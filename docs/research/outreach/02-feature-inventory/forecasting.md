# Feature Inventory — Forecasting (Commit)

**Tier:** P only (unlicensed module — protocol §1; public sources exclusively, logged in
`../sources/forecasting.md`).

## Purpose

Commit is Outreach's forecasting module: it layers a submission-and-rollup workflow over
the mirrored opportunity pipeline, then augments human calls with statistical machinery
— an AI projection of the period finish, a Monte-Carlo-style scenario planner, and
assist features that flag when a team's submitted number diverges from what the data
supports. Reps submit numbers with notes; managers review, override, and submit upward
through a configurable hierarchy; every submission snapshots the pipeline so accuracy is
auditable after the fact. Multi-currency and line-item (product/SKU) forecasting extend
it to global and multi-product orgs.

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Forecast submission | Reps/managers enter forecast values per configurable category (e.g., Commit / Best Case / Pipeline) and must attach comments when overriding; submissions timestamped and visible to the org | Reps, managers | Enter values → comment → submit | S-FCT-003, S-FCT-004 |
| Automated rollup & hierarchy | Submissions auto-aggregate to the next team level in the user rollup; each manager may pass the rolled total or submit an adjusted number; leaders see every team/individual below them; vendor-claimed 44% prep-time reduction | Managers, leaders | Reps submit → totals roll up → manager adjusts/submits → repeats to top | S-FCT-001, S-FCT-003 |
| Multiple named forecasts | Distinct forecasts (e.g., New ARR vs Expansion Only) run side-by-side as separate tabs with their own categories | RevOps (config), leaders | Configure forecast types → teams submit per type | S-FCT-003 |
| AI projection | Machine-generated projection of the period finish combining won business, remaining pipeline, and intraquarter/pulled-in deals — a data-driven check on the human call | Managers, leaders | Compare submitted number vs projection → investigate gaps | S-FCT-001 |
| Scenario Planner | Runs 10,000+ simulations over trailing-12-month history; inputs: weighted-pipeline basis (by stage or by forecast category), period, rollup or individual scope, opportunity picklist filters, optional custom win-rate/pipeline overrides; outputs fair value (most frequent), bear (beaten >75% of the time), bull (hit only 25% of the time); baseline win rates come from the same point in the past 3 periods | Leaders, RevOps | Pick inputs → run → compare overlaid distributions + table | S-FCT-002, S-FCT-004 |
| Smart Forecast Assist | AI assist (beta as of Nov 2025) that surfaces systemic forecast risk — including divergence between the team's entered forecast and the AI projection — and recommends corrections; announced with AI-guided scenario building | Leaders | Review flags → drill to causes → adjust call | S-FCT-006, S-FCT-007, S-FCT-008 *(snippet)* |
| Snapshots & history | Every submission snapshots the underlying data; past forecasts kept with notes and full pipeline context; exportable; enables historical-accuracy scoring | Leaders, RevOps | Submit → snapshot stored → later compare vs actuals | S-FCT-001, S-FCT-005 |
| Point-in-time analytics | Analytics views reconstruct pipeline by stage and outcomes (won / lost / slipped) for any historical date or the current period | RevOps, leaders | Pick date/period → inspect stage mix + outcomes | S-FCT-005 |
| Forecast Movement | Visualization of how deals moved in/out/changed over time (Nov 2025); 7-day change indicators with daily-change tooltips on rollup metrics (entry + pipeline-filter metrics only) | Managers, leaders | Open rollup → review change markers → hover for daily breakdown | S-FCT-003, S-FCT-006 |
| Deal drill-down | From any rollup number, drill into a seller's deals; clicking a metric filters the opportunity list; inline editing of opportunity fields; per-deal health status (On track / Needs review / At-risk) with focus guidance | Managers | Click metric → filtered deal list → inspect/edit | S-FCT-003, S-FCT-004 |
| Risk signals | Deal-level warnings (e.g., missing decision-maker, slower-than-benchmark stage progression) aggregated for intervention | Managers | Scan signals → coach rep / fix deal | S-FCT-005 |
| Multi-currency | Amounts managed and forecasts submitted in the user's preferred local currency; conversion uses the latest dated rates defined in the CRM (documented for Salesforce) | Global teams | Pick currency → values convert on the fly | S-FCT-001, S-FCT-002 |
| Line-item forecasting | Forecast built from opportunity line items so product-line/SKU composition of each team's call is visible | Multi-product orgs | Enable line items → submit/roll up per product | S-FCT-001 |
| Intraquarter modeling | Projects deals not yet in pipeline that history says will be created and closed inside the period | Leaders | Include in projection → judge true coverage | S-FCT-001, S-FCT-005 |
| Mobile forecasting | Rollup review and forecast submission from the mobile app (Nov 2025) | Managers on the road | Open app → review → submit | S-FCT-006 |
| Outcomes / win-loss reporting | Outcomes Report correlates win rates with deal size, cycle length, prospect count, and influence factors (April 2026); Unleash 2025 added Win/Loss Insights over engagement patterns | Leaders, RevOps | Review correlations → adjust GTM/coaching | S-FCT-007, S-FCT-009 |

## Key workflows

1. **Weekly forecast cycle:** reps update deals and submit category values with notes →
   numbers auto-roll to their manager, who inspects the 7-day movement markers, drills
   into flagged sellers' deals (health status, close dates), edits or accepts the total,
   comments, submits upward → repeat to the top-line call; each submission snapshots
   state for later accuracy review. [S-FCT-003/004/005]
2. **Validating the call:** leader compares the submitted rollup against the AI
   projection (won + pipeline + intraquarter) → runs Scenario Planner scoped to the org
   for the quarter, first on stage-weighted then forecast-weighted pipeline → reads
   fair/bear/bull spread → where the human call sits above bull or Smart Forecast
   Assist flags divergence, drills into contributing teams before finalizing.
   [S-FCT-001/002/006/008]
3. **Retro & calibration (RevOps):** after quarter close, load point-in-time analytics
   for week-1 vs week-13 snapshots → measure submission accuracy by team → review
   Outcomes Report correlations (deal size, cycle, prospect count) → adjust category
   definitions, coverage targets, and coaching focus. [S-FCT-005/009]

## Data touched (cross-ref doc 04 — pending)

Forecast definition (categories, formula metrics, tabs/types), Forecast submission
(user, period, per-category values, comment, timestamp), Rollup hierarchy (user→team
tree, distinct from HR chart — see admin-governance), Snapshot (full pipeline state per
submission), Opportunity mirror (stage, amount, close date, forecast category, line
items, currency), Currency rate table (CRM-sourced, dated), Scenario run (inputs,
simulated distribution), Risk-signal and movement event streams, Outcomes aggregates.

## Unknowns

- AI-projection model internals (features, algorithm family, retraining cadence) —
  public docs describe inputs/outputs only.
- Minimum history required before projections/scenarios become available, and behavior
  for young orgs (the planner draws on 12 months of data; floor undocumented).
- Whether Smart Forecast Assist has exited beta by August 2026 (GA not confirmed in
  fetched sources).
- Snapshot cadence beyond submission-triggered captures (any scheduled daily snapshot
  is undocumented publicly).
- Currency-rate behavior for non-Salesforce CRMs.
- How line-item forecasts reconcile when CRM line items are edited mid-period.
- Which capabilities sit in which paid tier (deferred to doc 07 pricing/packaging).

## Completeness checklist

- [x] Every claim carries an S-FCT source ref; snippet-limited rows flagged.
- [x] Unknowns recorded above.
- [x] Function described, not visual design (protocol §6).
- [x] ≤4 pages / ≤200 lines; family template followed.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
