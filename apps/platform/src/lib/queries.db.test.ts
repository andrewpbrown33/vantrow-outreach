/** The product surfaces against real Postgres.
 *
 *  Mocks would have hidden the bug this file exists for. The sweep parks an
 *  enrollment whose sequence is not active and clears its `next_touch_at`;
 *  since that column IS the schedule, turning the sequence on later has to
 *  re-plan those rows or they are stranded — paused forever, invisible to the
 *  claim query, never sent, no error anywhere. Only a real database, with the
 *  real migrations and the real partial indexes, tells you that.
 *
 *  Skips when no Postgres is reachable, and hard-fails in CI instead (the
 *  engine harness owns that policy). */

import { afterAll, describe, expect, it } from "vitest";
import { provisionTestDb } from "@vantrow/engine/test-db";
import pg from "pg";

// Top-level, before the describes register: the skip decision has to be made
// at collection time, and queries.ts must not be imported until getPool() has
// a URL to memoize.
const url = await provisionTestDb();
if (url) process.env.SUPABASE_DB_URL = url;
const admin = url ? new pg.Pool({ connectionString: url, max: 4 }) : null!;
const q = url
  ? await import("./queries")
  : (null as unknown as typeof import("./queries"));

const WS_A = "00000000-0000-4000-8000-0000000000a1";
const WS_B = "00000000-0000-4000-8000-0000000000b2";

afterAll(async () => {
  await admin?.end();
  await (globalThis as { __nudgerowPool?: pg.Pool }).__nudgerowPool?.end();
});

const run = () => (url ? describe : describe.skip);

interface Fixture {
  sequenceId: string;
  mailboxId: string;
  prospectIds: string[];
}

/** A workspace with one mailbox, one draft sequence, one step, and n people. */
async function seed(ws: string, emails: string[], name = "Intro"): Promise<Fixture> {
  await admin.query(
    `insert into public.workspaces (id, name) values ($1, $2)
     on conflict (id) do nothing`, [ws, `ws-${ws.slice(-2)}`]);
  const mb = await admin.query<{ id: string }>(
    `insert into public.mailboxes (workspace_id, email) values ($1, $2) returning id`,
    [ws, `sender-${ws.slice(-2)}-${name}@example.com`]);
  const seq = await admin.query<{ id: string }>(
    `insert into public.sequences
       (workspace_id, name, state, mailbox_id, window_days,
        window_start_minute, window_end_minute, skip_us_holidays)
     values ($1, $2, 'draft', $3, '{1,2,3,4,5}', 480, 1020, false)
     returning id`, [ws, name, mb.rows[0].id]);
  await admin.query(
    `insert into public.sequence_steps
       (workspace_id, sequence_id, step_order, mode, interval_days, interval_hours)
     values ($1, $2, 1, 'auto', 0, 0)`, [ws, seq.rows[0].id]);

  const ids: string[] = [];
  for (const email of emails) {
    const p = await admin.query<{ id: string }>(
      `insert into public.prospects (workspace_id, email) values ($1, $2) returning id`,
      [ws, email]);
    ids.push(p.rows[0].id);
  }
  return { sequenceId: seq.rows[0].id, mailboxId: mb.rows[0].id, prospectIds: ids };
}

/** What the sweep does to an enrollment whose sequence is not active. */
async function sweepParks(enrollmentId: string): Promise<void> {
  await admin.query(
    `update public.enrollments
        set state = 'paused', next_touch_at = null,
            pause_reason = 'sequence not active', claimed_at = null
      where id = $1`, [enrollmentId]);
}

run()("activateSequence", () => {
  it("re-plans everyone the sweep parked, so a draft-then-start flow sends", async () => {
    const f = await seed(WS_A, ["a1@x.com", "a2@x.com"], "draft-then-start");
    await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);

    const before = await q.listEnrollments(WS_A, f.sequenceId);
    expect(before).toHaveLength(2);
    for (const e of before) await sweepParks(e.id);

    const parked = await admin.query(
      `select state, next_touch_at from public.enrollments where sequence_id = $1`,
      [f.sequenceId]);
    expect(parked.rows.every((r) => r.state === "paused" && r.next_touch_at === null)).toBe(true);

    const result = await q.activateSequence(WS_A, f.sequenceId);
    expect(result).toEqual({ activated: true, revived: 2 });

    const after = await admin.query(
      `select state, next_touch_at, pause_reason from public.enrollments
        where sequence_id = $1`, [f.sequenceId]);
    for (const r of after.rows) {
      expect(r.state).toBe("scheduled");
      expect(r.pause_reason).toBeNull();
      // The timer is armed again — this is the whole point.
      expect(r.next_touch_at).not.toBeNull();
    }
  });

  it("leaves an out-of-office pause alone — reviving it early would break I6", async () => {
    const f = await seed(WS_A, ["ooo@x.com"], "ooo-untouched");
    await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    const [enrollment] = await q.listEnrollments(WS_A, f.sequenceId);
    const resumeAt = new Date(Date.now() + 5 * 86_400_000);
    await admin.query(
      `update public.enrollments
          set state = 'paused', next_touch_at = null,
              pause_reason = 'out of office', resume_at = $2
        where id = $1`, [enrollment.id, resumeAt]);

    const result = await q.activateSequence(WS_A, f.sequenceId);
    expect(result.revived).toBe(0);

    const { rows } = await admin.query(
      `select state, pause_reason, next_touch_at from public.enrollments where id = $1`,
      [enrollment.id]);
    expect(rows[0].state).toBe("paused");
    expect(rows[0].pause_reason).toBe("out of office");
    expect(rows[0].next_touch_at).toBeNull();
  });

  it("leaves a ledger entry for every revival (I10)", async () => {
    const f = await seed(WS_A, ["ledger@x.com"], "ledger");
    await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    const [e] = await q.listEnrollments(WS_A, f.sequenceId);
    await sweepParks(e.id);
    await q.activateSequence(WS_A, f.sequenceId);

    const { rows } = await admin.query(
      `select payload from public.events
        where enrollment_id = $1 and type = 'enrollment.resumed'`, [e.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].payload.reason).toBe("sequence_activated");
  });

  it("refuses to touch another workspace's sequence", async () => {
    const f = await seed(WS_A, ["cross@x.com"], "cross-tenant");
    await admin.query(
      `insert into public.workspaces (id, name) values ($1, 'other')
       on conflict (id) do nothing`, [WS_B]);
    const result = await q.activateSequence(WS_B, f.sequenceId);
    expect(result).toEqual({ activated: false, revived: 0 });
    const { rows } = await admin.query(
      `select state from public.sequences where id = $1`, [f.sequenceId]);
    expect(rows[0].state).toBe("draft");
  });
});

run()("enrollProspects", () => {
  it("refuses a suppressed address and names it, rather than dropping it", async () => {
    const f = await seed(WS_A, ["ok@x.com", "bounced@x.com"], "suppression");
    await admin.query(
      `insert into public.suppression_entries (workspace_id, email, reason)
       values ($1, 'BOUNCED@x.com', 'hard_bounce')`, [WS_A]);

    const out = await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    expect(out.enrolled).toBe(1);
    expect(out.suppressed).toEqual(["bounced@x.com"]);
    const rows = await q.listEnrollments(WS_A, f.sequenceId);
    expect(rows.map((r) => r.prospectEmail)).toEqual(["ok@x.com"]);
  });

  it("refuses an opted-out prospect", async () => {
    const f = await seed(WS_A, ["gone@x.com"], "opted-out");
    await admin.query(
      `update public.prospects set opted_out_at = now() where id = $1`,
      [f.prospectIds[0]]);
    const out = await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    expect(out.enrolled).toBe(0);
    expect(out.optedOut).toEqual(["gone@x.com"]);
  });

  it("is idempotent — a second pass does not double-enroll anyone", async () => {
    const f = await seed(WS_A, ["twice@x.com"], "idempotent");
    expect((await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds)).enrolled).toBe(1);
    const second = await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    expect(second.enrolled).toBe(0);
    expect(second.alreadyEnrolled).toBe(1);
    expect(await q.listEnrollments(WS_A, f.sequenceId)).toHaveLength(1);
  });

  it("plans the first touch inside the sequence's sending window", async () => {
    const f = await seed(WS_A, ["window@x.com"], "window");
    await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    const { rows } = await admin.query<{ next_touch_at: Date }>(
      `select next_touch_at from public.enrollments where sequence_id = $1`,
      [f.sequenceId]);
    const at = rows[0].next_touch_at;
    // Seeded window is Mon–Fri 08:00–17:00 in the fallback zone.
    const local = new Date(at.toLocaleString("en-US", { timeZone: "America/New_York" }));
    expect(local.getDay()).toBeGreaterThanOrEqual(1);
    expect(local.getDay()).toBeLessThanOrEqual(5);
    expect(local.getHours()).toBeGreaterThanOrEqual(8);
    expect(local.getHours()).toBeLessThan(17);
  });

  it("ignores prospect ids belonging to another workspace", async () => {
    const mine = await seed(WS_A, ["mine@x.com"], "tenant-mine");
    const theirs = await seed(WS_B, ["theirs@x.com"], "tenant-theirs");
    const out = await q.enrollProspects(
      WS_A, mine.sequenceId, [...mine.prospectIds, ...theirs.prospectIds]);
    expect(out.enrolled).toBe(1);
    const rows = await q.listEnrollments(WS_A, mine.sequenceId);
    expect(rows.map((r) => r.prospectEmail)).toEqual(["mine@x.com"]);
  });

  it("refuses a sequence with no sending mailbox rather than writing dead rows", async () => {
    const f = await seed(WS_A, ["nomailbox@x.com"], "no-mailbox");
    await admin.query(
      `update public.sequences set mailbox_id = null where id = $1`, [f.sequenceId]);
    await expect(q.enrollProspects(WS_A, f.sequenceId, f.prospectIds))
      .rejects.toThrow(/sending mailbox/);
  });
});

run()("upsertProspects", () => {
  it("enriches an existing person instead of duplicating them", async () => {
    await admin.query(
      `insert into public.workspaces (id, name) values ($1, 'up')
       on conflict (id) do nothing`, [WS_A]);
    const first = await q.upsertProspects(WS_A, [
      { email: "dup@x.com", firstName: "Ana" },
    ]);
    expect(first.created).toBe(1);

    const second = await q.upsertProspects(WS_A, [
      { email: "DUP@x.com", company: "Foundry" },
    ]);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(1);

    const { rows } = await admin.query(
      `select first_name, company from public.prospects
        where workspace_id = $1 and lower(email) = 'dup@x.com'`, [WS_A]);
    expect(rows).toHaveLength(1);
    // The blank incoming first name must not erase what was already known.
    expect(rows[0].first_name).toBe("Ana");
    expect(rows[0].company).toBe("Foundry");
  });
});

run()("workspace scoping", () => {
  it("never lets one workspace's summaries include another's sequences", async () => {
    await seed(WS_A, ["scope-a@x.com"], "scope-a");
    await seed(WS_B, ["scope-b@x.com"], "scope-b");
    const a = await q.listSequenceSummaries(WS_A);
    const b = await q.listSequenceSummaries(WS_B);
    expect(a.some((s) => s.name === "scope-b")).toBe(false);
    expect(b.some((s) => s.name === "scope-a")).toBe(false);
    expect(b.map((s) => s.name)).toContain("scope-b");
  });

  it("returns null for a sequence in another workspace", async () => {
    const f = await seed(WS_A, ["hidden@x.com"], "hidden");
    expect(await q.getSequence(WS_B, f.sequenceId)).toBeNull();
    expect(await q.listEnrollments(WS_B, f.sequenceId)).toEqual([]);
    expect(await q.listSteps(WS_B, f.sequenceId)).toEqual([]);
  });
});

/** What the sweep does to a draft-first step: parks it and clears the timer.
 *  Mirrors the branch in packages/engine/src/sweep.ts exactly — including the
 *  null next_touch_at, which is what made this a dead end before 0007. */
async function sweepParksDraft(enrollmentId: string): Promise<void> {
  await admin.query(
    `update public.enrollments
        set state = 'paused', next_touch_at = null,
            pause_reason = 'awaiting draft approval', claimed_at = null
      where id = $1`, [enrollmentId]);
}

run()("approveDraft", () => {
  it("re-arms a parked draft-first step and records the step it approved", async () => {
    const f = await seed(WS_A, ["d1@x.com"], "draft-approve");
    await admin.query(
      `update public.sequence_steps set mode = 'draft_first'
        where sequence_id = $1 and step_order = 1`, [f.sequenceId]);
    await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    const [e] = await q.listEnrollments(WS_A, f.sequenceId);
    await sweepParksDraft(e.id);

    expect(await q.approveDraft(WS_A, e.id)).toBe(true);

    const { rows } = await admin.query(
      `select state, pause_reason, next_touch_at, draft_approved_step,
              current_step_order
         from public.enrollments where id = $1`, [e.id]);
    expect(rows[0].state).toBe("scheduled");
    expect(rows[0].pause_reason).toBeNull();
    expect(rows[0].next_touch_at).not.toBeNull(); // the timer is back
    // Recorded per step: this is what stops the sweep re-parking it forever.
    expect(rows[0].draft_approved_step).toBe(rows[0].current_step_order);
  });

  it("does not pre-approve a later step", async () => {
    const f = await seed(WS_A, ["d2@x.com"], "draft-per-step");
    await admin.query(
      `update public.sequence_steps set mode = 'draft_first'
        where sequence_id = $1 and step_order = 1`, [f.sequenceId]);
    await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    const [e] = await q.listEnrollments(WS_A, f.sequenceId);
    await sweepParksDraft(e.id);
    await q.approveDraft(WS_A, e.id);

    // The engine advances to step 2; the step-1 approval must not carry.
    await admin.query(
      `update public.enrollments set current_step_order = 2 where id = $1`, [e.id]);
    const { rows } = await admin.query(
      `select draft_approved_step, current_step_order
         from public.enrollments where id = $1`, [e.id]);
    expect(rows[0].draft_approved_step).not.toBe(rows[0].current_step_order);
  });

  it("refuses an enrollment that is not awaiting approval", async () => {
    const f = await seed(WS_A, ["d3@x.com"], "draft-noop");
    await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    const [e] = await q.listEnrollments(WS_A, f.sequenceId);
    expect(await q.approveDraft(WS_A, e.id)).toBe(false);
  });

  it("will not approve across a workspace boundary", async () => {
    const f = await seed(WS_A, ["d4@x.com"], "draft-tenancy");
    await q.enrollProspects(WS_A, f.sequenceId, f.prospectIds);
    const [e] = await q.listEnrollments(WS_A, f.sequenceId);
    await sweepParksDraft(e.id);

    expect(await q.approveDraft(WS_B, e.id)).toBe(false);
    const { rows } = await admin.query(
      "select state from public.enrollments where id = $1", [e.id]);
    expect(rows[0].state).toBe("paused"); // untouched by the wrong tenant
  });
});
