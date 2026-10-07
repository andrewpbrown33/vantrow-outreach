import { brand } from "@vantrow/brand";

/**
 * The Nudgerow wordmark — SINGLE-TONE, rendered lowercase.
 *
 * It was two-tone until 2026-10-04: the stem in the brand lead, the "row"
 * suffix in the Vantrow camel. That existed for one reason — the camel was the
 * thread every subsidiary shared — and Andrew retired the shared thread, so
 * the split lost its only justification and goes with it.
 *
 * Single-tone is also the one shape that survives dark mode for free. It
 * inherits `color`, so it resolves to the per-scheme `--brand-primary` wherever
 * it is placed, and no second value is needed. That matters because a second
 * value is provably impossible here: 4.5:1 against the soft ground needs
 * luminance ≤ 0.1731 while 4.5:1 against the dark ground needs ≥ 0.2102, so no
 * single hex can carry wordmark text on both. The signal amber (`brand.signal`,
 * 4.51:1 on soft, 3.85:1 on dark) fills the mark's BALL, where the 3:1
 * graphical floor applies and one value does suffice.
 *
 * Case: lowercase in the drawn lockup (the family case split, Parcelrow
 * precedent, 2026-08-07); prose keeps capitalized "Nudgerow".
 */
export function Wordmark({ className }: { className?: string }) {
  return <span className={className}>{brand.name.toLowerCase()}</span>;
}
