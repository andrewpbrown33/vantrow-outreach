"use server";

import { headers, cookies } from "next/headers";
import {
  VERIFIER_COOKIE, authConfig, challengeFor, newVerifier, sendMagicLink,
} from "../../lib/auth";
import { mayRequestLink } from "../../lib/workspace";

export interface SignInState { sent?: boolean; error?: string }

/** Where the magic link comes back to. Derived from the request so preview
 *  deploys work without a per-environment variable; overridable when the app
 *  sits behind a domain the proxy headers do not report. */
async function callbackUrl(): Promise<string> {
  const configured = process.env.APP_ORIGIN;
  if (configured) return `${configured.replace(/\/+$/, "")}/auth/callback`;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/auth/callback`;
}

export async function requestLinkAction(
  _prev: SignInState, formData: FormData,
): Promise<SignInState> {
  const cfg = authConfig();
  if (!cfg.ok) {
    return { error: `Sign-in is not configured yet: ${cfg.missing.join(", ")} unset.` };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That does not look like an email address." };
  }

  // Unknown addresses get the same answer and no mail: no enumeration, and no
  // stray auth users created by anyone who finds the page.
  if (!(await mayRequestLink(email))) return { sent: true };

  const verifier = newVerifier();
  const result = await sendMagicLink(
    email, await callbackUrl(), challengeFor(verifier), cfg);
  if (!result.ok) return { error: `The auth server refused: ${result.error}` };

  const jar = await cookies();
  jar.set(VERIFIER_COOKIE, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });
  return { sent: true };
}
