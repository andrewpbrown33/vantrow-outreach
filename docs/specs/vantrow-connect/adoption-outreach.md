# Vantrow Connect Adoption — Outreach Subsidiary (`outreach.*`)

**Status:** stub. The mapping is decided at **Gate 6** (Phase 3) and recorded here plus
in the decision log. This subsidiary implements the **producer** side from MVP
(program-plan locked decision; Gate 7 acceptance requires producer green in CI).

Follows the contract's own "Mapping guidance for future verticals" (`overview.md`) and
its five adoption rules: map don't mint; every native stage maps to exactly one core
`status` (native string rides in `status_detail`); everything else in `extensions`
under `outreach.*`; namespace event types and metric keys; never overload core
semantics.

## The Gate 6 question: what is `project` for a sales-engagement platform?

| Candidate mapping | Sketch | Tension |
|---|---|---|
| **A. `project` = client campaign/engagement** *(expected recommendation)* | An explicit entity grouping the sequences + prospects worked for an end client — what a PEAK client's dashboard should show ("your deal's outreach: N contacted, M meetings booked"); serves every agency-shaped tenant | Requires the campaign entity to exist in the MVP data model |
| B. `project` = opportunity/deal | Cleanest fit to the frozen status enum | MVP may contain no opportunity objects (CRM-mastered) → producer ships empty |
| C. `project` = sequence | Always exists at MVP | Semantically weak as a client-facing "unit of work" |
| D. metrics + contacts only at first | Smallest producer | Undercuts the producer-from-MVP decision; `projects` is the dashboard's spine |

## To be produced at Gate 6 (checklist)

- [ ] Decision memo per the option anatomy → decision-log Gate 6 record
- [ ] `project.status` mapping table (native stage → core enum + `status_detail`)
- [ ] Prospect → `contact` field mapping; org → `tenant`
- [ ] Whether `invoice` is emitted at MVP (likely deferred to billing phase — raise a
      contract note, do not reinterpret fields)
- [ ] Core metric keys with core semantics (`revenue_mtd` and friends) + `outreach.*`
      metric catalog: `outreach.emails_sent`, `outreach.reply_rate`,
      `outreach.meetings_booked`, `outreach.active_prospects`, …
- [ ] `schemas/extensions/outreach.*.schema.json` + golden fixtures (endpoint + event),
      added to `scripts/validate-connect-fixtures.mjs`'s maps so CI enforces them
- [ ] Event types: which core events fire at MVP (`contact.created`,
      `project.created`, `project.status_changed`) + any `outreach.*` extension events
      (e.g. `outreach.sequence.completed`), each with an envelope fixture
