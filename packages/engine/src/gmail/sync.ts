/** Inbound sync for one mailbox: incremental via Gmail history when a cursor
 *  exists, full INBOX sweep otherwise (or when the cursor expires, per Gmail's
 *  404 contract). At-least-once by design — processInbound dedupes by message
 *  id — and the cursor only advances after a pass completes. */

import type { Pool } from "pg";
import type { FetchLike, TokenSource } from "./oauth";
import { processInbound, type NormalizedInbound } from "./inbound";
import { decodeBody, headerRecord, type GmailPayload } from "./rfc822";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface SyncStats {
  fetched: number;
  processed: number;
  duplicates: number;
  errors: number;
  mode: "history" | "full" | "none";
}

export interface SyncOpts {
  fetchImpl?: FetchLike;
  maxMessages?: number;
}

function fromAddress(headers: Record<string, string>): string {
  const raw = headers["from"] ?? "";
  const angled = /<([^>]+)>/.exec(raw)?.[1];
  if (angled) return angled.toLowerCase();
  const bare = raw.split(/[\s,;]+/).find((t) => t.includes("@"));
  return (bare ?? raw).toLowerCase();
}

export async function syncMailboxInbound(
  pool: Pool,
  mailboxId: string,
  tokenSource: TokenSource,
  opts: SyncOpts = {},
): Promise<SyncStats> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxMessages = opts.maxMessages ?? 50;
  const stats: SyncStats = {
    fetched: 0, processed: 0, duplicates: 0, errors: 0, mode: "none",
  };

  const call = async (path: string, retryOn401 = true): Promise<Response> => {
    const token = await tokenSource.accessToken();
    const res = await fetchImpl(`${API}${path}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (res.status === 401 && retryOn401) {
      tokenSource.invalidate();
      return call(path, false);
    }
    return res;
  };

  const creds = (await pool.query<{ last_history_id: string | null }>(
    "select last_history_id from mailbox_credentials where mailbox_id = $1",
    [mailboxId],
  )).rows[0];
  if (!creds) return stats; // not connected; nothing to sync

  // -- Collect candidate message ids ---------------------------------------
  const ids: string[] = [];
  if (creds.last_history_id) {
    let pageToken: string | undefined;
    let expired = false;
    do {
      const p = new URLSearchParams({
        startHistoryId: creds.last_history_id,
        historyTypes: "messageAdded",
        labelId: "INBOX",
      });
      if (pageToken) p.set("pageToken", pageToken);
      const res = await call(`/history?${p.toString()}`);
      if (res.status === 404) { expired = true; break; } // cursor too old
      if (!res.ok) throw new Error(`gmail_history_${res.status}`);
      const json = (await res.json()) as {
        history?: { messagesAdded?: { message?: { id?: string } }[] }[];
        nextPageToken?: string;
      };
      for (const h of json.history ?? []) {
        for (const a of h.messagesAdded ?? []) {
          if (a.message?.id) ids.push(a.message.id);
        }
      }
      pageToken = json.nextPageToken;
    } while (pageToken && ids.length < maxMessages);
    stats.mode = expired ? "full" : "history";
    if (expired) ids.length = 0;
  } else {
    stats.mode = "full";
  }

  if (stats.mode === "full") {
    const q = encodeURIComponent("in:inbox newer_than:7d");
    const res = await call(`/messages?q=${q}&maxResults=${maxMessages}`);
    if (!res.ok) throw new Error(`gmail_list_${res.status}`);
    const json = (await res.json()) as { messages?: { id: string }[] };
    ids.push(...(json.messages ?? []).map((m) => m.id));
  }

  // -- Fetch + process, one message at a time ------------------------------
  for (const id of [...new Set(ids)].slice(0, maxMessages)) {
    stats.fetched += 1;
    try {
      const res = await call(`/messages/${id}?format=full`);
      if (!res.ok) throw new Error(`gmail_get_${res.status}`);
      const json = (await res.json()) as {
        id: string; snippet?: string; internalDate?: string;
        payload?: GmailPayload;
      };
      const headers = headerRecord(json.payload);
      const msg: NormalizedInbound = {
        gmailMessageId: json.id,
        headers,
        fromEmail: fromAddress(headers),
        subject: headers["subject"] ?? "",
        snippet: json.snippet ?? "",
        bodyText: decodeBody(json.payload),
        receivedAt: json.internalDate
          ? new Date(Number(json.internalDate))
          : new Date(),
      };
      const result = await processInbound(pool, mailboxId, msg);
      if (result.duplicate) stats.duplicates += 1;
      else stats.processed += 1;
    } catch {
      stats.errors += 1; // per-message isolation; the rest of the batch runs
    }
  }

  // -- Advance the cursor only after the pass ------------------------------
  const profile = await call("/profile");
  if (profile.ok) {
    const { historyId } = (await profile.json()) as { historyId?: string };
    if (historyId) {
      await pool.query(
        `update mailbox_credentials
            set last_history_id = $2, updated_at = now()
          where mailbox_id = $1`,
        [mailboxId, historyId],
      );
    }
  }
  return stats;
}
