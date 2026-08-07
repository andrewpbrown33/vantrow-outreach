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
| `icon.svg` | favicon/app tile | small cut on the family rx-22 cream tile |

## Construction law

- 100-unit grid, 80-unit live area. The ball sits left (cx 34 hero / 33 small),
  vertically centered; the arcs share its center, spans ±50°/±35°/±25°, round caps.
- **The ball never moves and is always family camel `#B8956A`** — camel fills only,
  never strokes, never text under 18px. It is the same ball Vantrow's V cradles.
- Arc weights: 7 hero, 8 small — never mixed within one rendering.
- Clear space: one ball-radius on all sides. Lockup: mark height = wordmark ascender
  height; gap ≈ 40% mark width; wordmark lowercase `nudge|row` (stem in ink, "row" in
  camel), byline "a Vantrow company". Prose stays capitalized "Nudgerow".
- **Surfaces render these files verbatim — no redrawing in situ.** (In-situ redraws
  are what caused Parcelrow's pre-lock drift; same rule here from day one.)

## Color law (the arithmetic)

| Pair | Ratio | Verdict |
|---|---|---|
| ink `#4A4952` on cream `#FDFBF2` | 7.4:1 | arcs, light grounds ✓ |
| ink `#4A4952` on dark `#16151A` | 2.4:1 | ✗ — never draw ink on dark |
| clarity `#F3DD6D` on dark `#16151A` | 12.4:1 | arcs, dark grounds ✓ (the dark-scheme primary) |
| clarity `#F3DD6D` on cream `#FDFBF2` | 1.4:1 | ✗ — never draw yellow on light |
| camel `#B8956A` on cream | 2.5:1 | display-only, ✓ at mark sizes |
| camel `#B8956A` on dark | 3.4:1 | display-only, ✓ at mark sizes |

So each ground keeps exactly two colors — that ground's brand primary for structure
(ink on light, clarity yellow on dark) + the constant camel ball. This matches the
family law (Parcelrow: cornflower/cream + gold) with Nudgerow's own pair.

## Decision record

- Round 1 (A–D): Cadence · Nudge · Return · N Frame — A led.
- Round 2 (E–I + sharpening-A): Climb · Closed Loop · **Momentum (G)** · Burndown ·
  Prompt; A2/A3 variants. Andrew: *"Let's go with G, but change the direction so dot
  is left and arcs are being 'signaled' forward"*, in the decided palette (F, Clarity
  Ink). Flip applied; dark cut uses the palette's dark primary per the arithmetic above.
- Wordmark case split (lowercase lockup / capitalized prose) applied per the
  Parcelrow-precedent recommendation, presented 2026-08-07 and unobjected — one
  decision-log row reverses it if Andrew ever wants uppercase lockups.
