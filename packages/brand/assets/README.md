# Nudgerow brand assets — the Signal

**Decided by Andrew 2026-08-07** (logo exploration rounds 1–2, `docs/brand/logo-mockups.html`):
round-2 candidate **G, direction flipped** — the family ball on the **left**, three arcs
**signaling forward**. One nudge, broadcasting until something answers.

## Files

| File | Use | Geometry |
|---|---|---|
| `mark.svg` | hero cut, ≥28px | ball cx34 r13 · arcs stroke 7, radii 22/32/42 |
| `mark-small.svg` | nav/inline/<28px | ball cx33 r14 · arcs stroke 8, radii 21/31/41 |
| `mark-dark.svg` | any dark ground | small-cut geometry · arcs go clarity yellow |
| `icon.svg` | favicon/app tile | small cut on the family rx-22 soft tile |

## Construction law

- 100-unit grid, 80-unit live area. The ball sits left (cx 34 hero / 33 small),
  vertically centered; the arcs share its center, spans ±50°/±35°/±25°, round caps.
- **The ball never moves and is always the signal amber `#887200`** — amber fills
  only, never strokes. One value for every cut, because it clears its own ground in
  both schemes. It replaced the Vantrow camel `#B8956A` on 2026-10-04 when the shared
  camel stopped being a cross-brand thread; see "Color law" for why that was overdue.
- Arc weights: 7 hero, 8 small — never mixed within one rendering.
- Clear space: one ball-radius on all sides. Lockup: mark height = wordmark ascender
  height; gap ≈ 40% mark width; wordmark lowercase `nudgerow`, SINGLE-TONE, inheriting
  the per-scheme `primary` (the two-tone split carried the retired family thread and
  went with it); byline "a Vantrow company". Prose stays capitalized "Nudgerow".
- **Surfaces render these files verbatim — no redrawing in situ.** (In-situ redraws
  are what caused Parcelrow's pre-lock drift; same rule here from day one.)

## Color law (the arithmetic)

Recomputed 2026-10-04 against the CURRENT grounds. The rows below were stale from
the 2026-09-30 D9 re-theme — they still quoted ink `#4A4952` on cream `#FDFBF2`, two
values this brand had already stopped using.

| Pair | Ratio | Verdict |
|---|---|---|
| damson `#403243` on soft `#FAFAF7` | 11.44:1 | arcs, light grounds ✓ |
| damson `#403243` on dark `#16151A` | 1.52:1 | ✗ — never draw the deep on dark |
| clarity `#F3DD6D` on dark `#16151A` | 13.30:1 | arcs, dark grounds ✓ (the dark-scheme primary) |
| clarity `#F3DD6D` on soft `#FAFAF7` | 1.31:1 | ✗ — never draw yellow on light |
| amber `#887200` on soft `#FAFAF7` | 4.51:1 | ball ✓ — clears 4.5 text-grade |
| amber `#887200` on dark `#16151A` | 3.85:1 | ball ✓ — clears the 3:1 graphical floor |

So each ground keeps exactly two colors — that ground's brand primary for structure
(damson on light, clarity yellow on dark) + the constant amber ball.

**Why the ball changed.** The camel reached only **2.5:1** on the light ground and this
file waved it through as "display-only, ✓ at mark sizes". That is the weakest claim in
the old law, and it was worst exactly where it mattered most: `icon.svg` at 16px. The
amber clears 4.5:1 there. The camel's justification was that it was the shared family
thread — once that went, nothing was left to pay for the contrast.

**What is NOT a floor:** ball-vs-arc. Amber sits 2.54:1 from the damson arcs and 3.45:1
from the clarity-yellow arcs, and neither needs to clear 3:1 — a logo is exempt from WCAG
1.4.11, and the real requirement is that each element reads against the GROUND, which both
do. The two cuts separate differently, and the difference is worth stating precisely:

- **light cut** — amber (hue 50.3°) is 120.9° from damson (289.4°): hue does the work.
- **dark cut** — amber and clarity yellow are the *same* hue (50.3° vs 50.1°, by
  construction, since the amber is derived from the yellow). They separate by value
  alone, 3.45:1, plus the geometric gap. A family resemblance, not a clash.

Demanding 3:1 on all four pairs at once is arithmetically impossible on this hue; it was
checked rung by rung before settling for the two that are real requirements.

## Decision record

- Round 1 (A–D): Cadence · Nudge · Return · N Frame — A led.
- Round 2 (E–I + sharpening-A): Climb · Closed Loop · **Momentum (G)** · Burndown ·
  Prompt; A2/A3 variants. Andrew: *"Let's go with G, but change the direction so dot
  is left and arcs are being 'signaled' forward"*, in the decided palette (F, Clarity
  Ink). Flip applied; dark cut uses the palette's dark primary per the arithmetic above.
- Wordmark case split (lowercase lockup / capitalized prose) applied per the
  Parcelrow-precedent recommendation, presented 2026-08-07 and unobjected — one
  decision-log row reverses it if Andrew ever wants uppercase lockups.
