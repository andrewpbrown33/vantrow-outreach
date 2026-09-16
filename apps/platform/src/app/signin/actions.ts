"use server";

import { cookies } from "next/headers";
import {
  VERIFIER_COOKIE, authConfig, challengeFor, newVerifier, sendMagicLink,
} from "../../lib/auth";
import { appOrigin } from "../../lib/origin";
import { mayRequestLink } from "../../lib/workspace";

export interface SignInState { sent?: boolean; error?: string }

export async function requestLinkAction(
  _prev: SignInState, formData: FormData,
): Promise<SignInState> {
  const cfg = authConfig();
  if (!cfg.ok) {
    return { error: `Sign-in is not configured yet: ${cfg.missing.join(", ")} unset.` };
  }
  // Where the magic link comes back to. A link that lands in someone's inbox
  // is built from configuration in production, never from request headers
  // (lib/origin); a missing value is reported here, by name, like the rest.
  let redirectTo: string;
  try {
    redirectTo = `${await appOrigin()}/auth/callback`;
  } catch (err) {
    return { error: `Sign-in is not configured yet: ${
      String(err instanceof Error ? err.message : err)}` };
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
    email, redirectTo, challengeFor(verifier), cfg);
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
