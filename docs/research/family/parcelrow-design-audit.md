# Parcelrow design & drafting audit — condensed

**Date:** 2026-08-07 · **Source:** full read-only audit of the private family repo
`andrewpbrown33/vantrow-knakal_map_room` (Parcelrow, subsidiary #2), attached to the
session by Andrew for this purpose. First-party family material (no clean-room tiering
applies). This file is the durable extract; paths below are Parcelrow-repo paths.
**Why it exists:** the R11 design directive names Parcelrow's design/drafting work as
the explicit bar for Nudgerow.

## How Parcelrow drafted (the process worth copying)

1. **Research → gap statement → mockups → checkpoint → build**, founder gate after
   each stage; UI untouched until the research phases closed (`docs/01-program-plan.md`).
2. **Competitive teardown before any pixel** — `docs/landscape/C2-ui-teardowns.md`
   tags every observed pattern `[BORROW]`/`[AVOID]` with attribution, names three
   products as "the craft bar we must clear," then `C3-gap-and-guideline.md` distills
   a numbered 15-borrow / 7-avoid list. Design starts from that list, not from taste.
3. **A single-file interactive mockup deck** —
   `docs/design/mockups/checkpoint-c-mockups.html`: zero dependencies, tabbed views,
   working hovers/toggles, every screen stamped `ILLUSTRATIVE DATA`, and design
   rationale written in flanking annotation notes, each citing its source pattern.
   Reviewable by the founder in a browser, diffable in git, becomes the build spec.
4. **Brand explored in numbered decision plates** (six of them, recorded in
   `packages/brand/README.md`): four color directions → mark constructions on one
   grid → dual-ground color systems → dark-prefix candidates → a nine-way live
   switcher → final color locked with a date. The initial pick (oxblood) was
   overturned and the reversal is still visible in the shipped files' comments.
5. **An append-only decision log** with Options/Why/Consequences per entry, dated,
   reversals as new entries — including retro-documenting a decision that had only
   ever existed in code (D11), and recording *accepted* limitations with an owner.
   (Nudgerow already runs this pattern.)

## The brand system (what "robust" looks like)

- **Marks:** one named geometric concept ("the Quarter Section") on a 100-unit grid,
  four SVG cuts (hero ≥28px strokes 8/7 · small <28px strokes 9/8 widened ·
  dark = structure flips to cream, gold stays · icon = geometry on an rx-22 cream
  tile). Every SVG carries a construction-law comment + "keep in sync" note.
- **The family constant:** gold `#B8956A` — "gold NEVER moves, gold fills only,
  never strokes, never text under 18px." The "row" morpheme is always this gold.
- **Wordmark law:** Manrope 800, lowercase, −0.02em, split `parcel|row`; byline
  "a Vantrow company"; lockup ratio mark-height = ascender height, gap = 40% mark
  width. Production self-hosts Manrope — never a font CDN.
- **Two palettes, deliberately separated:** brand chrome tokens
  (`packages/brand/tokens.css`, 16 tokens incl. tuned light/dark brand pair with a
  WCAG ratio table for all eight pairs) vs the **data palette**
  (`packages/design-tokens/palette.json`) for map encodings — *"brand color is
  UI-only so deal dots never read as advertising."* The data palette is pinned by a
  CI check (`tools/check-palette.mjs`) so edits force deliberate re-validation.
- **Dark is a place, not a preference:** marketing site pinned light; the signed-in
  "vault" world is dark (`#171410`); no toggle anywhere. Dark bleeds into the light
  site only at the final CTA + footer, terminating the page into the app's world.
- **Type texture:** serif body (Georgia) + sans brand (Manrope) + mono for data,
  eyebrows and all-caps micro-labels at .14–.22em tracking; tabular numerals.

## Anti-generic law, CI-enforced (`tools/check-guardrails.sh`)

Banned typefaces (Inter/Roboto/Open Sans/Poppins/Montserrat/DM Sans/Space
Grotesk/Playfair) · no gradients · no emoji on product surfaces · radius cap ≤2px ·
no box-shadows — all grep gates on every PR, plus a self-test that fails if the
include globs match nothing. Depth comes from 1px hairlines, not shadows. This law
is *why* the site cannot drift into generic SaaS.

## First-run & failure-state craft

- **Pay first, set password after** (D11): no signup wall in front of payment; the
  welcome page claims the account ("Your key is cut.").
- **Six distinct auth-failure messages** written for humans, because "a wrong
  password and a misconfigured deployment look identical behind a generic message"
  (`apps/gate/api/login.js`). Locked/offline/404 rooms each get designed copy.
- **Demo mode:** with no backend keys set, any credentials open a seeded demo
  account — the whole app is walkable with zero configuration.
- **The not-available path is a designed surface:** all 50 states are live links;
  unbuilt counties prefill a request form that locks a lifetime founder rate and
  reorders the build queue; queued items get deterministic, procedurally generated
  artwork deliberately drained of gold so live vs queued reads at a glance.
- **Provenance as UI:** "records through {date}" stamps, `(inferred)` labels,
  dashed TBD chips, method shown next to every computed number.
- **Voice enforced from a manifest:** `packages/brand/platform-manifest.json`
  carries voice rules + banned words (`AI-powered`, `revolutionary`, `seamless`,
  `unlock`, `game-changer`); family bar/JSON-LD render from the Vantrow hub between
  HTML markers with a committed fallback and a `--check` CI gate.

## What Nudgerow ports (ranked; the Phase 4 plan operationalizes these)

1. Mockup deck before app UI — single-file, interactive, `ILLUSTRATIVE DATA`
   stamps, flanking rationale notes (sequences board · sequence detail · cracks home).
2. Anti-generic design law as a CI gate, tuned to Clarity Ink (our banned-font list,
   gradient/emoji bans, radius/shadow discipline — exact law set in the phase plan).
3. Two-palette separation: brand chrome vs **sequence/prospect state encodings**
   (draft/active/paused/replied/finished-no-reply/bounced), pinned with a drift check.
4. Brand README that states the construction law, shows the WCAG arithmetic, and
   records accepted trade-offs; marks rendered verbatim, never redrawn in situ.
5. Empty/failure states written as product copy + a runnable demo mode.
6. Designed not-available paths (unconnected providers, unbuilt channels).
7. Provenance-as-UI for inferred things (bounce classification, OOO detection,
   engagement signals): label the inference, show the method.
8. Voice block + banned-word list in the platform manifest slot; Vantrow-hub family
   markers for footer/JSON-LD.
9. `[BORROW]`/`[AVOID]` teardown discipline — already partially done in doc 10;
   the UI-specific teardown pass happens against the mockup deck.
10. Dark-as-a-place question — decide deliberately for Nudgerow (our palette F has
    a real dark scheme; the *site vs app* ground split is a design-pass decision).

**Not ported, and why:** Parcelrow's no-framework static-HTML architecture (Nudgerow's
stack is locked to the family Next/Tailwind toolchain — the *laws* port, the build
system doesn't) · serif body type (Clarity Ink's voice is set in the palette memo;
type choice happens in the design pass with the mockup deck) · the literal
cream/vault hexes (Nudgerow has its own grounds from palette F).
