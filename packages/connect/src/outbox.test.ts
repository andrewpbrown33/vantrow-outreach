/** Outbox durability and delivery, against REAL Postgres: enqueue is
 *  transactional with the caller's state change, delivery follows the spec's
 *  retry ladder then dead-letters, the event id is stable across retries
 *  (the consumer's dedup key), and non-HTTPS endpoints never receive. */

import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { provisionTestDb } from "../../engine/src/test-db";
import { drainOutbox, enqueueEvent, verifySignature } from "./index";

const dbUrl = await provisionTestDb();
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl, max: 4 }) : null;
afterAll(async () => { await pool?.end(); });

async function seedEndpoint(opts: { url?: string; types?: string[] } = {}) {
  const ws = (await pool!.query(
    "insert into workspaces (name) values ('t') returning id")).rows[0].id;
  const tenantId = `ten_${randomUUID().replace(/-/g, "")}`;
  await pool!.query(
    `insert into connect_endpoints (workspace_id, url, secret, tenant_id, event_types)
     values ($1, $2, 'whsec_test', $3, $4)`,
    [ws, opts.url ?? "https://dash.vantrow.example/hooks", tenantId, opts.types ?? []]);
  return { ws, tenantId };
}

const enqueue = async (ws: string, tenantId: string, type = "project.status_changed") => {
  const client = await pool!.connect();
  try {
    await client.query("begin");
    const env = await enqueueEvent(client, {
      workspaceId: ws, tenantId, type,
      occurredAt: new Date("2026-08-09T09:41:00Z"),
      data: { hello: "world" },
    });
    await client.query("commit");
    return env;
  } finally { client.release(); }
};

const row = async (eventId: string) =>
  (await pool!.query("select * from connect_outbox where event_id = $1", [eventId])).rows[0];

describe.skipIf(!dbUrl)("Connect outbox (real Postgres)", () => {
  it("enqueue rolls back with the caller's transaction — no event for a change that didn't happen", async () => {
    const { ws, tenantId } = await seedEndpoint();
    const client = await pool!.connect();
    let eventId = "";
    try {
      await client.query("begin");
      const env = await enqueueEvent(client, {
        workspaceId: ws, tenantId, type: "project.created",
        occurredAt: new Date(), data: {},
      });
      eventId = env.id;
      await client.query("rollback"); // the state change failed
    } finally { client.release(); }
    expect(await row(eventId)).toBeUndefined();
  });

  it("delivers with a verifiable signature over the exact bytes sent", async () => {
    const { ws, tenantId } = await seedEndpoint();
    const env = await enqueue(ws, tenantId);
    let seen: { body: string; sig: string; id: string } | null = null;
    const stats = await drainOutbox(pool!, {
      now: () => Date.UTC(2026, 7, 9, 12, 0, 0),
      fetchImpl: async (_url, init) => {
        const h = init!.headers as Record<string, string>;
        seen = {
          body: String(init!.body),
          sig: h["x-vantrow-signature"]!,
          id: h["x-vantrow-event-id"]!,
        };
        return new Response(null, { status: 204 }); // 204 forbids a body
      },
    });
    expect(stats.delivered).toBe(1);
    expect(seen!.id).toBe(env.id);
    // A consumer verifying by the spec's own algorithm must accept it.
    expect(verifySignature(seen!.sig, seen!.body, "whsec_test",
      Date.UTC(2026, 7, 9, 12, 0, 0))).toBe(true);
    // Tampering with a single byte must break it.
    expect(verifySignature(seen!.sig, seen!.body + " ", "whsec_test",
      Date.UTC(2026, 7, 9, 12, 0, 0))).toBe(false);
    expect((await row(env.id)).state).toBe("delivered");
  });

  it("retries on the spec's ladder, keeps the event id, then dead-letters", async () => {
    const { ws, tenantId } = await seedEndpoint();
    const env = await enqueue(ws, tenantId);
    const seenIds = new Set<string>();
    const failing = async (_u: string, init?: RequestInit) => {
      seenIds.add((init!.headers as Record<string, string>)["x-vantrow-event-id"]!);
      return new Response("nope", { status: 500 });
    };

    // 5 backoff slots, then the 6th failure dead-letters.
    for (let attempt = 1; attempt <= 5; attempt++) {
      const stats = await drainOutbox(pool!, { fetchImpl: failing });
      expect(stats.retrying).toBe(1);
      const r = await row(env.id);
      expect(r.state).toBe("pending");
      expect(r.attempts).toBe(attempt);
      expect(new Date(r.next_attempt_at).getTime()).toBeGreaterThan(Date.now());
      // Make it due again for the next round.
      await pool!.query(
        "update connect_outbox set next_attempt_at = now() where id = $1", [r.id]);
    }
    const last = await drainOutbox(pool!, { fetchImpl: failing });
    expect(last.deadLettered).toBe(1);
    const dead = await row(env.id);
    expect(dead.state).toBe("dead_lettered");
    expect(dead.last_error).toContain("http_500");
    // Every attempt carried the SAME id — the consumer's dedup key.
    expect([...seenIds]).toEqual([env.id]);
  });

  it("treats a 3xx as failure and never follows it", async () => {
    const { ws, tenantId } = await seedEndpoint();
    const env = await enqueue(ws, tenantId);
    let redirectMode: string | undefined;
    const stats = await drainOutbox(pool!, {
      fetchImpl: async (_u, init) => {
        redirectMode = init!.redirect;
        return new Response("", { status: 302 });
      },
    });
    expect(stats.retrying).toBe(1);
    expect(redirectMode).toBe("manual");
    expect((await row(env.id)).state).toBe("pending");
  });

  it("dead-letters a non-HTTPS endpoint without ever sending", async () => {
    const { ws, tenantId } = await seedEndpoint({ url: "http://insecure.example/hook" });
    const env = await enqueue(ws, tenantId);
    let called = false;
    const stats = await drainOutbox(pool!, {
      fetchImpl: async () => { called = true; return new Response("", { status: 200 }); },
    });
    expect(called).toBe(false);
    expect(stats.deadLettered).toBe(1);
    expect((await row(env.id)).last_error).toContain("https");
  });

  it("honors per-endpoint event-type filters", async () => {
    const { ws, tenantId } = await seedEndpoint({ types: ["invoice.paid"] });
    const env = await enqueue(ws, tenantId, "project.status_changed");
    let called = false;
    const stats = await drainOutbox(pool!, {
      fetchImpl: async () => { called = true; return new Response("", { status: 200 }); },
    });
    expect(called).toBe(false);
    expect(stats.skipped).toBe(1);
    expect((await row(env.id)).state).toBe("delivered");
  });
});

/** The producer wired to the ENGINE: a real terminal transition must enqueue a
 *  Connect event in the same transaction — and must not when no endpoint is
 *  configured (the common case must stay free). */
describe.skipIf(!dbUrl)("engine → Connect emission", () => {
  async function seedRunnable(withEndpoint: boolean) {
    const ws = (await pool!.query(
      "insert into workspaces (name) values ('t') returning id")).rows[0].id;
    const tenantId = `ten_${randomUUID().replace(/-/g, "")}`;
    if (withEndpoint) {
      await pool!.query(
        `insert into connect_endpoints (workspace_id, url, secret, tenant_id)
         values ($1, 'https://dash.example/hooks', 'whsec_test', $2)`, [ws, tenantId]);
    }
    const mailbox = (await pool!.query(
      `insert into mailboxes (workspace_id, email) values ($1, $2) returning id`,
      [ws, `mb-${randomUUID()}@getvantrow.com`])).rows[0].id;
    const prospect = (await pool!.query(
      `insert into prospects (workspace_id, email) values ($1, $2) returning id`,
      [ws, `p-${randomUUID()}@example.com`])).rows[0].id;
    const template = (await pool!.query(
      `insert into email_templates (workspace_id, name, subject, body_html)
       values ($1, 't', 's', 'b') returning id`, [ws])).rows[0].id;
    const seq = (await pool!.query(
      `insert into sequences (workspace_id, name, state, mailbox_id,
         window_days, window_start_minute, window_end_minute, skip_us_holidays)
       values ($1, 'Vantrow intro', 'active', $2, '{1,2,3,4,5,6,7}', 0, 1440, false)
       returning id`, [ws, mailbox])).rows[0].id;
    await pool!.query(
      `insert into sequence_steps (workspace_id, sequence_id, step_order, template_id)
       values ($1, $2, 1, $3)`, [ws, seq, template]);
    await pool!.query(
      `insert into enrollments (workspace_id, sequence_id, prospect_id, mailbox_id,
         state, next_touch_at)
       values ($1, $2, $3, $4, 'scheduled', now() - interval '1 minute')`,
      [ws, seq, prospect, mailbox]);
    return { ws, tenantId, seq };
  }

  it("a finished-no-reply enrollment enqueues project.status_changed with live counts", async () => {
    const { FakeProvider } = await import("../../engine/src/dispatcher");
    const { sweepOnce } = await import("../../engine/src/sweep");
    const { ws, tenantId, seq } = await seedRunnable(true);

    // One step: sending it finishes the enrollment into the cracks.
    const stats = await sweepOnce(pool!, new FakeProvider(), { jitterFraction: () => 0 });
    expect(stats.sent).toBe(1);

    const queued = await pool!.query(
      "select event_type, payload from connect_outbox where workspace_id = $1", [ws]);
    expect(queued.rows).toHaveLength(1);
    const env = queued.rows[0].payload;
    expect(env.type).toBe("project.status_changed");
    expect(env.tenant_id).toBe(tenantId);
    expect(env.data.project.id)
      .toBe(`proj_${seq.replace(/-/g, "")}`);
    // The cracks count the dashboard came for.
    expect(env.data.project.extensions["outreach.sequence"])
      .toMatchObject({ enrolled: 1, finished_no_reply: 1, sent: 1, replied: 0 });
  });

  it("emits nothing when the workspace has no Connect endpoint", async () => {
    const { FakeProvider } = await import("../../engine/src/dispatcher");
    const { sweepOnce } = await import("../../engine/src/sweep");
    const { ws } = await seedRunnable(false);
    await sweepOnce(pool!, new FakeProvider(), { jitterFraction: () => 0 });
    const queued = await pool!.query(
      "select 1 from connect_outbox where workspace_id = $1", [ws]);
    expect(queued.rowCount).toBe(0);
  });
});
