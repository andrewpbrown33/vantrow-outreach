/** Inbound sync for one mailbox: incremental via Gmail history when a cursor
 *  exists, full INBOX sweep otherwise (or when the cursor expires, per Gmail's
 *  404 contract). At-least-once by design — processInbound dedupes by message
 *  id — and the cursor only ever moves to a history record that has been
 *  processed in full.
 *
 *  The per-tick budget bounds WORK, never the record. When it runs out, the
 *  pass stops where it stands and leaves the cursor on the last record it
 *  finished, so the next tick resumes from there; a message that fails to
 *  ingest holds the cursor the same way and is seen again. The alternative —
 *  read fifty, advance past everything — is how a reply, or an unsubscribe,
 *  received during an outage would vanish, and the next step would go to
 *  someone who had asked it not to. */

import type { Pool } from "pg";
import type { FetchLike, TokenSource } from "./oauth";
import { processInbound, type NormalizedInbound } from "./inbound";
import { decodeBody, headerRecord, type GmailPayload } from "./rfc822";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

/** Ids per list page. Listing is cheap; the per-message GET is the cost the
 *  budget below is spent on. */
const PAGE_SIZE = 100;

export interface SyncStats {
  fetched: number;
  processed: number;
  duplicates: number;
  errors: number;
  mode: "history" | "full" | "none";
  /** False when the pass stopped early — budget spent, or a message failed —
   *  and left a continuation for the next tick. Nothing was skipped. */
  drained: boolean;
}

export interface SyncOpts {
  fetchImpl?: FetchLike;
  /** Messages fetched and ingested per pass. Bounds work, never the record. */
  maxMessages?: number;
}

function fromAddress(headers: Record<string, string>): string {
  const raw = headers["from"] ?? "";
  const angled = /<([^>]+)>/.exec(raw)?.[1];
  if (angled) return angled.toLowerCase();
  const bare = raw.split(/[\s,;]+/).find((t) => t.includes("@"));
  return (bare ?? raw).toLowerCase();
}

interface HistoryPage {
  history?: {
    id?: string;
    messagesAdded?: { message?: { id?: string } }[];
  }[];
  nextPageToken?: string;
  historyId?: string;
}

export async function syncMailboxInbound(
  pool: Pool,
  mailboxId: string,
  tokenSource: TokenSource,
  opts: SyncOpts = {},
): Promise<SyncStats> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const budget = opts.maxMessages ?? 50;
  const stats: SyncStats = {
    fetched: 0, processed: 0, duplicates: 0, errors: 0, mode: "none",
    drained: true,
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

  const setCursor = (historyId: string | null): Promise<unknown> =>
    pool.query(
      `update mailbox_credentials
          set last_history_id = $2, updated_at = now()
        where mailbox_id = $1`,
      [mailboxId, historyId],
    );

  /** Which of these ids are new to the ledger. A resumed or repeated pass
   *  must not pay a GET for every message it has already read; the insert in
   *  processInbound is still the guarantee, this is only the cheap first
   *  look. */
  const unseen = async (ids: string[]): Promise<Set<string>> => {
    if (ids.length === 0) return new Set();
    const { rows } = await pool.query<{ gmail_message_id: string }>(
      `select gmail_message_id from inbound_messages
        where mailbox_id = $1 and gmail_message_id = any($2::text[])`,
      [mailboxId, ids],
    );
    const seen = new Set(rows.map((r) => r.gmail_message_id));
    return new Set(ids.filter((id) => !seen.has(id)));
  };

  /** Fetch and ingest one message. False means it could not be processed
   *  and must be seen again next tick — the cursor stays behind it. */
  const ingest = async (id: string): Promise<boolean> => {
    stats.fetched += 1;
    try {
      const res = await call(`/messages/${id}?format=full`);
      // Gone between the listing and the read (deleted, or a spam sweep):
      // nothing to ingest, and nothing a retry could recover.
      if (res.status === 404) return true;
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
      return true;
    } catch {
      stats.errors += 1;
      return false;
    }
  };

  let remaining = budget;

  // -- Incremental: walk history, one record at a time --------------------
  if (creds.last_history_id) {
    stats.mode = "history";
    // `start` is fixed for the whole page walk (page tokens belong to it);
    // `cursor` is the last record ingested in full, and the only value the
    // database will ever be told.
    const start = creds.last_history_id;
    let cursor = start;
    let pageToken: string | undefined;
    let expired = false;
    let stopped = false;
    do {
      const p = new URLSearchParams({
        startHistoryId: start,
        historyTypes: "messageAdded",
        labelId: "INBOX",
        maxResults: String(PAGE_SIZE),
      });
      if (pageToken) p.set("pageToken", pageToken);
      const res = await call(`/history?${p.toString()}`);
      if (res.status === 404) { expired = true; break; } // cursor too old
      if (!res.ok) throw new Error(`gmail_history_${res.status}`);
      const page = (await res.json()) as HistoryPage;
      const records = page.history ?? [];
      const fresh = await unseen(records.flatMap((r) =>
        (r.messagesAdded ?? []).flatMap((a) => a.message?.id ? [a.message.id] : [])));

      for (const rec of records) {
        const ids = [...new Set((rec.messagesAdded ?? [])
          .flatMap((a) => a.message?.id ? [a.message.id] : []))];
        const work = ids.filter((id) => fresh.has(id));
        stats.duplicates += ids.length - work.length;
        // The budget is checked between records, never inside one: a record
        // is ingested whole or not at all, so the cursor never lands on a
        // half-read record. One record can overshoot by its own size.
        if (work.length > 0 && remaining <= 0) { stopped = true; break; }
        let whole = true;
        for (const id of work) {
          remaining -= 1;
          if (!(await ingest(id))) { whole = false; break; }
        }
        if (!whole) { stopped = true; break; }
        if (rec.id) cursor = rec.id;
      }
      if (stopped) break;
      pageToken = page.nextPageToken;
      // The listing is exhausted: everything up to the mailbox's current
      // history id has been seen, records without INBOX additions included.
      if (!pageToken && page.historyId) cursor = page.historyId;
    } while (pageToken);

    if (!expired) {
      if (cursor !== start) await setCursor(cursor);
      stats.drained = !stopped;
      return stats;
    }
    // Gmail no longer holds history back to this cursor. It is worthless now
    // and must not be retried every minute; the full pass below re-anchors.
    await setCursor(null);
  }

  // -- Full: everything in the inbox from the last week --------------------
  stats.mode = "full";
  // The mailbox's history id is taken BEFORE listing, so anything that lands
  // while this pass runs falls inside the next incremental window instead of
  // between the listing and the cursor write.
  const profile = await call("/profile");
  if (!profile.ok) throw new Error(`gmail_profile_${profile.status}`);
  const { historyId } = (await profile.json()) as { historyId?: string };

  let pageToken: string | undefined;
  let stopped = false;
  do {
    const p = new URLSearchParams({
      q: "in:inbox newer_than:7d",
      maxResults: String(PAGE_SIZE),
    });
    if (pageToken) p.set("pageToken", pageToken);
    const res = await call(`/messages?${p.toString()}`);
    if (!res.ok) throw new Error(`gmail_list_${res.status}`);
    const page = (await res.json()) as {
      messages?: { id: string }[]; nextPageToken?: string;
    };
    const ids = [...new Set((page.messages ?? []).map((m) => m.id))];
    const fresh = await unseen(ids);
    stats.duplicates += ids.length - fresh.size;
    for (const id of fresh) {
      if (remaining <= 0) { stopped = true; break; }
      remaining -= 1;
      if (!(await ingest(id))) { stopped = true; break; }
    }
    if (stopped) break;
    pageToken = page.nextPageToken;
  } while (pageToken);

  stats.drained = !stopped;
  // The cursor is written only once the whole window is in the ledger. Until
  // then the next tick repeats the full pass — cheaply, since it skips every
  // id it has already read — and nothing in the window is left behind.
  if (!stopped && historyId) await setCursor(historyId);
  return stats;
}
