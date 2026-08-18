/** The cross-device half of sign-in.
 *
 *  Supabase's email template can hand us a `token_hash` instead of sending the
 *  browser through its own `/verify` redirect. That matters because a magic
 *  link is usually opened on a phone, from the mail app, while it was
 *  requested on a laptop — and the PKCE path in /auth/callback binds the link
 *  to the requesting browser via a cookie it cannot see.
 *
 *  A token hash needs no cookie: holding it is the proof, because it only
 *  reached the person who received the email. So this route works from any
 *  device, and it also sidesteps the redirect allow-list entirely — the link
 *  points straight here rather than bouncing through Supabase.
 *
 *  Template (Supabase → Authentication → Emails → Magic Link):
 *    {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
 */

import { NextResponse } from "next/server";
import { authConfig, setSessionCookie, verifyTokenHash } from "../../../lib/auth";

export const dynamic = "force-dynamic";

/** Only the types an email link can legitimately carry. Anything else is a
 *  malformed or hand-edited URL, and we refuse rather than forward it. */
const ALLOWED_TYPES = new Set(["magiclink", "email", "signup", "invite", "recovery"]);

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

  const tokenHash = params.get("token_hash");
  if (!tokenHash) {
    return back(req, "That link is missing its token. Ask for a new one.");
  }
  const type = params.get("type") ?? "magiclink";
  if (!ALLOWED_TYPES.has(type)) return back(req, "That link has an unexpected type.");

  const result = await verifyTokenHash(tokenHash, type, cfg);
  if (!result.ok) return back(req, result.error.slice(0, 200));

  await setSessionCookie(result.user, cfg.secret);
  return NextResponse.redirect(new URL("/", req.url));
}
