# Hard-Problems Register

The four problems where this product is actually won or lost. None of them is UI. This
register is **reviewed at every gate**: each entry's mitigation and test coverage must be
current, or the gate does not close. (Eaverow's equivalent lesson: 17 of 18 adversarial
review findings were still open at snapshot — tracked risk beats remembered risk.)

Source analysis: `docs/research/inputs/replication-scope-brief.md` §9 and §14 (lands in
Phase 1).

| # | Problem | Why it's hard | Current mitigation | Test coverage |
|---|---|---|---|---|
| 1 | **Sequence-engine correctness** | Millions of scheduled, stateful, multi-channel touches: exactly-once under crash/retry; a reply must race-cancel the next touch; timezone/DST-correct fire times; per-mailbox throttling; editing a live sequence with active enrollments | Gate 5 decides the substrate; design principles fixed now: durable timers in Postgres, claim-and-execute (`FOR UPDATE SKIP LOCKED`), idempotency touch-ledger, execute+advance in one transaction, final in-transaction pause re-check, swappable dispatcher | Phase 4 CI suite (verification table): ledger-dedupe under simulated crash, reply-race cancellation, DST fire-times, throttle ceiling, OOO≠reply |
| 2 | **Email deliverability** | If mail lands in spam the product is worthless; bulk-sender rules (SPF/DKIM/DMARC, one-click unsub, complaint <0.3%) tighten yearly; reputation is earned in calendar weeks, not code | Doc 14 (deliverability playbook) in Phase 1; secondary sending domains + warmup state modeled on the Mailbox entity from the first migration; founder-side domain/mailbox infra stood up early (long-lead register); no deliverability promises anywhere (legal-lint blocks them) | Phase 4: send-path self-diagnostics; Phase 5: monitoring + auto-pause unhealthy mailboxes; warmup throttle honored in engine tests |
| 3 | **CRM bidirectional sync** | The CRM is the customer's system of record; a sync bug that corrupts it is account-ending; conflict resolution, field mapping, rate limits, loop prevention, reconciliation | Deliberately **deferred past dogfood** (Gate 8): MVP ships one-way import (CSV/Affinity-lite for PEAK); two-way sync is its own phase with a local-mirror design and a mandatory reconciliation sweep | Phase 5: seeded-divergence reconciliation test; write-back tested against a sandbox org before any real tenant |
| 4 | **Multi-tenant reliability & fairness** | Noisy-neighbor isolation, per-tenant quotas, an observable async pipeline ("why didn't this prospect get emailed?" answerable in seconds) | Family pattern: `org_id` everywhere + Postgres RLS with the membership predicate (Eaverow's 0004 security fix applied from the first migration, not retrofitted); per-tenant partitioned scheduling in the engine design; append-only Event stream from Phase 4 | Phase 4: RLS tenant-isolation test (two orgs, mutual invisibility); engine fairness test (one org's backlog cannot starve another's due touches) |

## Standing design commitments (carry into every phase plan)

- **Adapter-pattern env-gated stores** for every external surface (file/in-memory dev
  implementation + real backend behind one interface) — the family's proven seam.
- **Unbypassable suppression:** no code path — human, cron, or agent — sends to a
  suppressed address. CI-tested from the first engine build (protocol §10).
- **Draft → approval for our own outbound; per-step tenant opt-in for product
  auto-send** (protocol §10).
- **Per-org COGS instrumentation from Phase 4 day one** (mailbox ops, sends, LLM calls) —
  Gate 9 pricing needs measured, not guessed, unit costs (the Eaverow pricing-analysis
  lesson: two same-day supersessions came from an unmeasured cost model).
