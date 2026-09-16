/** Gmail tokens at rest.
 *
 *  A refresh token is a standing grant to send as somebody's mailbox. Until
 *  now it sat in `mailbox_credentials` as the plain string Google returned:
 *  RLS keeps clients out of that table, but a database export, a backup, or
 *  a pooler log still held every mailbox's key in the clear — and Google's
 *  restricted-scope assessment asks for encryption at rest by name.
 *
 *  AES-256-GCM under `MAILBOX_TOKEN_KEY` (32 bytes, base64). The stored form
 *  is `enc:v1:<iv>:<tag>:<data>`, each part base64url, in the same text
 *  columns the plaintext used — so there is no migration, and a value written
 *  before the key existed still reads (the legacy path) until its next write
 *  re-encrypts it. GCM's tag means a value altered in the database fails to
 *  open rather than opening to garbage.
 *
 *  The policy lives here so every writer agrees: with the key set, tokens are
 *  sealed; without it, production REFUSES to store a new token (the error
 *  names the variable) while anything already stored keeps working; outside
 *  production a missing key stores plaintext, so local runs and the test
 *  suite need no key. */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const TOKEN_KEY_ENV = "MAILBOX_TOKEN_KEY";
const PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

type Env = Record<string, string | undefined>;

/** The key from the environment, or null when unset. A key of the wrong
 *  size is a configuration error, not a missing key — it must not fall back
 *  to plaintext. */
export function loadTokenKey(env: Env = process.env): Buffer | null {
  const raw = env[TOKEN_KEY_ENV];
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `${TOKEN_KEY_ENV} must decode to exactly 32 bytes ` +
      `(generate one with: openssl rand -base64 32)`,
    );
  }
  return key;
}

export function isEncryptedToken(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptToken(plain: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${data.toString("base64url")}`;
}

/** Open a stored value. Plaintext (written before the key existed) passes
 *  through; an encrypted value needs the key and must verify. */
export function decryptToken(stored: string, key: Buffer | null): string {
  if (!isEncryptedToken(stored)) return stored;
  if (!key) {
    throw new Error(
      `this token is encrypted and ${TOKEN_KEY_ENV} is not set — set it to the key it was encrypted with`,
    );
  }
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("stored token is malformed");
  const [iv, tag, data] = parts.map((p) => Buffer.from(p, "base64url"));
  if (iv!.length !== IV_BYTES || tag!.length !== 16) {
    throw new Error("stored token is malformed");
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv!);
  decipher.setAuthTag(tag!);
  try {
    return Buffer.concat([decipher.update(data!), decipher.final()]).toString("utf8");
  } catch {
    // GCM refused the tag: the value was altered, or the key is not the one
    // it was sealed with. Either way it does not open.
    throw new Error("stored token failed to verify — altered, or sealed with a different key");
  }
}

/** True when a token may be stored under the current configuration: a key
 *  is set, or this is not production. */
export function canStoreToken(env: Env = process.env): boolean {
  return loadTokenKey(env) !== null || env.NODE_ENV !== "production";
}

/** The value to WRITE for a token. Sealed when the key is set; refused in
 *  production without it; plaintext elsewhere. */
export function sealToken(plain: string, env: Env = process.env): string {
  const key = loadTokenKey(env);
  if (key) return encryptToken(plain, key);
  if (env.NODE_ENV === "production") {
    throw new Error(
      `${TOKEN_KEY_ENV} is not set — refusing to store a Gmail token in plaintext. ` +
      `Set it on the platform project (runbook 08 §2) and redeploy.`,
    );
  }
  return plain;
}

/** The value READ back from a token column, whichever form it was written in. */
export function openToken(stored: string, env: Env = process.env): string {
  return decryptToken(stored, loadTokenKey(env));
}
