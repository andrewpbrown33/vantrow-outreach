# Feature Inventory — Prospecting & Data (AI Prospecting / Revenue Agent)

**Tier: P only** (module outside the founder's license; public sources exclusively).
Source fragment: `../sources/prospecting.md`.

## Purpose

The prospecting module is an autonomous top-of-funnel machine, announced 2024-12-10 as
"AI Prospecting Agents" and generally available 2025-03-26 [S-PRO-001] [S-PRO-002]; in
the current help center it is productized as the **Revenue Agent** under the Amplify
package [S-PRO-004]. It watches first/second/third-party signals, researches and
summarizes accounts from public information, targets by ICP and persona, sources
contacts — including net-new people not yet in the customer's CRM, via enrichment
partnerships — drafts channel-specific content, and enrolls prospects into dedicated
sequences at an admin-chosen autonomy level, handing engaged prospects to a human.

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Signal synthesis | Blends first-party signals (the org's own engagement data, e.g. stakeholder sentiment), second-party (direct customer interactions), third-party (department hiring, new funding, news, market events), and prospect-level events like job changes; optional "targeting signals" (e.g. an IPO announcement) narrow which accounts qualify; ZoomInfo Signals extend enrichment with intent/market-event data (2026). | Agent (autonomous); RevOps tune | Signals evaluated against configured filters → qualifying accounts enter the run | [S-PRO-003] [S-PRO-004] [S-PRO-007] |
| Account research summaries | Auto-generates an account brief in seconds from company websites, financial filings, press releases, and news — replacing manual pre-call research. | Reps consume; agent produces | Account qualifies → summary generated → attached for rep/agent use | [S-PRO-003] |
| ICP / persona targeting | Account targeting via account-field filters (reusable from list views) plus firmographics (industry, revenue), prior engagement, or buying signals; persona targeting configured on the agent; third-party matching requires a valid account domain. | RevOps/admins configure | Define account filters + personas → agent restricts itself to matches | [S-PRO-004] [S-PRO-003] [S-PRO-005] |
| Sales-motion coverage | Plays for Inbound, Outbound, New Logo, and Expansion motions, plus dormant-account re-engagement — one agent framework across pipeline types. | Sales leadership choose motions | Pick motion → agent workflow mirrors it | [S-PRO-003] [S-PRO-001] |
| Net-new contact sourcing | Sourcing modes: existing prospects (prospect-level filters), net-new contacts not present in the CRM, or both; net-new discovery filters by department, seniority, location, and time-in-role; powered by enrichment providers — Explorium documented as a provider, with multi-provider "Smart Data Enrichment" (ZoomInfo signals added later); agent-targeted prospects get enriched, agent-created prospects auto-enrich on creation. | Agent; admins pick mode | Choose sourcing mode + criteria → agent finds/creates prospects → auto-enrichment | [S-PRO-004] [S-PRO-006] [S-PRO-003] [S-PRO-007] |
| Drafting & personalization | Generates Email, LinkedIn, and call-script content per prospect, tunable at subject-line / opening-sentence / full-message granularity; AI-personalized passages are labeled "Personalized" and visually flagged for review. | Agent drafts; reps review | Prospect enters sequence → content drafted → labeled for review or auto-sent | [S-PRO-003] [S-PRO-004] |
| Autonomy levels | Deployment spectrum from copilot (agent researches/drafts, rep executes) to fully autonomous 24/7 plays; per-sequence-step manual vs automatic control; documented best practice keeps step 1 a manual email so reps check AI content; autonomous plays hand off to a human once the prospect engages. | Admins set; org risk appetite | Configure per-step autonomy → semi or full automation → handoff on engagement | [S-PRO-001] [S-PRO-003] [S-PRO-004] |
| Throughput & guardrails | Daily account throughput defaults to 30 (adjustable); each prospect group is tied to a dedicated sequence with daily sequencing limits; creation/editing gated by a profile permission; feature gated to the Amplify package. | Admins/RevOps | Set throughput + sequence limits → grant permission → run | [S-PRO-004] |
| Monitoring & attribution | Agent list view shows outcome metrics; agents link directly to Sequence Performance Reports pre-scoped to their sequences (opportunities created, closed-won revenue), so pipeline impact is measurable per agent. | Leadership, RevOps | Open agent → scoped report → evaluate → tune | [S-PRO-004] [S-PRO-007] |
| Agent-family context | Revenue Agent sits in a named-agent roster — Omni (conversational front door incl. Slack), Research, Personalization, Deal, Meeting Prep — sharing the platform's agent governance. | All roles | n/a (context) | [S-PRO-005] |

## Key workflows

1. **Admin configures an agent.** Grant the profile permission (Amplify entitlement) →
   define account filters (reuse list-view filters) and optional targeting signals →
   choose prospect sourcing (existing / net-new / both) with persona criteria
   (department, seniority, location, time-in-role) → assign dedicated sequences with
   daily limits and set per-step autonomy → set daily account throughput (default 30) →
   launch and monitor via scoped performance reports. [S-PRO-004] [S-PRO-007]
2. **Fully autonomous play.** A third-party signal (funding, hiring, IPO) qualifies an
   account → agent builds the research summary from public web/filings/news → sources
   and auto-enriches net-new contacts matching the persona → drafts channel content →
   enrolls and sends through the automated sequence 24/7 → prospect replies/engages →
   conversation handed to a human seller. [S-PRO-003] [S-PRO-001] [S-PRO-004] [S-PRO-006]
3. **Copilot (review-first) mode.** Same research/sourcing pipeline, but step 1 is a
   manual email task: drafts arrive labeled "Personalized" and highlighted → rep reviews,
   edits, sends → later steps may automate once trust is established. [S-PRO-004]
   [S-PRO-003]

## Data touched (cross-ref doc 04)

- **Account**: firmographic fields, domain (enrichment key), signal/event associations,
  generated research summaries.
- **Prospect**: existing records targeted; agent-created records (provenance flag),
  persona attributes (department, seniority, location, time-in-role), enrichment fields.
- **Agent configuration**: filters, targeting signals, sourcing mode, throughput,
  per-step autonomy, linked sequences.
- **Sequence + steps**: dedicated agent sequences, daily limits, AI-drafted content
  artifacts with "Personalized" labeling.
- **Reporting**: agent-scoped sequence performance (opps created, closed-won revenue).

## Unknowns

- Full roster of data providers behind net-new sourcing (Explorium and ZoomInfo Signals
  evidenced; contract/commercial structure unknown) and whether customer credits meter it.
- Pricing of the Amplify package and per-seat vs consumption economics.
- Model/LLM stack behind research and drafting. INFERENCE: hosted third-party LLMs with
  retrieval over the platform's engagement data — unverified.
- De-duplication and CRM-writeback rules for agent-created prospects (against Salesforce
  duplicates, ownership assignment).
- Deliverability guardrails specific to autonomous sending (volume caps beyond daily
  sequencing limits, warm-up behavior).
- Data-residency handling of enrichment lookups for EU tenants.
- Independent performance data: only vendor-cited anecdotes (customer quote, Gartner
  stat) found; no third-party benchmark. [S-PRO-002]

## Completeness checklist

- [x] Every claim carries a source ref resolving to `sources/prospecting.md`.
- [x] Unknowns recorded above (none silently guessed).
- [x] Function described, not visual design (labeling noted as function: review cue).
- [x] ≤4 pages.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
