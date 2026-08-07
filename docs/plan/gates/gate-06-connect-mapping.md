# Gate 6 — Vantrow Connect `outreach.*` Mapping

> **DECIDED 2026-08-07 — Option C, project = sequence (Andrew overruled the campaign recommendation: "organize outreach by sequences overall").** Plus: the dashboard connection is a paid per-client add-on (Gate 9 input). Record: decision log.

**Type:** Decision gate.
**Question:** how does Nudgerow map onto the Connect core model — above all, **what is
`project`** for a sales-engagement platform? (Producer-from-MVP is a locked decision;
Gate 7 acceptance requires the producer green in CI.)
**Grounding:** `docs/specs/vantrow-connect/overview.md` (five core entities; frozen
`project.status` enum; adoption rules 1–5), `adoption-outreach.md` (the checklist this
memo fills), the Gate 3 Option E data model, and the PEAK dashboard story (a client
sees *their deal's outreach*).

Fixed by the contract regardless of option: `org → tenant` · `prospect → contact` ·
`invoice` **not emitted at MVP** (billing lands Phase 5; a contract note records the
deferral rather than reinterpreting fields — rule 5) · all product-specific detail in
`extensions` under `outreach.*` with JSON Schemas + golden fixtures validated by the
existing CI job.

## Options — what is `project`?

| # | Mapping | One-line | Verdict |
|---|---|---|---|
| A | `project` = **client campaign/engagement** | An explicit entity grouping the sequences + prospects worked for one end client | **Recommended** |
| B | `project` = opportunity/deal | Cleanest enum fit, but MVP has no opportunity objects | Empty producer at MVP |
| C | `project` = sequence | Always exists, semantically weak for a client dashboard | Fallback only |
| D | metrics + contacts only | Defer `projects` | Undercuts the producer mandate |

### A — `project` = client campaign/engagement ★

A **Campaign** entity enters the MVP data model (cheap: id, tenant, client-name/ref,
grouped sequences, lifecycle status): "the outreach we are running for client X."
Exactly what a PEAK client's Vantrow dashboard should render — *your deal's outreach:
N contacted, M replied, next steps live* — and it generalizes to every agency-shaped
tenant; solo in-house tenants get a default campaign transparently.
- **Status mapping (native → frozen core enum):** draft→`lead` · scheduled→`quoted`
  (status_detail carries the native word) · active→`in_progress` · paused→`in_progress`
  (detail: paused) · finished→`completed` · archived→`closed` · canceled→`canceled`.
  Rule 2 honored: every native stage maps to exactly one core status; nothing new
  minted.
- **Biggest weakness:** it adds an entity the Option E core didn't strictly need —
  scope discipline requires Campaign to stay thin (a grouping + status, not a
  project-management surface).

### B — `project` = opportunity/deal

Semantically the contract's own example ("unit of work"), but opportunities are
CRM-mastered and **absent from the MVP** — the producer would ship emitting nothing,
which is how subsidiary #1 got a 0% producer.
- **Biggest weakness:** correctness in theory, vacuum in practice.

### C — `project` = sequence

Always populated, trivially mapped — but a client dashboard listing raw sequences
leaks internal mechanics and reads as noise to an end client.
- **Biggest weakness:** semantic mismatch with the dashboard's audience; kept as the
  fallback if A's Campaign entity gets cut at Phase 4 planning.

### D — metrics + contacts only

- **Biggest weakness:** `projects` is the dashboard's spine; shipping without it
  repeats the Eaverow gap this program exists to close.

## Metric catalog (applies with A)

**Core keys — honest semantics check (rule 4/5):** `revenue_mtd`,
`jobs_in_progress`, `avg_cycle_days` were minted for job-shaped verticals. At MVP:
`jobs_in_progress` = active campaigns (defensible, emitted); `avg_cycle_days` = median
days from first touch → reply per completed enrollment (defensible, emitted);
`revenue_mtd` has **no honest MVP semantics** (no billing, no deal values) — **not
emitted**; a coordinated contract note records this (the consumer must already
tolerate absent metrics; rule: never fake core semantics).

**`outreach.*` extension keys (emitted from day one):** `outreach.emails_sent` ·
`outreach.reply_rate` · `outreach.bounce_rate` · `outreach.active_prospects` ·
`outreach.finished_no_reply` (the cracks number — the dashboard's most Nudgerow-shaped
stat) · `outreach.meetings_logged` (external interactions, R9).

**Events at MVP:** `contact.created` · `project.created` ·
`project.status_changed` (core-status changes only) + extension events
`outreach.enrollment.finished` and `outreach.prospect.replied` (by-id references,
envelope per the contract). Each gets a golden fixture added to
`scripts/validate-connect-fixtures.mjs`'s maps — the CI job enforces them from the
first producer commit.

### #1 pick: **A**

It is the only mapping that is simultaneously populated at MVP, meaningful to the
dashboard's actual audience, and thin enough to respect the Option E scope. B stays
the documented evolution once a deals layer exists (a campaign can later reference an
opportunity id without re-mapping).

> ## Next steps — do these in order
> 1. **Andrew:** confirm or redirect (the visible consequence: your clients' future
>    Vantrow dashboards organize outreach **by campaign/engagement**, not by raw
>    sequence).
> 2. **Agent:** record Gate 6; fill `adoption-outreach.md`'s checklist; author the
>    `outreach.*` schemas + fixtures in the Phase 4 producer work; raise the two
>    contract notes (invoice deferral; revenue_mtd non-emission) as a coordinated
>    revision note in `PROVENANCE.md`.
