/** GmailProvider — the dispatcher seam's first real implementation (Gate 4).
 *  Raw Gmail REST, one instance per mailbox.
 *
 *  IDENTITY, THE HARD WAY (learned from live Gmail, 2026-08-09): Gmail
 *  REWRITES the RFC822 Message-ID on send — a supplied
 *  `<touch-…@domain>` comes back as `<CAK71…@mail.gmail.com>`. So the
 *  Message-ID cannot carry touch identity, and `rfc822msgid:` lookups always
 *  miss (which made retries duplicate — the exact failure I1/I8 exist to
 *  prevent). What DOES survive is our custom header `X-Nudgerow-Key`.
 *
 *  Therefore identity rides `X-Nudgerow-Key: {enrollment}:{step}:{epoch}` and
 *  recovery scans the **SENT label index** — which is immediately consistent,
 *  unlike Gmail's search index (empirically minutes behind; unusable for a
 *  crash-recovery check that must answer NOW). The scan is bounded and only
 *  runs on retries, so steady-state sends stay one API call.
 *
 *  Gmail's own Message-ID and threadId are returned to the caller so the
 *  engine can persist them (ledger) — that is what later threading and
 *  inbound reply-matching key off, since prospects reply to Gmail's id. */

import type { Provider, SendRequest, SendResult } from "../dispatcher";
import type { FetchLike, TokenSource } from "./oauth";
import { composeRaw, touchMessageId } from "./rfc822";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailProviderOpts {
  tokenSource: TokenSource;
  /** Domain used for the advisory Message-ID we supply (Gmail may replace it). */
  senderDomain: string;
  fetchImpl?: FetchLike;
  /** How many recent SENT messages a recovery scan inspects. */
  scanDepth?: number;
}

/** What a recovery scan found: Gmail's ids for an already-sent touch. */
export interface SentTouch {
  providerMessageId: string;
  threadId?: string;
  /** Gmail's assigned RFC822 Message-ID — persist it; replies quote it. */
  rfc822MessageId?: string;
}

export class GmailProvider implements Provider {
  private readonly fetchImpl: FetchLike;
  private readonly scanDepth: number;

  constructor(private readonly opts: GmailProviderOpts) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.scanDepth = opts.scanDepth ?? 25;
  }

  private async call(
    path: string,
    init: RequestInit = {},
    retryOn401 = true,
  ): Promise<Response> {
    const token = await this.opts.tokenSource.accessToken();
    const res = await this.fetchImpl(`${API}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401 && retryOn401) {
      this.opts.tokenSource.invalidate();
      return this.call(path, init, false);
    }
    return res;
  }

  /** Scan recent SENT messages for one whose X-Nudgerow-Key belongs to
   *  `touchRef` (any attempt epoch). Label-index based: immediately
   *  consistent, so a message sent seconds ago is already visible. */
  private async scanSentForTouch(touchRef: string): Promise<SentTouch | null> {
    const list = await this.call(
      `/messages?labelIds=SENT&maxResults=${this.scanDepth}`,
    );
    if (!list.ok) {
      throw new Error(`gmail_list_sent_${list.status}: recovery scan failed`);
    }
    const { messages } = (await list.json()) as { messages?: { id: string }[] };
    for (const { id } of messages ?? []) {
      const res = await this.call(
        `/messages/${id}?format=metadata` +
        "&metadataHeaders=X-Nudgerow-Key&metadataHeaders=Message-ID",
      );
      if (!res.ok) continue; // a single unreadable message must not abort recovery
      const msg = (await res.json()) as {
        id: string; threadId?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const headers = msg.payload?.headers ?? [];
      const key = headers.find(
        (h) => h.name.toLowerCase() === "x-nudgerow-key",
      )?.value;
      if (key?.startsWith(`${touchRef}:`)) {
        return {
          providerMessageId: msg.id,
          threadId: msg.threadId,
          rfc822MessageId: headers.find(
            (h) => h.name.toLowerCase() === "message-id",
          )?.value,
        };
      }
    }
    return null;
  }

  /** I8's question: did ANY attempt for this touch reach the wire? */
  async checkSent(
    touchRef: string,
  ): Promise<{ sent: boolean; providerMessageId?: string }> {
    const found = await this.scanSentForTouch(touchRef);
    return found
      ? { sent: true, providerMessageId: found.providerMessageId }
      : { sent: false };
  }

  async send(req: SendRequest): Promise<SendResult> {
    // Idempotency guard, priced correctly: only a RETRY (epoch > 0) can have a
    // prior attempt on the wire, so only a retry pays for the scan. First
    // attempts stay a single API call.
    const epoch = Number(req.idempotencyKey.split(":").pop());
    if (Number.isFinite(epoch) && epoch > 0) {
      const prior = await this.scanSentForTouch(req.touchRef);
      if (prior) return { ok: true, providerMessageId: prior.providerMessageId };
    }

    // Threading: Gmail rewrote our Message-ID, so the previous touch's real id
    // must come from the caller (persisted at its send time) — see
    // SendRequest.inReplyToMessageId. Falls back to the Gmail threadId alone.
    const raw = composeRaw({
      from: req.fromEmail,
      to: req.toEmail,
      subject: req.subject,
      bodyHtml: req.bodyHtml,
      // Advisory only — Gmail replaces it. Kept so non-Gmail providers on this
      // seam (and our own tests) still get a deterministic id.
      messageId: touchMessageId(req.touchRef, this.opts.senderDomain),
      idempotencyKey: req.idempotencyKey,
      inReplyTo: req.threadAsReply ? req.inReplyToMessageId : undefined,
    });
    const body: Record<string, string> = { raw };
    if (req.threadAsReply && req.threadId) body.threadId = req.threadId;

    const res = await this.call("/messages/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const kind = res.status === 429 || res.status >= 500 ? "retryable" : "rejected";
      return {
        ok: false,
        error: `gmail_send_${kind}_${res.status}: ${text.slice(0, 300)}`,
      };
    }
    const sent = (await res.json()) as { id: string; threadId?: string };

    // Read back the ids the engine must persist: Gmail's Message-ID is what a
    // prospect's reply will carry in In-Reply-To, and the threadId keeps a
    // sequence in one conversation.
    let rfc822MessageId: string | undefined;
    const meta = await this.call(
      `/messages/${sent.id}?format=metadata&metadataHeaders=Message-ID`,
    ).catch(() => null);
    if (meta?.ok) {
      const m = (await meta.json()) as {
        payload?: { headers?: { name: string; value: string }[] };
      };
      rfc822MessageId = m.payload?.headers?.find(
        (h) => h.name.toLowerCase() === "message-id",
      )?.value;
    }
    return {
      ok: true,
      providerMessageId: sent.id,
      threadId: sent.threadId,
      rfc822MessageId,
    };
  }
}
