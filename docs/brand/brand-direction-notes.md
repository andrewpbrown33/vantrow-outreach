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

## ~~Candidate palettes — round 1 (A/B/C)~~ REJECTED 2026-08-07

Andrew's critique, on the record: round 1 ignored the "build from them all"
instruction (each palette led with 1–2 colors and benched the rest) and every option
resembled an existing brand — **A (emerald+golden) ≈ Eaverow's pine+camel, C ≈
Vantrow's navy+camel, B ≈ the category's default blue.** Kept below for history
(supersede-don't-delete); round 2 replaces it.

## Candidate palettes — round 2 (D/E/F), built 2026-08-07 after the critique

**Structure change that answers the critique:** every candidate carries the SAME
full role sheet — all eight colors have a job in every option — and only the LEAD
rotates, through the colors the family does NOT already own:

| Color | Job in every candidate |
|---|---|
| `#E10600` red | Alert/danger (bounces, failures, urgent cracks) — except in E, where it leads |
| `#006D46` emerald | Success/positive (replies, delivered, warmed-up) — never a lead (ceded to Eaverow's pine territory) |
| `#7DA1C4` dusty blue | Info/neutral states, empty states, charts-secondary |
| `#F3DD6D` clarity yellow | Highlight/selection (selected rows, cracked-prospect flags) — leads in F |
| `#7E7D81` gray-violet | The neutral spine — muted text and borders derive from it |
| `#BE6A00` golden | Warm secondary/hover — leads in D |
| `#B8956A` camel (Vantrow row) | The family thread: the "row" in the wordmark + the endorsement lockup, always |
| `#001489` royal | Deep counter-accent (focus rings, links-on-cream) — never a lead (blue ceded) |

**Distinctness rule:** no candidate leads with navy+camel (Vantrow), green+gold
(Eaverow), or plain blue (the category default).

| Token | D — "Golden Hour" (Luxury·Calm) | E — "Signal" (bold; Fear put to work) | F — "Clarity Ink" (Clarity·Insecurity-gray as sophistication) |
|---|---|---|---|
| light.primary | `#BE6A00` golden (UI elements) | `#E10600` red | `#4A4952` deep gray-violet ink |
| light.primaryDark | `#8F4F00` (text duties, wordmark) | `#A80400` | `#201F24` |
| light.accent | `#001489` royal counter-pop | `#001489` royal | `#F3DD6D` clarity yellow (ink text on chips) |
| light.background | `#FBF7F0` golden-cast cream | `#F5F4F6` violet-cast paper | `#FDFBF2` yellow-cast cream |
| light.foreground | `#2A1F14` deep brown | `#1C1B1E` | `#201F24` |
| light.muted | `#6F6E74` (from #7E7D81) | `#7E7D81` raw | `#7E7D81` raw |
| dark.primary | `#D98E33` | `#F0554A` | `#F3DD6D` (yellow pops on dark) |
| dark.primaryDark | `#E8AC5C` | `#F5837A` | `#F7E794` |
| dark.accent | `#7DA1C4` (royal illegible on dark → info-blue takes over) | `#7DA1C4` | `#7DA1C4` |
| dark.background | `#191410` warm brown-black | `#17161A` violet-black | `#16151A` |
| dark.foreground | `#F2EAE0` | `#ECEBEE` | `#EFEDE6` |
| dark.muted | `#9A948E` | `#97949B` | `#9B99A3` |

Feel summary: **D** — warm, moneyed, unhurried; amber/gold is unclaimed territory in
sales tech; royal blue appears only as the sharp counter-accent. **E** — the bold one:
red as brand energy (urgency is the product's subject), disciplined by violet-grays;
highest risk, highest memorability. **F** — editorial ink + clarity yellow; the
gray-violet finally stars as sophistication rather than filler; yellow highlight IS
the product's "surface what's slipping" gesture.

Wordmark note: the two-tone rule holds (lead color + camel `row`); D's wordmark uses
`#8F4F00` for "nudge" so the gold lead never muddies against the camel row.
BrandConfig gains semantic tokens (alert/success/info/highlight) at token-apply time
so every color's job ships into the product, not just the memo.

### Round 1 record (rejected — see critique above)

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

**Visual preview:** `docs/brand/palette-preview.html` (open in any browser) — the three
candidates rendered as two-tone wordmarks (camel "row") on their own light/dark grounds
with full token chips. Also published for review at the session artifact link.
