# Phase 1 Plan — Clean-Room Teardown + Naming Sprint

**Opened:** 2026-08-06, immediately after Gate 1 closed (posture B). Per the gate
cadence rule this phase is DONE when its verification rows pass and its memo exists;
its gate is **Gate 2 — brand name**.

## Scope

Produce the full teardown doc set (`docs/research/outreach/`, docs 00–14 incl. the 17
module files — contents per the program plan's Phase 1 table, tiers per the research
README), the **doc 11 copy-priority matrix** synthesized from them, and the
**naming decision memo** (`docs/brand/naming-decision-memo.md`) that Gate 2 decides
from. The research brief (`docs/research/inputs/replication-scope-brief.md`) is an
input, not evidence — its claims re-verify against primary sources.

## Workstreams (parallel research fan-out, Tier P web sources)

| WS | Docs | Primary sources |
|---|---|---|
| A — Core Engage | 01 overview · 02/sequences · 02/email-deliverability | outreach.io/.ai product pages, support.outreach.io |
| B — Rep experience | 02/tasks-workflow · 03 UI walkthrough | support.outreach.io, published demos/webinars |
| C — Unlicensed cluster 1 | 02/dialer-voice · 02/meetings-scheduling · 02/prospecting-data · 02/mobile | product pages, help center, press |
| D — Unlicensed cluster 2 | 02/opportunities-deals · 02/conversation-intelligence · 02/forecasting · 02/ai-agents · 02/admin-governance · 02/reporting-analytics · 02/crm-sync | product pages, help center, release notes |
| E — Data model | 04 inferred data model · 05 public API teardown | developers.outreach.io (API v2), cross-checked into 04 |
| F — Business | 06 assumed architecture · 07 pricing-packaging · 10 market landscape | job posts, eng blog, press; Vendr/ITQlick/review sites (dated, confidence-flagged) |
| G — Voice of customer | 08 review mining · 12 differentiation thesis | G2, Capterra, TrustRadius, Reddit/r/sales |
| H — Plumbing | 09 integration landscape · 13 migration feasibility · 14 deliverability playbook | partner dev-program pages, Google/Yahoo/Microsoft sender rules, help center export docs |

Rules for every workstream: clean-room protocol §1–§4 (describe never copy; verbatim
quotes only from customer reviews, cited); every claim → an S-ID row (workstream writes
`sources/<module>.md` fragments; aggregated into 00 at synthesis); ASSUMPTION/INFERENCE
labels inline; an **Unknowns** section per doc; the self-certification line ends every
doc; module docs follow the family template (Purpose → Feature table → Key workflows →
Data touched → Unknowns → Completeness checklist); **page budgets: module docs ≤4
pages, 03/04/05 ≤8, others ≤6**; doc 09 uses the four-level access column
(OPEN-API / VERIFICATION-REQUIRED / PARTNER-REQUIRED / PROHIBITED).

## After the fan-out (synthesis, serial)

1. **Doc 00 aggregation** from fragments; provenance spot-check.
2. **Doc 11 matrix**: every doc-02 feature row scored value (anchored to doc 08) ×
   build-lift (anchored to the family stack) × gate (from doc 09) → draft MVP cutline
   (input to Gate 3, not decided here).
3. **F-verification pass** (Tier F, posture B): targeted questions to Andrew on the
   licensed modules; answers land as F-IDs in 00b; docs cite F-IDs as verification only.
4. **Naming sprint**: generate 40–50 `-row` candidates → RDAP auto-filter (seeded from
   the 2026-08-05 pre-screen; fresh lookups, dated) → deep-screen survivors against doc
   10 collisions + trademark quick-screens + 3-axis Outreach-similarity → memo per the
   option anatomy, ranked top 3–4 → **Gate 2**. Same-day domain registration is
   Andrew's action at the gate.

## Verification (program-plan Phase 1 rows)

Self-cert line count == research doc count · 10 random claims resolve to S-IDs · every
doc has an Unknowns section · Tier-P-only docs contain zero `F-` refs (grep vs the tier
table) · every S/F row dated · naming memo: ≥40 generated, filter documented, dated
RDAP + collision screen + risk grade per survivor · pnpm suite + spec checks still
green · CI green on the updated PR.
