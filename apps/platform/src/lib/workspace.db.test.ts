/** Who gets into a workspace, against REAL Postgres.
 *
 *  This path had no tests at all, while being the highest-privilege code in
 *  the app: it decides whether a signed-in stranger becomes an OWNER. The
 *  cases below are the ones that matter the day a second workspace exists —
 *  which, until now, is precisely when the old behaviour would have started
 *  handing ownership away. */

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { provisionTestDb } from "@vantrow/engine/test-db";
import pg from "pg";
import { randomUUID } from "node:crypto";

const url = await provisionTestDb();
if (url) process.env.SUPABASE_DB_URL = url;
const admin = url ? new pg.Pool({ connectionString: url, max: 4 }) : null!;
const ws = url
  ? await import("./workspace")
  : (null as unknown as typeof import("./workspace"));

afterAll(async () => {
  await admin?.end();
  await (globalThis as { __nudgerowPool?: pg.Pool }).__nudgerowPool?.end();
});

const run = () => (url ? describe : describe.skip);

async function workspace(name: string): Promise<string> {
  const r = await admin.query<{ id: string }>(
    "insert into public.workspaces (name) values ($1) returning id", [name]);
  return r.rows[0].id;
}
async function mailbox(wsId: string, email: string): Promise<void> {
  await admin.query(
    "insert into public.mailboxes (workspace_id, email) values ($1, $2)",
    [wsId, email]);
}
async function member(wsId: string, role = "owner"): Promise<string> {
  const uid = randomUUID();
  await admin.query(
    "insert into public.workspace_members (workspace_id, user_id, role) values ($1, $2, $3)",
    [wsId, uid, role]);
  return uid;
}
const user = (email: string) => ({ userId: randomUUID(), email });
const membershipsOf = async (uid: string) =>
  (await admin.query("select workspace_id, role from public.workspace_members where user_id = $1", [uid])).rows;

run()("getting into a workspace", () => {
  beforeEach(() => { delete process.env.NUDGEROW_ALLOWED_EMAILS; });

  it("bootstrap: a mailbox address opens a workspace that has NO members", async () => {
    const w = await workspace("fresh");
    const email = `boot-${randomUUID()}@getvantrow.com`;
    await mailbox(w, email);

    const got = await ws.resolveWorkspace(user(email));
    expect(got?.id).toBe(w);
  });

  it("THE HOLE: a mailbox address does NOT open a workspace that already has an owner", async () => {
    const w = await workspace("claimed");
    await member(w);                       // somebody already runs this account
    const email = `later-${randomUUID()}@getvantrow.com`;
    await mailbox(w, email);               // an operator adds a sending mailbox

    // Adding a mailbox must not be the same act as granting ownership.
    const u = user(email);
    expect(await ws.resolveWorkspace(u)).toBeNull();
    expect(await membershipsOf(u.userId)).toHaveLength(0);
  });

  it("does not hand one workspace's mailbox address ownership of another", async () => {
    const a = await workspace("tenant A");
    const b = await workspace("tenant B");
    await member(a);
    const shared = `shared-${randomUUID()}@getvantrow.com`;
    await mailbox(a, shared);              // A's mailbox…
    await member(b);                       // …and B is claimed too

    const u = user(shared);
    expect(await ws.resolveWorkspace(u)).toBeNull();
    expect(await membershipsOf(u.userId)).toHaveLength(0);
  });

  it("an invitation is the way into a claimed workspace, with its stated role", async () => {
    const w = await workspace("inviting");
    await member(w);
    const email = `invitee-${randomUUID()}@example.com`;
    await admin.query(
      `insert into public.workspace_invites (workspace_id, email, role)
       values ($1, $2, 'member')`, [w, email]);

    const u = user(email);
    expect((await ws.resolveWorkspace(u))?.id).toBe(w);
    expect(await membershipsOf(u.userId)).toEqual([{ workspace_id: w, role: "member" }]);

    // Accepting consumes it, and the join is on the record.
    const inv = await admin.query(
      "select accepted_at, accepted_user_id from public.workspace_invites where workspace_id = $1", [w]);
    expect(inv.rows[0].accepted_at).not.toBeNull();
    expect(inv.rows[0].accepted_user_id).toBe(u.userId);
    const ev = await admin.query(
      "select payload from public.events where workspace_id = $1 and type = 'workspace.member_joined'", [w]);
    expect(ev.rows[0].payload).toMatchObject({ email, via: "invite", role: "member" });
  });

  it("refuses an expired invitation", async () => {
    const w = await workspace("stale");
    await member(w);
    const email = `stale-${randomUUID()}@example.com`;
    await admin.query(
      `insert into public.workspace_invites (workspace_id, email, role, expires_at)
       values ($1, $2, 'member', now() - interval '1 day')`, [w, email]);

    const u = user(email);
    expect(await ws.resolveWorkspace(u)).toBeNull();
    expect(await membershipsOf(u.userId)).toHaveLength(0);
  });

  it("an existing membership wins over everything, and adds no second row", async () => {
    const home = await workspace("home");
    const other = await workspace("other");
    const email = `settled-${randomUUID()}@getvantrow.com`;
    const u = user(email);
    await admin.query(
      "insert into public.workspace_members (workspace_id, user_id, role) values ($1, $2, 'member')",
      [home, u.userId]);
    await mailbox(other, email);   // a bootstrap-eligible workspace elsewhere

    expect((await ws.resolveWorkspace(u))?.id).toBe(home);
    expect(await membershipsOf(u.userId)).toHaveLength(1);
  });

  it("the allow-list key never opens a workspace somebody already runs", async () => {
    const w = await workspace("allowlisted");
    await member(w);
    const email = `allow-${randomUUID()}@getvantrow.com`;
    process.env.NUDGEROW_ALLOWED_EMAILS = email;

    // Key (b) is a day-one key: it needs exactly one workspace in existence,
    // unclaimed. Whatever else is in this database, it must never produce a
    // membership in a workspace that already has an owner.
    const u = user(email);
    await ws.resolveWorkspace(u);
    const mine = await membershipsOf(u.userId);
    expect(mine.some((m) => m.workspace_id === w)).toBe(false);
  });

  it("lets an invited address ask for a sign-in link; a stranger still cannot", async () => {
    const w = await workspace("gatekeeping");
    await member(w);
    const invitee = `may-${randomUUID()}@example.com`;
    await admin.query(
      `insert into public.workspace_invites (workspace_id, email, role)
       values ($1, $2, 'member')`, [w, invitee]);

    expect(await ws.mayRequestLink(invitee)).toBe(true);
    expect(await ws.mayRequestLink(`nobody-${randomUUID()}@example.com`)).toBe(false);
  });
});
