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
| 01 | `01-repo-privacy.md` — flip this repo private | ✅ Done 2026-08-06 (Gate 1 precondition) |
| 02 | `02-domain-and-email.md` — Vercel domain (✅ purchased), Workspace email, SPF rule, secondary sending domains | **ACTIVE** |
| 03 | `03-vercel-site.md` — site project, root directory `apps/site`, env vars, custom domain | **ACTIVE** |
| 04 | `04-supabase-waitlist.md` — project, `0001_waitlist.sql`, keys → Vercel | **ACTIVE** |
| 05 | `05-legal-counsel-checklist.md` — NUDGEROW clearance (Nudge.ai/Affinity flag), Outreach ToS review, comparative-ad + ToS/privacy sign-offs | **ACTIVE — item 1 opens now** |
| 06 | `06-site-launch-checklist.md` — Gate 3 acceptance, site half | ACTIVE (runs at Gate 3) |
| 07 | mailbox OAuth verification (Microsoft publisher verification; Google restricted-scope assessment if gated in) | Planned — Phase 3, per `docs/plan/long-lead-register.md` |
| 08 | sending domains + warmup operations | Planned — Phase 3/4 |
| 09 | Stripe billing activation (build-now-charge-at-GA switch) | Planned — Phase 5 |
| 10 | dogfood go-live checklist (Gate 7 acceptance) | Planned — Phase 4 |
