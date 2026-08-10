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
 *  which would be a locked door on day one. Two deliberate keys open it —
 *  (a) the address is already a connected sending mailbox in that workspace
 *  (you connected it; you operate it), or (b) the address is listed in
 *  NUDGEROW_ALLOWED_EMAILS and exactly one workspace exists. Both mint an
 *  `owner` row and both are one-time: after that, membership is the rule.
 */

import { redirect } from "next/navigation";
import { currentUser, type SessionUser } from "./auth";
import { getPool } from "./db";

export interface Session {
  user: SessionUser;
  workspaceId: string;
  workspaceName: string;
}

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
    `select 1 from public.mailboxes where lower(email) = lower($1) limit 1`,
    [email],
  );
  return (rowCount ?? 0) > 0;
}

async function resolveWorkspace(user: SessionUser): Promise<{ id: string; name: string } | null> {
  const pool = getPool();

  const member = await pool.query<{ id: string; name: string }>(
    `select w.id, w.name
       from public.workspace_members m
       join public.workspaces w on w.id = m.workspace_id
      where m.user_id = $1
      order by m.created_at
      limit 1`,
    [user.userId],
  );
  if (member.rows[0]) return member.rows[0];

  // Key (a): the address is a connected sending mailbox.
  const byMailbox = await pool.query<{ id: string; name: string }>(
    `select w.id, w.name
       from public.mailboxes mb
       join public.workspaces w on w.id = mb.workspace_id
      where lower(mb.email) = lower($1)
      order by mb.created_at
      limit 1`,
    [user.email],
  );
  let target = byMailbox.rows[0] ?? null;

  // Key (b): allow-listed, and there is exactly one workspace to join.
  if (!target && isAllowlisted(user.email)) {
    const only = await pool.query<{ id: string; name: string }>(
      `select id, name from public.workspaces limit 2`,
    );
    if (only.rowCount === 1) target = only.rows[0];
  }
  if (!target) return null;

  await pool.query(
    `insert into public.workspace_members (workspace_id, user_id, role)
     values ($1, $2, 'owner')
     on conflict (workspace_id, user_id) do nothing`,
    [target.id, user.userId],
  );
  return target;
}

/** Guard for every signed-in surface. Redirects rather than throwing, so an
 *  expired cookie lands on the sign-in page instead of an error screen. */
export async function requireSession(): Promise<Session> {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const ws = await resolveWorkspace(user);
  if (!ws) redirect("/signin?denied=1");
  return { user, workspaceId: ws.id, workspaceName: ws.name };
}
