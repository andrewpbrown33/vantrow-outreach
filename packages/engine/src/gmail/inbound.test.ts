/** Inbound behaviors against REAL Postgres: reply -> I2, OOO -> I6 (pause with
 *  return date, auto-resume through the planner, never a reply), hard bounce
 *  -> I7 (suppress + halt), all idempotent by Gmail message id. */

import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { FakeProvider } from "../dispatcher";
import { sweepOnce } from "../sweep";
import { provisionTestDb } from "../test-db";
import { processInbound, type NormalizedInbound } from "./inbound";

const dbUrl = await provisionTestDb();
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl, max: 4 }) : null;

afterAll(async () => {
  await pool?.end();
});

async function seed(): Promise<{
  ws: string; mailboxId: string; prospectId: string; enrollmentId: string;
  prospectEmail: string;
}> {
  const q = pool!;
  const ws = (await q.query(
    "insert into workspaces (name) values ('t') returning id")).rows[0].id;
  const mailboxId = (await q.query(
    `insert into mailboxes (workspace_id, email) values ($1, $2) returning id`,
    [ws, `mb-${randomUUID()}@getvantrow.com`])).rows[0].id;
  const prospectEmail = `p-${randomUUID()}@example.com`;
  const prospectId = (await q.query(
    `insert into prospects (workspace_id, email, first_name)
     values ($1, $2, 'Derek') returning id`, [ws, prospectEmail])).rows[0].id;
  const template = (await q.query(
    `insert into email_templates (workspace_id, name, subject, body_html)
     values ($1, 't', 's', 'b') returning id`, [ws])).rows[0].id;
  const seq = (await q.query(
    `insert into sequences (workspace_id, name, state, mailbox_id,
       window_days, window_start_minute, window_end_minute, skip_us_holidays)
     values ($1, 's', 'active', $2, '{1,2,3,4,5,6,7}', 0, 1440, false)
     returning id`, [ws, mailboxId])).rows[0].id;
  for (const [order, days] of [[1, 0], [2, 3]] as const) {
    await q.query(
      `insert into sequence_steps (workspace_id, sequence_id, step_order,
         template_id, interval_days) values ($1, $2, $3, $4, $5)`,
      [ws, seq, order, template, days]);
  }
  const enrollmentId = (await q.query(
    `insert into enrollments (workspace_id, sequence_id, prospect_id,
       mailbox_id, state, current_step_order, next_touch_at)
     values ($1, $2, $3, $4, 'active', 2, now() + interval '2 days')
     returning id`, [ws, seq, prospectId, mailboxId])).rows[0].id;
  return { ws, mailboxId, prospectId, enrollmentId, prospectEmail };
}

function inbound(over: Partial<NormalizedInbound>): NormalizedInbound {
  return {
    gmailMessageId: `g-${randomUUID()}`,
    headers: {},
    fromEmail: "someone@example.com",
    subject: "Re: a quiet question",
    snippet: "snippet",
    bodyText: "Happy to take a look.",
    receivedAt: new Date(),
    ...over,
  };
}

const enrollment = async (id: string) =>
  (await pool!.query("select * from enrollments where id = $1", [id])).rows[0];
const eventTypes = async (ws: string) =>
  (await pool!.query(
    "select type from events where workspace_id = $1 order by id", [ws],
  )).rows.map((r) => r.type as string);

describe.skipIf(!dbUrl)("inbound behaviors (real Postgres)", () => {
  it("I2: a touch-referenced reply stops the enrollment; re-delivery is inert", async () => {
    const s = await seed();
    const msg = inbound({
      fromEmail: s.prospectEmail,
      headers: { "in-reply-to": `<touch-${s.enrollmentId}-1@getvantrow.com>` },
    });
    const first = await processInbound(pool!, s.mailboxId, msg);
    expect(first).toMatchObject({
      classification: "reply", enrollmentId: s.enrollmentId, duplicate: false,
    });
    const e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("replied");
    expect(e.next_touch_at).toBeNull();
    expect(e.replied_at).not.toBeNull();

    // The sync is at-least-once: the same Gmail message must change nothing.
    const again = await processInbound(pool!, s.mailboxId, msg);
    expect(again.duplicate).toBe(true);
    const types = await eventTypes(s.ws);
    expect(types.filter((t) => t === "inbound.reply")).toHaveLength(1);
  });

  it("matches replies without a touch header by sender address", async () => {
    const s = await seed();
    const res = await processInbound(pool!, s.mailboxId,
      inbound({ fromEmail: s.prospectEmail.toUpperCase() }));
    expect(res.classification).toBe("reply");
    expect(res.enrollmentId).toBe(s.enrollmentId);
    expect((await enrollment(s.enrollmentId)).state).toBe("replied");
  });

  it("I6: OOO pauses with the return date, never a reply — then auto-resumes through the window", async () => {
    const s = await seed();
    const res = await processInbound(pool!, s.mailboxId, inbound({
      fromEmail: s.prospectEmail,
      headers: { "auto-submitted": "auto-replied" },
      subject: "Automatic reply: a quiet question",
      bodyText: "I will return on March 9, 2027.",
    }));
    expect(res.classification).toBe("ooo");
    let e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("paused");
    expect(e.pause_reason).toBe("out of office");
    expect(e.replied_at).toBeNull(); // I6: never counts as a reply
    expect(new Date(e.resume_at).toISOString().slice(0, 10)).toBe("2027-03-09");
    expect(e.next_touch_at).toBeNull();

    // The return date passes; the next sweep resumes it via the planner and
    // (all-day test window) sends the pending step in the same tick.
    await pool!.query(
      "update enrollments set resume_at = now() - interval '1 minute' where id = $1",
      [s.enrollmentId]);
    const provider = new FakeProvider();
    const stats = await sweepOnce(pool!, provider, { jitterFraction: () => 0 });
    expect(stats.sent).toBe(1);
    e = await enrollment(s.enrollmentId);
    expect(e.pause_reason).toBeNull();
    expect((await eventTypes(s.ws))).toContain("enrollment.resumed");
  });

  it("I7: a hard DSN bounce suppresses the address and halts the enrollment", async () => {
    const s = await seed();
    const res = await processInbound(pool!, s.mailboxId, inbound({
      fromEmail: "mailer-daemon@googlemail.com",
      headers: {
        "content-type": "multipart/report; report-type=delivery-status",
        "in-reply-to": `<touch-${s.enrollmentId}-1@getvantrow.com>`,
      },
      subject: "Delivery Status Notification (Failure)",
      bodyText:
        `Final-Recipient: rfc822; ${s.prospectEmail.toUpperCase()}\n` +
        "Action: failed\nStatus: 5.1.1\n",
    }));
    expect(res.classification).toBe("bounce_hard");
    const e = await enrollment(s.enrollmentId);
    expect(e.state).toBe("bounced");
    expect(e.error_reason).toContain("5.1.1");
    expect(e.next_touch_at).toBeNull();
    const sup = await pool!.query(
      `select reason from suppression_entries
        where workspace_id = $1 and lower(email) = lower($2)`,
      [s.ws, s.prospectEmail]);
    expect(sup.rows).toEqual([{ reason: "hard_bounce" }]);
  });

  it("records soft bounces without halting the enrollment", async () => {
    const s = await seed();
    const res = await processInbound(pool!, s.mailboxId, inbound({
      fromEmail: "postmaster@corp.example",
      headers: { "in-reply-to": `<touch-${s.enrollmentId}-1@getvantrow.com>` },
      bodyText: "Status: 4.2.2\nFinal-Recipient: rfc822; x@y.z\n",
    }));
    expect(res.classification).toBe("bounce_soft");
    expect((await enrollment(s.enrollmentId)).state).toBe("active");
    expect(await eventTypes(s.ws)).toContain("inbound.bounce_soft");
  });
});
