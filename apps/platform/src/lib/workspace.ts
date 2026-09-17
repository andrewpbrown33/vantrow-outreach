/** Who may see what.
 *
 *  Every surface in this app resolves its workspace here, and every query in
 *  queries.ts takes that workspace id as its first argument — there is no way
 *  to write a read that isn't scoped, which is the point. The database's RLS
 *  policies are the second wall (they key on auth.uid() and serve any future
 *  direct-from-browser access); this module is the first, because the engine's
 *  connection is a service-role connection and RLS does not constrain it.
 *
 *  Membership is READ on every request rather than carried in the cookie, so
 *  removing a member takes effect immediately.
 *
 *  First sign-in: a workspace with no members yet cannot be joined by anyone,
 *  which would be a locked door on day one. Two keys open THAT door and only
 *  that one — (a) the address is already a sending mailbox in the workspace
 *  (you connected it; you operate it), or (b) the address is allow-listed and
 *  exactly one workspace exists. Both mint an `owner` row.
 *
 *  Both keys are scoped to a workspace with NO members. That scoping is the
 *  whole security property: key (a) searches mailboxes across every workspace,
 *  so left unbounded it would make "add a sending mailbox" mean the same thing
 *  as "hand that address ownership of this account" — two acts no operator
 *  would expect to be one. Invisible while a single workspace exists; not
 *  invisible on the day a second one does.
 *
 *  Once a workspace has an owner, the only way in is an invitation someone
 *  deliberately wrote (workspace_invites, 0010). Every join writes an event
 *  saying which of the three routes was taken, because a membership that
 *  appears with no record of how is exactly the thing you cannot audit later.
 */

import { redirect } from "next/navigation";
import { currentUser, type SessionUser } from "./auth";
import { getPool } from "./db";

export type Role = "owner" | "member";

export interface Session {
  user: SessionUser;
  workspaceId: string;
  workspaceName: string;
  role: Role;
}

export interface Membership {
  id: string;
  name: string;
  role: Role;
}

export const OWNER_ONLY = "Only a workspace owner can do that.";

function allowedEmails(): string[] {
  return (process.env.NUDGEROW_ALLOWED_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** True if this address may open a workspace it is not yet a member of. */
export function isAllowlisted(email: string): boolean {
  return allowedEmails().includes(email.toLowerCase());
}

/** The addresses that may request a sign-in link at all. Anything else gets
 *  the same "check your inbox" answer with no mail sent — no enumeration, no
 *  stray auth users. */
export async function mayRequestLink(email: string): Promise<boolean> {
  if (isAllowlisted(email)) return true;
  const { rowCount } = await getPool().query(
    `select 1 from public.mailboxes where lower(email) = lower($1)
      union all
     select 1 from public.workspace_invites
      where lower(email) = lower($1) and accepted_at is null
        and expires_at > now()
      limit 1`,
    [email],
  );
  return (rowCount ?? 0) > 0;
}

export async function resolveWorkspace(user: SessionUser): Promise<Membership | null> {
  const pool = getPool();

  const member = await pool.query<{ id: string; name: string; role: string }>(
    `select w.id, w.name, m.role
       from public.workspace_members m
       join public.workspaces w on w.id = m.workspace_id
      where m.user_id = $1
      order by m.created_at
      limit 1`,
    [user.userId],
  );
  if (member.rows[0]) {
    const m = member.rows[0];
    return { id: m.id, name: m.name, role: m.role === "owner" ? "owner" : "member" };
  }

  // An invitation someone wrote. This is the ONLY route into a workspace that
  // already has members, and it carries the role the inviter chose.
  const invited = await pool.query<{ id: string; name: string; invite: string; role: string }>(
    `select w.id, w.name, i.id as invite, i.role
       from public.workspace_invites i
       join public.workspaces w on w.id = i.workspace_id
      where lower(i.email) = lower($1)
        and i.accepted_at is null and i.expires_at > now()
      order by i.created_at
      limit 1`,
    [user.email],
  );
  if (invited.rows[0]) {
    const inv = invited.rows[0];
    await join(pool, inv.id, user, inv.role, "invite");
    await pool.query(
      `update public.workspace_invites
          set accepted_at = now(), accepted_user_id = $2
        where id = $1 and accepted_at is null`,
      [inv.invite, user.userId],
    );
    return { id: inv.id, name: inv.name, role: inv.role === "owner" ? "owner" : "member" };
  }

  // The bootstrap keys below open a workspace that has NO members — and only
  // such a workspace. See the header: unbounded, key (a) would turn adding a
  // sending mailbox into granting account ownership.
  const unclaimed = `not exists (
        select 1 from public.workspace_members m2 where m2.workspace_id = w.id)`;

  // Key (a): the address is one of that workspace's sending mailboxes.
  const byMailbox = await pool.query<{ id: string; name: string }>(
    `select w.id, w.name
       from public.mailboxes mb
       join public.workspaces w on w.id = mb.workspace_id
      where lower(mb.email) = lower($1) and ${unclaimed}
      order by mb.created_at
      limit 1`,
    [user.email],
  );
  let target = byMailbox.rows[0] ?? null;
  let how: JoinRoute = "mailbox";

  // Key (b): allow-listed, and this really is day one — exactly one workspace
  // exists ANYWHERE and nobody has claimed it. Counting only the unclaimed
  // ones would be a different, looser rule: with four claimed workspaces and
  // one spare, it would walk an allow-listed stranger into the spare.
  if (!target && isAllowlisted(user.email)) {
    const all = await pool.query<{ id: string; name: string; claimed: boolean }>(
      `select w.id, w.name, not (${unclaimed}) as claimed
         from public.workspaces w limit 2`,
    );
    if (all.rowCount === 1 && all.rows[0].claimed === false) {
      target = { id: all.rows[0].id, name: all.rows[0].name };
      how = "allowlist";
    }
  }
  if (!target) return null;

  await join(pool, target.id, user, "owner", how);
  return { ...target, role: "owner" };
}

type JoinRoute = "invite" | "mailbox" | "allowlist";

/** Add the membership and say, on the record, how it was earned. */
async function join(
  pool: ReturnType<typeof getPool>,
  workspaceId: string,
  user: SessionUser,
  role: string,
  how: JoinRoute,
): Promise<void> {
  const added = await pool.query(
    `insert into public.workspace_members (workspace_id, user_id, role)
     values ($1, $2, $3)
     on conflict (workspace_id, user_id) do nothing
     returning user_id`,
    [workspaceId, user.userId, role === "owner" ? "owner" : "member"],
  );
  if (added.rowCount === 0) return;   // already a member; nothing happened
  await pool.query(
    `insert into public.events (workspace_id, type, payload)
     values ($1, 'workspace.member_joined', $2)`,
    [workspaceId, { email: user.email, role, via: how }],
  );
}

/** Guard for every signed-in surface. Redirects rather than throwing, so an
 *  expired cookie lands on the sign-in page instead of an error screen. */
export async function requireSession(): Promise<Session> {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const ws = await resolveWorkspace(user);
  if (!ws) redirect("/signin?denied=1");
  return { user, workspaceId: ws.id, workspaceName: ws.name, role: ws.role };
}

/** Guard for the actions that change what goes out or who gets in. A member
 *  reads everything and edits prospects and templates; starting a sequence,
 *  approving a draft, lifting a hold, connecting a mailbox and changing the
 *  team are the owner's. A member who reaches one lands back on `backTo`
 *  and is told why, rather than shown an error screen. */
export async function requireOwner(backTo: string): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "owner") {
    redirect(`${backTo}?error=${encodeURIComponent(OWNER_ONLY)}`);
  }
  return session;
}
