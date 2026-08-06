# 02 — Feature Inventory: Sequences

**Prepared:** 2026-08-06 · Phase-1 workstream A · Tier P only in this pass (doc tiered
P+F; F-verification at synthesis). Source IDs resolve in `../sources/sequences.md`.

## Purpose

Sequences are Outreach's core engine: an ordered, multi-channel series of touchpoints
(automated and manual emails, calls, LinkedIn actions, SMS, generic to-dos) that the
platform executes and tracks against enrolled prospects over days or weeks. A sequence
combines content (step templates), timing (intervals or fixed dates, gated by delivery
schedules), policy (rulesets governing enrollment, exclusivity, opt-outs, and reply/OOO
behavior), and per-prospect enrollment state. Its job is to guarantee the right touch
happens at the right time — and to stop touching the moment a prospect replies, bounces,
or opts out. [S-SEQ-001] [S-SEQ-002] [S-SEQ-003]

## Feature table

| Feature | Description (our words) | Who uses it (roles) | Workflow steps | Source refs |
|---|---|---|---|---|
| Sequence object | Named series of steps with per-prospect history and per-step stats; visibility public (org) or private (owner) | Content creator, Rep | Create → add steps → set schedule/ruleset → activate via master toggle | [S-SEQ-001] |
| Step types | Auto email (system-sent), manual email (drafted task), phone call, LinkedIn task (connect / view profile / InMail), generic task; SMS available as a sequence task where the org has texting enabled | Rep executes; Content creator defines | Add step → pick type → attach template/notes → set interval | [S-SEQ-001] [S-SEQ-012] |
| Interval timing | Day-interval sequences for recurring campaigns: each step fires N days after the prior; prospects enrollable anytime; runs on the user's timezone; interval type counts calendar days or schedule (working) days | Content creator | Choose interval type → per-step day offsets | [S-SEQ-001] |
| Date timing | Exact date/time sequences for one-off events (webinars, conferences); creator's timezone; enrollment closes once the date passes | Content creator, Marketing-adjacent users | Set per-step absolute date/time | [S-SEQ-001] |
| Schedules | Admin-defined day/time blocks gating when auto emails deliver and tasks come due; out-of-window steps defer to the next window, shifting later steps; timezone options: prospect TZ (sender fallback), fixed TZ, per-country holiday calendars; US holidays by default | Admin/RevOps defines; sequences consume | Administration > Workflow automations > Schedules → name, owner, time blocks → assign to sequence/steps | [S-SEQ-008] |
| Rulesets | Reusable policy pack per sequence: how often a prospect may be added (once / re-add if inactive / anytime), sequence exclusivity, minimum latency since last contact, unsubscribe-link toggle, per-channel opt-out handling (block+finish vs skip channel steps), automatic stage updates (on add, first contact, bounce, reply, opt-out, finish), OOO pause behavior, engagement-triggered call tasks (open/click thresholds → task with priority), and finish-on-meeting-booked / finish-on-inbound-SMS toggles | Admin/RevOps defines; applies to all enrollments | Create ruleset → configure sections → attach to sequence | [S-SEQ-003] |
| Throttle | Caps newly added prospects activated per 24 h; smooths volume against mailing caps and speeds A/B reads | Content creator, Admin | Sequence settings → set max newly-activated prospects/24 h | [S-SEQ-009] |
| Enrollment states | Ten states per (prospect, sequence): pending, active, paused, paused-OOTO, disabled, failed (hover shows reason), bounced, finished-replied, finished-no-reply, opted-out; prospect counts as in-sequence unless in a terminal finished/opted-out state | Rep monitors; system drives | Enroll → pending/active → step loop → terminal state | [S-SEQ-002] |
| Reply handling | A reply (or answered call) moves the prospect to finished-replied and stops future touches; marketing surface also touts consolidating replies across emails into one thread; ML classifies reply sentiment (positive / objection / referral / unsubscribe / other) | System; Rep reviews | Reply detected → state change → next touch cancelled | [S-SEQ-002] [S-SEQ-011] [S-SEQ-013] |
| OOO auto-pause/resume | OOO auto-replies are detected (paused-OOTO, auto-resume by default); the ML layer extracts the stated return date and resumes around the prospect's actual return, replacing fixed ruleset resume timers; Gmail and Outlook | System; Admin configures via ruleset | OOO reply → classify → extract return date → pause → auto-resume | [S-SEQ-002] [S-SEQ-003] [S-SEQ-010] |
| Multi-recipient sequencing (beta) | Several prospects on one sequenced email with a designated primary recipient (first in To:, badge-marked, reassignable); variables resolve from the primary; separate reply policies for primary vs secondary (finish / pause / continue); Gmail-only orgs; ~5 recipients per account suggested | AE/closer roles per vendor framing | Enroll group → mark primary → set per-recipient reply rules | [S-SEQ-007] [S-SEQ-011] |
| A/B variants | Any auto or manual email step; adding a second template activates the test; variant assignment automatic or manual at enrollment; vendor guidance: one small change, even volumes, ≥150 sends per variant (~100–200 prospects each); subject-only tests read open rate, body-only read reply rate; statistically significant winner flagged in-app | Content creator runs; Reps unaffected | Add 2nd template → enroll → monitor → winner flag → consolidate | [S-SEQ-006] |
| Live-edit constraint | Vendor warns editing a sequence with in-flight prospects can behave inconsistently and is outside best practice; steps added mid-flight ARE executed by upstream prospects; converting a step to a scheduled task resets its due date; step edit rights are permission-gated; cloning exists for safe iteration | Content creator, Admin | Prefer: clone → edit copy → migrate future enrollments | [S-SEQ-004] [S-SEQ-005] |
| Step editing surface | Editable per step: type, interval, schedule, priority (low/high/urgent), notes, skip-when-overdue (admin-enabled); reorder, clone, delete | Content creator | Open step menu → edit/reorder/clone/delete | [S-SEQ-004] |
| Delivery-time checks | At send time the platform re-evaluates every throttle: sequence schedule, user daily/weekly/custom limits, org caps, per-domain and per-prospect thresholds; blocked sends sit visibly delayed with the reason; provider-limit hits auto-retry after 24 h | System; Rep sees delayed state | Due step → throttle evaluation → send or delay+reason | [S-SEQ-014] [S-SEQ-001] |
| Failure/retry | Failed steps (e.g. missing template variables) show a reason and can be retried after the fix; deleting a task pauses the prospect rather than removing the record | Rep, Content creator | Fix cause → retry step | [S-SEQ-002] [S-SEQ-013] |
| Sequence patterns | Vendor vocabulary for library patterns: follow-up sequences (incl. reply follow-up), email bump reminders, the "agoge" heavily-personalized cold pattern; locked sequences = archived/unusable | Content creator | Pick pattern → adapt | [S-SEQ-013] |

## Key workflows

1. **Build and launch an interval sequence.** A content creator creates a sequence,
   picks day-interval type and calendar-vs-schedule-day counting, stacks steps (e.g.
   day-1 auto email → day-3 call → day-5 LinkedIn view → day-8 manual email), attaches
   templates (cloned or linked), assigns a delivery schedule and a ruleset, optionally
   sets a 24 h enrollment throttle, then flips the master toggle. Enrollments start
   pending until the toggle, throttle, and schedule window all allow activation.
   [S-SEQ-001] [S-SEQ-008] [S-SEQ-003] [S-SEQ-009] [S-SEQ-002]
2. **Enrollment lifecycle with reply/OOO.** A rep enrolls a prospect (ruleset permits:
   frequency, exclusivity, latency, opt-out checks). The prospect goes active; each due
   step passes delivery-time throttle checks. A reply exits them finished-replied and
   cancels remaining touches; an OOO reply parks them paused-OOTO with resume timed to
   the extracted return date; a bounce or opt-out terminates the branch; completing all
   steps without response ends finished-no-reply, optionally auto-updating the prospect
   stage. [S-SEQ-003] [S-SEQ-002] [S-SEQ-010] [S-SEQ-014]
3. **A/B test an email step.** The owner adds a second template to step 2 (subject
   changed only), lets automatic assignment split enrollments evenly, waits for ≥150
   sends per variant, reads the winner flag on open rate, then consolidates on the
   winning template. Throttled enrollment keeps the read clean. [S-SEQ-006] [S-SEQ-009]
4. **Change a running sequence safely.** Best practice per vendor guidance: review
   per-step active counts for bottlenecks; rather than editing in place (inconsistent
   in-flight behavior), clone the sequence, adjust the copy, and point new enrollments
   at it — accepting that a step added in place does get executed by upstream
   prospects. [S-SEQ-005] [S-SEQ-004]

## Data touched (cross-ref doc 04, forthcoming)

Sequence · SequenceStep (type, interval, schedule ref, priority, variant templates) ·
Ruleset · Schedule (time blocks, TZ policy, holidays) · SequenceState (per
prospect×sequence: state enum, current step, pause reason) · Prospect (stage, opt-outs,
engagement counters, timezone) · Template/Snippet links · Mailing (per-send record) ·
Task (manual/call/LinkedIn/SMS steps materialize here) · engagement events feeding
scores and A/B stats. [S-SEQ-001] [S-SEQ-002] [S-SEQ-003] [S-SEQ-008]

## Unknowns

1. Exact in-flight semantics of editing or deleting an *existing* step (vs adding one)
   — public docs warn but don't specify outcomes per case.
2. Reply-detection mechanics (header matching vs mailbox-sync inference) — not publicly
   documented; treated in the email doc's unknowns too.
3. Whether SMS/LinkedIn steps appear as first-class picker types in the current step UI
   or only as task-flavored steps — public articles show LinkedIn subtypes and SMS
   tasks, not the full current picker.
4. Throttle scope precision: whether the sequence throttle limits *activations* only or
   also caps concurrent active prospects.
5. Numeric defaults: default schedule windows, default ruleset values, max steps per
   sequence — not published.
6. Whether A/B supports >2 variants per step — public material consistently shows
   two-template framing ("second template activates").

## Completeness checklist

- [x] Every claim carries an S-SEQ ref; snippet-limited rows marked in the fragment
- [x] Step types, interval vs date timing, rulesets, schedules covered
- [x] Multi-stakeholder, reply/OOO auto-pause, A/B, live-edit constraint, enrollment states covered
- [x] Function described, not visual design
- [x] Unknowns filled (6) — no silent guesses
- [x] Zero F- references (Tier-P pass)
- [x] ≤200 lines / ≤4 pages

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
