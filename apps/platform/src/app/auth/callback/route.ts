/** Where the magic link lands.
 *
 *  Supabase sends `?code=…`; we hold the matching PKCE verifier in an httpOnly
 *  cookie, so a link intercepted in transit is not enough on its own. On
 *  success we mint our own session cookie and never talk to the auth server
 *  about this person again. */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  VERIFIER_COOKIE, authConfig, exchangeAuthCode, setSessionCookie,
} from "../../../lib/auth";

export const dynamic = "force-dynamic";

function back(req: Request, message: string): NextResponse {
  const url = new URL("/signin", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request): Promise<NextResponse> {
  const cfg = authConfig();
  if (!cfg.ok) return back(req, `Sign-in is not configured: ${cfg.missing.join(", ")} unset.`);

  const params = new URL(req.url).searchParams;
  const supabaseError = params.get("error_description") ?? params.get("error");
  if (supabaseError) return back(req, supabaseError.slice(0, 200));

  const code = params.get("code");
  if (!code) return back(req, "That link is missing its code. Ask for a new one.");

  const jar = await cookies();
  const verifier = jar.get(VERIFIER_COOKIE)?.value;
  if (!verifier) {
    return back(req, "Open the link in the same browser you asked for it from.");
  }

  const result = await exchangeAuthCode(code, verifier, cfg);
  if (!result.ok) return back(req, result.error.slice(0, 200));

  jar.delete(VERIFIER_COOKIE);
  await setSessionCookie(result.user, cfg.secret);
  return NextResponse.redirect(new URL("/", req.url));
}
