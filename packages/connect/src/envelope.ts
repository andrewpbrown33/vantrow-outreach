/** Connect event envelopes and the HMAC signature scheme (events.md §Signatures).
 *  Pure functions — no I/O, no clock reads except where injected — so the
 *  contract is exercised deterministically in tests. */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export interface Envelope<T = unknown> {
  id: string;
  type: string;
  occurred_at: string;
  tenant_id: string;
  version: "v1";
  data: T;
}

/** `evt_` + 24 lowercase base36-ish chars, inside the contract's
 *  `^evt_[0-9a-z]{8,32}$`. Generated once and persisted: every retry of a
 *  delivery MUST reuse it, because it is the consumer's dedup key. */
export function newEventId(): string {
  const bytes = randomBytes(16);
  let out = "";
  for (const b of bytes) out += (b % 36).toString(36);
  return `evt_${out.slice(0, 24)}`;
}

export function buildEnvelope<T>(args: {
  type: string;
  tenantId: string;
  occurredAt: Date;
  data: T;
  eventId?: string;
}): Envelope<T> {
  return {
    id: args.eventId ?? newEventId(),
    type: args.type,
    // The spec is explicit: when the change happened, not when we delivered.
    occurred_at: args.occurredAt.toISOString(),
    tenant_id: args.tenantId,
    version: "v1",
    data: args.data,
  };
}

/** `t=<unix>,v1=<hex hmac of "<t>.<raw body>">`. Signed over the RAW bytes we
 *  are about to send — sign the exact string that goes on the wire, never a
 *  re-serialization, or a consumer's verification legitimately fails. */
export function signPayload(
  rawBody: string,
  secret: string,
  atMs: number,
): string {
  const t = Math.floor(atMs / 1000);
  const mac = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return `t=${t},v1=${mac}`;
}

/** Consumer-side verification, exported so the contract is testable from both
 *  ends (and so a consumer team can copy it verbatim). Tolerates the
 *  multi-`v1` form used during secret rotation. */
export function verifySignature(
  header: string,
  rawBody: string,
  secret: string,
  nowMs: number,
  toleranceSecs = 300,
): boolean {
  const parts = header.split(",").map((p) => p.trim());
  const t = Number(parts.find((p) => p.startsWith("t="))?.slice(2));
  if (!Number.isFinite(t)) return false;
  if (Math.abs(Math.floor(nowMs / 1000) - t) > toleranceSecs) return false;
  const expected = createHmac("sha256", secret)
    .update(`${t}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  return parts
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3))
    .some((sig) => {
      const buf = Buffer.from(sig, "hex");
      return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
    });
}
