/** The signed state parameter for the Gmail connect flow.
 *
 *  Google hands `state` back verbatim on the redirect, so it is the only thing
 *  tying a callback to the request that started it. Unsigned, anyone could
 *  link their own Google account to someone else's mailbox row by forging the
 *  return. So it carries who asked, which mailbox, and when — HMAC'd with
 *  AUTH_SECRET, the same key and shape as the session cookie, and short-lived
 *  because a consent screen is a two-minute errand, not a two-day one. */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TTL_SECONDS = 15 * 60;

export interface ConnectState {
  mailboxId: string;
  userId: string;
  /** Guards against a replayed callback re-using an old code. */
  nonce: string;
}

const b64url = (b: Buffer): string => b.toString("base64url");

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function mintConnectState(
  s: Omit<ConnectState, "nonce">, secret: string,
): string {
  const payload = b64url(Buffer.from(JSON.stringify({
    m: s.mailboxId,
    u: s.userId,
    n: b64url(randomBytes(9)),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  })));
  return `${payload}.${sign(payload, secret)}`;
}

export function readConnectState(
  token: string | undefined, secret: string,
): ConnectState | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), sign(payload, secret))) return null;
  try {
    const c = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      m?: unknown; u?: unknown; n?: unknown; exp?: unknown;
    };
    if (typeof c.m !== "string" || typeof c.u !== "string" ||
        typeof c.n !== "string") return null;
    if (typeof c.exp !== "number" || c.exp * 1000 < Date.now()) return null;
    return { mailboxId: c.m, userId: c.u, nonce: c.n };
  } catch {
    return null;
  }
}

/** Where Google sends the browser back. Must match the redirect URI registered
 *  on the OAuth client exactly, so it is derived from one place. */
export function connectRedirectUri(origin: string): string {
  return `${origin.replace(/\/+$/, "")}/api/gmail/callback`;
}
