/** Step two: Google returns, we trade the code for a refresh token and store
 *  it against the mailbox — but only after proving the grant belongs to the
 *  address on that mailbox row.
 *
 *  Outcomes land on /settings as a ?connect= note rather than a bare error
 *  page, because every one of them is something the operator can act on. */

import { NextResponse } from "next/server";
import { exchangeCode, grantedAddress, GMAIL_SCOPES, sealToken } from "@vantrow/engine";
import { currentUser } from "../../../../lib/auth";
import { resolveWorkspace } from "../../../../lib/workspace";
import { getPool } from "../../../../lib/db";
import { readConnectState, connectRedirectUri } from "../../../../lib/oauth-state";
import { appOrigin } from "../../../../lib/origin";

export const dynamic = "force-dynamic";

function back(origin: string, note: string, extra?: string): NextResponse {
  const q = new URLSearchParams({ connect: note });
  if (extra) q.set("detail", extra);
  return NextResponse.redirect(`${origin}/settings?${q}`, { status: 303 });
}

export async function GET(req: Request): Promise<NextResponse> {
  let origin: string;
  try {
    origin = await appOrigin();
  } catch (err) {
    // The code exchange must quote the same redirect_uri the consent step
    // used; without APP_ORIGIN in production there is nothing to quote.
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
  const url = new URL(req.url);

  // The operator pressed Cancel, or Google refused.
  const denied = url.searchParams.get("error");
  if (denied) return back(origin, "denied", denied);

  const user = await currentUser();
  if (!user) return NextResponse.redirect(`${origin}/signin`, { status: 303 });
  const ws = await resolveWorkspace(user);
  if (!ws) return NextResponse.redirect(`${origin}/signin?denied=1`, { status: 303 });
  // The same gate as the connect step: a grant a member obtained is not stored.
  if (ws.role !== "owner") return back(origin, "owner-only");

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const secret = process.env.AUTH_SECRET;
  if (!clientId || !clientSecret || !secret) return back(origin, "not-configured");

  const state = readConnectState(url.searchParams.get("state") ?? undefined, secret);
  const code = url.searchParams.get("code");
  if (!state || !code) return back(origin, "bad-state");
  // The browser that finishes must be the one that started.
  if (state.userId !== user.userId) return back(origin, "bad-state");

  const pool = getPool();
  const { rows } = await pool.query<{ email: string }>(
    "select email from public.mailboxes where id = $1 and workspace_id = $2",
    [state.mailboxId, ws.id],
  );
  const mailbox = rows[0];
  if (!mailbox) return back(origin, "unknown-mailbox");

  let grant;
  try {
    grant = await exchangeCode(
      { clientId, clientSecret }, code, connectRedirectUri(origin),
    );
  } catch (err) {
    return back(origin, "exchange-failed", String(err).slice(0, 200));
  }

  // Google only returns a refresh token on a consent-granting authorization.
  // Without one there is nothing durable to store, and the mailbox would go
  // dark the moment this access token expired.
  if (!grant.refreshToken) return back(origin, "no-refresh-token");

  const missing = GMAIL_SCOPES.filter((s) => !grant.scopes.includes(s));
  if (missing.length > 0) {
    return back(origin, "missing-scope", missing.join(" "));
  }

  // Which account actually consented. login_hint only pre-fills the chooser,
  // so without this a second signed-in Google account silently becomes the
  // sending identity for a mailbox row bearing a different address.
  const granted = await grantedAddress(grant.accessToken);
  if (granted === null) return back(origin, "profile-unreadable");
  if (granted.toLowerCase() !== mailbox.email.toLowerCase()) {
    return back(origin, "wrong-account", granted);
  }

  // At rest, sealed. Production without MAILBOX_TOKEN_KEY refuses right here
  // — the grant is discarded and the note names the variable — rather than
  // write a standing credential to the database in the clear.
  let refreshToken: string;
  let accessToken: string;
  try {
    refreshToken = sealToken(grant.refreshToken);
    accessToken = sealToken(grant.accessToken);
  } catch (err) {
    return back(origin, "no-token-key",
      String(err instanceof Error ? err.message : err).slice(0, 200));
  }

  await pool.query(
    `insert into public.mailbox_credentials
       (mailbox_id, workspace_id, refresh_token, access_token,
        access_token_expires_at, scopes, last_refresh_error)
     values ($1, $2, $3, $4, $5, $6, null)
     on conflict (mailbox_id) do update
        set refresh_token = excluded.refresh_token,
            access_token = excluded.access_token,
            access_token_expires_at = excluded.access_token_expires_at,
            scopes = excluded.scopes,
            -- A reconnect is the cure for the error the settings page shows,
            -- so clearing it here is the point, not a side effect. The history
            -- cursor is deliberately left alone: the same mailbox resuming
            -- should not re-read its whole inbox.
            last_refresh_error = null,
            updated_at = now()`,
    [state.mailboxId, ws.id, refreshToken, accessToken,
     new Date(grant.expiresAt), grant.scopes],
  );
  await pool.query(
    `insert into public.events (workspace_id, type, mailbox_id, payload)
     values ($1, 'mailbox.connected', $2, $3)`,
    [ws.id, state.mailboxId, { email: mailbox.email, by: user.email }],
  );

  return back(origin, "connected", mailbox.email);
}
