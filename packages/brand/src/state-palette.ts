/**
 * Nudgerow STATE palette — data encodings for sequence/enrollment states.
 *
 * Two-palette law (ported from Parcelrow, R11): this file is the DATA palette;
 * `brand.config.ts` is the CHROME palette. Brand color never encodes state,
 * the family camel (#B8956A) never encodes data, and states are never
 * color-only — every chip/dot carries its text label; color is redundant.
 *
 * Values are pinned by `scripts/check-state-palette.mjs` (exact-match against
 * the last VALIDATED set + computed WCAG ratios: every `light` ≥4.5:1 on the
 * light ground #FAFAF7, every `dark` ≥4.5:1 on the dark ground #16151A) so an
 * edit here fails CI until the check's VALIDATED block is deliberately
 * re-stamped. Washes are decorative backgrounds (ink text sits on them) and
 * are not contrast-pinned.
 *
 * Keep each entry on one line — the check script parses this file textually.
 */

export interface StateEncoding {
  /** stable key, used in CSS vars as --state-<key> */
  key: string;
  /** human label — always rendered next to the color */
  label: string;
  /** text-grade encoding on the light ground (#FAFAF7) */
  light: string;
  /** text-grade encoding on the dark ground (#16151A) */
  dark: string;
  /** pale chip/row background for light surfaces (decorative) */
  washLight: string;
  note: string;
}

// prettier-ignore
export const statePalette: StateEncoding[] = [
  { key: "draft",             label: "Draft",             light: "#6E6C77", dark: "#9B99A3", washLight: "#EAE9EC", note: "not yet scheduled; neutral — no urgency" },
  { key: "scheduled",         label: "Scheduled",         light: "#3E6FA3", dark: "#7FA7DB", washLight: "#E3EBF5", note: "queued with a fire time" },
  { key: "active",            label: "Active",            light: "#0F7D8C", dark: "#4FB3C4", washLight: "#DFEEF1", note: "engine is running this enrollment" },
  { key: "paused",            label: "Paused",            light: "#986200", dark: "#D9A045", washLight: "#F3E8D4", note: "held — OOO return date or manual hold" },
  { key: "replied",           label: "Replied",           light: "#1E7A3C", dark: "#66BB7A", washLight: "#DFEEE4", note: "goal state; sequence stopped by a reply" },
  { key: "finished_no_reply", label: "Finished · no reply", light: "#6D4FA6", dark: "#A98BD9", washLight: "#E9E3F4", note: "the cracks state — ran dry without an answer" },
  { key: "bounced",           label: "Bounced",           light: "#B3261E", dark: "#E5726A", washLight: "#F6DDDB", note: "hard bounce / suppressed; distinct from UI alert red" },
];

/** CSS custom properties for the state palette, scheme-aware at the callsite. */
export function stateCssVars(scheme: "light" | "dark"): string {
  return statePalette
    .map((s) => `--state-${s.key.replace(/_/g, "-")}:${scheme === "light" ? s.light : s.dark};`)
    .join("");
}

/** Light-ground washes (decorative chip/row backgrounds). */
export function stateWashVars(): string {
  return statePalette.map((s) => `--state-wash-${s.key.replace(/_/g, "-")}:${s.washLight};`).join("");
}
