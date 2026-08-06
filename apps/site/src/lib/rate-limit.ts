/**
 * Naive in-memory rate limiter: sliding one-minute window per key.
 *
 * Deliberately simple — state lives in the Node process, so it resets on
 * deploy and is per-instance. Good enough to blunt casual form abuse; swap
 * for a shared store if the site ever runs multi-instance.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

/** Returns true if the request is allowed, false if over the limit. */
export function rateLimitAllow(key: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (timestamps.length >= MAX_PER_WINDOW) {
    hits.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 10_000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= cutoff)) hits.delete(k);
    }
  }
  return true;
}
