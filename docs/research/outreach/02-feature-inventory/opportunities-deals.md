# Feature Inventory — Opportunities & Deal Management

**Tier:** P only (unlicensed module — protocol §1; public sources exclusively, logged in
`../sources/deals.md`).

## Purpose

Outreach's deal-management layer sits on top of CRM-mastered opportunities: it mirrors
opportunity records into Outreach, enriches them with the engagement data the platform
already captures (emails, calls, meetings), and pushes edits back to the CRM. Its job is
deal *inspection and hygiene* rather than pipeline data entry — a spreadsheet-style grid
for bulk review/edit, a per-deal overview that reconstructs the buyer/seller interaction
history, a machine-learning health score that flags at-risk deals, an AI agent that
proposes field updates from call evidence, buyer-facing mutual action plans, and a
leader-facing pipeline analytics suite. The through-line: every surface leans on synced
CRM opportunity data plus captured activity, and every edit is expected to respect the
CRM's own validation rules.

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Editable deal grid | All pipeline deals in one sortable/filterable grid with saved views; inline edits write back to the CRM automatically and must satisfy the CRM's validation rules | AEs, sales managers, RevOps | Open grid → filter/save view → inline-edit fields → write-back syncs to CRM | S-OPP-001 |
| Commit deals view | Forecasting-grade single view of pipeline fields (amount, next step, close date) plus a Signals column counting risk signals — more signals, likelier off course; on-track = pacing to close in-period vs the team's historical trends | Managers, leaders | Scan grid → sort by signals → open flagged deal | S-OPP-004 *(snippet)* |
| Deal Health score | 0–100 machine-learning score benchmarked against similar deals at comparable stages; recomputed once daily (~10 am, timestamped); classified On-track / Needs review / At-risk | AEs, AE managers | View score column → open card → read contributing factors → take suggested de-risk actions | S-OPP-002 |
| Deal Health trends & factors | 7-day trend (direction + magnitude) shown in the list column and on the card; factor groups: buyer engagement (seniority of contacts, departments, recency), CRM signals (days in stage, close-date pushes), communications volume/recency, meeting cadence | AEs, managers | Review trend → inspect negative factors → act | S-OPP-002 |
| Deal Overview | Per-opportunity summary reached from Records > Opportunities: trend cards (amount, close date, stage, next meeting), engagement timeline of buyer/seller activities with hover detail (top three daily activities), latest Kaia recording card (talk time, participants, topics, sentiment), Success Plan engagement card; tile layout customizable since April 2026 | Managers (deal reviews), AEs | Open opportunity → scan cards → drill into timeline/recording | S-OPP-003, S-OPP-008 |
| Opportunity editing | Edit button on the overview updates opportunity fields; documented for Salesforce customers with bidirectional sync configured | AEs, managers | Edit → save → sync to CRM | S-OPP-003 |
| Topics (deal level) | Conversation topics extracted across a deal's emails and meetings; view most-recent topics or compare across all interactions | AEs, managers | Open deal → Topics view → compare | S-OPP-001 |
| Deal Agent | AI agent proposing opportunity-field updates from conversation evidence: reads up to 10 Kaia calls + 80 emails + structured fields; silent by default — suggests only with explicit transcript evidence, suppresses at low confidence; surfaces in an Insights side-panel tab (sparkle marker); accept / dismiss / copy-then-edit; also reachable from Slack incl. custom fields | AEs; admins configure | Agent watches activity → suggests (e.g., Next Steps, Champion, Economic Buyer) → rep accepts/rejects/edits → field updates (and CRM via sync) | S-OPP-009, S-OPP-010, S-OPP-011, S-OPP-012 |
| Deal Agent autonomy config | Admin picks methodology (MEDDPICC, MEDDIC, "Identify Pain & Champion", or custom fields with guidance prompts) and per-field update criteria: auto update, auto update if vacant, or confirmation required; prospect-role fields (Champion, Economic Buyer) stay manual-select | Admins, RevOps | Admin panel → AI Agents > Deal Agent → map fields → set criteria | S-OPP-010 |
| Deal Alerts | Signal-based alerts (e.g., engagement drops, attribute changes) surfaced inside opportunity views; can spawn action items | AEs, managers | Alert fires → review in opportunity view → act | S-OPP-008, S-OPP-011 |
| Mutual action plans (Success Plans) | Shared buyer/seller project plan, one-to-one with an Opportunity; sections: Timeline (phases, tasks, meetings, owners, attachments), Success Criteria, Resources (recordings, case studies, security docs), Teams; internal-only events hidden from buyers | AEs, buying committee | Create from template → invite internal + external members → collaborate → track | S-OPP-005, S-OPP-006 |
| Methodology templates | Plan templates that operationalize MEDDPICC / MEDDIC / SPIN, with custom field mapping into the CRM so qualification stays consistent | Sales leadership, AEs | Leader configures template → reps instantiate per deal | S-OPP-005 |
| Plan engagement tracking | Tracks which buying-committee members open the plan, engage with deal emails, and access shared resources; per-contact engagement tiles with recent activity; late-added committee members self-serve context | AEs, managers | Share plan → monitor engagement tiles → follow up on silent stakeholders | S-OPP-005, S-OPP-006 |
| Pipeline dashboard & movement | Team pipeline metrics in one filterable view; movement analytics show how pipeline shifted over a period and which deals drove the change | Sales leaders, RevOps | Open dashboard → filter → inspect movement → drill to deals | S-OPP-007 |
| Coverage modeling | Custom coverage models per team and seller derived from opportunity history, projecting whether pipeline suffices for quota in current and future periods; weighted-pipeline view with weekly coverage trends | Leaders, RevOps | Review coverage vs model → trigger pipeline-gen plays where short | S-OPP-007 |
| Scorecards & win/loss modeling | Team/rep scorecards of conversion efficiency per stage and forecast category; win/loss modeling; deal pacing vs the team's win model; revenue attainment vs prior periods and year-over-year | Leaders, managers | Review scorecard → identify stage-level leaks → coach | S-OPP-007 |
| Outcomes reporting | Win-rate correlations by deal size, cycle length, prospect count, and influence factors (April 2026) | Leaders, RevOps | Open Outcomes Report → compare cohorts | S-OPP-008 |
| Field-level opportunity governance | Per-field view/edit/hide controls on opportunities; Salesforce field-level-security permissions sync automatically (Nov 2025) | Admins | Configure per field → users see/edit accordingly | S-OPP-009 |

## Key workflows

1. **Monday pipeline scrub (manager):** open the editable deal grid → apply saved view →
   sort by Deal Health / signals → inline-fix stale close dates and next steps (writes
   back to CRM, validation-checked) → open the Deal Overview of each At-risk deal →
   read health factors and timeline → assign de-risk actions. [S-OPP-001/002/003/004]
2. **Deal hygiene via Deal Agent (rep):** after a Kaia meeting, the agent extracts
   evidence → proposes Next Steps text and Champion / Economic Buyer assignments (with
   last-updated timestamps) → rep accepts, dismisses, or copies-and-edits in the
   Insights tab or from Slack → accepted values land on the opportunity per the admin's
   auto/confirm criteria. [S-OPP-009/010/012]
3. **Mutual action plan lifecycle (AE + buyer):** AE instantiates a MEDDPICC-mapped
   template on the opportunity → tailors timeline phases and success criteria → invites
   buying committee → both sides check off milestones, comment, and consume resources →
   AE watches per-contact engagement tiles; a champion change mid-cycle is absorbed by
   inviting the new stakeholder into the same plan. [S-OPP-005/006]
4. **Quarterly pipeline review (leader):** pipeline dashboard → movement analysis for
   the quarter → coverage model per team vs quota → scorecard to locate stage-conversion
   leaks → Outcomes Report to see which behaviors correlate with wins → feed conclusions
   into forecast calls. [S-OPP-007/008]

## Data touched (cross-ref doc 04 — pending)

Opportunity (CRM-mastered, mirrored locally; external-ID mapping; per-field sync +
validation), Opportunity field metadata (view/edit/hide governance, field-level security
import), Prospect↔Opportunity roles (Champion, Economic Buyer), Account, Activity
stream (emails, calls, meetings feeding health/timeline/Topics), Kaia recording
(summary, topics, sentiment), Deal Health score + factor snapshots (daily), Deal Alerts,
Success Plan (plan, phases, tasks, resources, external participants, engagement events),
pipeline aggregates (coverage, movement, scorecards).

## Unknowns

- Exact Deal Health model inputs/weights beyond the published factor groups; scoring
  behavior when activity data is sparse.
- Full column set and bulk-action list of the editable grid (grid article was
  snippet-only); how CRM validation failures are surfaced to the editor.
- Whether non-Salesforce CRMs (HubSpot, Dynamics) get the same write-back breadth as
  the documented Salesforce paths.
- Buyer-side (unauthenticated) Success Plan experience details and whether plans are
  brandable per tenant.
- Which pipeline-management views are bundled vs sold with which SKU (packaging is
  doc 07's scope).
- Topics taxonomy at the deal level: fixed list vs custom topics (Kaia docs suggest a
  14-topic buyer set — see conversation-intelligence doc).

## Completeness checklist

- [x] Every claim carries an S-OPP source ref; snippet-limited rows flagged.
- [x] Unknowns recorded above (none silently guessed).
- [x] Function described, not visual design (protocol §6).
- [x] ≤4 pages / ≤200 lines; family template followed.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
