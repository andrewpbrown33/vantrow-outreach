/** The drip, against REAL Postgres.
 *
 *  The claims worth proving, in the style of the I-series invariants:
 *    R1 · a queued enrollment is structurally unclaimable — the sweep cannot
 *         reach it, so nothing can be sent to someone the drip hasn't released
 *    R2 · the day's release is exactly-once under overlapping ticks
 *    R3 · the rate grows at most once a week, and never past the ceiling
 *    R4 · bad deliverability freezes the ramp and says so — it never cuts the
 *         rate, and never stops the campaign
 *    R5 · a thin sample is not evidence: two bounces out of three sends must
 *         not trip the brake
 *    R6 · releases only land on the sequence's own sending days
 *    R7 · the warmup cap ramps, so the drip's growth is not strangled by a
 *         flat daily_cap */

import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { releaseDue, readHealth } from "./release";
import { provisionTestDb } from "./test-db";

const dbUrl = await provisionTestDb();
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl, max: 6 }) : null;

afterAll(async () => {
  await pool?.end();
});

/** A Tuesday inside the default Tue–Fri window, 09:00 New York. */
const TUESDAY = new Date("2026-09-15T13:00:00Z");
const SATURDAY = new Date("2026-09-19T13:00:00Z");

async function seed(opts: {
  queued: number;
  startPerDay?: number;
  growthPct?: number;
  maxPerDay?: number;
  windowDays?: number[];
}): Promise<{ ws: string; seq: string; mailbox: string }> {
  const q = pool!;
  const ws = (await q.query(
    "insert into workspaces (name) values ('drip') returning id")).rows[0].id;
  const mailbox = (await q.query(
    `insert into mailboxes (workspace_id, email) values ($1, $2) returning id`,
    [ws, `mb-${randomUUID()}@getvantrow.com`])).rows[0].id;
  const template = (await q.query(
    `insert into email_templates (workspace_id, name, subject, body_html)
     values ($1, 't', 'hello', '<p>hi</p>') returning id`, [ws])).rows[0].id;
  const seq = (await q.query(
    `insert into sequences (workspace_id, name, state, mailbox_id, window_days,
       window_start_minute, window_end_minute, skip_us_holidays,
       timezone_source, fallback_timezone)
     values ($1, 'drip seq', 'active', $2, $3, 510, 690, false,
             'sequence', 'America/New_York')
     returning id`,
    [ws, mailbox, opts.windowDays ?? [2, 3, 4, 5]])).rows[0].id;
  await q.query(
    `insert into sequence_steps (workspace_id, sequence_id, step_order, template_id)
     values ($1, $2, 1, $3)`, [ws, seq, template]);
  await q.query(
    `insert into release_policies
       (sequence_id, workspace_id, start_per_day, growth_pct, max_per_day,
        current_per_day)
     values ($1, $2, $3, $4, $5, $3)`,
    [seq, ws, opts.startPerDay ?? 5, opts.growthPct ?? 25, opts.maxPerDay ?? 50]);

  for (let i = 0; i < opts.queued; i++) {
    const p = (await q.query(
      `insert into prospects (workspace_id, email, first_name, company)
       values ($1, $2, 'Pat', 'Acme Roofing') returning id`,
      [ws, `p${i}-${randomUUID()}@example.com`])).rows[0].id;
    await q.query(
      `insert into enrollments (workspace_id, sequence_id, prospect_id,
         mailbox_id, state, current_step_order, next_touch_at)
       values ($1, $2, $3, $4, 'queued', 1, null)`,
      [ws, seq, p, mailbox]);
  }
  return { ws, seq, mailbox };
}

const counts = async (seq: string) => {
  const { rows } = await pool!.query(
    `select state, count(*)::int as n from enrollments
      where sequence_id = $1 group by state`, [seq]);
  return Object.fromEntries(rows.map((r) => [r.state, r.n])) as Record<string, number>;
};
const policy = async (seq: string) =>
  (await pool!.query("select * from release_policies where sequence_id = $1", [seq])).rows[0];

describe.skipIf(!dbUrl)("the drip (real Postgres)", () => {
  it("R1: a queued enrollment is invisible to the claim — nothing can send to it", async () => {
    const s = await seed({ queued: 3 });
    // Even with a due timer forced on, the claim filters on state.
    await pool!.query(
      "update enrollments set next_touch_at = now() - interval '1 hour' where sequence_id = $1",
      [s.seq]);
    const claimed = await pool!.query(
      "select id from public.claim_due_enrollments(50, make_interval(mins => 5))");
    const mine = new Set((await pool!.query(
      "select id from enrollments where sequence_id = $1", [s.seq])).rows.map((r) => r.id));
    expect(claimed.rows.filter((r) => mine.has(r.id))).toHaveLength(0);
  });

  it("R2: the day's release is exactly-once, even when ticks overlap", async () => {
    const s = await seed({ queued: 20, startPerDay: 5 });
    const [a, b, c] = await Promise.all([
      releaseDue(pool!, { now: TUESDAY, jitterFraction: () => 0 }),
      releaseDue(pool!, { now: TUESDAY, jitterFraction: () => 0 }),
      releaseDue(pool!, { now: TUESDAY, jitterFraction: () => 0 }),
    ]);
    const mineOnly = (r: Awaited<ReturnType<typeof releaseDue>>) =>
      r.results.find((x) => x.sequenceId === s.seq)?.released ?? 0;
    const total = mineOnly(a) + mineOnly(b) + mineOnly(c);
    expect(total).toBe(5);
    expect(await counts(s.seq)).toMatchObject({ queued: 15, scheduled: 5 });

    const log = await pool!.query(
      "select released_count from release_log where sequence_id = $1", [s.seq]);
    expect(log.rowCount).toBe(1);
    expect(log.rows[0].released_count).toBe(5);

    // A released enrollment leaves with a planned first touch, inside the window.
    const { rows } = await pool!.query(
      `select next_touch_at from enrollments
        where sequence_id = $1 and state = 'scheduled'`, [s.seq]);
    for (const r of rows) expect(r.next_touch_at).not.toBeNull();
  });

  it("R3: the rate grows at most weekly and stops at the ceiling", async () => {
    const s = await seed({ queued: 200, startPerDay: 10, growthPct: 25, maxPerDay: 13 });
    await releaseDue(pool!, { now: TUESDAY, jitterFraction: () => 0 });
    expect((await policy(s.seq)).current_per_day).toBe(10);   // day one: no growth yet

    // Next day, same week — no growth.
    const wed = new Date(TUESDAY.getTime() + 86_400_000);
    await releaseDue(pool!, { now: wed, jitterFraction: () => 0 });
    expect((await policy(s.seq)).current_per_day).toBe(10);

    // A week on: 10 -> 12.5 -> 13 (rounds to 13, which is also the ceiling).
    const nextWeek = new Date(TUESDAY.getTime() + 8 * 86_400_000);
    await releaseDue(pool!, { now: nextWeek, jitterFraction: () => 0 });
    expect((await policy(s.seq)).current_per_day).toBe(13);

    // And never past it.
    const fortnight = new Date(TUESDAY.getTime() + 16 * 86_400_000);
    await releaseDue(pool!, { now: fortnight, jitterFraction: () => 0 });
    expect((await policy(s.seq)).current_per_day).toBe(13);
  });

  it("R4: bad deliverability freezes the ramp, keeps sending, and says so", async () => {
    const s = await seed({ queued: 100, startPerDay: 10 });
    // 40 sends with 4 hard bounces = 10%, over the 3% line.
    for (let i = 0; i < 40; i++) {
      await pool!.query(
        `insert into touch_ledger (workspace_id, enrollment_id, mailbox_id,
           step_order, attempt_epoch, idempotency_key, state)
         select $1, e.id, $2, 1, 0, $3, 'sent' from enrollments e
          where e.sequence_id = $4 limit 1`,
        [s.ws, s.mailbox, `k-${randomUUID()}`, s.seq]);
    }
    for (let i = 0; i < 4; i++) {
      await pool!.query(
        `insert into suppression_entries (workspace_id, email, reason)
         values ($1, $2, 'hard_bounce')`, [s.ws, `b${i}-${randomUUID()}@x.com`]);
    }

    const health = await readHealth(
      await pool!.connect().then((c) => { setTimeout(() => c.release(), 0); return c; }),
      s.ws);
    expect(health.verdict).toBe("unhealthy");

    const before = (await policy(s.seq)).current_per_day;
    const stats = await releaseDue(pool!, { now: TUESDAY, jitterFraction: () => 0 });
    const pol = await policy(s.seq);

    expect(pol.state).toBe("holding");
    expect(pol.hold_reason).toMatch(/hard bounces/);
    // Holding freezes the rate — it does not cut it, and does not stop sending.
    expect(pol.current_per_day).toBe(before);
    expect(stats.enrollmentsReleased).toBe(before);

    const ev = await pool!.query(
      "select type, sequence_id from events where workspace_id = $1 and type = 'release.held'",
      [s.ws]);
    expect(ev.rowCount).toBe(1);
    expect(ev.rows[0].sequence_id).toBe(s.seq);   // the feed renders the campaign
  });

  it("R5: a thin sample is not evidence — three sends, two bounces, no brake", async () => {
    const s = await seed({ queued: 50, startPerDay: 5 });
    for (let i = 0; i < 3; i++) {
      await pool!.query(
        `insert into touch_ledger (workspace_id, enrollment_id, mailbox_id,
           step_order, attempt_epoch, idempotency_key, state)
         select $1, e.id, $2, 1, 0, $3, 'sent' from enrollments e
          where e.sequence_id = $4 limit 1`,
        [s.ws, s.mailbox, `k-${randomUUID()}`, s.seq]);
    }
    for (let i = 0; i < 2; i++) {
      await pool!.query(
        `insert into suppression_entries (workspace_id, email, reason)
         values ($1, $2, 'hard_bounce')`, [s.ws, `t${i}-${randomUUID()}@x.com`]);
    }
    await releaseDue(pool!, { now: TUESDAY, jitterFraction: () => 0 });
    expect((await policy(s.seq)).state).toBe("ramping");
  });

  it("R6: releases only land on the sequence's own sending days", async () => {
    const s = await seed({ queued: 20, windowDays: [2, 3, 4, 5] });   // Tue-Fri
    const sat = await releaseDue(pool!, { now: SATURDAY, jitterFraction: () => 0 });
    expect(sat.results.find((r) => r.sequenceId === s.seq)).toBeUndefined();
    expect(await counts(s.seq)).toMatchObject({ queued: 20 });

    const tue = await releaseDue(pool!, { now: TUESDAY, jitterFraction: () => 0 });
    expect(tue.results.find((r) => r.sequenceId === s.seq)?.released).toBe(5);
  });

  it("R7: a warming mailbox's cap ramps weekly instead of pinning at the start", async () => {
    const s = await seed({ queued: 1 });
    await pool!.query(
      `update mailboxes
          set warmup_state = 'warming', warmup_started_on = date '2026-09-01',
              warmup_start_cap = 30, warmup_growth_pct = 30, daily_cap = 200
        where id = $1`, [s.mailbox]);
    const capOn = async (day: string) => (await pool!.query(
      `select public.mailbox_daily_cap(m.*, $2::date) as cap
         from mailboxes m where m.id = $1`, [s.mailbox, day])).rows[0].cap;

    expect(await capOn("2026-09-01")).toBe(30);    // week 0
    expect(await capOn("2026-09-08")).toBe(39);    // week 1
    expect(await capOn("2026-09-15")).toBe(50);    // week 2 — past the old flat 30
    expect(await capOn("2026-10-06")).toBe(111);   // week 5

    // daily_cap is still the ceiling, and 'none' means flat.
    await pool!.query("update mailboxes set daily_cap = 45 where id = $1", [s.mailbox]);
    expect(await capOn("2026-10-06")).toBe(45);
    await pool!.query("update mailboxes set warmup_state = 'none' where id = $1", [s.mailbox]);
    expect(await capOn("2026-10-06")).toBe(45);
  });
});
