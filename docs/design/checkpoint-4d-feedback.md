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

## Sequence from here

1. Andrew picks a direction plate (or hybrid).
2. Deck v2 rebuilt in that language (feed home, sequences overview → detail,
   collapsible schedule filter, linked entities) → checkpoint re-review.
3. Design law amended by decision-log row if the direction demands it; state
   palette re-validated on the new grounds.
4. Only then: workstream C (app UI build).
