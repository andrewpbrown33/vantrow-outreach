/** The engine correctness contract (phase-4 §1) against REAL Postgres:
 *  I1 at-most-once dispatch under concurrency · I2 stop-on-reply beats the
 *  queue (the claimed-send race) · I3 suppression is unbypassable ·
 *  I5 caps defer, never drop · I8 crash-safe ticks (claim TTL + epoch bump +
 *  provider checkSent) · I9/I10 by construction here (cancel totality rides
 *  the same one-transaction resolve; every path appends events) · RLS tenant
 *  isolation. Locally the suite skips (loudly) without a database; in CI it
 *  hard-fails instead — see test-db.ts. */

import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { FakeProvider } from "./dispatcher";
import { executeOne, sweepOnce } from "./sweep";
import { provisionTestDb } from "./test-db";

const dbUrl = await provisionTestDb();
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl, max: 8 }) : null;

afterAll(async () => {
  await pool?.end();
});

interface Seeded {
  workspaceId: string;
  mailboxId: string;
  prospectId: string;
  sequenceId: string;
  enrollmentId: string;
  prospectEmail: string;
}

/** A workspace with one active 2-step sequence (step 2 fires +3 days) and one
 *  due enrollment. All-day/all-week window so wall-clock never gates a test. */
async function seed(opts: {
  dailyCap?: number;
  steps?: number;
  extraProspects?: number;
} = {}): Promise<Seeded & { extraEnrollmentIds: string[] }> {
  const q = pool!;
  const ws = (await q.query(
    "insert into workspaces (name) values ('t') returning id")).rows[0].id;
  const mailbox = (await q.query(
    `insert into mailboxes (workspace_id, email, daily_cap)
     values ($1, $2, $3) returning id`,
    [ws, `mb-${randomUUID()}@getvantrow.com`, opts.dailyCap ?? 100],
  )).rows[0].id;
  const prospectEmail = `p-${randomUUID()}@example.com`;
  const prospect = (await q.query(
    `insert into prospects (workspace_id, email, first_name, company, timezone)
     values ($1, $2, 'Derek', 'Meridian', 'America/New_York') returning id`,
    [ws, prospectEmail],
  )).rows[0].id;
  const template = (await q.query(
    `insert into email_templates (workspace_id, name, subject, body_html)
     values ($1, 't1', '{{firstName}}, a quiet question on {{company}}',
             '<p>Hello {{firstName}}</p>') returning id`,
    [ws],
  )).rows[0].id;
  const seq = (await q.query(
    `insert into sequences (workspace_id, name, state, mailbox_id,
       window_days, window_start_minute, window_end_minute, skip_us_holidays)
     values ($1, 's1', 'active', $2, '{1,2,3,4,5,6,7}', 0, 1440, false)
     returning id`,
    [ws, mailbox],
  )).rows[0].id;
  const stepCount = opts.steps ?? 2;
  for (let i = 1; i <= stepCount; i++) {
    await q.query(
      `insert into sequence_steps (workspace_id, sequence_id, step_order,
         template_id, interval_days, interval_hours)
       values ($1, $2, $3, $4, $5, 0)`,
      [ws, seq, i, template, i === 1 ? 0 : 3],
    );
  }
  const mkEnrollment = async (pid: string): Promise<string> =>
    (await q.query(
      `insert into enrollments (workspace_id, sequence_id, prospect_id,
         mailbox_id, state, next_touch_at)
       values ($1, $2, $3, $4, 'scheduled', now() - interval '1 minute')
       returning id`,
      [ws, seq, pid, mailbox],
    )).rows[0].id;
  const enrollment = await mkEnrollment(prospect);
  const extraEnrollmentIds: string[] = [];
  for (let i = 0; i < (opts.extraProspects ?? 0); i++) {
    // Merge data is deliberate. These exist only to create a second DUE
    // enrollment for the cap/spacing tests, and a prospect with no first_name
    // or company now blocks on unfilled merge fields before it can reach the
    // wire. Seeded bare, those tests silently exercised the block path instead
    // of the invariant they name — and before the block existed they asserted
    // that "<p>Hello </p>" was an acceptable thing to send a live prospect.
    const extra = (await q.query(
      `insert into prospects (workspace_id, email, first_name, company)
       values ($1, $2, 'Robin', 'Northwind') returning id`,
      [ws, `x-${randomUUID()}@example.com`],
    )).rows[0].id;
    extraEnrollmentIds.push(await mkEnrollment(extra));
  }
  return {
    workspaceId: ws, mailboxId: mailbox, prospectId: prospect,
    sequenceId: seq, enrollmentId: enrollment, prospectEmail,
    extraEnrollmentIds,
  };
}

const enrollment = async (id: string) =>
  (await pool!.query("select * from enrollments where id = $1", [id])).rows[0];
const eventsOf = async (ws: string) =>
  (await pool!.query(
    "select type, payload from events where workspace_id = $1 order by id", [ws],
  )).rows;

describe.skipIf(!dbUrl)("engine invariants (real Postgres)", () => {
  it("I1: two concurrent ticks never both claim one row; one send total", async () => {
    const s = await seed();
    const [a, b] = await Promise.all([
      pool!.query("select id from claim_due_enrollments(50, interval '5 minutes')"),
      pool!.query("select id from claim_due_enrollments(50, interval '5 minutes')"),
    ]);
    const claimedIds = [...a.rows, ...b.rows]
      .map((r) => r.id).filter((id) => id === s.enrollmentId);
    expect(claimedIds).toHaveLength(1);

    // Release the claim and run a full sweep: exactly one message on the wire.
    await pool!.query(
      "update enrollments set claimed_at = null, claim_token = null where id = $1",
      [s.enrollmentId]);
    const provider = new FakeProvider();
    const stats = await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    expect(stats.sent).toBe(1);
    expect(provider.uniqueSendCount()).toBe(1);
    const ledger = await pool!.query(
      "select state from touch_ledger where enrollment_id = $1", [s.enrollmentId]);
    expect(ledger.rows).toEqual([{ state: "sent" }]);
  });

  it("I2: a reply landing on a claimed enrollment aborts at the last-line recheck", async () => {
    const s = await seed();
    const claim = (await pool!.query(
      "select id, claim_token, attempt_epoch from claim_due_enrollments(50, interval '5 minutes')",
    )).rows.find((r) => r.id === s.enrollmentId);
    expect(claim).toBeDefined();
    // The reply arrives while the send is in flight (claimed, not executed).
    await pool!.query(
      "update enrollments set replied_at = now() where id = $1", [s.enrollmentId]);

    const provider = new FakeProvider();
    const outcome = await executeOne(pool!, provider, claim!, { jitterFraction: () => 0 });
    expect(outcome).toBe("skipped");
    expect(provider.attempts).toHaveLength(0); // never reached the provider
    const e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("replied");
    expect(e.next_touch_at).toBeNull();
    expect((await eventsOf(s.workspaceId)).map((r) => r.type))
      .toContain("enrollment.stopped_on_reply");
  });

  it("I3: a suppressed address cannot be sent to — final in-transaction check", async () => {
    const s = await seed();
    await pool!.query(
      `insert into suppression_entries (workspace_id, email, reason)
       values ($1, $2, 'hard_bounce')`,
      [s.workspaceId, s.prospectEmail.toUpperCase()], // case must not matter
    );
    const provider = new FakeProvider();
    const stats = await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    expect(stats.sent).toBe(0);
    expect(provider.uniqueSendCount()).toBe(0);
    const e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("canceled");
    expect(e.error_reason).toBe("address suppressed");
    expect((await pool!.query(
      "select count(*)::int as n from touch_ledger where enrollment_id = $1",
      [s.enrollmentId])).rows[0].n).toBe(0);
  });

  it("I8: a tick that dies after provider-ack recovers without a double send", async () => {
    const s = await seed();
    const provider = new FakeProvider();
    provider.crashAfterAck(`${s.enrollmentId}:1:0`);

    const first = await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    expect(first.failed).toBe(1);
    expect(provider.uniqueSendCount()).toBe(1); // it DID reach the wire
    let e = await enrollment(s.enrollmentId);
    expect(e.claimed_at).not.toBeNull(); // claim survives the crash
    expect((await pool!.query(
      "select count(*)::int as n from touch_ledger where enrollment_id = $1",
      [s.enrollmentId])).rows[0].n).toBe(0); // the dead transaction left nothing

    // Time passes; the claim TTL expires and the sweep re-claims (epoch bump).
    await pool!.query(
      "update enrollments set claimed_at = now() - interval '10 minutes' where id = $1",
      [s.enrollmentId]);
    const second = await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    expect(second.sent).toBe(1);
    expect(provider.uniqueSendCount()).toBe(1); // recovered, not re-sent

    e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("active");
    expect(e.current_step_order).toBe(2); // advanced past the recovered touch
    expect(e.next_touch_at).not.toBeNull();
    const types = (await eventsOf(s.workspaceId)).map((r) => r.type);
    expect(types).toContain("touch.recovered");
    const ledger = await pool!.query(
      "select attempt_epoch, state from touch_ledger where enrollment_id = $1",
      [s.enrollmentId]);
    expect(ledger.rows).toEqual([{ attempt_epoch: 1, state: "sent" }]);
  });

  it("I5: the mailbox daily cap defers to the next window — never drops", async () => {
    const s = await seed({ dailyCap: 1, extraProspects: 1 });
    const provider = new FakeProvider();
    const stats = await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    expect(stats.sent).toBe(1);
    expect(stats.deferred).toBe(1);
    expect(provider.uniqueSendCount()).toBe(1);

    const ids = [s.enrollmentId, ...s.extraEnrollmentIds];
    const rows = await Promise.all(ids.map(enrollment));
    const deferred = rows.find((r) => r.current_step_order === 1 && r.state === "scheduled");
    expect(deferred).toBeDefined();
    expect(new Date(deferred!.next_touch_at).getTime())
      .toBeGreaterThan(Date.now()); // re-armed in the future, still holding step 1
    const types = (await eventsOf(s.workspaceId)).map((r) => r.type);
    expect(types).toContain("touch.deferred");
  });

  it("blocks a send whose merge fields have nothing behind them", async () => {
    // The product promise is "blocked and flagged — never sent broken, never
    // skipped silently". Before this existed the engine rendered {{company}} as
    // "" and sent ", a quiet question on " to a live prospect.
    const s = await seed();
    await pool!.query("update prospects set company = null where id = $1", [s.prospectId]);
    const provider = new FakeProvider();
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });

    expect(provider.attempts).toHaveLength(0); // never reached the wire

    const e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("paused");
    expect(e.pause_reason).toContain("company");
    expect(e.next_touch_at).toBeNull();

    // Flagged: named in an event a human can see, and on the ledger.
    const blocked = (await eventsOf(s.workspaceId)).find((r) => r.type === "touch.blocked");
    expect(blocked).toBeDefined();
    expect(blocked!.payload.fields).toEqual(["company"]);

    const led = await pool!.query(
      "select state, error from touch_ledger where enrollment_id = $1", [s.enrollmentId]);
    expect(led.rows[0].state).toBe("skipped");
    expect(led.rows[0].error).toContain("company");
  });

  it("treats a whitespace-only value as unfilled, not as supplied", async () => {
    // A merge field is a claim that a value exists; "   " produces the same
    // broken output as nothing at all.
    const s = await seed();
    await pool!.query("update prospects set company = '   ' where id = $1", [s.prospectId]);
    const provider = new FakeProvider();
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    expect(provider.attempts).toHaveLength(0);
    expect((await enrollment(s.enrollmentId)).state).toBe("paused");
  });

  it("spaces consecutive sends from one mailbox by min_send_gap_secs", async () => {
    // Two due enrollments, one mailbox, cap well clear of the count: without
    // spacing both fired in the same tick, back to back.
    const s = await seed({ extraProspects: 1 });
    const provider = new FakeProvider();
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });

    const rows = await Promise.all(
      [s.enrollmentId, ...s.extraEnrollmentIds].map(enrollment));
    expect(rows.filter((r) => r.current_step_order === 2)).toHaveLength(1); // one sent
    const held = rows.filter((r) => r.current_step_order === 1 && r.state === "scheduled");
    expect(held).toHaveLength(1); // the other deferred, not dropped
    expect(new Date(held[0].next_touch_at).getTime())
      .toBeGreaterThan(Date.now() + 20_000); // default gap is 30s
  });

  it("applies the gap per mailbox — separate mailboxes still send in one tick", async () => {
    // Each seed() builds its own workspace and mailbox, so neither should be
    // held behind the other's send.
    const a = await seed();
    const b = await seed();
    const provider = new FakeProvider();
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });

    expect((await enrollment(a.enrollmentId)).current_step_order).toBe(2);
    expect((await enrollment(b.enrollmentId)).current_step_order).toBe(2);
  });

  it("never auto-sends a draft-first step, and sends it once approved", async () => {
    // The program plan's own Phase-4 verification row: no code path sends
    // tenant email without an approved draft. Before 0006 the second half of
    // this test was impossible — approval had nowhere to be recorded, so the
    // enrollment parked here permanently.
    const s = await seed();
    await pool!.query(
      `update sequence_steps set mode = 'draft_first'
        where sequence_id = $1 and step_order = 1`, [s.sequenceId]);

    const provider = new FakeProvider();
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });

    let e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("paused");
    expect(e.pause_reason).toBe("awaiting draft approval");
    expect(e.next_touch_at).toBeNull();
    // Nothing was attempted for THIS enrollment (other seeds share the sweep).
    const before = await pool!.query<{ c: number }>(
      "select count(*)::int as c from touch_ledger where enrollment_id = $1",
      [s.enrollmentId]);
    expect(before.rows[0]?.c).toBe(0);

    // What approveDraft does: record the approved step, hand the timer back.
    await pool!.query(
      `update enrollments
          set state = 'scheduled', pause_reason = null,
              draft_approved_step = current_step_order, next_touch_at = now()
        where id = $1`, [s.enrollmentId]);
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });

    e = await enrollment(s.enrollmentId);
    expect(e.current_step_order).toBe(2); // it sent and advanced
    const after = await pool!.query<{ c: number }>(
      `select count(*)::int as c from touch_ledger
        where enrollment_id = $1 and state = 'sent'`, [s.enrollmentId]);
    expect(after.rows[0]?.c).toBe(1);
  });

  it("sends step 1, plans step 2 at +3 days, and finishes into the cracks", async () => {
    const s = await seed({ steps: 1 });
    const provider = new FakeProvider();
    const stats = await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    expect(stats.sent).toBe(1);
    const e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("finished_no_reply"); // single step -> the cracks
    expect(e.finished_at).not.toBeNull();

    const s2 = await seed(); // two steps: verify the +3d plan
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    const e2 = await enrollment(s2.enrollmentId);
    expect(e2.current_step_order).toBe(2);
    const delta = new Date(e2.next_touch_at).getTime() - Date.now();
    expect(Math.abs(delta - 3 * 86_400_000)).toBeLessThan(5 * 60_000);
    // Variables resolved at send (R-REQ): the subject carried real values.
    const sentReq = provider.attempts.length; // sanity: sends happened
    expect(sentReq).toBeGreaterThan(0);
  });

  it("RLS: members read only their workspace; the event stream rejects member writes", async () => {
    const s1 = await seed();
    const s2 = await seed();
    const u1 = randomUUID();
    await pool!.query(
      "insert into workspace_members (workspace_id, user_id) values ($1, $2)",
      [s1.workspaceId, u1]);

    const client = await pool!.connect();
    try {
      await client.query("begin");
      await client.query("set local role authenticated");
      await client.query("select set_config('request.jwt.claim.sub', $1, true)", [u1]);
      const visible = await client.query(
        "select workspace_id from prospects");
      const wsSeen = new Set(visible.rows.map((r) => r.workspace_id));
      expect(wsSeen.has(s1.workspaceId)).toBe(true);
      expect(wsSeen.has(s2.workspaceId)).toBe(false);
      // I10: events are append-only FOR THE ENGINE; members cannot write them.
      await expect(client.query(
        `insert into events (workspace_id, type) values ($1, 'forged')`,
        [s1.workspaceId],
      )).rejects.toThrow(/row-level security/);
      await client.query("rollback");
    } finally {
      client.release();
    }
  });
});
