# Checkpoint 4-D — round-1 founder feedback

**Date:** 2026-08-07 · **Deck reviewed:** `docs/design/mockups/checkpoint-4d-mockups.html`
(v1, as merged in PR #6) · **Also decided in the same message:** the brandmark
(G flipped → "the Signal", see decision log).

Faithful paraphrase of Andrew's redlines, with consequences. Three supporting
screenshots from his licensed incumbent account are logged **Tier-F only**
(F-001..003 in `docs/research/outreach/00b-founder-input-log.md`) — directional
reference, never reproduced.

## Redlines

- **R-4D-1 · Kill the table; the home is an activity FEED.** Replace the cracks
  table with a feed segmented by date (Today / Yesterday / 2 days ago …), entries
  written as events — *"You received an email from prospect Derek Smith"*,
  *"… Step #6 (Auto Email) of Investor Sequence"*, *"Nathan Roseman advanced to
  Step #8 … of General Outreach Sequence"*, *"Bob Rose finished Investor Sequence"*.
  He "hates tables"; the feed is the view.
- **R-4D-2 · The feed's filters ARE the reports.** Filtering the feed by activity
  type (sends this week, replies, finished sequences, bounces …) replaces the
  separate report views from v1.
- **R-4D-3 · Everything links.** Prospect names open the prospect view; sequence
  names open the sequence page. The feed is interactive, not a log.
- **R-4D-4 · Sequence detail: drop the "stops itself" commentary.** Window /
  holidays / daily cap move into a **collapsible filtering/settings menu**, not
  inline furniture.
- **R-4D-5 · Sequences opens to an OVERVIEW.** The Sequences nav item lands on an
  all-sequences view with statistics (active, paused, failed, bounced, finished);
  the v1 detail view is what a specific sequence opens into. (v1's "Board" view,
  which read unclear to him, becomes this overview.)
- **R-4D-6 · Reference material.** Three screenshots supplied (F-001..003):
  sequences listing with per-state counts, template editor with variable
  live-preview, step timeline with per-step analytics. Replicate *aspects*, keep
  our own brand feel.
- **R-4D-7 · Direction plates requested.** 3–4 design mockups that follow **no
  pre-set guidelines** (ours or the family's) — designed purely for this product's
  case. Presented as `docs/design/mockups/direction-plates.html`; deck v2 gets
  built in the chosen direction (with the design law amended deliberately if the
  pick breaks it).

## Notes

- One feed example mentioned a *text-message* step; customer-#1 requirements
  exclude telephony/SMS (Tier-R log). Feed mockups stay email-only; SMS remains a
  Gate-11 market question — flagged, not built.
- v1 deck stays in the repo as the checkpoint artifact; a redline banner points
  here. Deck v2 replaces it after the direction pick.

## Direction plates — round-1 reactions (2026-08-07, same day)

- **R-4D-8 · What landed:** Plate 3 (Studio)'s **icon chips** — the tinted circles
  with glyphs beside each feed item (screenshot of the Studio feed attached in
  chat). Plate 2 (Mission Deck)'s **live-console feel and darker background**.
- **R-4D-9 · What didn't:** Mission Deck reads **too "codey"** — the product must
  be loved across many industries, not feel engineer-flavored. Consequence: no
  monospace body text, no terminal idioms (snake-case names, log-tail syntax) in
  any surviving direction; mono survives only as tiny numeric texture, if at all.
- **R-4D-10 · The target, in his words:** *"effortless AND like an always-on
  dashboard. the feed itself should be darker background, but rest of contents
  does not necessarily need to be."*
- **R-4D-11 · Asked for:** 2–3 additional directions plus the direct synthesis of
  this feedback. Delivered as round 2 on `direction-plates.html`: **The Lantern**
  (the synthesis: dark feed pane in a light room), **The Sidecar** (feed as a
  persistent dark left column), **The Marquee** (light cards floating on a dark
  band), **The Crown** (inversion control: dark dashboard crown, light feed —
  tests whether "dark" wants to live in the chrome instead of the feed).

## Round 3 — the social-grammar question (2026-08-08)

- **R-4D-12 · "What if we made the feed look like X (Twitter), or Threads?"**
  Asked with four Threads-web-home screenshots (third-party reference — curated
  captures of Meta's Threads UI, not incumbent material, so no Tier-F concern;
  kept out of the repo, described here). What the reference shows: one centered
  column; person-first rows (avatar left, bold name + relative time, content,
  action row with counts); faint hairline dividers, no cards; a centered
  "For you ▾" view picker; a small corner badge on each avatar.
- **Read as a row-grammar question, orthogonal to the round-2 ground question.**
  Plates 5–8 decide *where dark lives*; the social grammar decides *the shape of
  each row*. They compose — Threads-shaped rows can sit inside the Lantern pane.
- **Answered as Plate 9 · The Pulse** on `direction-plates.html`: **9A** the
  literal borrow (Threads' white ground — flagged as contradicting R-4D-10 "the
  feed itself darker"), **9B** the synthesis (identical rows inside the Lantern
  pane). Translation rules recorded on the plate: monogram-as-chip with corner
  state badge; the reply's words become the post body; no engagement-count
  theater (per-row actions instead); thin events aggregate under stacked
  monograms; date bands stay (R-4D-1); the borrow is the generic social-feed
  grammar only — no Threads/X iconography or trade dress.

## The pick (2026-08-08)

- **R-4D-13 · Andrew's answer to the plates: "9" — the Pulse.** Read per the
  plate's own terms: the Pulse is a **row grammar**, not a ground, so the ground
  resolves to **the Lantern** — R-4D-10 stands ("the feed itself should be darker
  background") and Plate 9's verdict names "Lantern × Pulse" the natural hybrid.
  **Built as 9B.** If the light 9A cut was the intent, one word re-cuts it.
- **Deck v2 built in the language:** `docs/design/mockups/deck-v2.html` —
  Activity home (Pulse rows inside the Lantern pane; the centered picker IS the
  reports per R-4D-2), Sequences overview (R-4D-5), sequence detail (schedule
  drawer per R-4D-4, per-step numbers per F-003's aspect, enrollments as
  person-first rows — no tables anywhere). v1 stays archived under a superseded
  banner; the deck artifact republished at the same URL.
- **Design law amended** (decision-log row, same date): radius cap rises to the
  Lantern pane's 16px (`rounded-2xl` legal; 3xl+ and arbitrary radii still
  banned) · U+2713 ✓ carved out of the emoji ban (the finished-badge glyph —
  typographic, not emoji). **Grounds and state palette unchanged** — the pane is
  the validated night ground `#16151A`, so the pinned set needs no re-stamp; v1's
  open "night question" is answered: dark is a *place* (the feed pane), not a
  preference.
- **Open on the deck:** the "failed" vocabulary question — does step-level
  failure need its own state, or do Bounced + retry policy cover it? (Overview
  rail; one decision row either way.)

## Round 4 — deck v2 redlines (2026-08-08, same day)

Andrew's reply to deck v2, applied as **v2.1** on the same PR:

- **R-4D-14 · The home is BOTH.** A home page combining the activity feed with a
  sequences overview as a right window panel — the feed stays the primary view.
  (The Sequences nav still opens the full overview per R-4D-5; the panel is its
  always-visible summary.)
- **R-4D-15 · The stacked bar fails; another visualization.** The per-sequence
  proportion bar "doesn't make sense to what we're tracking." Replaced with **dot
  strips**: one dot = one person currently in the sequence, colored by pinned
  state, grouped in fixed state order; counts written beside every strip (states
  never color-alone); finished is history — a number, never dots. Validator
  evidence recorded: two pinned pairs sit close (paused↔bounced for CVD;
  replied↔active at the normal-vision floor) — covered now by grouping + words;
  any future palette round should re-step them deliberately.
- **R-4D-16 · No outreach scores.** "I don't need to know what you're tracking
  here" — per-step sent/opened/replied numbers and all engagement-score texture
  are off the surfaces. The ledger (I10) still records everything for the three
  reports and the data export.
- **R-4D-17 · "Brand's palette feels weak."** Addressed first as application:
  deeper ink `#1A1920`, firmer hairlines `#DCD6C2`, heavier weights, camel
  eyebrows — tokens, validated grounds, and the pinned state set untouched. If
  Clarity Ink still reads weak in v2.1, the palette gate reopens (one decision
  row, new candidates round — which would also re-step the CVD-close pairs).
- **R-4D-18 · No self-describing screens; onboarding is a phase.** Product-
  descriptive copy removed from every surface ("it's gonna be intuitive
  interface"); provenance survives only at the value it qualifies ("classified
  from headers"). First-time use becomes a dedicated onboarding flow — designed
  under workstream A6 once this deck approves. The first-run panel left the
  overview page accordingly.
- One clause — *"update rounds to match the points"* — read as: keep this doc's
  round records in sync with the feedback as delivered (this section). Flagged
  in case a different meaning was intended.

## Round 5 — v2.1 verdict (2026-08-08, post-merge)

- **R-4D-19 · Eyebrow text: gone, everywhere.** *"Remove eyebrow text on any
  page, it looks low quality."* Applied across the deck (section labels are now
  plain bold sentence case) and the live site (five instances: home hero
  tagline, cracks-section lead-in, pricing "Founding teams", thanks-page "Early
  access" — removed; the About endorsement line kept its words and lost the
  costume). Now **design-law rule 6**: uppercase+tracked micro-labels, anything
  classed `eyebrow`, and raw uppercase transforms are banned on product
  surfaces. The Parcelrow port of that texture is revoked for this product;
  A5's site-elevation spec updated.
- **R-4D-20 · Verdict: serviceable framework — proceed.** *"Overall, the site
  feels low quality UI, but it is a serviceable first pass at the
  setup/framework. We can proceed, and then do a phased approach at improving
  UI components on a per-page view once everything is setup."* Consequences:
  this deck stands as the IA/structure contract (workstream C builds on it);
  the program **proceeds to the engine (B1–B2 per phase-4 §6)**; a **phased
  per-page UI elevation** is registered as a standing post-setup workstream —
  the open palette question (R-4D-17), the CVD re-step, and per-component
  quality passes ride it.
- PR #8 merged by Andrew alongside this message.

## Sequence from here

1. ~~Andrew picks a direction plate (or hybrid)~~ **Done 2026-08-08: "9" →
   Lantern × Pulse (R-4D-13 above).**
2. ~~Deck v2 rebuilt in that language → re-review~~ **Done: v2.1 accepted as
   the serviceable framework (R-4D-20).**
3. ~~Design law amended by decision-log row~~ **Done** (radius + ✓ carve-out ·
   rule 6 eyebrow ban); palette re-validation not needed (grounds unchanged).
4. **Live: the build proceeds per phase-4 §6** — engine B1–B2 next, then
   workstream C on this deck's structure; **phased per-page UI elevation after
   setup** (palette question + CVD re-step + component passes carried there).
