# Runbooks — Founder-Only Actions

Runbooks cover the steps only Andrew can perform (accounts, purchases, dashboard
settings, legal). Policy, learned the hard way in subsidiary #1:

- **Cloud-first, always.** Andrew has no local dev setup. Every runbook leads with
  "do it in the dashboard / paste keys in Vercel" — local-dev instructions appear only
  as an aside, if at all.
- **Numbered steps + a "You're done when" section** with a check a non-developer can
  perform. The final step of a launch-adjacent runbook IS the end-to-end test.
- **Superseded runbooks get a banner at the top** pointing to what replaces them —
  never only a note in a later runbook.
- No upsells: when a runbook says buy something, it says exactly which add-ons to
  decline.

## Index

| # | Runbook | Status |
|---|---|---|
| 01 | `01-repo-privacy.md` — flip this repo private | **ACTIVE — Gate 1 precondition** |
| 02 | domain + branded email (buy the Gate 2 `.com`, DNS, mailboxes) | Planned — written at Phase 2 |
| 03 | Vercel setup (site project, root directory, env vars, domain) | Planned — Phase 2 |
| 04 | Supabase setup (project, migrations, keys) | Planned — Phase 2 |
| 05 | legal-counsel checklist (trademark clearance, comparative-ad review, ToS/privacy, **Outreach ToS competitive-use review** flagged from Gate 1) | Planned — Phase 2 |
| 06 | site-launch checklist (Gate 3 acceptance half) | Planned — Phase 2 |
| 07 | mailbox OAuth verification (Microsoft publisher verification; Google restricted-scope assessment if gated in) | Planned — Phase 3, per `docs/plan/long-lead-register.md` |
| 08 | sending domains + warmup operations | Planned — Phase 3/4 |
| 09 | Stripe billing activation (build-now-charge-at-GA switch) | Planned — Phase 5 |
| 10 | dogfood go-live checklist (Gate 7 acceptance) | Planned — Phase 4 |
