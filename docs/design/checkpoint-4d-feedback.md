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

## Sequence from here

1. ~~Andrew picks a direction plate (or hybrid)~~ **Done 2026-08-08: "9" →
   Lantern × Pulse (R-4D-13 above).**
2. Deck v2 rebuilt in that language — **built; the checkpoint re-review is the
   live step.**
3. Design law amended by decision-log row — **done (radius + ✓ carve-out)**;
   palette re-validation **not needed** (grounds unchanged).
4. Only then: workstream C (app UI build) — unlocks on deck v2 approval.
