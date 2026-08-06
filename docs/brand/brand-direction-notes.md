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

Plus: **the "row" color from Vantrow** (extract from the parent brand — getvantrow.com
/ the vantrow-web repo when attached — at design time; log the sourced hex here).

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
