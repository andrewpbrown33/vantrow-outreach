import { AppBar } from "../../components/app-bar";
import { Chip, Notice } from "../../components/ui";
import { listMailboxes } from "../../lib/queries";
import { requireSession } from "../../lib/workspace";

export const dynamic = "force-dynamic";

/** What every ?connect= outcome means, said as something the operator can act
 *  on. The Google app runs in test mode, where refresh tokens expire about
 *  weekly, so people meet this screen often — vague errors here cost real
 *  sending days. */
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
  "bad-state": () =>
    "That connect link expired or did not match this browser. Press Connect to start again.",
  "unknown-mailbox": () => "That mailbox is not in this workspace.",
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
  const mailboxes = await listMailboxes(workspaceId);
  const broken = mailboxes.filter((m) => !m.connected || m.lastRefreshError);

  const sp = await searchParams;
  const one = (v: string | string[] | undefined): string | null =>
    typeof v === "string" ? v : null;
  const outcome = one(sp.connect);
  const note = outcome ? CONNECT_NOTE[outcome]?.(one(sp.detail)) ?? null : null;

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
