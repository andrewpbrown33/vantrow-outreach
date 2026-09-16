/** The second wall, proven — one tenant's rows against another's, as a
 *  non-owner role with a real member claim.
 *
 *  The app's own connection is the table owner today, so RLS does not
 *  constrain it and the first wall is the `where workspace_id = $1` in every
 *  query. These tests are about the wall behind that one: whether the policies
 *  would actually hold the moment application traffic is moved onto a
 *  non-owner role (planned), and whether anything reaching Postgres with an
 *  `authenticated` claim — Supabase's own REST surface included, which is
 *  live and public by design — can cross a tenant boundary.
 *
 *  0002's policies had one test. Everything added since (0005's Connect rows,
 *  0009's release tables, 0010's invitations) had policies written and never
 *  exercised. A policy nobody has run is a claim, not a control. */

import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { provisionTestDb } from "./test-db";

const dbUrl = await provisionTestDb();
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl, max: 6 }) : null;

afterAll(async () => {
  await pool?.end();
});

interface Tenant {
  ws: string;
  user: string;
  sequenceId: string;
  mailboxId: string;
}

/** A workspace with one member, a sequence, a mailbox with credentials, a
 *  release policy, a release row, a Connect endpoint and an invitation — one
 *  of everything a policy could get wrong. */
async function tenant(label: string): Promise<Tenant> {
  const q = pool!;
  const ws = (await q.query(
    "insert into workspaces (name) values ($1) returning id", [label])).rows[0].id;
  const user = randomUUID();
  await q.query(
    "insert into workspace_members (workspace_id, user_id, role) values ($1, $2, 'owner')",
    [ws, user]);
  const mailboxId = (await q.query(
    "insert into mailboxes (workspace_id, email) values ($1, $2) returning id",
    [ws, `mb-${randomUUID()}@getvantrow.com`])).rows[0].id;
  await q.query(
    `insert into mailbox_credentials (mailbox_id, workspace_id, refresh_token)
     values ($1, $2, $3)`,
    [mailboxId, ws, `refresh-${randomUUID()}`]);
  const sequenceId = (await q.query(
    `insert into sequences (workspace_id, name, state, mailbox_id)
     values ($1, 'seq', 'active', $2) returning id`, [ws, mailboxId])).rows[0].id;
  await q.query(
    `insert into release_policies
       (sequence_id, workspace_id, current_per_day) values ($1, $2, 5)`,
    [sequenceId, ws]);
  await q.query(
    `insert into release_log
       (workspace_id, sequence_id, released_on, rate_used, policy_state)
     values ($1, $2, current_date, 5, 'ramping')`, [ws, sequenceId]);
  await q.query(
    `insert into connect_endpoints (workspace_id, url, secret, tenant_id)
     values ($1, 'https://example.com/hook', $2, $3)`,
    [ws, `whsec_${randomUUID()}`, randomUUID()]);
  await q.query(
    `insert into workspace_invites (workspace_id, email, role)
     values ($1, $2, 'member')`, [ws, `invitee-${randomUUID()}@example.com`]);
  return { ws, user, sequenceId, mailboxId };
}

/** Run as `authenticated` carrying this user's claim, exactly as Supabase's
 *  REST surface would. Rolled back either way — these tests read. */
async function asMember<T>(
  userId: string, fn: (c: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool!.connect();
  try {
    await client.query("begin");
    await client.query("set local role authenticated");
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    return await fn(client);
  } finally {
    await client.query("rollback").catch(() => {});
    client.release();
  }
}

/** Assert one statement is refused, and leave the transaction usable.
 *
 *  Postgres aborts the whole transaction on the first error, so a bare
 *  sequence of expected-failure assertions only ever tests the first one —
 *  every later denial comes back as "current transaction is aborted" and the
 *  test passes or fails for the wrong reason. A savepoint per attempt keeps
 *  each assertion honest. */
async function denied(
  c: pg.PoolClient, pattern: RegExp, sql: string, params: unknown[] = [],
): Promise<void> {
  await c.query("savepoint attempt");
  let message: string | null = null;
  try {
    await c.query(sql, params);
  } catch (err) {
    message = String((err as Error).message);
  }
  await c.query("rollback to savepoint attempt");
  expect(message, `expected a refusal from: ${sql.slice(0, 60)}`).not.toBeNull();
  expect(message).toMatch(pattern);
}

describe.skipIf(!dbUrl)("RLS holds across tenants (real Postgres)", () => {
  it("member-readable tables show only the member's own workspace", async () => {
    const a = await tenant("rls A");
    const b = await tenant("rls B");

    await asMember(a.user, async (c) => {
      for (const table of [
        "sequences", "mailboxes", "prospects", "enrollments",
        "release_policies", "release_log", "workspace_invites",
        "connect_outbox", "touch_ledger", "events", "inbound_messages",
        "suppression_entries", "email_templates", "sequence_steps",
      ]) {
        const seen = await c.query(`select workspace_id from ${table}`);
        const ids = new Set(seen.rows.map((r) => r.workspace_id));
        expect(ids.has(b.ws), `${table} leaked tenant B to tenant A`).toBe(false);
      }
      // …and the member really can see their own, so the check above is not
      // passing merely because everything is empty.
      const mine = await c.query("select workspace_id from release_policies");
      expect(mine.rows.map((r) => r.workspace_id)).toEqual([a.ws]);
    });
  });

  it("the secrets tables are invisible to a member — even their own rows", async () => {
    const a = await tenant("rls secrets");
    await asMember(a.user, async (c) => {
      // RLS on, zero policies, deliberately: refresh tokens and webhook
      // signing keys are for the service role alone. A member holding the
      // public anon key must see nothing here, own workspace included.
      for (const table of ["mailbox_credentials", "connect_endpoints"]) {
        const seen = await c.query(`select * from ${table}`);
        expect(seen.rowCount, `${table} was readable by a member`).toBe(0);
      }
    });
    // The rows do exist — the service role can see them.
    const real = await pool!.query(
      "select 1 from mailbox_credentials where workspace_id = $1", [a.ws]);
    expect(real.rowCount).toBe(1);
  });

  it("a member cannot forge history: events and the release log are read-only", async () => {
    const a = await tenant("rls append");
    await asMember(a.user, async (c) => {
      await denied(c, /row-level security/,
        "insert into events (workspace_id, type) values ($1, 'forged')", [a.ws]);
      await denied(c, /row-level security/,
        `insert into release_log
           (workspace_id, sequence_id, released_on, rate_used, policy_state)
         values ($1, $2, current_date + 1, 999, 'ramping')`,
        [a.ws, a.sequenceId]);
      await denied(c, /row-level security/,
        "insert into touch_ledger (workspace_id, step_order, attempt_epoch, idempotency_key) " +
        "values ($1, 1, 0, 'forged')", [a.ws]);
    });
  });

  it("a member cannot write into another tenant's workspace", async () => {
    const a = await tenant("rls writer");
    const b = await tenant("rls victim");

    await asMember(a.user, async (c) => {
      // WITH CHECK refuses the insert outright…
      await denied(c, /row-level security/,
        "insert into prospects (workspace_id, email) values ($1, $2)",
        [b.ws, `intruder-${randomUUID()}@example.com`]);

      // …and an UPDATE simply matches nothing, which is the same answer said
      // more quietly: invisible rows cannot be changed.
      const renamed = await c.query(
        "update sequences set name = 'owned' where workspace_id = $1", [b.ws]);
      expect(renamed.rowCount).toBe(0);
      const deleted = await c.query(
        "delete from workspace_invites where workspace_id = $1", [b.ws]);
      expect(deleted.rowCount).toBe(0);
    });

    // B's rows are untouched.
    const still = await pool!.query(
      "select name from sequences where workspace_id = $1", [b.ws]);
    expect(still.rows[0].name).toBe("seq");
  });

  it("a member cannot alter the compliance tables — suppression is add-only (0011)", async () => {
    const a = await tenant("rls compliance");
    const email = `gone-${randomUUID()}@example.com`;
    await pool!.query(
      "insert into suppression_entries (workspace_id, email, reason) values ($1, $2, 'unsubscribe')",
      [a.ws, email]);
    const stepId = (await pool!.query(
      `insert into sequence_steps (workspace_id, sequence_id, step_order, mode)
       values ($1, $2, 1, 'draft_first') returning id`, [a.ws, a.sequenceId])).rows[0].id;
    const prospectId = (await pool!.query(
      "insert into prospects (workspace_id, email) values ($1, $2) returning id",
      [a.ws, `p-${randomUUID()}@example.com`])).rows[0].id;
    const enrollmentId = (await pool!.query(
      `insert into enrollments (workspace_id, sequence_id, prospect_id, mailbox_id, state)
       values ($1, $2, $3, $4, 'paused') returning id`,
      [a.ws, a.sequenceId, prospectId, a.mailboxId])).rows[0].id;

    await asMember(a.user, async (c) => {
      // Reads stay open: the member sees their own workspace's rows.
      expect((await c.query("select 1 from suppression_entries where workspace_id = $1", [a.ws]))
        .rowCount).toBe(1);
      expect((await c.query("select 1 from sequence_steps where id = $1", [stepId])).rowCount).toBe(1);

      // Adding a suppression is the one write that is always safe.
      const added = await c.query(
        "insert into suppression_entries (workspace_id, email, reason) values ($1, $2, 'manual')",
        [a.ws, `also-${randomUUID()}@example.com`]);
      expect(added.rowCount).toBe(1);

      // Removing or changing one is not. With no policy for it, the rows are
      // simply not there to be touched — the quiet refusal.
      expect((await c.query("delete from suppression_entries where lower(email) = lower($1)", [email]))
        .rowCount).toBe(0);
      expect((await c.query("update suppression_entries set email = 'x@y.z' where lower(email) = lower($1)", [email]))
        .rowCount).toBe(0);
      // The human gate of protocol §10 cannot be flipped to auto.
      expect((await c.query("update sequence_steps set mode = 'auto' where id = $1", [stepId]))
        .rowCount).toBe(0);
      // Nor the schedule, nor the record of what a human approved.
      expect((await c.query(
        "update enrollments set draft_approved_step = 1, state = 'scheduled', next_touch_at = now() where id = $1",
        [enrollmentId])).rowCount).toBe(0);
      // Nor the deliverability brake.
      expect((await c.query("update mailboxes set daily_cap = 9999 where id = $1", [a.mailboxId]))
        .rowCount).toBe(0);
      // And nothing can be enrolled from a client at all.
      await denied(c, /row-level security/,
        `insert into enrollments (workspace_id, sequence_id, prospect_id, mailbox_id)
         values ($1, $2, $3, $4)`, [a.ws, a.sequenceId, prospectId, a.mailboxId]);
    });

    // The rows are as they were: the unsubscribe stands, the step is still
    // draft-first, the enrollment still paused.
    expect((await pool!.query(
      "select reason from suppression_entries where workspace_id = $1 and lower(email) = lower($2)",
      [a.ws, email])).rows).toEqual([{ reason: "unsubscribe" }]);
    expect((await pool!.query("select mode from sequence_steps where id = $1", [stepId]))
      .rows[0].mode).toBe("draft_first");
    expect((await pool!.query("select state from enrollments where id = $1", [enrollmentId]))
      .rows[0].state).toBe("paused");
  });

  it("the security-definer engine functions are not callable by a member (0008)", async () => {
    const a = await tenant("rls rpc");
    await asMember(a.user, async (c) => {
      // These run as the definer and act across every workspace. 0008 revoked
      // them from PUBLIC/anon/authenticated precisely so a leaked anon key
      // cannot drain or stall the send pipeline.
      await denied(c, /permission denied/,
        "select * from public.claim_due_enrollments(50, make_interval(mins => 5))");
      await denied(c, /permission denied/,
        "select public.increment_cogs($1, 'forged', 1)", [a.ws]);
    });
  });

  it("a claim for nobody sees nothing at all", async () => {
    await tenant("rls stranger");
    await asMember(randomUUID(), async (c) => {
      const seen = await c.query("select workspace_id from sequences");
      expect(seen.rowCount).toBe(0);
    });
  });
});
