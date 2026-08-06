# 11 — Copy-Priority Matrix (Keystone)

**Prepared:** 2026-08-06 · Phase-1 synthesis. **Tier:** — (synthesis; every row traces to a
`02-feature-inventory/` doc; no new sources). **Inputs:** all 14 module docs under
`02-feature-inventory/`, doc 08 (value anchors), doc 09 (gate axis), doc 04 (engine lift
calibration), doc 14 (deliverability lift calibration), `docs/plan/hard-problems.md`,
`docs/plan/long-lead-register.md`. **Feeds:** Gate 3 MVP-cutline memo; every later build phase.

---

## §1 Scoring model

**Value (1–5)** — revenue/retention impact, anchored to doc 08 (review mining):
- **5** = core-loop table stakes OR a documented churn/switch driver (P/L ID cited).
- **4** = strong daily use / repeatedly requested in reviews.
- **3** = valued by a meaningful segment.
- **2** = nice-to-have / low evidence.
- **1** = not a build item (constraint, framing, or vendor-ops row).

The **Anchor** column cites the doc-08 pain (P1–P8) or praise (L1–L6) ID wherever one exists;
`—` = no direct review evidence (value then rests on core-loop logic, doc-14 rules, protocol
§10 mandates, or market-landscape norms — flagged in §5).

**Build-lift (1–5)** — on OUR stack (pnpm monorepo, Next.js 16 on Vercel serverless, Supabase
Postgres+RLS+Auth+Storage, Resend for product mail, adapter-pattern stores, Vercel cron;
mailbox OAuth is new; **no Temporal/queue infra assumed**):
**1** = days · **2** = ~1 week · **3** = 2–4 weeks · **4** = 1–2 months · **5** = 3+ months.
Rows touching the four hard problems (engine correctness, deliverability, CRM sync, tenant
fairness) carry honest, higher lifts. Sequence sends go through the *customer's* mailbox
(doc 14), not Resend — Resend covers only our transactional mail.

**Gate** — from doc 09, compact tokens: **NONE** (no third party) · **OPEN** (= OPEN-API,
self-serve credentials) · **VER** (= VERIFICATION-REQUIRED) · **PARTNER** (= PARTNER-REQUIRED)
· **PROHIB** (= PROHIBITED). **Best-available-path rule:** the gate column reflects the best
OPEN path to a credible version of the feature — e.g. CSV import is NONE even though native
CRM sync is higher-gated; manual LinkedIn tasks are NONE even though LinkedIn automation is
PROHIBITED. Partner-only expansions get their own rows in §4 (they are doc-09 surfaces, not
doc-02 features, so they are kept out of the §2 reconciliation count).

**Prioritization rule (verbatim):**

> "No single composite number: sort by value desc, then lift asc. PARTNER-REQUIRED and
> PROHIBITED are hard vetoes for MVP v1 regardless of value. The cutline applies value ≥ 4,
> lift ≤ 3, gate ∉ {PARTNER-REQUIRED, PROHIBITED}, with named exceptions justified inline."

**Markers used in Notes:** `MVP` (passes cutline, in build sequence) · `MVP-EXC` (in MVP as a
named exception despite failing a criterion) · `v1.1` (fast-follow) · `v2+` (waits) ·
`Gate N` (blocked on that decision gate) · `DUP → module` (cross-module duplicate).

**Duplicates rule:** cross-module duplicates are kept for auditability, scored **identically**,
and point at the canonical module. Nine dup rows exist (listed in the Reconciliation note).

---

## §2 The matrix (by module, directory order)

### 2.1 admin-governance (16 rows)

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| User Roles (hierarchy) | 3 | — | 3 | NONE | v2+; MVP = flat admin/member |
| Hierarchy access models | 3 | — | 3 | NONE | v2+; rides role tree |
| Governance Profiles | 3 | — | 3 | NONE | v2+; profile sprawl is a P2 driver for them — ours stays minimal |
| Notable profile switches | 2 | — | 3 | NONE | v2+ |
| Record- + field-level control | 2 | — | 4 | NONE | v2+ enterprise |
| Teams | 3 | — | 2 | NONE | v1.1 simple groups |
| Content governance (Collections) | 2 | — | 3 | NONE | v2+ |
| Ownership/share tiers | 3 | — | 2 | NONE | basic private/shared flag rides MVP content CRUD; tier UI v1.1 |
| Reserved Public collection | 2 | — | 1 | NONE | v2+ with collections |
| Data residency | 2 | — | 3 | NONE | single-region MVP; EU option v2+ |
| Data retention | 3 | — | 3 | NONE | v2 (GA compliance posture, Gate 10) |
| Recording consent | 3 | — | 3 | NONE | DUP → conversation-intelligence (consent page); v2+ |
| Kaia access permissions | 2 | — | 4 | NONE | DUP → conversation-intelligence (permissions & redaction); v2+ |
| Email compliance controls | 5 | — | 2 | NONE | DUP → email-deliverability (opt-out + auth rows); MVP there |
| AI autonomy limits | 3 | — | 4 | NONE | v2 full suite; per-step opt-in subset is MVP (see ai-agents autonomy controls) |
| Admin experience management | 1 | — | 3 | NONE | not a build item |

### 2.2 ai-agents (19 rows)

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Revenue Agent (ex AI Prospecting) | 3 | — | 5 | OPEN | v2+ (Gate 15); enrichment via self-serve vendors |
| Research Agent | 3 | — | 4 | NONE | v2; public-web + first-party grounding |
| Meeting Prep / Conversation Agent | 3 | — | 3 | NONE | v1.1 candidate; needs activity corpus |
| Deal Agent | 2 | — | 5 | NONE | v2+; needs CI + CRM sync first |
| Personalization Agent | 4 | L1 | 3 | NONE | MVP as review-first AI draft assist — the AI-native thesis feature |
| Expansion Agent | 2 | — | 4 | NONE | v2+ |
| Reply Agent | 4 | L1 | 3 | NONE | v1.1 EXCLUSION: passes cutline; needs live reply corpus first (§3) |
| Forecast/analytics assists | 1 | — | 4 | NONE | v2+; rides forecasting module |
| Omni | 3 | — | 5 | NONE | v2+ (Gate 15) |
| Omni surfaces (web/Slack/mobile) | 2 | — | 4 | OPEN | v2+; Slack app self-serve |
| Agent Studio | 3 | P8 | 5 | NONE | v2+; the at-scale answer to "automation holes" |
| Agent Studio templates | 2 | — | 2 | NONE | v2+; after Studio |
| Knowledge grounding | 3 | — | 3 | NONE | v1.1 (Supabase Storage + retrieval) |
| Autonomy controls | 4 | — | 2 | NONE | MVP subset: per-step draft-vs-auto + org AI toggle (protocol §10) |
| Brand-voice safeguards | 2 | — | 3 | NONE | v2 |
| AI credit metering | 3 | P5 | 2 | NONE | internal per-org COGS metering is MVP (hard-problems mandate); customer usage view v1.1 |
| MCP Server | 3 | — | 3 | NONE | v1.1/v2 positioning play |
| MCP Client + marketplace | 2 | — | 5 | OPEN | generic client OPEN; curated partner marketplace → §4 (PARTNER) |
| ChatGPT app / Codex context | 1 | — | 4 | PARTNER | VETO v1; not in doc-09 — conservative pending screen |

### 2.3 conversation-intelligence (19 rows)

Whole module waits: unlicensed (Tier P), Gate 13 buy-vs-build, depth-first rule. Lifts assume
the buy path (vendor bot/STT) per the Gate 13 framing.

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Meeting capture (bot) | 3 | L6 | 4 | VER | v2+ (Gate 13); Zoom/Meet/Teams gates → §4 |
| Platform coverage | 2 | — | 4 | VER | v2+; Teams gate heaviest (doc-09 #19) |
| Live transcription & languages | 2 | L6 | 4 | VER | v2+; vendor STT |
| English-only AI features | 1 | — | 1 | NONE | constraint row, not a build item |
| Live content cards | 2 | — | 5 | VER | v2+ |
| Live action items, notes, bookmarks | 2 | — | 4 | VER | v2+ |
| Post-meeting summary | 3 | L6 | 3 | NONE | v2+; upload-path summaries need no bot gate |
| Topics & Reactions | 2 | — | 4 | NONE | v2+; corpus-dependent |
| AI Topics Explorer | 2 | — | 4 | NONE | v2+ |
| Kaia Chat & sharing | 2 | — | 3 | NONE | v2+ |
| Playlists | 2 | — | 2 | NONE | v2+ |
| Smart Kaia Coach | 2 | — | 5 | NONE | v2+ |
| Coach Card report | 2 | — | 3 | NONE | v2+; after coach |
| One-sided recording | 2 | — | 3 | VER | v2+; consent-constrained capture |
| Recording consent page | 3 | — | 3 | NONE | canonical for admin dup; precondition when CI ships |
| Permissions & redaction | 2 | — | 4 | NONE | canonical for admin dup; v2+ |
| CRM sync of recordings | 2 | — | 3 | OPEN | v2+ |
| Ingestion & auth controls | 2 | — | 3 | VER | v2+ |
| Translations & mobile | 1 | — | 4 | NONE | v2+ |

### 2.4 crm-sync (12 rows)

Hard problem 3 governs: **MVP = one-way import (CSV + Affinity-lite, doc-09 #11 OPEN)**;
two-way sync is its own phase behind Gate 8 with a mandatory reconciliation sweep.

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| First-class CRM connections | 4 | L4 | 5 | OPEN | Gate 8 (Phase 5); MVP path = one-way import; AppExchange listing → §4 |
| Object sync | 4 | L4 | 5 | OPEN | Gate 8; hard problem 3 |
| Inbound polling | 3 | — | 3 | OPEN | Gate 8; Vercel cron fits |
| Outbound batching | 3 | — | 3 | OPEN | Gate 8 |
| Per-object configuration tabs | 3 | — | 3 | OPEN | Gate 8 |
| Field mapping UX | 4 | P4 | 3 | NONE | MVP subset: CSV-import mapping + dupe keys (email/external_id); native-sync mapping Gate 8 |
| Conflict-resolution layer | 4 | P4 | 5 | OPEN | Gate 8; account-ending if wrong (hard problem 3) |
| Sequence/engagement status → CRM | 3 | L4 | 3 | OPEN | Gate 8 |
| Sync-error surfaces | 4 | P4 | 3 | OPEN | Gate 8 EXCLUSION: passes cutline but rides two-way sync; import-run error report ships with MVP CSV import |
| User sync (Dynamics) | 2 | — | 3 | OPEN | v2+ (Gate 14 family) |
| Support-gated enablement (Dynamics) | 1 | — | 1 | NONE | their ops anti-pattern; we stay self-serve (P2) |
| HubSpot path | 3 | — | 4 | OPEN | Gate 14 (second CRM); listing/cert → §4 |

### 2.5 dialer-voice (11 rows)

Whole module waits (Gate 11, unlicensed). MVP path for calling: **manual call tasks + outcome
logging (NONE)** inside sequences/tasks; L6 praise says telephony matters eventually.

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Browser softphone window | 3 | L6 | 4 | OPEN | Gate 11; Twilio SDK; SHAKEN clock → §4 |
| Click-to-call | 3 | L6 | 2 | OPEN | Gate 11; after softphone |
| Dialing modes (computer vs phone) | 2 | — | 3 | OPEN | Gate 11 |
| Local Presence caller-ID rotation | 3 | — | 4 | VER | Gate 11; needs SHAKEN A-attestation to be credible |
| Call recording | 3 | — | 3 | OPEN | Gate 11; consent controls required |
| Dispositions & call purposes | 3 | — | 2 | NONE | manual call-task outcome logging is MVP; admin taxonomies Gate 11 |
| Voicemail drop | 2 | — | 4 | OPEN | Gate 11; pre-recorded-VM consent rules |
| Sequential dialing | 2 | — | 4 | OPEN | Gate 11 |
| In-call controls | 2 | — | 3 | OPEN | Gate 11 |
| Inbound handling | 2 | — | 4 | OPEN | Gate 11 |
| Number management | 2 | — | 3 | OPEN | Gate 11 |

### 2.6 email-deliverability (19 rows)

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Templates | 5 | L1 | 2 | NONE | MVP |
| Snippets | 3 | — | 1 | NONE | v1.1 |
| Variables / merge fields | 5 | L1 | 2 | NONE | MVP |
| Conditional logic | 3 | — | 2 | NONE | v1.1 |
| Comment variables (send-block) | 3 | — | 1 | NONE | v1.1; cheap personalization enforcer |
| Missing-variable failure | 4 | P8 | 1 | NONE | MVP; visible fail + retry, never silent |
| A/B testing | 3 | — | 3 | NONE | DUP → sequences (A/B variants); v1.1 |
| Open tracking | 4 | L5 | 2 | NONE | MVP; ship their honest weak-signal caveats |
| Click tracking | 4 | L5 | 2 | NONE | MVP |
| Reply tracking & threading | 5 | L5, P4 | 4 | VER | MVP-EXC (lift 4, mailbox scopes): core loop; doc-14 §6 header discipline |
| Mailbox connection — Gmail | 5 | L4 | 4 | VER | MVP-EXC: Gate 4 picks ONE provider; CASA clock → §4; dogfood on test users |
| Mailbox connection — O365 | 5 | L4 | 4 | VER | MVP-EXC: Gate 4; loser → Gate 12; publisher-verification clock → §4 |
| Send limits & safeguards | 5 | — | 3 | NONE | MVP; doc-14 budgets — provider caps are circuit-breakers, not targets |
| Delivery scheduling & delay states | 4 | P8 | 3 | NONE | MVP; visible delay reasons (their send-later failures are a named pain) |
| Authentication guidance | 5 | — | 2 | NONE | MVP; verify SPF/DKIM/DMARC in-product, refuse unverified domains (doc 14) |
| Warmup & volume guidance | 4 | — | 2 | NONE | MVP; warmup state on Mailbox from first migration (hard problem 2) |
| Hygiene & content guidance | 3 | — | 2 | NONE | v1.1 lint; full monitoring Phase 5 |
| Branded URLs / custom tracking domain | 4 | — | 3 | NONE | v1.1 EXCLUSION: passes cutline; deferred to Phase 5 trust bar — dogfood volume too small to burn reputation |
| Opt-out handling | 5 | — | 2 | NONE | MVP; unbypassable suppression + RFC 8058 one-click (protocol §10) |

### 2.7 forecasting (16 rows)

Whole module waits: unlicensed, breadth-waits rule; every row presupposes the Gate-8
CRM opportunity mirror (hence OPEN).

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Forecast submission | 2 | — | 3 | OPEN | v2+ |
| Automated rollup & hierarchy | 2 | — | 4 | OPEN | v2+ |
| Multiple named forecasts | 1 | — | 3 | OPEN | v2+ |
| AI projection | 2 | — | 5 | OPEN | v2+ |
| Scenario Planner | 2 | — | 5 | OPEN | v2+ |
| Smart Forecast Assist | 1 | — | 5 | OPEN | v2+ |
| Snapshots & history | 2 | — | 3 | OPEN | v2+ |
| Point-in-time analytics | 2 | — | 4 | OPEN | v2+ |
| Forecast Movement | 1 | — | 4 | OPEN | v2+ |
| Deal drill-down | 2 | — | 3 | OPEN | v2+ |
| Risk signals | 2 | — | 4 | OPEN | v2+ |
| Multi-currency | 2 | — | 3 | OPEN | v2+ |
| Line-item forecasting | 1 | — | 4 | OPEN | v2+ |
| Intraquarter modeling | 1 | — | 5 | OPEN | v2+ |
| Mobile forecasting | 1 | — | 3 | NONE | v2+ |
| Outcomes / win-loss reporting | 2 | — | 4 | OPEN | DUP → opportunities-deals (Outcomes reporting); v2+ |

### 2.8 meetings-scheduling (10 rows)

Calendar scopes are the light verification tier (Google sensitive ≈10 days, no CASA; Graph
calendar rides the same Gate-4 app registration).

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Meeting types | 3 | — | 2 | NONE | v1.1; one minimal type rides MVP booking |
| Team distribution: manual / round-robin | 2 | — | 3 | NONE | v2 |
| Round-robin counting rules | 2 | — | 2 | NONE | v2 |
| Public booking links | 4 | — | 3 | VER | MVP tail; the conversion event |
| Team booking links | 2 | — | 2 | VER | v2; after team types |
| Insert availability into emails | 4 | — | 2 | VER | MVP tail; the sequence CTA |
| Book from records | 3 | — | 2 | VER | v1.1 |
| Availability windows & book-on-behalf | 3 | — | 2 | VER | windows subset rides MVP booking; on-behalf v2 |
| Live handoff scheduling | 2 | — | 2 | VER | v2 |
| Calendar integration | 4 | — | 3 | VER | MVP tail; provider #1 rides the Gate-4 app |

### 2.9 mobile (11 rows)

MVP posture: **responsive web, no native apps** (their own 3.6★ store rating warns that thin
ports disappoint). Rows scored as native-app builds.

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Task list (mobile) | 2 | — | 4 | NONE | v2+; responsive web covers |
| Voice calling (mobile) | 1 | — | 5 | OPEN | v2+; rides Gate 11 |
| Email (mobile) | 2 | — | 4 | NONE | v2+ |
| Meetings (mobile) | 1 | — | 4 | NONE | v2+ |
| Kaia recording playback | 1 | — | 4 | NONE | v2+; rides Gate 13 |
| Search & Smart Views | 2 | — | 3 | NONE | v2+ |
| SMS (mobile) | 1 | — | 4 | VER | v2+; A2P registration |
| Omni assistant (mobile) | 1 | — | 4 | NONE | v2+ |
| Calendar & forecast views | 1 | — | 3 | NONE | v2+ |
| Auth & platform facts | 1 | — | 1 | NONE | facts row, not a build item |
| Deliberate exclusions | 1 | — | 1 | NONE | scope-boundary row; validates web-first posture |

### 2.10 opportunities-deals (18 rows)

Whole module waits: unlicensed; CRM-mastered layer — everything presupposes the Gate-8
opportunity mirror.

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Editable deal grid | 3 | — | 4 | OPEN | v2+ (post Gate 8) |
| Commit deals view | 2 | — | 3 | OPEN | v2+ |
| Deal Health score | 2 | — | 5 | OPEN | v2+; needs data scale |
| Deal Health trends & factors | 2 | — | 4 | OPEN | v2+ |
| Deal Overview | 3 | — | 3 | OPEN | v2+ |
| Opportunity editing | 3 | P4 | 3 | OPEN | v2+; write-back = hard problem 3 |
| Topics (deal level) | 2 | — | 4 | NONE | v2+; rides CI corpus |
| Deal Agent | 2 | — | 5 | NONE | DUP → ai-agents (Deal Agent); v2+ |
| Deal Agent autonomy config | 2 | — | 2 | NONE | config surface of ai-agents Deal Agent; v2+ |
| Deal Alerts | 2 | — | 3 | OPEN | v2+ |
| Mutual action plans (Success Plans) | 2 | — | 4 | NONE | v2+ |
| Methodology templates | 2 | — | 2 | NONE | v2+ |
| Plan engagement tracking | 2 | — | 3 | NONE | v2+ |
| Pipeline dashboard & movement | 2 | — | 4 | OPEN | v2+ |
| Coverage modeling | 1 | — | 4 | OPEN | v2+ |
| Scorecards & win/loss modeling | 2 | — | 4 | OPEN | v2+ |
| Outcomes reporting | 2 | — | 4 | OPEN | canonical for forecasting dup; v2+ |
| Field-level opportunity governance | 2 | — | 4 | OPEN | v2+ |

### 2.11 prospecting-data (10 rows)

Whole module waits: unlicensed, Amplify-tier autonomous prospecting; MVP ships no data product.

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Signal synthesis | 2 | — | 5 | OPEN | v2+; ZoomInfo signals → §4 (PARTNER) |
| Account research summaries | 3 | — | 3 | NONE | v1.1 candidate; public web + LLM |
| ICP / persona targeting | 2 | — | 3 | NONE | v2+ |
| Sales-motion coverage | 1 | — | 2 | NONE | framing row, not a build item |
| Net-new contact sourcing | 3 | — | 4 | OPEN | v2+; self-serve enrichment first; ZoomInfo → §4 |
| Drafting & personalization | 4 | L1 | 3 | NONE | DUP → ai-agents (Personalization Agent); MVP there |
| Autonomy levels | 4 | — | 2 | NONE | DUP → ai-agents (autonomy controls); MVP subset there |
| Throughput & guardrails | 3 | — | 2 | NONE | v2+ with agent; MVP engine throttles cover the need |
| Monitoring & attribution | 2 | — | 3 | NONE | v2+ |
| Agent-family context | 1 | — | 1 | NONE | context row, not a build item |

### 2.12 reporting-analytics (16 rows)

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Report catalog | 3 | P6 | 2 | NONE | our v1 ships 2–3 focused reports, not a catalog |
| Sales Execution report | 3 | — | 3 | NONE | v1.1 |
| Team Performance suite | 3 | — | 4 | NONE | v2 |
| Team Activity report | 3 | — | 3 | NONE | v1.1 |
| Sequence Performance report | 4 | P6, L1 | 3 | NONE | MVP; the product's proof surface |
| Step-level drill-down | 4 | P6 | 2 | NONE | MVP; "where engagement dies" |
| Pipeline Generation report | 2 | — | 3 | NONE | v2 |
| Custom layouts | 3 | P6 | 4 | NONE | v2 |
| History window | 2 | — | 2 | NONE | posture: no artificial caps (vs their 180-day/16-month limits) |
| Refresh cadence | 3 | P6 | 1 | NONE | live-SQL posture beats their 24 h refresh lag for free at our scale |
| Exportability | 4 | P6 | 1 | NONE | MVP; CSV export everywhere |
| Meeting attribution | 3 | — | 3 | NONE | v1.1 |
| Revenue attribution | 3 | — | 4 | OPEN | v2 (post Gate 8) |
| Outcomes / win-loss view | 2 | — | 3 | NONE | v2 |
| Team-history semantics | 2 | — | 2 | NONE | design-in: membership-at-activity-time from day 1 |
| Reporting governance | 2 | — | 3 | NONE | v2 |

### 2.13 sequences (17 rows)

The core module (L1 = most-cited strength, 15/18). Engine rows carry hard-problem-1 lifts.

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Sequence object | 5 | L1 | 3 | NONE | MVP |
| Step types | 5 | L1 | 3 | NONE | MVP: auto/manual email + call/generic task; LinkedIn = manual task only (automation PROHIB → §4); SMS deferred (VER) |
| Interval timing | 5 | L1 | 3 | NONE | MVP; TZ/DST correctness in the CI suite |
| Date timing | 3 | — | 2 | NONE | v1.1 |
| Schedules | 4 | L1 | 3 | NONE | MVP; send windows + TZ policy |
| Rulesets | 4 | L1 | 4 | NONE | MVP-EXC as fixed sane defaults (lift 2 subset); reusable policy packs v1.1 |
| Throttle | 4 | — | 2 | NONE | MVP |
| Enrollment states | 5 | L1 | 4 | NONE | MVP-EXC (lift 4): the engine itself — hard problem 1; no product without it |
| Reply handling | 5 | L1 | 4 | VER | MVP-EXC: reply race-cancel is a Gate 7 acceptance row |
| OOO auto-pause/resume | 4 | L1 | 3 | VER | MVP: classify + pause (OOO ≠ reply test); return-date resume v1.1 |
| Multi-recipient sequencing (beta) | 2 | — | 4 | NONE | v2+ |
| A/B variants | 3 | — | 3 | NONE | canonical (email dup points here); v1.1 |
| Live-edit constraint | 4 | P8 | 3 | NONE | MVP: clone-first + safe-edit guards — fix their documented footgun |
| Step editing surface | 4 | L1 | 2 | NONE | MVP |
| Delivery-time checks | 5 | — | 3 | NONE | MVP; suppression re-check inside the send transaction (protocol §10) |
| Failure/retry | 4 | P8 | 2 | NONE | MVP; visible reasons, answerable in seconds (hard problem 4) |
| Sequence patterns | 2 | — | 2 | NONE | v1.1 library nicety |

### 2.14 tasks-workflow (16 rows)

| Feature | Value | Anchor | Lift | Gate | Notes |
|---|---|---|---|---|---|
| Task object & types | 5 | L2 | 2 | NONE | MVP |
| Task attributes | 4 | L2 | 2 | NONE | MVP |
| Task origins | 4 | L2 | 2 | NONE | MVP; provenance answers "why is this here" (hard problem 4) |
| Prioritized task list | 5 | L2 | 3 | NONE | MVP |
| Engagement-scored prioritization | 3 | L2 | 2 | NONE | v1.1; simple 1/2/3 weights |
| 360-dashboard due queue | 4 | L2 | 3 | NONE | MVP |
| Task flow (focused mode) | 4 | L2 | 3 | NONE | MVP; the loved play-mode loop |
| Universal task flow (extension) | 2 | P3 | 5 | NONE | v2+ decision; their extension is the 3.0★ liability — web-first instead |
| Urgent-task alerts | 3 | — | 2 | NONE | v1.1 |
| Completion semantics | 5 | L2 | 3 | NONE | MVP; complete→advance in one transaction; delete = pause, never skip |
| Bulk operations | 3 | — | 2 | NONE | v1.1 |
| Triggers (admin rules engine) | 3 | P8 | 4 | NONE | v2; simple event→action subset v1.1 |
| Trigger actions | 3 | P8 | 3 | NONE | v2; after triggers |
| Trigger ownership resolution | 2 | — | 3 | NONE | v2 |
| Playbooks | 1 | — | 1 | NONE | positioning concept, not a build item |
| Out-of-office handling | 4 | L1 | 3 | VER | DUP → sequences (OOO auto-pause/resume); MVP there |

---

## §3 DRAFT MVP cutline (DRAFT — decided at Gate 3)

**Cutline size: 42 canonical rows** — mechanically, the rows whose Notes cell *begins* with
`MVP` (plain, `-EXC`, `subset`, or `tail`) — plus 4 dup rows riding their canonicals
("MVP there"), 46 rows referencing inclusion in all; the two mailbox rows count as two matrix
rows but Gate 4 builds exactly one provider.
**Named exceptions IN** (fail a criterion, included): mailbox connection Gmail/O365 (lift 4 +
VER — there is no product without a sending mailbox; dogfood runs on test-mode/tenant-consent
while §4 clocks run), reply tracking & threading (lift 4 + VER — the loop's exit condition),
enrollment states (lift 4 — the engine), reply handling (lift 4 + VER — Gate 7 acceptance),
rulesets (lift 4 full scope — MVP ships the fixed-defaults subset at lift 2).
**Named exclusions OUT** (pass, deferred): branded tracking domains (Phase 5 trust bar),
Reply Agent (needs a live reply corpus), sync-error surfaces (rides Gate 8 two-way sync;
import-run errors still surface at MVP).

### Build sequence (each item assumes the ones before it)

1. **Tenant + people substrate** — Workspace/`org_id` on every table + Postgres RLS with the
   membership predicate from migration 1 (hard problem 4); Contact/Company model with
   per-channel opt-outs; org-wide suppression tables. *(opt-out handling storage; task/people substrate)*
2. **One-way import** — CSV import with field mapping, dupe keys (email/external_id), and an
   import-run error report; Affinity-lite pull for dogfood (doc-09 #11, OPEN). CRM = import
   only at MVP (hard problem 3). *(field mapping UX subset)*
3. **Content** — templates + variables/merge fields with missing-variable validation; basic
   private/shared flag. *(templates; variables; missing-variable failure)*
4. **Sequence builder** — sequence object, step types (auto/manual email, call task, generic
   task, LinkedIn manual task), interval timing, step editing, clone-first safe-edit guards,
   per-step draft-vs-auto control (protocol §10). *(sequence object; step types; interval; step editing; live-edit; autonomy controls)*
5. **The engine** — enrollment state machine on Postgres durable timers: claim-and-execute
   (`FOR UPDATE SKIP LOCKED`), idempotency touch-ledger, execute+advance in one transaction,
   final in-transaction pause/suppression re-check; schedules/send-windows with TZ/DST;
   three-layer throttles (sequence/mailbox/org) + per-tenant fairness partitioning; visible
   delay states + failure/retry with reasons. Engine-correctness CI suite lands here
   (hard problems 1, 2, 4). *(enrollment states; schedules; throttle; delivery-time checks; delivery scheduling & delay states; failure/retry; rulesets-as-defaults)*
6. **Mailbox provider #1 (Gate 4 decision)** — OAuth connect + send path through the
   customer's mailbox; per-mailbox daily budget + paced sending with jitter; warmup state on
   the Mailbox entity honored by the throttler; DNS auth verification (SPF/DKIM/DMARC) at
   domain onboarding, refuse-to-send on unverified domains; RFC 8058 one-click unsubscribe
   headers on every sequence email (hard problem 2 foundations inside MVP). *(mailbox connection ×1; send limits; auth guidance; warmup; opt-out enforcement)*
7. **Reply/bounce/OOO loop** — mailbox sync; Message-ID persistence + In-Reply-To/References
   threading (doc-14 §6); reply detection → in-transaction race-cancel of the next touch;
   bounce classification; OOO-classified-not-replied → pause; unsubscribe processed to
   suppression in minutes. *(reply tracking & threading; reply handling; OOO auto-pause)*
8. **Task queue** — task object/attributes/origins, prioritized task list, due queue on the
   rep home, focused task flow, completion semantics advancing enrollments in-transaction.
   *(all seven MVP task rows)*
9. **Engagement telemetry** — open/click tracking endpoints + the append-only engagement
   event stream and counters (hard problem 4 observability). *(open tracking; click tracking)*
10. **Reporting core** — sequence performance + step-level drill-down as live SQL views;
    CSV export. *(sequence performance; drill-down; exportability; refresh-cadence posture)*
11. **Scheduling tail** — calendar connect (rides the Gate-4 app registration), availability
    windows, personal booking link, insert-availability into emails; booked-meeting →
    sequence-finish default. *(calendar integration; booking links; insert availability)*
12. **AI draft assist** — review-first sequence/email drafting via the Anthropic SDK, AI
    content labeled, per-step opt-in enforced for any auto-send; per-org LLM COGS metered
    internally. *(Personalization Agent; AI credit metering internal subset)*

Program overlays built alongside (program-plan mandates, not doc-02 rows): Vantrow Connect
producer with `outreach.*` fixtures green in CI; per-org COGS instrumentation from day one.

**Hard-problem sanity check:** engine (item 5) lands before any channel (6–7) ✓ ·
deliverability foundations (auth verification, warmup state, budgets, one-click unsub,
suppression) are inside MVP at items 1/5/6/7 ✓ · CRM is one-way import only (item 2), two-way
waits for Gate 8 ✓ · tenant fairness: RLS in item 1, fairness partitioning + observable
pipeline in items 5/9 ✓.

### v1.1 fast-follow

Snippets · conditional logic · comment-variable send-block · date-timing sequences · full
ruleset editor (reusable policy packs) · OOO return-date extraction + smart resume · A/B
variants · sequence patterns/library · engagement-scored prioritization · urgent-task alerts ·
bulk task operations · simple trigger subset (event→action) · Team Activity + Sales Execution
reports · meeting attribution · meeting types + book-from-records · branded tracking domains ·
hygiene lint + bounce monitoring (Phase 5 formalizes) · Reply Agent · knowledge grounding ·
account research summaries · customer-facing usage/COGS view · teams (simple groups) ·
share-tier UI · Meeting Prep agent · MCP Server.

### Waits (v2+), by blocking gate

- **Gate 8 / Phase 5 (CRM):** first-class connections, object sync, polling, batching,
  conflict resolution, sync-error dashboard, per-object config, status write-back, revenue
  attribution; then HubSpot/Dynamics at Gate 14.
- **Gate 11 (telephony):** all 11 dialer rows; SMS step type (A2P); mobile voice.
- **Gate 13 (conversation intelligence):** all 19 CI rows + admin consent/permission dups +
  deal-level Topics.
- **Gate 15 (agent autonomy):** Revenue/Research/Deal/Expansion agents, Omni + surfaces,
  Agent Studio + templates, brand-voice safeguards, MCP client marketplace.
- **No gate, deliberately later:** forecasting module (all 16 rows), opportunities/deals layer
  (18 rows), native mobile apps, browser extension (web-first posture, P3 lesson), custom
  report layouts, Team Performance suite, role hierarchies/profiles/collections/field-level
  governance, data residency options, retention policies (Gate 10 compliance posture),
  multi-recipient sequencing.

---

## §4 Gated roadmap

Rule: **"Engineering waits; the clocks do not."** Every VER item starts when its trigger
phase is *plannable* (long-lead-register rule), not when code needs it. PARTNER rows are
MVP-vetoed and only enter via their own gate memos.

| # | Gated surface (doc-09 ref) | Features gated | Clock | Long-lead-register cross-ref / start |
|---|---|---|---|---|
| G1 | Gmail restricted scopes + CASA (#1) | Gmail mailbox connect, Gmail-side reply sync | Brand verify 2–3 d → restricted review (weeks) → CASA (annual, ≈$500–1k+/yr) | Register "Google OAuth verification"; start Phase 3 if Gmail wins Gate 4; dogfood ≤100 test users meanwhile |
| G2 | Microsoft publisher verification (#3–4) | O365 mailbox connect, Graph calendar | Days–weeks; free; needs CPP account | Register "Microsoft publisher verification"; Gate 4 memo drafts the app registration; dogfood = tenant-admin consent |
| G3 | Google Calendar verification (#2) | Booking links, availability, calendar sync | ≈10 days; sensitive tier, no CASA | Rides G1's Google review; add to register at Gate 4 |
| G4 | A2P 10DLC (#13) | SMS step type, mobile SMS | Weeks; brand+campaign vetting, monthly fees, per-tenant onboarding to productize | Register "A2P 10DLC"; start only when SMS enters scope (Gate 11 family) |
| G5 | STIR/SHAKEN attestation (#14) | Dialer answer rates, Local Presence credibility | KYC via Trust Hub; days–weeks; per-tenant | Register (with A2P row); Gate 11 |
| G6 | Salesforce AppExchange review (#6) | SFDC distribution + Professional-edition revenue | $999/attempt; months; periodic re-review | Register "AppExchange security review"; start only if Gate 8 picks Salesforce |
| G7 | HubSpot listing/certification (#8) | HubSpot distribution + trust badge | Listing needs ≥3 installs; cert ≥60 installs + 6 months listed | Not yet on register — add at Gate 14 |
| G8 | Zoom marketplace review (#17) | CI meeting capture (Zoom) | Functional review + security audit, per-scope justification | Add to register at Gate 13 |
| G9 | Google Meet API verification (#18) | CI capture (Meet) | Rides Google verification; scope class unknown (doc-09 U1) | Gate 13 |
| G10 | Teams protected APIs (#19) | CI capture (Teams) | MS approval (≈weekly batches) + per-tenant admin policy grant — must be productized | Gate 13; heaviest CI gate |
| P1 | Dynamics AppSource / ISV Connect (#10) | Dynamics distribution | Program enrollment (BD) | Gate 14 family; API access itself is OPEN |
| P2 | ZoomInfo partnership (#15) | Premium enrichment/intent signals | Enterprise subscription ≈$50k+/yr + partner approval | Only if a data product enters scope; self-serve vendors (#16, OPEN) carry until then |
| P3 | LinkedIn official programs (#21) | Embedded Sales Navigator views (manual workflows only) | Invite/application-gated; terms unverified | Screen only; never a send channel |
| P4 | MCP partner marketplace (ours) | Curated third-party agent connectors | Our own partner program (BD) | v2+; generic MCP client stays OPEN |
| P5 | ChatGPT app (unlisted in doc 09) | Distribution surface inside ChatGPT | OpenAI review/partnership; unscreened | v2+; screen before any commitment |
| X1 | LinkedIn automation (#20) | Automated LinkedIn sends/scraping/inbox | **PROHIBITED — permanent veto** | Manual-task pattern only; no session puppeteering, ever |

Marketing language for every G/P row follows protocol §8: "designed to integrate with" until
the verification/agreement exists.

---

## §5 Caveats & Unknowns

**Scoring caveats**
1. **Doc-08 sample limits:** TrustRadius percentages rest on n=18; Trustpilot is an n=40
   venting channel; G2 is fetch-blocked (snippet-grade). P-anchored value scores are
   directional, not survey-grade; exact theme counts are un-derivable until G2 is manually
   re-verified.
2. **Meetings/scheduling values (V4) have no direct P/L anchor** — they rest on
   market-landscape bundling norms and meetings-as-conversion logic; re-examine at Gate 3
   with the dogfood-vs-market section.
3. **Dogfood bias:** PEAK's tiny volume understates throughput features (sequential dialing,
   bulk ops, round-robin) and overstates Affinity; rows were scored to market, but Gate 3
   must re-read the cutline against the dogfood-vs-market lens.
4. **Lift assumes Gate 4/5 land near family-stack defaults** (Postgres durable timers +
   claim-and-execute; one mailbox provider). A substrate surprise re-prices engine rows ±1;
   the serverless minute-granularity/timeout ceiling is a known risk the Gate 5 memo must
   price honestly.
5. **Mobile rows scored as native builds;** the responsive-web MVP posture makes their
   effective lift 1–2 — re-score if a native companion becomes a wedge.

**Unknowns (Tier-F pass should re-score)**
1. Live-edit in-flight semantics (sequences U1) — may move the live-edit row's lift/subset.
2. Engagement-score mechanics and reply/bounce detection internals (tasks U1, email U1) —
   affect items 7/9 design, not scores.
3. The 5,000/week cap unit (mailbox vs user) and ruleset numeric defaults — calibrate our
   default send limits.
4. Step-interval unit discrepancy (doc 04 §10) — verify empirically at build.
5. Whether one-click unsubscribe (RFC 8058) is genuinely product-supported by the incumbent
   (email U7) — a `/vs-outreach` claim candidate if we ship it and they don't; needs source.
6. Founder-corpus (Tier F, per Gate 1 posture) verification of sequences/email/tasks/
   reporting/admin rows — any correction that changes a doc-11 score gets logged in
   00b and re-scored here before Gate 3 closes.

---

## Reconciliation note

**Total matrix rows: 210** — 100% of the feature rows across the 14 module docs in
`02-feature-inventory/` (the program plan's full module list; every doc's feature table is
reproduced row-for-row above, none dropped). Per-doc counts, matching a mechanical grep of
each doc's feature table: admin-governance 16 · ai-agents 19 · conversation-intelligence 19 ·
crm-sync 12 · dialer-voice 11 · email-deliverability 19 · forecasting 16 ·
meetings-scheduling 10 · mobile 11 · opportunities-deals 18 · prospecting-data 10 ·
reporting-analytics 16 · sequences 17 · tasks-workflow 16. Nine rows are cross-module
duplicates kept for auditability, scored identically to and pointing at their canonical rows:
email A/B → sequences; tasks OOO → sequences; admin email-compliance → email-deliverability;
admin recording-consent → conversation-intelligence; admin Kaia-permissions →
conversation-intelligence; opportunities Deal-Agent → ai-agents; forecasting outcomes →
opportunities-deals; prospecting drafting → ai-agents; prospecting autonomy → ai-agents.
§4's G/P/X rows are doc-09 gate surfaces, not doc-02 features, and sit outside this count.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
