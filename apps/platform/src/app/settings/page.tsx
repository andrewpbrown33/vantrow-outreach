import { AppBar } from "../../components/app-bar";
import { Chip, Notice } from "../../components/ui";
import { listMailboxes, listTeam } from "../../lib/queries";
import { requireSession } from "../../lib/workspace";
import { inviteAction, revokeInviteAction } from "./actions";

export const dynamic = "force-dynamic";

/** What every ?connect= outcome means, said as something the operator can act
 *  on. The Google app runs in test mode, where refresh tokens expire about
 *  weekly, so people meet this screen often — vague errors here cost real
 *  sending days. */
const INVITE_NOTE: Record<string, (detail: string | null) => string> = {
  sent: (d) =>
    `${d ?? "They"} can now sign in. Tell them to go to this site and ask for a ` +
    "link — the invitation is what makes that work; no email goes out from here.",
  "bad-email": () => "That does not look like an email address.",
  "already-invited": () => "That address already has an invitation waiting.",
  "already-member": () => "That address is already on the team.",
};

const CONNECT_NOTE: Record<string, (detail: string | null) => string> = {
  connected: (d) => `${d ?? "The mailbox"} is connected and sending.`,
  denied: () => "Google did not grant access — nothing changed. Press Connect to try again.",
  "wrong-account": (d) =>
    `That consent was for ${d ?? "a different address"}, which is not this mailbox. ` +
    "Nothing was saved. Press Connect again and pick the matching account — " +
    "signing out of the other Google account first makes the chooser behave.",
  "no-refresh-token": () =>
    "Google returned no refresh token, which usually means this account was " +
    "already connected elsewhere. Remove Nudgerow at myaccount.google.com/permissions, " +
    "then press Connect again.",
  "missing-scope": (d) =>
    `Consent came back without ${d ?? "a required permission"}. Press Connect and leave ` +
    "every box ticked — sending needs all of them.",
  "not-configured": () =>
    "This server has no Google client configured yet (runbook 07). Nothing was changed.",
  "no-token-key": (d) =>
    `Nothing was saved. ${d ?? "MAILBOX_TOKEN_KEY is not set on this server (runbook 08 §2)."}`,
  "bad-state": () =>
    "That connect link expired or did not match this browser. Press Connect to start again.",
  "unknown-mailbox": () => "That mailbox is not in this workspace.",
  "owner-only": () => "Only a workspace owner can connect a mailbox. Nothing was changed.",
  "no-mailbox": () => "No mailbox was named.",
  "profile-unreadable": () =>
    "Google would not say which account consented, so nothing was saved. Try again.",
  "exchange-failed": (d) =>
    `Google refused the exchange${d ? ` — ${d}` : ""}. Nothing was saved.`,
};

/** Mailbox health, mostly. Dogfood runs the Google OAuth app in test mode,
 *  where refresh tokens expire about weekly — so a dead mailbox has to be
 *  visible here rather than discovered as a week of unsent steps. */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceId, workspaceName, user } = await requireSession();
  const [mailboxes, team] = await Promise.all([
    listMailboxes(workspaceId), listTeam(workspaceId),
  ]);
  const broken = mailboxes.filter((m) => !m.connected || m.lastRefreshError);

  const sp = await searchParams;
  const one = (v: string | string[] | undefined): string | null =>
    typeof v === "string" ? v : null;
  const outcome = one(sp.connect);
  const note = outcome ? CONNECT_NOTE[outcome]?.(one(sp.detail)) ?? null : null;
  const invited = one(sp.invite);
  const inviteNote = invited ? INVITE_NOTE[invited]?.(one(sp.detail)) ?? null : null;
  // Where an action sends a member who reached an owner-only control.
  const refused = one(sp.error);

  return (
    <>
      <AppBar here="/settings" />
      <div className="px-4 pt-3.5 pb-10">
        <h1 className="text-[21px] font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-[13px] text-muted">
          {workspaceName} · signed in as {user.email}
        </p>

        {note ? (
          <div className="mt-3 max-w-2xl">
            <Notice tone={outcome === "connected" ? "good" : "bad"}>{note}</Notice>
          </div>
        ) : null}
        {refused ? (
          <div className="mt-3 max-w-2xl">
            <Notice tone="bad">{refused}</Notice>
          </div>
        ) : null}

        {broken.length > 0 ? (
          <div className="mt-3 max-w-2xl">
            <Notice tone="bad">
              {broken.length === 1 ? "One mailbox is not sending" : `${broken.length} mailboxes are not sending`}.
              Press Reconnect below — steps waiting on them defer rather than drop,
              so nothing is lost in the meantime.
            </Notice>
          </div>
        ) : null}

        <p className="mt-5 text-[13px] font-extrabold">Mailboxes</p>
        <div className="mt-1 max-w-2xl">
          {mailboxes.map((m) => (
            <div key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-line py-2.5 text-sm">
              <span>
                <b className="font-semibold">{m.email}</b>
                <span className="block text-xs text-muted">
                  {[
                    m.displayName,
                    `cap ${m.dailyCap}/day`,
                    m.sendDisabled ? "sending disabled" : null,
                    m.lastRefreshError ? `last error: ${m.lastRefreshError.slice(0, 120)}` : null,
                  ].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="flex items-center gap-2">
                {m.connected && !m.lastRefreshError
                  ? <Chip state="active">Connected</Chip>
                  : <Chip state="bounced">{m.connected ? "Needs attention" : "Not connected"}</Chip>}
                <a
                  href={`/api/gmail/connect?mailbox=${encodeURIComponent(m.id)}`}
                  className="rounded-lg border border-line bg-panel px-3 py-1.5 text-[12px] font-semibold text-sub hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {m.connected ? "Reconnect" : "Connect"}
                </a>
              </span>
            </div>
          ))}
        </div>

        <p className="mt-7 text-[13px] font-extrabold">Who can get in</p>
        <p className="mt-0.5 max-w-2xl text-[12.5px] text-muted">
          An invitation is the only way into this workspace. Everyone here signs
          in with a link to their own address — there are no passwords to share
          and nothing to revoke but the invitation itself.
        </p>

        {inviteNote ? (
          <div className="mt-2 max-w-2xl">
            <Notice tone={invited === "sent" ? "good" : "bad"}>{inviteNote}</Notice>
          </div>
        ) : null}

        <div className="mt-1 max-w-2xl">
          {team.map((t) => (
            <div
              key={`${t.email}-${t.joinedAt?.getTime() ?? "pending"}`}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-line py-2.5 text-sm"
            >
              <span>
                <b className="font-semibold">{t.email}</b>
                <span className="block text-xs text-muted">
                  {t.joinedAt
                    ? `${t.role === "owner" ? "Owner" : "Member"} · joined ${t.joinedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : `Invited as ${t.role === "owner" ? "owner" : "member"} · has not signed in yet`}
                </span>
              </span>
              {t.joinedAt ? (
                <Chip state="active">On the team</Chip>
              ) : (
                <span className="flex items-center gap-2">
                  <Chip state="scheduled">Invited</Chip>
                  <form action={revokeInviteAction}>
                    <input type="hidden" name="email" value={t.email} />
                    <button
                      type="submit"
                      className="rounded-lg border border-line bg-panel px-3 py-1.5 text-[12px] font-semibold text-sub"
                    >
                      Withdraw
                    </button>
                  </form>
                </span>
              )}
            </div>
          ))}
        </div>

        <form action={inviteAction} className="mt-3 flex max-w-2xl flex-wrap items-center gap-2">
          <label htmlFor="invite-email" className="sr-only">Email address to invite</label>
          <input
            id="invite-email" name="email" type="email" required
            placeholder="name@company.com"
            className="min-w-[15rem] flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-[13px]"
          />
          <label htmlFor="invite-role" className="sr-only">Role</label>
          <select
            id="invite-role" name="role" defaultValue="member"
            className="rounded-lg border border-line bg-panel px-3 py-2 text-[13px]"
          >
            <option value="member">Member</option>
            <option value="owner">Owner</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background"
          >
            Invite
          </button>
        </form>

        <form action="/auth/signout" method="post" className="mt-8">
          <button
            type="submit"
            className="rounded-lg border border-line bg-panel px-4 py-2 text-[13px] font-semibold text-sub"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
