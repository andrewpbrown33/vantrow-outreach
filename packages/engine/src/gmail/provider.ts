/** GmailProvider — the dispatcher seam's first real implementation (Gate 4).
 *  Raw Gmail REST, one instance per mailbox. Idempotency contract honored by
 *  construction: the touch's Message-ID is deterministic, send() pre-checks
 *  `rfc822msgid:` before firing, and checkSent() answers the epoch-agnostic
 *  question the sweep asks during crash recovery (I1/I8). */

import type { Provider, SendRequest, SendResult } from "../dispatcher";
import type { FetchLike, TokenSource } from "./oauth";
import { composeRaw, touchMessageId } from "./rfc822";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailProviderOpts {
  tokenSource: TokenSource;
  /** Domain for touch Message-IDs — the mailbox's sending domain. */
  senderDomain: string;
  fetchImpl?: FetchLike;
}

interface MessageRef {
  id: string;
  threadId?: string;
}

export class GmailProvider implements Provider {
  private readonly fetchImpl: FetchLike;

  constructor(private readonly opts: GmailProviderOpts) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /** Authorized call; one retry through a token refresh on 401. */
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

  /** The message (if any) carrying a touch's Message-ID. */
  private async findByMessageId(mid: string): Promise<MessageRef | null> {
    const bare = mid.replace(/^<|>$/g, "");
    const res = await this.call(
      `/messages?q=${encodeURIComponent(`rfc822msgid:${bare}`)}&maxResults=1`,
    );
    if (!res.ok) {
      throw new Error(`gmail_search_${res.status}: rfc822msgid lookup failed`);
    }
    const json = (await res.json()) as { messages?: MessageRef[] };
    return json.messages?.[0] ?? null;
  }

  async checkSent(
    touchRef: string,
  ): Promise<{ sent: boolean; providerMessageId?: string }> {
    const found = await this.findByMessageId(
      touchMessageId(touchRef, this.opts.senderDomain),
    );
    return found
      ? { sent: true, providerMessageId: found.id }
      : { sent: false };
  }

  async send(req: SendRequest): Promise<SendResult> {
    const mid = touchMessageId(req.touchRef, this.opts.senderDomain);

    // Idempotent by touch: if any prior attempt reached the wire, return it.
    const prior = await this.findByMessageId(mid);
    if (prior) return { ok: true, providerMessageId: prior.id };

    // Threading: a thread_as_reply step references the PREVIOUS step's touch
    // Message-ID (deterministic), and reuses its Gmail threadId when found.
    let inReplyTo: string | undefined;
    let threadId: string | undefined;
    if (req.threadAsReply) {
      const [enrollmentId, stepStr] = req.touchRef.split(":");
      const step = Number(stepStr);
      if (enrollmentId && step > 1) {
        inReplyTo = touchMessageId(`${enrollmentId}:${step - 1}`, this.opts.senderDomain);
        const prev = await this.findByMessageId(inReplyTo).catch(() => null);
        threadId = prev?.threadId;
        if (!prev) inReplyTo = undefined; // nothing to thread under
      }
    }

    const raw = composeRaw({
      from: req.fromEmail,
      to: req.toEmail,
      subject: req.subject,
      bodyHtml: req.bodyHtml,
      messageId: mid,
      idempotencyKey: req.idempotencyKey,
      inReplyTo,
    });
    const res = await this.call("/messages/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(threadId ? { raw, threadId } : { raw }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const kind = res.status === 429 || res.status >= 500 ? "retryable" : "rejected";
      return {
        ok: false,
        error: `gmail_send_${kind}_${res.status}: ${body.slice(0, 300)}`,
      };
    }
    const json = (await res.json()) as { id: string };
    return { ok: true, providerMessageId: json.id };
  }
}
