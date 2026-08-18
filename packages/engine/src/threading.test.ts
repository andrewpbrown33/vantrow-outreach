/** Reply-step threading against REAL Postgres: a bump step must reach the
 *  wire as "Re: <what its thread opened with>", quoting the provider ids the
 *  previous touch persisted — because Gmail threads by subject match plus
 *  References, and a mismatched subject silently starts a new conversation.
 *  This is the correctness half of the 2026-08-16 walkthrough asks. */

import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { FakeProvider, type SendRequest } from "./dispatcher";
import { sweepOnce } from "./sweep";
import { provisionTestDb } from "./test-db";

const dbUrl = await provisionTestDb();
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl, max: 4 }) : null;

afterAll(async () => {
  await pool?.end();
});

interface StepSpec {
  subject: string;
  threadAsReply: boolean;
}

/** One workspace, one prospect (Derek at Meridian), one ACTIVE sequence whose
 *  steps each get their OWN template — reply steps with an empty subject, the
 *  shape the platform form now writes. All-day window; every interval 0 so a
 *  re-arm makes the next step immediately due; and no per-mailbox send gap,
 *  because these steps share one mailbox and the sweep would otherwise pace
 *  them apart (the default is 30s + jitter) and defer every touch after the
 *  first. What that spacing does is asserted in invariants.test.ts — here it
 *  would only stop the test reaching the subject it means to check. */
async function seedThreaded(steps: StepSpec[]): Promise<{
  workspaceId: string; enrollmentId: string;
}> {
  const q = pool!;
  const ws = (await q.query(
    "insert into workspaces (name) values ('threading') returning id")).rows[0].id;
  const mailbox = (await q.query(
    `insert into mailboxes (workspace_id, email, daily_cap,
       min_send_gap_secs, jitter_secs)
     values ($1, $2, 100, 0, 0) returning id`,
    [ws, `mb-${randomUUID()}@eaverow.com`],
  )).rows[0].id;
  const prospect = (await q.query(
    `insert into prospects (workspace_id, email, first_name, company)
     values ($1, $2, 'Derek', 'Meridian') returning id`,
    [ws, `p-${randomUUID()}@example.com`],
  )).rows[0].id;
  const seq = (await q.query(
    `insert into sequences (workspace_id, name, state, mailbox_id,
       window_days, window_start_minute, window_end_minute, skip_us_holidays)
     values ($1, 's', 'active', $2, '{1,2,3,4,5,6,7}', 0, 1440, false)
     returning id`,
    [ws, mailbox],
  )).rows[0].id;
  for (const [i, step] of steps.entries()) {
    const tpl = (await q.query(
      `insert into email_templates (workspace_id, name, subject, body_html)
       values ($1, $2, $3, '<p>Hello {{firstName}}</p>') returning id`,
      [ws, `step ${i + 1}`, step.subject],
    )).rows[0].id;
    await q.query(
      `insert into sequence_steps (workspace_id, sequence_id, step_order,
         template_id, interval_days, interval_hours, thread_as_reply)
       values ($1, $2, $3, $4, 0, 0, $5)`,
      [ws, seq, i + 1, tpl, step.threadAsReply],
    );
  }
  const enrollment = (await q.query(
    `insert into enrollments (workspace_id, sequence_id, prospect_id,
       mailbox_id, state, next_touch_at)
     values ($1, $2, $3, $4, 'scheduled', now() - interval '1 minute')
     returning id`,
    [ws, seq, prospect, mailbox],
  )).rows[0].id;
  return { workspaceId: ws, enrollmentId: enrollment };
}

/** Pull the enrollment's timer back to "due now" so the next sweep fires the
 *  next step without waiting out the interval. */
async function makeDue(enrollmentId: string): Promise<void> {
  await pool!.query(
    `update enrollments set next_touch_at = now() - interval '1 minute'
      where id = $1 and next_touch_at is not null`,
    [enrollmentId],
  );
}

describe.skipIf(!dbUrl)("reply-step threading (real Postgres)", () => {
  it("bump steps send Re: <rendered opener>, quoting the provider's ids", async () => {
    const s = await seedThreaded([
      { subject: "{{firstName}}, a quiet question on {{company}}", threadAsReply: false },
      { subject: "", threadAsReply: true },
      { subject: "", threadAsReply: true },
    ]);
    const provider = new FakeProvider();
    for (let i = 0; i < 3; i++) {
      await makeDue(s.enrollmentId);
      await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    }
    expect(provider.requests).toHaveLength(3);
    const [first, second, third] =
      provider.requests as [SendRequest, SendRequest, SendRequest];

    expect(first.subject).toBe("Derek, a quiet question on Meridian");
    expect(first.threadAsReply).toBe(false);

    // The bump: derived subject, single Re:, threaded on the ids the FIRST
    // touch persisted (FakeProvider mints fake-thread-N / <fake-N@…>).
    expect(second.subject).toBe("Re: Derek, a quiet question on Meridian");
    expect(second.threadAsReply).toBe(true);
    expect(second.inReplyToMessageId).toBe("<fake-1@provider.test>");
    expect(second.threadId).toBe("fake-thread-1");

    // The third touch threads under the SECOND (nearest sent), and stripping
    // keeps the subject at one Re: rather than stacking.
    expect(third.subject).toBe("Re: Derek, a quiet question on Meridian");
    expect(third.inReplyToMessageId).toBe("<fake-2@provider.test>");
    expect(third.threadId).toBe("fake-thread-2");

    // The ledger remembers exactly what each touch sent.
    const ledger = await pool!.query(
      `select step_order, sent_subject from touch_ledger
        where enrollment_id = $1 order by step_order`,
      [s.enrollmentId],
    );
    expect(ledger.rows.map((r) => r.sent_subject)).toEqual([
      "Derek, a quiet question on Meridian",
      "Re: Derek, a quiet question on Meridian",
      "Re: Derek, a quiet question on Meridian",
    ]);
  });

  it("falls back to re-rendering the opener when the ledger predates 0006", async () => {
    const s = await seedThreaded([
      { subject: "Roofs at {{company}}", threadAsReply: false },
      { subject: "", threadAsReply: true },
    ]);
    const provider = new FakeProvider();
    await makeDue(s.enrollmentId);
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    // Simulate a touch recorded before sent_subject existed.
    await pool!.query(
      "update touch_ledger set sent_subject = null where enrollment_id = $1",
      [s.enrollmentId],
    );
    await makeDue(s.enrollmentId);
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });

    expect(provider.requests[1]?.subject).toBe("Re: Roofs at Meridian");
  });

  it("legacy reply steps that carry their own subject keep sending it as Re:", async () => {
    // Pre-walkthrough sequences stored a real subject on every step. The
    // derivation must not invent a different thread than the one the ledger
    // opened — prev sent_subject wins over the step's own words.
    const s = await seedThreaded([
      { subject: "Opening line for {{company}}", threadAsReply: false },
      { subject: "Following up again", threadAsReply: true },
    ]);
    const provider = new FakeProvider();
    for (let i = 0; i < 2; i++) {
      await makeDue(s.enrollmentId);
      await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    }
    expect(provider.requests[1]?.subject).toBe("Re: Opening line for Meridian");
  });

  it("parks the enrollment visibly when no thread subject exists anywhere", async () => {
    // Malformed on purpose: a reply step with an empty subject, an opener with
    // an empty subject, and a ledger with no sent row to lean on.
    const s = await seedThreaded([
      { subject: "", threadAsReply: false },
      { subject: "", threadAsReply: true },
    ]);
    const provider = new FakeProvider();
    await makeDue(s.enrollmentId);
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    // The opener's recorded subject is blank, its template is blank, and no
    // earlier thread-opener exists: every rung of the derivation is absent.
    await makeDue(s.enrollmentId);
    await sweepOnce(pool!, provider, { jitterFraction: () => 0 });

    const e = (await pool!.query(
      "select state, pause_reason from enrollments where id = $1", [s.enrollmentId],
    )).rows[0];
    expect(e.state).toBe("paused");
    expect(e.pause_reason).toBe("reply step has no thread subject");
    // Exactly one message went out (the empty-subject opener) — the reply
    // step never reached the provider.
    expect(provider.requests).toHaveLength(1);
  });
});
