# 13 — Migration Feasibility: How a Team Actually Leaves Outreach

**Tier:** P (+F/R later, only for the founder exporting *his own* data under protocol §1
Tier R — nothing in this draft uses account knowledge). **Workstream:** H.
**Sources:** `sources/migration.md` (S-MIG). **Feeds:** onboarding/concierge design and
the doc 12 switching-cost thesis.

**Evidence tiers used in this doc:**
- **P** — Outreach's own public pages (help center, developer portal). Facts.
- **S** — other vendors' official migration docs (Gong, Apollo). Facts about *their*
  services; strong signal about what's extractable in practice.
- **T** — third-party blogs/aggregators. Leads to verify, never load-bearing.

## 1. The export surfaces that exist

| Path | What it yields | Constraints | Evidence |
|---|---|---|---|
| In-app UI export (CSV) | Prospects, accounts, opportunities, calls, tasks, emails (outbox activity), sequence states, sequence stats, users | ≤200 rows download instantly; larger runs async → emailed link; **100K rows max per export** (partition by owner); links die after 7 days; fixed CSV shape | P [S-MIG-001][S-MIG-002] |
| REST API (api.outreach.io) | Everything the UI export covers **plus the content the UI withholds**: sequences, sequence steps, templates, snippets, mailings, calls metadata | OAuth app authorized by the customer; JSON:API; **10,000 requests/hour per user**; bulk endpoints exist | P [S-MIG-004][S-MIG-005] |
| One-off "ad hoc" full export | 50+ tables as compressed JSON — incl. prospects, accounts, **sequences, mailings, templates**, calls, tasks, opportunities, users | Admin support ticket; **≈1 month turnaround**; 12-hour download window; customer must ETL raw JSON; no published price | P [S-MIG-003] |
| Snowflake Data Sharing | Warehouse-grade share of Outreach data | Referenced as an export path on a support page; tier/entitlement unknown | P (existence) [S-MIG-009] |
| CRM itself | Whatever sync already wrote to Salesforce/Dynamics (activities, field values) | Only as good as the customer's sync config; not an Outreach export at all | INFERENCE from doc 02/crm-sync |

**The critical asymmetry [S-MIG-001]:** the self-serve UI deliberately exports *records
and stats* but **not working content** — Outreach's export overview lists templates and
snippets as not exportable, sequences export only their stats/membership, call
recordings don't export, and email bodies don't export (only outbox activity rows). The content a team most needs to
recreate its motion elsewhere is reachable only via API or the month-long ticket path.

## 2. Portable vs. locked

| Asset | Self-serve UI | API | Ad-hoc export | Verdict |
|---|---|---|---|---|
| Prospects/accounts/opps (records + custom fields) | Yes (CSV, 100K chunks) | Yes | Yes | **Portable** |
| Activity history (emails sent, calls, tasks) | Activity rows yes; bodies no | Mailings/calls resources; template `bodyHtml` and call `recordingUrl` attributes appear in public schema listings — **T-tier lead, verify against API reference** [S-MIG-010] | Yes (mailings table) | **Portable with engineering** |
| Sequence *structure* (steps, intervals, rulesets) | No | Yes (sequences, sequenceSteps) | Yes | **Portable via API only** |
| Templates & snippets (the copy) | **No** | Yes | Yes | **Portable via API only** |
| Sequence *stats* (A/B history, reply rates) | Yes (CSV) | Yes | Yes | Portable as numbers; meaning decays — can't distinguish manual vs automated step performance in exports [S-MIG-009] |
| Call recordings | **No** | recordingUrl lead (T) [S-MIG-010] | Unclear | **At risk / verify** |
| Opt-out & compliance state | Prospect fields (opt-out is prospect-level, per-channel when granular opt-outs are on [S-MIG-008]) | Yes | Yes | **Portable — and mandatory to carry** |
| Reporting configs, triggers, rulesets, admin config | Not found on public surfaces | Partial (some resources) | Possibly (50+ tables) | **Practically locked** — rebuild |
| Data after churn | — | Account access ends | Must request in time | **Deleted 60 days after service ends** [S-MIG-003] — exports must happen *before* termination |

## 3. Sequence-content portability (the heart of a switch)

What Gong and Apollo actually do when they take an Outreach customer (S-tier — their
own migration docs):

- **Gong Engage** [S-MIG-006]: paid concierge migration, API-driven with temporary admin
  access or API keys. Migrates templates/blocks, snippets, and *active, interval-based*
  sequences; owner-matches personal content by email; company-level content must be
  pre-tagged by the customer. Loses: images inside templates, conditional variables
  (no translation target), date-based sequences, inactive content.
- **Apollo** [S-MIG-007]: request-based migration of sequences (steps + the templates
  used in them + drafts), turnaround hours-to-a-day. Explicitly does **not** carry
  historical data, snippets, past emails, notes, or activities.

Read across both: **structure and copy move; history and cleverness don't.** Variable
syntax ({{first_name}}-style tokens, conditionals), send-window rules, and
branch/trigger logic all need a mapping layer into the destination's semantics, and
every vendor draws its own line on what it refuses to translate.

## 4. Realistic concierge-migration sketch (our Phase-5+ offer)

Design target: "leave Outreach in a week, lose nothing you'll miss."

1. **Scope call + credentials.** Customer admin creates an OAuth app / grants our
   migration tool access (their right as the account holder; we never hold their
   password — mirrors Gong's temporary-access pattern [S-MIG-006]). They tag
   company-owned content to move.
2. **API inventory pass (hours).** Enumerate users, prospects, accounts, opps,
   sequences, steps, templates, snippets, mailings, calls, tasks via API at
   10k req/hr/user [S-MIG-004] — for a mid-market org this is small; the constraint is
   mailings/activity volume, so plan pagination + resume.
3. **Content translation.** Templates/snippets → our editor (verify image handling
   early — the known Gong loss [S-MIG-006]); variables → our token dialect w/ a report
   of untranslatables; sequences → our step/interval model, flagging date-based and
   trigger-dependent constructs for human review.
4. **Compliance first-class.** Opt-outs/unsubscribes and bounce history land as a
   suppression list *before* any sending is enabled (protocol §10 posture; per-channel
   granularity preserved [S-MIG-008]).
5. **Records + history.** Prospects/accounts/opps with custom fields; activity history
   imported as timeline events (bodies where extractable, else metadata) — sold honestly
   as "reference history," not re-usable sends.
6. **Cutover.** Sequences arrive paused; side-by-side validation (counts per object,
   spot-check N templates); DNS/deliverability setup runs in parallel per doc 14; then
   staged re-activation.
7. **Escape-hatch clause for slow paths.** If the customer wants recordings or oddball
   tables, file the ad-hoc export ticket on day 1 (≈1-month lead [S-MIG-003]) so it
   lands during, not after, onboarding.

Feasibility verdict: **a faithful structural migration is fully feasible via the public
API; the moat Outreach retains is history-shaped** (recordings, report continuity,
manual-vs-auto stat lineage) — which argues for selling the migration on "your motion
moves; your dashboards restart."

## 5. What competitors' migration marketing claims (T-tier, leads only)

Third-party comparison content repeats a 6–8-weeks-of-lost-productivity switching figure
and advises negotiating a data-export guarantee clause — useful objection-handling
language, not evidence; do not cite outward without independent verification.

## Unknowns

1. Whether mailing bodies and call `recordingUrl` are actually populated/downloadable at
   customer scope via API (schema listings are T-tier [S-MIG-010]) — blocks the
   "reference history" promise until verified.
2. Ad-hoc export entitlement: plan-gated? priced? one per customer? [S-MIG-003] is
   silent.
3. Snowflake Data Sharing tier/cost/entitlement [S-MIG-009].
4. Whether API tokens/apps survive into a churn notice period (access during offboarding).
5. Rulesets/triggers/admin-config export coverage in the 50+ ad-hoc tables.
6. Practical API throughput on large mailings tables (page sizes, filter pushdown) vs
   the 10k/hr budget.

## Open questions a live account could answer (FLAG FOR F-PASS — Tier R self-export only; nothing here asserts account knowledge)

- F-Q1: Does the founder's Engage-core tier expose the UI export surfaces exactly as
  [S-MIG-001] describes (all listed object types present)?
- F-Q2: Create one throwaway template in his own account, extract via API: does
  `bodyHtml` round-trip with images intact?
- F-Q3: Export his own sequences via API: do step intervals, send windows, and variable
  tokens serialize completely?
- F-Q4: What does the in-app opt-out export actually contain (per-channel columns)?
- F-Q5: File nothing, but ask support the ad-hoc export's price/entitlement as a
  customer question.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
