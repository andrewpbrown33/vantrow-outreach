# Gate 3 — MVP Scope & Cutline

> **DECIDED 2026-08-06 — Andrew ruled in his own words, narrower than every drafted
> option: "the MVP to just be setting up email campaigns that run and track and update
> automatically, ending when replying, pausing with auto replies, and identifying
> bounces etc." Recorded as Option E — Auto-Email Core; precise mapping in the Gate 3
> record (`docs/plan/decision-log.md`). The site-launch acceptance half remains open
> (runbook 06). The options below stand as the historical analysis.**

**Type:** Decision gate (+ site-launch acceptance rides with it).
**Question:** what does the Nudgerow MVP build — exactly?
**Inputs:** the 210-row matrix (`docs/research/outreach/11-copy-priority-matrix.md`,
§3 draft cutline) × customer-#1 requirements
(`docs/research/inputs/customer1-requirements.md`, R1–R9).
**Decides:** the Phase 4 build contract. Phase 3's architecture memos (Gates 4–6)
design against whatever this gate picks.

## How the requirements reshape the draft cutline (applies to every option below)

- **R9 (no telephony/SMS, ever, for customer #1):** the call-task step type collapses
  into a labeled flavor of the generic manual task; **"log external interaction"**
  (a manual note/interaction type on the prospect timeline) is ADDED to the cutline.
  Nothing dials, nothing texts.
- **R4 (cracks view):** a first-class queue surface — **prospects who slipped through:
  finished-sequence-no-reply and stalled enrollments** — ADDED to the task-queue item.
  Small lift (it's a query over states the engine already keeps), real differentiator
  (doc 12 simplicity pillar).
- **R7 (three reports):** the reporting core re-centers on **bounced emails · finished
  sequences · replies**, with sequence-performance drill-down beneath them.
- **R8 (export):** exports ship sequence states, sequence-level metrics, prospect
  lists+states — **never email bodies**. Recorded as a product-privacy stance.
- **R2/R3 (intervals & schedules):** intervals in days+hours; schedules carry time
  windows, holiday skips (in the fixed-defaults ruleset), and stop-on-reply (already
  the engine's exit condition).
- **R1 (limits):** sending limits are deliverability-driven (provider caps, warmup,
  complaint thresholds) — not cost-metering.

## Options

| # | Option | One-line | Verdict |
|---|---|---|---|
| A | Dogfood-minimum | Items 1–10 only: no scheduling tail, no AI assist | Fast, but strips two things customer #1 actually uses |
| B | Refined cutline, faithful | The matrix's 12-item build sequence + the R-adjustments above | **Recommended** |
| C | B + meetings deepened | Add team round-robin/meeting types to item 11 | Over-builds for a solo-founder tenant |
| D | B + dialer-lite | (Historical option) | Dead — R9 removed telephony from the dogfood path entirely; Gate 11 remains only as a future market question |

### A — Dogfood-minimum (items 1–10)

Cut the scheduling tail (11) and AI draft assist (12). **For:** shortest path to a
running engine. **Biggest weakness:** meetings are PEAK's conversion event — dogfood
without a booking link mutilates the loop it's supposed to validate; and AI drafting is
the wedge story (doc 12 W3) — deferring it means dogfooding a product whose
differentiator doesn't exist yet.

### B — Refined cutline, faithful ★

The 12-item build sequence as drafted, with the R-adjustments (cracks view, external
interactions, three-report core, export stance, days+hours intervals, holiday-skip
defaults). Named exceptions stay in (mailbox connection, reply loop, enrollment
engine); named exclusions stay out (branded tracking domains, Reply Agent, sync-error
surfaces). Program overlays alongside: Connect producer green in CI + per-org COGS
from day one. **For:** it is the matrix's own verdict, sanity-checked against all four
hard problems, and every R-requirement lands inside it without scope growth beyond two
small additions. **Biggest weakness:** 12 items is a long MVP — the engine (item 5) and
reply loop (item 7) are the two multi-week hearts, and nothing user-visible ships until
item 8; mitigated by the phase-4 plan sequencing dogfood-visible slices early.

### C — B + meetings deepened

Round-robin, meeting types, team distribution at MVP. **Biggest weakness:** customer #1
is one person — team scheduling has zero dogfood user; the market case (doc 08) ranks
it below the core loop. Fast-follow, not MVP.

## Dogfood-vs-market check (mandatory section)

R9 removes telephony from the *dogfood* path — and the *market* evidence independently
supports an email-first MVP: doc 08's top pains are pricing opacity (P5), sync
reliability (P4), and learning curve (P1) — not "no dialer." The wedge segment can be
won on simple + transparent + deliverable email before voice exists (Gate 11 revisits
with real customers). The cracks view (R4) generalizes: "never let a prospect slip"
is a universal pain, not a PEAK quirk. Where dogfood genuinely narrows us: Affinity-lite
import (item 2) is customer-#1-shaped — the commercial import story stays CSV-first
until Gate 8 picks a CRM. No option above bakes a PEAK-only assumption into the
data model.

### #1 pick: **B — the refined cutline**

It is the only option that ships the differentiators (cracks view, AI-drafted-reviewed
sending, transparent posture) *and* the trust bar (deliverability foundations,
unbypassable suppression) in one coherent sequence, with the two R-additions costing
days, not weeks. A beats it on calendar only by cutting the two features customer #1
touches most after email itself.

> ## Next steps — do these in order
> 1. **Andrew:** decide this gate (A/B/C or a variant) — in chat or on the PR.
> 2. **Agent:** record the Gate 3 block in the decision log; site-launch acceptance
>    evidence attaches here when runbooks 02–06 are executed.
> 3. **Agent:** open Phase 3 (`phase-3-plan.md`) — the three architecture memos
>    (Gate 4 mailbox provider · Gate 5 engine substrate · Gate 6 Connect mapping),
>    each with spike evidence; Microsoft-vs-Gmail first-provider analysis uses the
>    long-lead register clocks + which mailboxes PEAK actually sends from.
> 4. **Andrew (parallel, from runbook 02):** secondary sending domains purchased so
>    warmup clocks start before the engine exists.
