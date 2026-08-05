# Outreach Competitive Teardown — Doc Map & License-Tier Table

> **HARD RULE: no research content lands in this directory until (a) the repo is
> PRIVATE on GitHub and (b) Gate 1 has decided the account posture**
> (`docs/plan/gates/gate-01-research-account-posture.md`). Until then this directory
> contains scaffolds only. Every research doc is prepared under
> `docs/legal/clean-room-protocol.md` and ends with the self-certification line:
> *"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*

Phase 1 produces this doc set (fan-out plan in `docs/plan/phase-1-plan.md` when Phase 1
opens; page budgets set there). Contents per doc: `docs/plan/program-plan.md` Phase 1
table.

## License-tier table — which sources each doc may draw from

Andrew's Outreach license is **Engage core only**. Whatever Gate 1 decides, docs marked
**P only** never use founder-account material — there is no licensed access to those
modules. Tier definitions: protocol §1 (P public / F founder corpus / R first-party).

| Doc | Tier |
|---|---|
| `00-sources-log.md` | — (the Tier-P record itself) |
| `00b-founder-input-log.md` | — (the Tier-F record itself; DORMANT until Gate 1) |
| `01-product-overview.md` | P + F |
| `02-feature-inventory/sequences.md` | P + F |
| `02-feature-inventory/email-deliverability.md` | P + F |
| `02-feature-inventory/tasks-workflow.md` | P + F |
| `02-feature-inventory/dialer-voice.md` | **P only** (unlicensed) |
| `02-feature-inventory/meetings-scheduling.md` | P (+F only for surfaces in the core tier) |
| `02-feature-inventory/prospecting-data.md` | **P only** (unlicensed) |
| `02-feature-inventory/opportunities-deals.md` | **P only** (unlicensed) |
| `02-feature-inventory/conversation-intelligence.md` | **P only** (unlicensed) |
| `02-feature-inventory/forecasting.md` | **P only** (unlicensed) |
| `02-feature-inventory/reporting-analytics.md` | P + F |
| `02-feature-inventory/crm-sync.md` | P (+F only for import/export surfaces Andrew's tier exposes) |
| `02-feature-inventory/admin-governance.md` | P + F |
| `02-feature-inventory/mobile.md` | P |
| `02-feature-inventory/ai-agents.md` | P |
| `03-ui-walkthrough.md` | P + F (F screens internal-only, prose descriptions; protocol §4/§6) |
| `04-inferred-data-model.md` | P |
| `05-public-api-teardown.md` | P |
| `06-assumed-architecture.md` | P |
| `07-pricing-packaging.md` | P |
| `08-review-mining.md` | P |
| `09-integration-landscape.md` | P |
| `10-market-landscape.md` | P |
| `11-copy-priority-matrix.md` | — (synthesis; every row traces to doc 02) |
| `12-differentiation-thesis.md` | P |
| `13-migration-feasibility.md` | P (+F/R only for Andrew exporting his own data — protocol §1 Tier R) |
| `14-deliverability-playbook.md` | P |

**Mechanical check (Phase 1 verification):** grep confirms `P only` docs contain zero
`F-` references; self-cert line count equals doc count; every doc has an "Unknowns"
section.

## Module template

Feature-inventory docs follow the family template: Purpose (one paragraph, our words) →
Feature table (`Feature | Description (our words) | Who uses it (roles) | Workflow
steps | Source refs`) → Key workflows (2–4 numbered end-to-end walkthroughs) → Data
touched (cross-ref doc 04) → Unknowns → Completeness checklist (every claim sourced;
unknowns filled or "none"; function not visual design; ≤4 pages).
