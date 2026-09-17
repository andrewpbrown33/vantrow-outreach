/** Step one of connecting a mailbox: send the operator to Google's consent
 *  screen with a signed state that says which mailbox they were standing on.
 *
 *  This replaces the CLI ritual (scripts/gmail-connect.mjs, which now writes
 *  the sealed credential itself and prints nothing). That script stays as the
 *  break-glass path, but it cannot be the normal one: Google's test-mode
 *  refresh tokens die about weekly, and a product whose recovery procedure is
 *  "open a terminal" is not usable by anyone who is not its author. */

import { NextResponse } from "next/server";
import { buildAuthUrl } from "@vantrow/engine";
import { currentUser } from "../../../../lib/auth";
import { resolveWorkspace } from "../../../../lib/workspace";
import { getPool } from "../../../../lib/db";
import { mintConnectState, connectRedirectUri } from "../../../../lib/oauth-state";
import { appOrigin } from "../../../../lib/origin";

export const dynamic = "force-dynamic";

function back(origin: string, note: string): NextResponse {
  return NextResponse.redirect(
    `${origin}/settings?connect=${encodeURIComponent(note)}`, { status: 303 },
  );
}

export async function GET(req: Request): Promise<NextResponse> {
  let origin: string;
  try {
    origin = await appOrigin();
  } catch (err) {
    // Production without APP_ORIGIN: there is no correct redirect_uri to
    // hand Google, so say so rather than guess one from the request.
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
  const user = await currentUser();
  if (!user) return NextResponse.redirect(`${origin}/signin`, { status: 303 });
  const ws = await resolveWorkspace(user);
  if (!ws) return NextResponse.redirect(`${origin}/signin?denied=1`, { status: 303 });
  // Attaching a sending identity to the workspace is the owner's decision.
  if (ws.role !== "owner") return back(origin, "owner-only");

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const secret = process.env.AUTH_SECRET;
  if (!clientId || !secret) return back(origin, "not-configured");

  const mailboxId = new URL(req.url).searchParams.get("mailbox");
  if (!mailboxId) return back(origin, "no-mailbox");

  // Scoped to the caller's workspace: the mailbox id arrives from the URL, so
  // it is theirs to prove, not ours to trust.
  const { rows } = await getPool().query<{ email: string }>(
    "select email from public.mailboxes where id = $1 and workspace_id = $2",
    [mailboxId, ws.id],
  );
  const mailbox = rows[0];
  if (!mailbox) return back(origin, "unknown-mailbox");

  return NextResponse.redirect(buildAuthUrl({
    clientId,
    redirectUri: connectRedirectUri(origin),
    state: mintConnectState({ mailboxId, userId: user.userId }, secret),
    // Pre-selects the right account in the chooser. The callback still
    // verifies which account actually came back — a hint is not a guarantee.
    loginHint: mailbox.email,
  }), { status: 303 });
}
