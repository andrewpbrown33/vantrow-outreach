# Brand Direction Notes — Founder Input (Tier R)

**Recorded 2026-08-06** from Andrew, for the Phase 2 **design pass** (logo, palette,
typography — the identity that replaces the interim tokens in
`packages/brand/src/brand.config.ts`; applied in the same commit as its decision-log
entry, per the no-token-drift rule).

## The brief, in Andrew's words (lightly formatted)

Base colors to try out — take these **plus the "row" color from Vantrow** and build
out color palettes from them all. Keywords/adjectives under each steer the feel:

| Hex | Andrew's description | Feel keyword |
|---|---|---|
| `#BE6A00` | Bold, warm orange-brown with golden undertones | **Luxury** |
| `#E10600` | Vibrant, intense shade of bright red | **Fear** |
| `#F3DD6D` | Warm, bright green-yellow | **Clarity** |
| `#7E7D81` | Muted, low-chroma cool gray-violet | **Insecurity** |
| `#001489` | Royal blue | **Productivity** |
| `#7DA1C4` | Muted, dusty cool blue | **Calm** |
| `#006D46` | Deep cool green — "emerald haven" | **Elegance** |

Plus: **the "row" color from Vantrow** — sourced 2026-08-07 from the live parent site
(getvantrow.com `/brand/vantrow-mark-duo.svg` + page styles): **camel-gold `#B8956A`**
(the duo mark's fill — the same camel used in Eaverow's wordmark, i.e. the family's
shared thread) with **deep navy `#1B2A4E`** as its companion tone; the page also uses
darker camel shades `#A9875D` and `#6F5733`.

## Candidate palettes (built 2026-08-07 — Andrew picks; tokens map to BrandConfig)

**All three share:** red `#E10600` (Fear) is the **semantic alert color** in-app
(bounces, failures, urgent cracks) — never a brand lead; the camel `#B8956A` family
thread appears in the endorsement lockup ("a Vantrow company") regardless of palette;
gray-violet `#7E7D81` informs the muted tones. AA contrast checked directionally;
final values verified at token-apply time.

| Token | A — "Emerald Standard" (Elegance·Luxury) | B — "Royal Signal" (Productivity·Clarity·Calm) | C — "Vantrow House" (family thread) |
|---|---|---|---|
| light.primary | `#006D46` emerald | `#001489` royal | `#1B2A4E` Vantrow navy |
| light.primaryDark | `#004A30` | `#000D5C` | `#101A33` |
| light.accent | `#BE6A00` golden | `#F3DD6D` clarity (dark text on chips) | `#B8956A` the row camel |
| light.background | `#F8FAF8` | `#F7F8FC` | `#FAF8F5` warm |
| light.foreground | `#10201A` | `#0C1030` | `#14192B` |
| light.muted | `#5C6B64` | `#5A6180` | `#6E6D75` (from #7E7D81, AA-darkened) |
| dark.primary | `#4CAF87` | `#7DA1C4` (the Calm blue, promoted) | `#8FA3CE` |
| dark.primaryDark | `#7FC7A8` | `#A5C0DA` | `#B3C2E0` |
| dark.accent | `#D98A2B` | `#F3DD6D` | `#B8956A` |
| dark.background | `#0B1512` | `#0A0E24` | `#0D1220` |
| dark.foreground | `#E4EDE8` | `#E3E7F5` | `#E8E6F0` |
| dark.muted | `#93A39B` | `#8E96B5` | `#9B99A3` |

Feel summary: **A** — emerald-haven elegance with golden luxury accents; distinct from
every sales-tech blue. **B** — royal-blue productivity with a clarity-yellow signal;
uses two of Andrew's colors as the light/dark primaries. **C** — maximum family
cohesion: Nudgerow visibly a Vantrow company (navy + camel exactly as the parent
mark); calmest and most "trusted advisor" of the three.

## Design-pass instructions (for the session that runs it)

1. Build 3–4 candidate palettes from combinations of the bases above + the Vantrow
   row color. Each palette maps to the full `BrandConfig` token set: light AND dark
   (primary / primaryDark / accent / background / foreground / muted), with AA
   contrast verified on both schemes.
2. Read the keywords as emotional steering, not labels to print: the product's
   positioning (doc 12) is *calm competence + transparent + simple* — palettes that
   lead with Calm/Clarity/Elegance bases and use Fear-red only as a rare alert accent
   (bounces, failures — which is semantically apt) will likely fit best; present the
   options, Andrew picks.
3. Wordmark/logo candidates ride the same memo (the `-row` family: consider how
   Eaverow's wordmark treats the suffix). Assets land in `packages/brand/assets/`.
4. Decision = an option memo (anatomy per the program plan) → Andrew picks → tokens +
   assets + decision-log row in ONE commit.
