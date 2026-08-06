# Feature Inventory — AI Agents Layer (2025–2026)

**Tier:** P (per README tier table; public sources exclusively, logged in
`../sources/agents.md`).

## Purpose

Since late 2024 Outreach has repositioned around an agent layer that operates the
platform's existing machinery (sequences, records, recordings, forecasts) rather than
replacing it. The layer has four parts: a roster of named, prebuilt agents for specific
jobs (prospecting research, meeting prep, deal hygiene, personalization, expansion,
forecast checks); Agent Studio, a no-code builder where RevOps composes autonomous
workflows from trigger/schedule/condition/action blocks; Omni, a conversational front
door that spans the dataset and can act, not just answer; and an MCP-based
interoperability suite connecting outside assistants into Outreach and outside data into
its agents. Governance is a first-class design axis: per-segment autonomy levels,
per-field update criteria, admin-editable prompts, brand-voice safeguards grounded in
approved content, and AI-credit metering. Launch sequence: AI Prospecting Agents
2024-12-10 → agent roster + assists at Unleash 2025 (2025-06-10) → Omni + Agent Studio
in the Spring 2026 release (2026-04-27) → MCP suite + ChatGPT/Codex apps (2026-06-02/03)
→ GA wave reported from the 2026 Unleash cycle. [S-AGT-002/003/004/005/007/008]

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Revenue Agent (ex AI Prospecting) | Top-of-funnel agent: researches accounts from first/third-party signals (CRM, news, buying signals), identifies high-intent accounts, sources fresh contacts, drafts personalized multi-touch messaging from the customer's own materials; runs 24x7 as copilot or fully autonomous (dormant re-engagement, expansion pipeline); success metrics visible in the agent library | SDRs, demand teams; admins configure | Configure motion + autonomy → agent researches → drafts/enrolls → human reviews or auto-runs | S-AGT-001, S-AGT-002, S-AGT-010 |
| Research Agent | Enriches accounts/prospects by synthesizing conversation data, first-party engagement, and third-party public data; admin on/off toggles + custom-field mapping; a Prospect Research Agent variant runs admin-defined research "blueprints" that populate custom fields; also invocable inline from Agent Studio for lead enrichment | Reps, RevOps | Define blueprint/fields → agent fills → reps consume | S-AGT-001, S-AGT-005, S-AGT-009, S-AGT-010 |
| Meeting Prep / Conversation Agent | Builds pre-call briefs from prior meetings, emails, and account context; brief sections and variables are admin-customizable (talking points, past conversations, account overview); GA per 2026 Unleash coverage | AEs, SDRs | Meeting upcoming → brief generated → rep reviews before call | S-AGT-003, S-AGT-004, S-AGT-005, S-AGT-009 |
| Deal Agent | Proposes opportunity-field updates from conversation evidence (up to 10 Kaia calls + 80 emails + structured fields); silent by default, suppressed at low confidence; accept/dismiss/edit in the opportunity Insights tab or from Slack (incl. custom fields); admin sets methodology mapping and per-field criteria (auto / auto-if-vacant / confirm) | AEs; admins | See opportunities-deals doc workflow 2 | S-AGT-005, S-AGT-011 |
| Personalization Agent | Converts research + buyer context into channel-specific messaging; cites uploaded Knowledge documents | Reps | Select target → agent drafts per channel → rep edits/sends | S-AGT-001, S-AGT-009 |
| Expansion Agent | Mines existing accounts for new personas to upsell, keyed on past purchase and product-usage data | AMs, CS-sales | Agent flags personas → rep runs expansion play | S-AGT-003 |
| Reply Agent | Drafts contextual responses to inbound objections/questions using account context (announced Unleash 2025; hub page still marks it coming soon) | Reps | Reply arrives → draft proposed → rep approves | S-AGT-001, S-AGT-003 |
| Forecast/analytics assists | Smart Forecast Assist (risk + AI-guided scenarios), Smart Analytics Assist (pipeline/coaching insights), Win/Loss Insights (engagement patterns) — assist-grade AI attached to Commit and reporting | Leaders, RevOps | See forecasting doc | S-AGT-003 |
| Omni | Universal conversational agent: natural-language Q&A and action across accounts, opportunities, prospects, sequences, activity, and Kaia recordings; same-thread follow-ups and actions (e.g., send an objection-handling email); rolled out 2026-04-16→29 | Sellers, managers, leaders | Ask → insight → refine → act, in one thread | S-AGT-004, S-AGT-009 |
| Omni surfaces | Web homepage entry point (when enabled), Slack chat tab, mobile app | Same | Open surface → converse | S-AGT-004, S-AGT-009 |
| Agent Studio | No-code visual canvas where RevOps designs, tests, and deploys autonomous workflows; four-block anatomy: Source & Event (trigger), Target & Frequency (schedule — fixed timers or scheduled triggers), Conditions (qualification filters), Actions (AI behaviors); expanded operators, filters, inactivity detection | RevOps, admins | Pick template or blank → wire blocks → test → deploy → runs unattended | S-AGT-005, S-AGT-006, S-AGT-009 |
| Agent Studio templates | Shipped plays: inbound-lead engagement/qualification, closed-lost re-engagement, signal-based deal alerts, pipeline-risk monitoring, prospect research; templates customizable | RevOps | Instantiate → tune conditions/actions | S-AGT-005, S-AGT-006 |
| Knowledge grounding | Admins upload approved collateral (PDFs, Word docs, text); agents (Account Assist, Personalization) reference up to 7 documents per output with citations — the brand-voice/accuracy guardrail | Admins, enablement | Upload → agents cite approved content | S-AGT-004, S-AGT-009 |
| Autonomy controls | Admin-set agent independence levels by segment; spectrum from human-review copilot to full autopilot per workflow; per-field update criteria on Deal Agent; Call Agent admin-controlled; agents on/off per admin | Admins | Set level per segment/workflow → agents obey | S-AGT-001, S-AGT-002, S-AGT-003, S-AGT-010, S-AGT-011 |
| Brand-voice safeguards | Centralized content safeguards keep agent-generated output on brand; paired with Knowledge grounding and admin-editable prompts (deal summaries, brief structures) | Admins | Configure once → applies to agent output | S-AGT-001, S-AGT-009 |
| AI credit metering | Consumption dashboard for agent/AI usage with admin access control by user profile | Admins, RevOps | Monitor spend → govern access | S-AGT-010 |
| MCP Server | Exposes Outreach context/actions to external assistants — Claude, Microsoft Copilot, Agentforce, ChatGPT, Codex — which can sequence prospects, update records, and trigger workflow automations under the existing permissions framework | Customers' AI stacks | Connect assistant → act on Outreach with user's permissions | S-AGT-005, S-AGT-007 |
| MCP Client + marketplace | Pulls external systems (Seismic, Amplitude, Snowflake, Crayon, Sendoso, Slack, ZoomInfo, Glean, Demandbase) into Outreach agents; partner agents reviewed before enterprise deployment; admin install controls; "Agentic Ecosystem" marketplace | Admins, RevOps | Install connector → agents use external context | S-AGT-005, S-AGT-007 |
| ChatGPT app / Codex context | Native Outreach app inside ChatGPT; the same MCP Server feeds Outreach context to Codex for custom agentic builds | Sellers, dev teams | Use Outreach data/actions without leaving those tools | S-AGT-008 |

## Key workflows

1. **Autonomous inbound play (RevOps):** in Agent Studio, instantiate the inbound-lead
   template → Source & Event: new inbound lead; Target & Frequency: continuous;
   Conditions: ICP filters; Actions: inline Research Agent enrichment → personalized
   engagement → test, deploy; the play runs unattended and alerts on key-deal signals.
   [S-AGT-005/006/009]
2. **Governed autonomy rollout (admin):** enable chosen agents → set autonomy by
   segment (e.g., autopilot for dormant SMB accounts, review-first for enterprise) →
   upload Knowledge docs so drafts cite approved content → set Deal Agent per-field
   criteria → watch the credit-metering dashboard and agent success metrics; tighten or
   widen autonomy accordingly. [S-AGT-001/009/010/011]
3. **Conversational execution (seller):** ask Omni in Slack which deals lost momentum
   this week → follow up on one deal's objection history → have it draft the
   objection-handling email in-thread → send; the same query pattern works on mobile
   and web. [S-AGT-004/009]
4. **Cross-stack agency (customer's AI platform):** admin installs the MCP Server
   connection for the company's assistant → a rep in ChatGPT asks for pipeline status
   and enrolls a prospect into a sequence — executed via Outreach permissions; Snowflake
   and ZoomInfo context flows the other way into Outreach agents via the MCP Client.
   [S-AGT-007/008]

## Data touched (cross-ref doc 04 — pending)

Agent definition/config (type, autonomy level, segment scope, prompts, field mappings),
Agent run/execution log + success metrics, AI credit ledger, Knowledge document store
(+ citation refs), Workflow (block graph: trigger, schedule, conditions, actions),
Omni conversation threads (grounded on accounts/opps/prospects/sequences/activity/
recordings), MCP connections (server grants, client connectors, permission bindings),
plus every underlying record the agents read/write (prospects, sequences,
opportunities, mailings, recordings).

## Unknowns

- Underlying model stack and routing (vendor, fine-tunes) — not publicly documented.
- Full Agent Studio block/operator catalog and limits (loops? branching? max runs);
  only the four-block anatomy and named operators are public.
- Precise autonomy-control granularity beyond "by segment" and Deal Agent per-field
  criteria (e.g., per-step-type send autonomy).
- AI-credit consumption rates per agent action and overage economics (doc 07 scope).
- Net-new contact sourcing data partners for the Revenue Agent (partner names not in
  the fetched releases; third-party coverage names vary — left unverified).
- Whether "Outbound Prospecting Agent" (Unleash 2025) and "Revenue Agent" (current hub)
  are the same SKU renamed. INFERENCE: same lineage, renamed — both described with
  matching scope.
- Omni guardrails on write actions (which actions require confirmation).

## Completeness checklist

- [x] Every claim carries an S-AGT source ref.
- [x] Unknowns recorded above; inferences labeled.
- [x] Function described, not visual design (protocol §6).
- [x] ≤4 pages / ≤200 lines; family template followed.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
