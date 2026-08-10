import { AppBar } from "../../components/app-bar";
import { Chip, Notice } from "../../components/ui";
import { listMailboxes } from "../../lib/queries";
import { requireSession } from "../../lib/workspace";

export const dynamic = "force-dynamic";

/** Mailbox health, mostly. Dogfood runs the Google OAuth app in test mode,
 *  where refresh tokens expire about weekly — so a dead mailbox has to be
 *  visible here rather than discovered as a week of unsent steps. */
export default async function SettingsPage() {
  const { workspaceId, workspaceName, user } = await requireSession();
  const mailboxes = await listMailboxes(workspaceId);
  const broken = mailboxes.filter((m) => !m.connected || m.lastRefreshError);

  return (
    <>
      <AppBar here="/settings" />
      <div className="px-4 pt-3.5 pb-10">
        <h1 className="text-[21px] font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-[13px] text-muted">
          {workspaceName} · signed in as {user.email}
        </p>

        {broken.length > 0 ? (
          <div className="mt-3 max-w-2xl">
            <Notice tone="bad">
              {broken.length === 1 ? "One mailbox is not sending" : `${broken.length} mailboxes are not sending`}.
              Reconnect with runbook 07 §6; steps queued for them defer rather than drop.
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
              {m.connected && !m.lastRefreshError
                ? <Chip state="active">Connected</Chip>
                : <Chip state="bounced">{m.connected ? "Needs attention" : "Not connected"}</Chip>}
            </div>
          ))}
        </div>

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
