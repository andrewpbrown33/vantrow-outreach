# Phase 3 Plan — MVP Architecture (Gates 4 · 5 · 6)

**Opened:** 2026-08-06, after PR #3 merged (Phase 2 storefront on `main`; Gate 3
decision half closed → **Option E, Auto-Email Core**; acceptance half runs on Andrew's
runbooks 02–06 in parallel and does not block this phase).

## Scope

Three option memos, produced in this phase, decided **in order** (one gate at a time):

1. **Gate 4 — mailbox provider & connection path**
   (`docs/plan/gates/gate-04-mailbox-provider.md`). Required founder input: which
   mailbox PEAK actually sends outreach from day-to-day (M365 vs Gmail) — the memo
   carries a conditional recommendation resolved by that answer.
2. **Gate 5 — sequence-engine substrate**
   (`docs/plan/gates/gate-05-engine-substrate.md`). Design-level analysis grounded in
   doc 04's enrollment state machine, doc 14's provider limits, and the hard-problems
   register; no code spikes needed — the candidate patterns are all family-stack
   primitives with well-documented behavior.
3. **Gate 6 — Vantrow Connect `outreach.*` mapping**
   (`docs/plan/gates/gate-06-connect-mapping.md`), filling
   `docs/specs/vantrow-connect/adoption-outreach.md`'s checklist: the `project`
   question, status mapping, metric catalog (core-key semantics honestly assessed;
   contract notes raised where they don't fit rather than overloaded — adoption
   rule 5), extension schemas + fixtures plan.

Constraints carried in: the Gate 3 Option E contract (auto-email core; no telephony;
Affinity-lite import; three reports + cracks view), R1–R9, the no-new-platforms
default (any vendor option must argue "necessary"), and the long-lead register's
verification clocks quoted per option.

## Out of scope

Platform code (Phase 4, after Gate 6 closes). The Phase 2 design pass (brand identity
memo) runs as its own thread when Andrew wants it — it does not gate architecture.

## Verification (program-plan Phase 3 rows)

- The three memos complete per the option anatomy (summary table with per-row
  grades/verdicts · per-option "Biggest weakness" · ranked · #1 pick · next-steps
  blockquote) — this plan file predates the memos in the same push.
- Every option that touches a verification/compliance clock quotes the long-lead
  register's current state for it.
- Gate 4's memo states both conditional branches (M365-primary vs Gmail-primary)
  explicitly.
- No spike code in the repo (none needed); no new dependencies introduced.
- Root suite + spec checks stay green; CI green on the PR.
