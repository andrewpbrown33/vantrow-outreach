// State-palette drift gate (Parcelrow's check-palette pattern, ported per R11).
//
// Asserts packages/brand/src/state-palette.ts matches the last VALIDATED set
// below AND that every value still clears text-grade contrast on its ground
// (light ≥4.5:1 on #FAFAF7, dark ≥4.5:1 on #16151A). An edit to the palette
// fails CI until this block is deliberately re-stamped with a new date —
// drift must be a decision, never an accident.

import { readFileSync } from "node:fs";

const VALIDATED = {
  // Re-stamped 2026-09-30: the GROUND moved cream #FDFBF2 → soft #FAFAF7
  // with the damson re-theme (D9). No state value changed — all seven were
  // recomputed against the new ground and still clear 4.5:1; the closest is
  // `active` at 4.64:1 (was 4.68:1). A deliberate re-stamp, not a drift.
  stamp: "2026-09-30",
  groundLight: "#FAFAF7",
  groundDark: "#16151A",
  states: {
    draft: { light: "#6E6C77", dark: "#9B99A3" },
    scheduled: { light: "#3E6FA3", dark: "#7FA7DB" },
    active: { light: "#0F7D8C", dark: "#4FB3C4" },
    paused: { light: "#986200", dark: "#D9A045" },
    replied: { light: "#1E7A3C", dark: "#66BB7A" },
    finished_no_reply: { light: "#6D4FA6", dark: "#A98BD9" },
    bounced: { light: "#B3261E", dark: "#E5726A" },
  },
};

const SRC = "packages/brand/src/state-palette.ts";
const text = readFileSync(SRC, "utf8");

const entryRe =
  /key:\s*"([a-z_]+)",.*?light:\s*"(#[0-9A-Fa-f]{6})",\s*dark:\s*"(#[0-9A-Fa-f]{6})"/g;
const shipped = {};
for (const m of text.matchAll(entryRe)) shipped[m[1]] = { light: m[2], dark: m[3] };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const errors = [];
const expectedKeys = Object.keys(VALIDATED.states);
const shippedKeys = Object.keys(shipped);

if (shippedKeys.length === 0)
  errors.push(`self-test: parsed 0 entries from ${SRC} — parser or file format broke`);
for (const k of expectedKeys)
  if (!shipped[k]) errors.push(`missing state "${k}" (in VALIDATED, not in shipped file)`);
for (const k of shippedKeys)
  if (!VALIDATED.states[k]) errors.push(`unvalidated state "${k}" — add to VALIDATED with a new stamp`);

for (const [k, v] of Object.entries(VALIDATED.states)) {
  const s = shipped[k];
  if (!s) continue;
  for (const ground of ["light", "dark"]) {
    if (s[ground].toUpperCase() !== v[ground].toUpperCase())
      errors.push(`${k}.${ground} = ${s[ground]} drifted from VALIDATED ${v[ground]} (stamp ${VALIDATED.stamp})`);
    const bg = ground === "light" ? VALIDATED.groundLight : VALIDATED.groundDark;
    const r = ratio(s[ground], bg);
    if (r < 4.5)
      errors.push(`${k}.${ground} = ${s[ground]} is ${r.toFixed(2)}:1 on ${bg} — below text-grade 4.5:1`);
  }
}

if (errors.length) {
  console.error(`✗ state-palette check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ state palette matches VALIDATED set (${VALIDATED.stamp}); all ${expectedKeys.length} states ≥4.5:1 on both grounds.`
);
