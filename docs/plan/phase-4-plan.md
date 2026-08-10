# Phase 4 Plan — MVP Build

**Opened:** 2026-08-07 · **Ends at:** Gate 7 (dogfood acceptance) · **Contract
sources:** Gate 3 cutline (Option E, Auto-Email Core: matrix items 1–7 + 9 + the
three-report/cracks 10-subset) · Gate 4 (Gmail API first, provider seam mandatory) ·
Gate 5 (Postgres durable timers, once-a-minute sweep, swappable dispatcher seam) ·
Gate 6 (Connect `project` = sequence) · R10 (standalone, brand-level, multi-mailbox)
· R11 (design bar = Parcelrow; audit: `docs/research/family/parcelrow-design-audit.md`).

Phase discipline unchanged: one workstream lands per PR where practical, decision log
rows for anything expensive to reverse, adversarial review with the edge-case mock
dataset before any real tenant, dogfood onboarding last.

---

## §1 — Engine invariants (the correctness contract)

Promised at Gate 5: this section is the contract the CI engine suite enforces. Every
invariant below ships with at least one test that fails when it is violated. The suite
runs against real Postgres (Supabase local) — not mocks — because the claims are
about transactional behavior.

- **I1 · At-most-once dispatch.** A send is dispatched from an outbox row claimed by
  atomic `UPDATE … WHERE state='due' … RETURNING`; two concurrent scheduler ticks can
  never both claim one row. Provider calls carry an idempotency key derived from
  (enrollment, step, attempt-epoch) so a crash between claim and provider-ack cannot
  double-send on retry.
- **I2 · Stop-on-reply beats the queue.** A detected reply cancels every pending
  timer for that prospect × sequence inside one transaction. Race case tested: reply
  arrives while a send for the same enrollment is already claimed — the send must
  abort at the last-line recheck, not go out "because it was already in flight."
- **I3 · Suppression is unbypassable.** The suppression check runs inside the
  dispatch transaction as the final condition, not upstream in planning code. No code
  path — manual send, resume, retry, backfill — can emit to a suppressed address.
- **I4 · Fire-times are timezone-true.** Days+hours intervals, send windows, and
  holiday skips compute in the prospect's (or sequence's) timezone, DST-correct.
  Tests pin the America/New_York spring-forward/fall-back boundaries and a
  window-straddling interval.
- **I5 · Per-mailbox caps defer, never drop.** Daily cap + minimum inter-send gap
  (with jitter) per mailbox; an over-cap send moves to the next legal slot and the
  enrollment records the deferral. Nothing silently disappears.
- **I6 · OOO pauses, never advances.** An auto-reply classified OOO pauses the
  enrollment with a return date and does not count as a reply. Tested against the
  misclassification trap: OOO must never mark a sequence finished-by-reply.
- **I7 · Bounces classify and halt.** Hard bounce → suppress + halt that enrollment +
  surface in the bounce report; soft bounces retry within policy before classifying.
- **I8 · Crash-safe ticks.** The minute sweep is idempotent; a tick that dies
  mid-batch leaves claims that expire (claim TTL) and are re-swept without
  double-sending (combines with I1's idempotency key).
- **I9 · Pause/resume/cancel are total.** State changes take effect against every
  pending timer of the enrollment atomically — no orphan timer fires after a cancel.
- **I10 · Everything leaves a ledger.** Sends, replies, bounces, OOOs, deferrals,
  suppression hits append to the event log; per-org COGS counters increment on every
  provider call from day one (program overlay).

The dispatcher seam (Gate 5): planning/claiming stays in SQL; the executor behind an
interface so a Temporal-class runner can replace the sweep without touching invariants.

---

## §2 — Workstream A: design foundations (R11 — runs FIRST)

Parcelrow's lesson is sequencing: *the mockup deck came before the app UI, and the
design law came as CI.* Nudgerow does the same, adapted to our locked stack (Next +
Tailwind — the laws port; the no-framework architecture does not).

- **A1 · Mockup deck → Checkpoint 4-D (founder review).** One self-contained
  interactive HTML file, `docs/design/mockups/checkpoint-4d-mockups.html`: three
  tabbed views — **Cracks home** (the monitoring view: finished-no-reply + stalled),
  **Sequence detail** (steps, schedule, per-step draft-vs-auto, enrollment states),
  **Sequences board + first-run** (connect mailbox → import → first sequence).
  Working hovers/toggles, `ILLUSTRATIVE DATA` stamps, flanking rationale notes citing
  sources (doc-10 teardown patterns, Parcelrow practices, R-requirements). Andrew
  reviews in a browser before any app UI is built. This is a mid-phase checkpoint,
  not a numbered gate. **Deck v2 (2026-08-08):** rebuilt after the 4-D redlines in
  the picked direction — **Lantern × Pulse** (`deck-v2.html`; plates, pick, and
  resolution in `docs/design/checkpoint-4d-feedback.md`) — Activity feed home,
  sequences overview, sequence detail; its approval is what unlocks workstream C.
- **A2 · Design law as CI.** `tools/check-design-law.sh` on every PR, tuned to
  Clarity Ink: banned typefaces (Inter, Roboto, Open Sans, Poppins, Montserrat,
  DM Sans, Space Grotesk, Playfair), no gradients, no emoji on product surfaces,
  radius and shadow discipline (exact caps set with the deck — Clarity Ink may keep
  a soft radius where Parcelrow chose ≤2px; the *law mechanism* is the port, the
  values are ours), plus the self-test that fails if include globs match nothing.
- **A3 · Two palettes.** Brand chrome (palette F tokens, shipped) stays separate from
  the **state palette**: sequence/enrollment encodings (draft · scheduled · active ·
  paused · replied · finished-no-reply · bounced/suppressed) defined once in
  `packages/brand` as data tokens, AA-checked on both grounds, pinned by a
  check-palette CI step so edits force re-validation. Brand color never encodes
  state; camel never encodes data.
- **A4 · Brand assets cut** (blocked on Andrew's logo pick from
  `docs/brand/logo-mockups.html`): winner lands as
  `packages/brand/assets/{mark,mark-small,mark-dark,icon}.svg` with
  Parcelrow-style construction-law comments; header + favicon swap; wordmark case
  split applied (lowercase lockup / capitalized prose, pending confirm); decision row.
- **A5 · Site elevation.** Rebuild the Phase 2 site's surface to the bar
  (eyebrow/caps micro-label texture is BANNED — R-4D-19, law rule 6; the
  elevation leans on hierarchy, spacing, and the statstrip instead): the
  annotated product-showcase pattern (real screenshots with hotspot pins +
  static legend fallback once app screens exist),
  designed not-available paths, the final-CTA/footer ground shift, family manifest
  markers (footer family bar + Organization JSON-LD with
  `parentOrganization` → Vantrow), voice block + banned-word list
  (`AI-powered`, `revolutionary`, `seamless`, `unlock`, `game-changer`) enforced by
  the site-copy lint.
- **A6 · First-run + failure states as product copy.** Welcome → connect mailbox →
  import → first sequence; distinct human-written auth/connect failure messages
  (Parcelrow's six-message standard); empty states for every list; **demo mode** —
  with no provider keys configured, the app opens seeded with illustrative data so
  the whole product is walkable (also our screenshot source and Playwright fixture).
- **A7 · Provenance as UI.** Everything inferred says so: bounce classification,
  OOO detection with return date, engagement signals — label the inference, show the
  method ("classified from headers", "return date parsed from auto-reply").

## §3 — Workstream B: the engine

Build order follows the dependency chain; §1 invariants are the acceptance bar.

- **B1 · Schema + RLS:** tenants/orgs, prospects, suppression, templates+variables,
  sequences/steps, enrollments, outbox/timers, events, mailboxes (N per org — R10),
  per-org COGS counters. Migration-first; RLS from the first table.
- **B2 · Scheduler + outbox:** the minute sweep (Vercel cron) + claim-and-execute +
  dispatcher seam; I1/I8/I9 tests green before any provider code.
- **B3 · Gmail provider adapter** behind the seam (Gate 4): OAuth connect flow in
  test mode (Andrew's brand mailboxes — getvantrow.com, eaverow.com, parcelrow.com —
  among the ≤100 test users), send, thread-watch for replies, bounce/OOO ingestion.
  The **restricted-scope verification + CASA clock is already running** (long-lead
  register) and gates commercial connections, not dogfood.
- **B4 · Reply/bounce/OOO loop:** classification + I2/I6/I7 behavior + suppression
  writes (I3).
- **B5 · Schedules:** days+hours intervals, windows, holiday-skip defaults,
  timezone/DST (I4); per-mailbox caps (I5).
- **B6 · Import:** CSV + Affinity-lite one-way import with dedupe + suppression
  screen on entry.

## §4 — Workstream C: app surfaces

> **Scaffold + heartbeat LANDED 2026-08-09.** `apps/platform` (second Vercel
> project) with `/api/cron/tick` — the Gate-5 dispatcher made real: inbound
> sync → engine sweep → Connect drain, every minute, CRON_SECRET-gated, jobs
> isolated so one outage can't silence the others, and the response body is
> the tick's own operator report (207 + named errors on partial failure).
> Deploy steps in runbook 08. **Next: the deck v2.1 surfaces themselves**
> (Activity home, Sequences overview, sequence detail) on real data.

Built only after Checkpoint 4-D approves the deck; every view exists in the deck
first. Cracks home · sequences board · sequence builder (auto-email steps primary,
per-step draft-vs-auto control) · sequence detail with enrollment states · prospects
+ import + suppression views · the three reports (bounces, finished, replies) ·
mailbox settings (multi-mailbox, warmup state fields) · external-interaction log
note type (R9) · data export (sequence states, metrics, prospect lists+states —
**no email bodies**, per requirements).

## §5 — Workstream D: Connect producer (Gate 6 applied)

> **LANDED 2026-08-09.** `packages/connect` (mapping · envelope · HMAC
> signing · transactional outbox + delivery worker · `outreach.*` metrics),
> migration 0005, engine emission on every terminal enrollment transition,
> and `docs/specs/vantrow-connect/ADOPTION.md` **generated from the
> producer's own code** (`pnpm connect:adoption`). Producer output is
> validated against the spec's normative JSON Schemas in the test suite —
> the mechanical check Eaverow lacked when it shipped 0%. Remaining:
> `project.created` fires from the sequence-create surface (workstream C),
> and the outbox drain joins the minute cron with the platform scaffold.

`project` = sequence, always populated; status mapping per the gate row
(draft→lead, scheduled→quoted, active/paused→in_progress with detail, finished→
completed, archived→closed, canceled→canceled); `outreach.*` metric/event catalog
incl. `outreach.finished_no_reply`; fixtures green in CI (already wired) + a rendered
adoption doc `docs/specs/vantrow-connect/ADOPTION.md` filled with real emitted
payloads. Context per Andrew: no Vantrow client dashboards exist yet — the dashboard
connection ships later as a **paid add-on per client** (Gate 9 monetization input);
the producer emits from MVP regardless so the contract is proven.

## §6 — Sequencing & checkpoints

1. A1 deck + A2/A3 law-and-palette CI  → **Checkpoint 4-D** (Andrew: deck + logo pick
   + case confirm — one review sitting)
2. B1–B2 (schema, scheduler; invariant tests I1/I8/I9) — **substrate landed
   2026-08-08**: migration `0002_engine_substrate.sql` + `packages/engine`
   (planner I4 · sweep with one-transaction execute+advance · dispatcher seam
   with checkSent crash-recovery). Invariants I1/I2/I3/I5/I8 + RLS isolation
   green against real Postgres (locally via the machine cluster; in CI via a
   postgres:16 service). Still riding: the Vercel cron endpoint + staleness
   alarm (needs the platform app scaffold), I6/I7 reply/bounce/OOO logic (B4).
3. B3–B5 (provider, reply loop, schedules; I2–I7 complete) + D (Connect producer)
   — **B3 landed 2026-08-08** (`packages/engine/src/gmail/`): GmailProvider on
   the seam (deterministic touch Message-ID ⇒ idempotent send + exact
   checkSent via `rfc822msgid:`), OAuth refresh client + `scripts/
   gmail-connect.mjs` + runbook 07 (Andrew's console steps), inbound sync
   (history cursor w/ full-sync fallback) and **B4's core behaviors with it**:
   reply→I2, OOO→I6 incl. planner-routed auto-resume, DSN hard bounce→I7
   suppress+halt, soft bounce recorded. B5's schedule mechanics were already
   in the substrate. Still riding: soft-bounce retry orchestration, D
   (Connect producer), the cron endpoint (platform scaffold).
   **Dogfood LIVE 2026-08-10:** runbooks 07 AND 08 executed — OAuth app in
   test mode, prod Supabase carries migrations 0002–0005 + the dogfood
   bootstrap, **all three brand mailboxes** (getvantrow / eaverow /
   parcelrow) connected and each verified against the live Gmail API, and
   `nudgerow-platform` deployed with the cron authenticating (200s on the
   minute). Inbound sync, the engine sweep, and Connect delivery now run
   unattended in production. R10 is real, not just modeled.
4. A4–A7 + C (brand assets, site elevation, app surfaces on the approved deck)
5. Adversarial functional review on the edge-case mock dataset (the standing list:
   DST straddles, reply-vs-send races, OOO chains, hard-bounce storms, cap
   starvation, suppressed re-imports) — before any real tenant
6. Dogfood onboarding: Andrew's three brand mailboxes connected, first real
   sequences run → **Gate 7 acceptance** (evidence: invariants suite green ·
   Connect producer green + rendered payloads · COGS counters live · a real
   sequence that ran, stopped on reply, and reported)

## §7 — Open items pending Andrew

1. ~~Logo pick + wordmark case confirm~~ **done 2026-08-07** — "the Signal" (G
   flipped), case split applied (decision log).
2. ~~Checkpoint 4-D deck review~~ **closed 2026-08-08**: direction "9" →
   Lantern × Pulse; rounds 4–5 applied; **v2.1 accepted as the serviceable
   framework — proceed** (R-4D-20). Still riding: the "failed" vocabulary
   question; the palette question + CVD re-step (carried by the **phased
   per-page UI elevation** workstream registered for after setup).
3. Google Cloud project access for the Gmail OAuth app (dogfood test mode) when B3
   starts — agent will prepare exact console steps as a runbook.
