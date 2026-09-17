/** Inbound sync against REAL Postgres and a scripted Gmail.
 *
 *  The property under test is the one the old sync lacked: no message is ever
 *  skipped. A pass may stop early — the per-tick budget, or a read that
 *  fails — but the cursor never moves past a record that was not ingested,
 *  so the next tick picks up exactly where this one stopped. A reply, or an
 *  unsubscribe, that arrived during an outage is still seen before the next
 *  step to that person goes out. */

import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { provisionTestDb } from "../test-db";
import type { FetchLike, TokenSource } from "./oauth";
import { syncMailboxInbound } from "./sync";

const dbUrl = await provisionTestDb();
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl, max: 4 }) : null;

afterAll(async () => {
  await pool?.end();
});

// ---------------------------------------------------------------------------
// A Gmail that pages, expires old cursors, and can be told to fail one read.

interface FakeMessage {
  id: string;
  historyId: number;
  from: string;
  subject: string;
  body: string;
}

/** Smaller than the sync's own page size, so paging is exercised on both
 *  the history and the list endpoints without hundreds of fixtures. */
const FAKE_PAGE = 40;

class FakeGmail {
  messages: FakeMessage[] = [];
  /** The mailbox's current history id — bumps with every message added. */
  historyId: number;
  /** startHistoryId below this is "too old": Gmail answers 404. */
  historyFloor: number;
  failRead = new Set<string>();
  reads: string[] = [];
  fetchImpl: FetchLike;

  constructor(historyId: number) {
    this.historyId = historyId;
    this.historyFloor = historyId;
    this.fetchImpl = async (url) => this.route(new URL(url));
  }

  add(n: number, from: (i: number) => string = (i) => `stranger-${i}@example.com`): void {
    for (let i = 0; i < n; i++) {
      this.historyId += 1;
      this.messages.push({
        id: `m${this.historyId}`, historyId: this.historyId,
        from: from(this.messages.length + 1),
        subject: `note ${this.historyId}`, body: "Hello there.",
      });
    }
  }

  private page<T>(items: T[], token: string | null): { items: T[]; next?: string } {
    const at = token ? Number(token) : 0;
    const slice = items.slice(at, at + FAKE_PAGE);
    const next = at + FAKE_PAGE < items.length ? String(at + FAKE_PAGE) : undefined;
    return { items: slice, next };
  }

  private route(url: URL): Response {
    const path = url.pathname.replace(/^.*\/users\/me/, "");
    const token = url.searchParams.get("pageToken");
    if (path === "/history") {
      const start = Number(url.searchParams.get("startHistoryId"));
      if (start < this.historyFloor) return json(404, { error: "notFound" });
      const records = this.messages
        .filter((m) => m.historyId > start)
        .map((m) => ({ id: String(m.historyId), messagesAdded: [{ message: { id: m.id } }] }));
      const { items, next } = this.page(records, token);
      return json(200, { history: items, nextPageToken: next, historyId: String(this.historyId) });
    }
    if (path === "/messages") {
      // Newest first, as Gmail lists.
      const { items, next } = this.page([...this.messages].reverse(), token);
      return json(200, { messages: items.map((m) => ({ id: m.id })), nextPageToken: next });
    }
    if (path === "/profile") {
      return json(200, { emailAddress: "mb@getvantrow.com", historyId: String(this.historyId) });
    }
    const id = /^\/messages\/(.+)$/.exec(path)?.[1];
    if (id) {
      this.reads.push(id);
      if (this.failRead.has(id)) return new Response("backend error", { status: 500 });
      const m = this.messages.find((x) => x.id === id);
      if (!m) return json(404, {});
      return json(200, {
        id: m.id, snippet: m.body.slice(0, 40), internalDate: "1760000000000",
        payload: {
          mimeType: "text/plain",
          headers: [
            { name: "From", value: `Someone <${m.from}>` },
            { name: "Subject", value: m.subject },
          ],
          body: { data: Buffer.from(m.body).toString("base64url") },
        },
      });
    }
    throw new Error(`unrouted: ${url}`);
  }
}

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json" },
  });

const tokens: TokenSource = {
  async accessToken() { return "tok"; },
  invalidate() {},
};

// ---------------------------------------------------------------------------

async function seed(lastHistoryId: string | null): Promise<{
  ws: string; mailboxId: string; prospectEmail: string; enrollmentId: string;
}> {
  const q = pool!;
  const ws = (await q.query(
    "insert into workspaces (name) values ('sync') returning id")).rows[0].id;
  const mailboxId = (await q.query(
    "insert into mailboxes (workspace_id, email) values ($1, $2) returning id",
    [ws, `mb-${randomUUID()}@getvantrow.com`])).rows[0].id;
  await q.query(
    `insert into mailbox_credentials (mailbox_id, workspace_id, refresh_token, last_history_id)
     values ($1, $2, 'r', $3)`, [mailboxId, ws, lastHistoryId]);
  const prospectEmail = `p-${randomUUID()}@example.com`;
  const prospectId = (await q.query(
    "insert into prospects (workspace_id, email) values ($1, $2) returning id",
    [ws, prospectEmail])).rows[0].id;
  const seq = (await q.query(
    `insert into sequences (workspace_id, name, state, mailbox_id)
     values ($1, 's', 'active', $2) returning id`, [ws, mailboxId])).rows[0].id;
  const enrollmentId = (await q.query(
    `insert into enrollments (workspace_id, sequence_id, prospect_id, mailbox_id,
       state, current_step_order, next_touch_at)
     values ($1, $2, $3, $4, 'active', 2, now() + interval '2 days') returning id`,
    [ws, seq, prospectId, mailboxId])).rows[0].id;
  return { ws, mailboxId, prospectEmail, enrollmentId };
}

const cursorOf = async (mailboxId: string): Promise<string | null> =>
  (await pool!.query(
    "select last_history_id from mailbox_credentials where mailbox_id = $1",
    [mailboxId])).rows[0].last_history_id;

const ingested = async (mailboxId: string): Promise<number> =>
  Number((await pool!.query(
    "select count(distinct gmail_message_id) from inbound_messages where mailbox_id = $1",
    [mailboxId])).rows[0].count);

describe.skipIf(!dbUrl)("inbound sync never skips a message (real Postgres)", () => {
  it("drains more than a tick's budget across ticks, reading each message once", async () => {
    const s = await seed("1000");
    const gmail = new FakeGmail(1000);
    // 120 arrivals in one window — beyond two full ticks. Number 77 is the
    // prospect writing back, buried well past the first fifty.
    gmail.add(120, (i) => i === 77 ? s.prospectEmail : `stranger-${i}@example.com`);
    const tick = () => syncMailboxInbound(pool!, s.mailboxId, tokens, { fetchImpl: gmail.fetchImpl });

    const one = await tick();
    expect(one).toMatchObject({ mode: "history", processed: 50, errors: 0, drained: false });
    // Fifty were read; the cursor sits on the fiftieth record, not the last.
    expect(await cursorOf(s.mailboxId)).toBe("1050");

    const two = await tick();
    expect(two).toMatchObject({ mode: "history", processed: 50, drained: false });
    expect(await cursorOf(s.mailboxId)).toBe("1100");
    // The reply was number 77: seen on the second tick, and it stopped the
    // enrollment (I2) — which is the whole reason a message may not be skipped.
    const e = await pool!.query("select state from enrollments where id = $1", [s.enrollmentId]);
    expect(e.rows[0].state).toBe("replied");

    const three = await tick();
    expect(three).toMatchObject({ mode: "history", processed: 20, drained: true });
    // Drained: the cursor moves to the mailbox's current history id.
    expect(await cursorOf(s.mailboxId)).toBe("1120");

    expect(await ingested(s.mailboxId)).toBe(120);
    expect(gmail.reads).toHaveLength(120);          // nothing read twice
    expect(new Set(gmail.reads).size).toBe(120);

    // A quiet tick: nothing new, cursor unchanged, no reads.
    const four = await tick();
    expect(four).toMatchObject({ processed: 0, fetched: 0, drained: true });
    expect(gmail.reads).toHaveLength(120);
  });

  it("an interrupted tick leaves the cursor behind the failure, and the next tick resumes without loss", async () => {
    const s = await seed("1000");
    const gmail = new FakeGmail(1000);
    gmail.add(30);
    gmail.failRead.add("m1008");
    const tick = () => syncMailboxInbound(pool!, s.mailboxId, tokens, { fetchImpl: gmail.fetchImpl });

    const one = await tick();
    expect(one).toMatchObject({ processed: 7, errors: 1, drained: false });
    // Seven records done; the eighth failed, so the cursor stays on seven.
    expect(await cursorOf(s.mailboxId)).toBe("1007");
    expect(await ingested(s.mailboxId)).toBe(7);

    gmail.failRead.clear();
    const two = await tick();
    expect(two).toMatchObject({ processed: 23, errors: 0, drained: true });
    expect(await cursorOf(s.mailboxId)).toBe("1030");
    expect(await ingested(s.mailboxId)).toBe(30);
    // The failed read was retried; the seven before it were not re-read.
    expect(gmail.reads.filter((id) => id === "m1008")).toHaveLength(2);
    expect(gmail.reads.filter((id) => id === "m1003")).toHaveLength(1);
  });

  it("a stale cursor falls back to the full window, which re-anchors only once drained", async () => {
    const s = await seed("5"); // long before Gmail's history horizon
    const gmail = new FakeGmail(1000);
    gmail.add(70);
    const tick = () => syncMailboxInbound(pool!, s.mailboxId, tokens, { fetchImpl: gmail.fetchImpl });

    const one = await tick();
    expect(one).toMatchObject({ mode: "full", processed: 50, drained: false });
    // The dead cursor is gone, and no new one is written until the window
    // has been read in full — a partial window must not become "caught up".
    expect(await cursorOf(s.mailboxId)).toBeNull();
    expect(await ingested(s.mailboxId)).toBe(50);

    const two = await tick();
    expect(two).toMatchObject({ mode: "full", processed: 20, duplicates: 50, drained: true });
    expect(await ingested(s.mailboxId)).toBe(70);
    expect(gmail.reads).toHaveLength(70);            // the fifty were not re-read
    // Anchored to the history id taken BEFORE the listing.
    expect(await cursorOf(s.mailboxId)).toBe("1070");

    // From here the sync is incremental again.
    gmail.add(1);
    const three = await tick();
    expect(three).toMatchObject({ mode: "history", processed: 1, drained: true });
    expect(await cursorOf(s.mailboxId)).toBe("1071");
  });
});
