# Decision Log

Dated record of program decisions. Newest first. Never delete — supersede: strike the
old title, append **(superseded — reason)**, keep the detail, point at the replacement
row. "Decided by" vocabulary: `Andrew` (founder ruling) · `Claude` (agent analysis) ·
`plan` (approved program plan) · `Claude, awaiting Andrew` (proposal pending sign-off).

| Date | Decision | Detail | Decided by |
|---|---|---|---|
| 2026-08-06 | **GATE 1 CLOSED: research account posture → B, founder-as-design-partner (split corpus)** | Repo verified **Private** on GitHub before closing (precondition, runbook 01). Tier F activates under protocol §1: Andrew may describe his licensed Engage-core usage and supply screenshots as internal-only F-ID entries in `docs/research/outreach/00b-founder-input-log.md`; F-material verifies and prioritizes but is never quotable, never reproduced, and never the sole source for a published claim; the agent never authenticates; unlicensed modules (dialer/CI/deals/forecast) stay Tier-P. Strict public-only (option A) remains the documented fallback posture, switchable by one decision-log row. Counsel question (Outreach ToS competitive-use/benchmarking clauses) stays flagged to the Phase 2 legal-counsel runbook. Memo: `docs/plan/gates/gate-01-research-account-posture.md`. | Andrew |
| 2026-08-05 | Session-level calls: Connect vendored, apps deferred | The Vantrow Connect spec is vendored into this repo verbatim (`docs/specs/vantrow-connect/` + `PROVENANCE.md` with source SHA) so future sessions never depend on cross-repo attachment, with fixture validation wired into CI from the first commit — Eaverow specced Connect and built 0%, partly because its CI never checked the fixtures. `apps/site` and `apps/platform` are deferred to Phases 2/4: under the deliberate cadence the brand name exists before the site is built, so there is no reason to build brand-agnostic UI first. Brand-string discipline still applies from day 1 (grep check). | plan |
| 2026-08-05 | **Gate ledger defined; Gate 1 = research account posture (not naming)** | Eaverow's Gate 1 was the name. Here the account posture must come first: research cannot start without knowing what the founder's paid account may be used for, while naming *wants* research (doc 10 collision input) before it. Naming is Gate 2 with the RDAP pre-screen as seed. Gates numbered globally, never reused (Eaverow's "Gate 2" name collision documented in its playbook). | plan |
| 2026-08-05 | **Stack: reuse the family stack; new platforms only via gates** | pnpm monorepo, Next 16 / React 19 / Tailwind 4, Supabase (auth+Postgres+RLS+storage), Stripe, Resend, Vercel ×2, Anthropic SDK, adapter-pattern env-gated stores, Vercel cron — per Andrew: avoid new accounts/platforms unless necessary. Unavoidable new dependencies for this vertical (mailbox OAuth; later possibly telephony, unified-mailbox vendors, workflow engines, STT) are explicit gate decisions with build-vs-buy options, never defaults. | Andrew |
| 2026-08-05 | **Naming: strict family pattern** | `-row` suffix + available `.com`, registered the same day as the naming gate (availability decays). RDAP pre-screen run 2026-08-05 and logged as dated evidence in `docs/legal/trademark-screens.md`: 11 available (pitchrow, touchrow, cadencerow, sequrow, closerow, campaignrow, warmrow, engagerow, funnelrow, quotarow, outreachrow — last pre-flagged elevated-risk), 20 taken. Phase 1 still runs the full domain-first sprint (≥40 candidates) per playbook mistake #2. | Andrew |
| 2026-08-05 | **Gate cadence: deliberate** | One gate at a time; each phase fully done and reviewed before its gate decision; every key decision presented as 3–4 options with a recommendation in the Eaverow memo anatomy. | Andrew |
| 2026-08-05 | **Vantrow Connect: producer from MVP** | Subsidiary #3 implements the Connect producer side as part of the MVP (Gate 6 decides the `outreach.*` mapping; Gate 7 acceptance requires producer green in CI + rendered output). The contract is fully specced but 0% implemented after two subsidiaries — this repo becomes the reference producer. | Andrew |
| 2026-08-05 | **Research method: clean-room, three tiers; account posture → Gate 1** | Protocol adopted this session, before any research content (`docs/legal/clean-room-protocol.md`). Tier P public / Tier F founder-corpus (dormant until Gate 1) / Tier R first-party requirements (unconstrained). Andrew's account is **Engage core only**, so dialer/CI/deals/forecast research is Tier-P regardless of the Gate 1 outcome. Standing rules independent of posture: the agent never authenticates; no research directed at the authenticated product; counsel reviews the competitive-use clauses. | Andrew |
| 2026-08-05 | **Repo private before research** | Andrew flips `vantrow-outreach` to private (runbook 01) — a hard Gate 1 precondition. He had chosen public only in the belief it eased agent access; it does not (Parcelrow is private and was built fine). This session commits nothing incumbent-derived, so the branch is safe while public. Follow-up flagged: `vantrow-acculynx` is public but its own README says it must stay private — Andrew to fix separately. | Andrew |
| 2026-08-05 | **Business model: commercial SaaS + dogfood** | Built to sell to sales/SDR teams like the other subsidiaries; Vantrow/PEAK is customer #1 (M&A advisory outbound: Affinity CRM, M365/Gmail, low-volume/high-stakes). Dogfood informs scope but must not define it — every scope/provider/pricing memo carries a dogfood-vs-market section. | Andrew |
| 2026-08-05 | **Target: Outreach (outreach.io) — subsidiary #3** | Replicate the validated sales-engagement incumbent under the Vantrow family pattern, following the Eaverow playbook with its recorded mistakes corrected (tests in Phase 0, global gate numbers, cloud-first runbooks, token-drift rule, fixture validation in CI, domain-first naming round 1). Program plan: `docs/plan/program-plan.md`. | Andrew |

## Gate 1 record — research account posture

Memo: `docs/plan/gates/gate-01-research-account-posture.md`.

- **Precondition:** ✅ repo shows **Private** on GitHub (flipped by Andrew; verified via
  repo listing, 2026-08-06)
- **Chosen posture:** ✅ **B — founder-as-design-partner, split corpus** (decided by
  Andrew in chat, 2026-08-06; the memo's #1 pick)
- **Protocol activation:** ✅ Tier-F rules of protocol §1 are ACTIVE;
  `docs/research/outreach/00b-founder-input-log.md` header flipped in the same commit
  as this record. Option A (strict public-only) remains the documented fallback,
  switchable by one decision-log row.
- **Counsel follow-up:** _open — Outreach ToS competitive-use/benchmarking clause review
  goes into the legal-counsel runbook when written (Phase 2)_
