/** Sign-in for the platform app.
 *
 *  Identity comes from Supabase Auth's magic link, driven through its REST
 *  endpoints from the server. Two consequences worth stating: the anon key
 *  never reaches a browser (this app has no NEXT_PUBLIC_* variable at all),
 *  and sign-in needs no client JavaScript.
 *
 *  The flow is PKCE, because the default email template is the one Supabase
 *  ships and that template's link comes back to us as `?code=…`. We mint the
 *  verifier here, keep it in an httpOnly cookie, and exchange the code for a
 *  session on the callback. Once Supabase has PROVEN the address we stop
 *  talking to it entirely: we mint our OWN signed cookie, so there is no
 *  refresh dance and no per-request round trip to the auth server.
 *
 *  The session cookie carries only user id, email and expiry — never a
 *  workspace id. Membership is re-read from the database on every request
 *  (see workspace.ts), so removing someone takes effect on their next click
 *  instead of whenever their cookie happens to expire.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "nr_session";
export const VERIFIER_COOKIE = "nr_pkce";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export interface SessionUser {
  userId: string;
  email: string;
}

/** Reduce whatever was pasted into `SUPABASE_URL` to the project ORIGIN.
 *
 *  Supabase's gateway routes by path prefix — `/auth/v1/*` to the auth server,
 *  `/rest/v1/*` to PostgREST — so the base we append `/auth/v1/otp` to must
 *  carry no path of its own. The dashboard also publishes a "RESTful endpoint"
 *  ending `/rest/v1`, and pasting THAT here sends every auth call to
 *  PostgREST, which answers with an opaque `PGRST125 Invalid path specified in
 *  request URL`. Nobody should have to decode that, so both values work.
 *
 *  Returns null for anything that is not a usable absolute URL, which the
 *  caller reports as configuration rather than letting fetch fail later. */
export function projectOrigin(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/** Missing configuration is reported, not guessed at: a sign-in page that
 *  silently does nothing is worse than one that says which value is unset. */
export function authConfig():
  | { ok: true; url: string; anonKey: string; secret: string }
  | { ok: false; missing: string[] } {
  const raw = process.env.SUPABASE_URL;
  const url = projectOrigin(raw);
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const secret = process.env.AUTH_SECRET;
  const missing = [
    !url && (raw ? "SUPABASE_URL (not a valid https URL)" : "SUPABASE_URL"),
    !anonKey && "SUPABASE_ANON_KEY",
    !secret && "AUTH_SECRET",
  ].filter((v): v is string => typeof v === "string");
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, url: url!, anonKey: anonKey!, secret: secret! };
}

/** Turn a provider error into something an operator can act on. A PostgREST
 *  code here means the request was routed to the database API instead of the
 *  auth server — always a base-URL problem, never a credential one. */
function explain(status: number, body: string): string {
  if (body.includes("PGRST")) {
    return `${status} — that request reached the database API instead of the ` +
      `auth server, which means SUPABASE_URL points at a path (e.g. /rest/v1) ` +
      `rather than the project root. Set it to https://<project-ref>.supabase.co.`;
  }
  return `${status} ${body.slice(0, 200)}`;
}

const b64url = (b: Buffer): string => b.toString("base64url");

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Constant-time compare that also survives length mismatch (timingSafeEqual
 *  throws on differing lengths, which would leak length by exception). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function mintSession(user: SessionUser, secret: string): string {
  const payload = b64url(Buffer.from(JSON.stringify({
    sub: user.userId,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })));
  return `${payload}.${sign(payload, secret)}`;
}

export function readSession(token: string | undefined, secret: string): SessionUser | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), sign(payload, secret))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      sub?: unknown; email?: unknown; exp?: unknown;
    };
    if (typeof claims.sub !== "string" || typeof claims.email !== "string") return null;
    if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) return null;
    return { userId: claims.sub, email: claims.email };
  } catch {
    return null;
  }
}

/** The signed-in user, or null. Reads the cookie only — no network. */
export async function currentUser(): Promise<SessionUser | null> {
  const cfg = authConfig();
  if (!cfg.ok) return null;
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value, cfg.secret);
}

export async function setSessionCookie(user: SessionUser, secret: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, mintSession(user, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(VERIFIER_COOKIE);
}

// --- PKCE ------------------------------------------------------------------

export function newVerifier(): string {
  return b64url(randomBytes(32));
}

export function challengeFor(verifier: string): string {
  return b64url(createHash("sha256").update(verifier).digest());
}

interface OtpResult { ok: boolean; error?: string }

/** Ask Supabase to email a magic link. `redirectTo` must be registered in the
 *  project's URL allow-list or Supabase silently sends people to the site URL. */
export async function sendMagicLink(
  email: string, redirectTo: string, challenge: string,
  cfg: { url: string; anonKey: string },
): Promise<OtpResult> {
  const res = await fetch(
    `${cfg.url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json", apikey: cfg.anonKey },
      body: JSON.stringify({
        email,
        create_user: true,
        code_challenge: challenge,
        code_challenge_method: "s256",
      }),
    },
  );
  if (res.ok) return { ok: true };
  const body = await res.text().catch(() => "");
  return { ok: false, error: explain(res.status, body) };
}

/** Verify a `token_hash` from the email link — the CROSS-DEVICE path.
 *
 *  PKCE binds the link to the browser that asked for it, because the verifier
 *  lives in a cookie there. That is fine on a laptop and wrong for a magic
 *  link, which people open on their phone from the mail app. A token hash
 *  carries its own proof: whoever holds it received the email, so it verifies
 *  from any device with no cookie involved.
 *
 *  Both paths stay live — /auth/callback for `?code=`, /auth/confirm for
 *  `?token_hash=` — because which one an email uses depends on the project's
 *  template, and a half-migrated project should not lock anyone out. */
export async function verifyTokenHash(
  tokenHash: string, type: string, cfg: { url: string; anonKey: string },
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const res = await fetch(`${cfg.url}/auth/v1/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: cfg.anonKey },
    body: JSON.stringify({ type, token_hash: tokenHash }),
  });
  const body = await res.json().catch(() => null) as
    | { user?: { id?: unknown; email?: unknown }; error_description?: string;
        msg?: string; message?: string }
    | null;
  if (!res.ok || !body) {
    return {
      ok: false,
      error: body?.error_description ?? body?.msg ?? body?.message
        ?? `that link could not be verified (${res.status})`,
    };
  }
  const id = body.user?.id;
  const email = body.user?.email;
  if (typeof id !== "string" || typeof email !== "string") {
    return { ok: false, error: "that link verified but returned no user" };
  }
  return { ok: true, user: { userId: id, email: email.toLowerCase() } };
}

/** Exchange the callback's `?code=` for the proven identity. We keep the id
 *  and the address and discard the tokens — nothing downstream calls Supabase
 *  again on this user's behalf. */
export async function exchangeAuthCode(
  authCode: string, verifier: string, cfg: { url: string; anonKey: string },
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const res = await fetch(`${cfg.url}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: cfg.anonKey },
    body: JSON.stringify({ auth_code: authCode, code_verifier: verifier }),
  });
  const body = await res.json().catch(() => null) as
    | { user?: { id?: unknown; email?: unknown }; error_description?: string; msg?: string }
    | null;
  if (!res.ok || !body) {
    return {
      ok: false,
      error: body?.error_description ?? body?.msg ?? `auth exchange failed (${res.status})`,
    };
  }
  const id = body.user?.id;
  const email = body.user?.email;
  if (typeof id !== "string" || typeof email !== "string") {
    return { ok: false, error: "auth exchange returned no user" };
  }
  return { ok: true, user: { userId: id, email: email.toLowerCase() } };
}
