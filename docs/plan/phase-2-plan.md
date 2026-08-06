# Phase 2 Plan — Synthesis & Storefront

**Opened:** 2026-08-06, after Gate 2 closed (Nudgerow; nudgerow.com purchased via
Vercel same day). Per the gate cadence rule this phase is DONE when its verification
rows pass and its memos exist; its gate is **Gate 3 — MVP scope & cutline (decision) +
site-launch acceptance**.

## Scope

1. **Gate 3 memo** (`docs/plan/gates/gate-03-mvp-scope-cutline.md`): the doc-11 draft
   cutline refined against `docs/research/inputs/customer1-requirements.md` (R1–R9),
   with the mandatory dogfood-vs-market section. Option anatomy; R9 (no telephony for
   customer #1) removes dialer options from the dogfood path entirely.
2. **Marketing site** (`apps/site`): Next.js 16 + Tailwind 4, ported from the Eaverow
   site's proven patterns (waitlist adapter with file fallback + 503-never-silent,
   honeypot + per-IP rate limit, `lib/nav`, `lib/seo` JSON-LD with
   `parentOrganization` → Vantrow, llms.txt/robots/sitemap, zero third-party scripts),
   consuming every brand string from `@vantrow/brand`. Pages: `/`, `/product`,
   `/pricing` (founding-customer framing, **no fabricated tiers or numbers**),
   `/vs-outreach` (**built last**: claims table from docs 07/08/12 with S-ID
   footnotes, ≥2 honest concession rows, the required disclaimer, "as of" dates,
   legal-lint clean), `/about` (Vantrow family story), `/early-access` (+`/thanks`),
   `/privacy` + `/terms` (structural drafts marked TODO(legal)).
3. **Waitlist backend**: `supabase/migrations/0001_waitlist.sql` (family pattern: RLS
   enabled, no policies, service-role writes only).
4. **Claims lint in CI**: `scripts/lint-site-claims.mjs` runs `@vantrow/growth`
   legal-lint over the site's marketing copy; `block` findings fail CI.
5. **Runbooks 02–06** (cloud-first, "You're done when" each): 02 domain & branded
   email (Vercel-purchased domain state, Workspace/forwarding paths, SPF rule,
   secondary sending domains) · 03 Vercel site project (root dir `apps/site`, env
   table, custom domain) · 04 Supabase (project, 0001 SQL, keys → Vercel) · 05
   legal-counsel checklist (NUDGEROW clearance incl. Nudge.ai/Affinity flag,
   comparative-ad review, ToS/privacy, Outreach ToS competitive-use review from Gate
   1) · 06 site-launch checklist (the Gate 3 acceptance half: sentinel greps, legal
   blocking items, end-to-end production form test, Lighthouse, 90-day claim
   re-verification reminder).

## Division of labor

Site build = one focused agent (playbook rule: single agent for coherent builds),
porting from `/workspace/andrewpbrown33/vantrow-acculynx/apps/site`. Gate 3 memo,
runbooks, and migration = orchestrator. `/vs-outreach` copy grounds in docs 07/08/12
and must pass the claims lint.

## Verification (program-plan Phase 2 rows + additions)

- Site `pnpm lint && typecheck && build` green; root suite green; CI green on the PR.
- Zero literal brand strings in `apps/site` outside `@vantrow/brand` imports (grep).
- Local `curl -X POST /api/waitlist` writes the JSONL file fallback.
- `scripts/lint-site-claims.mjs` exits 0 (no block findings) — wired into CI.
- Every `/vs-outreach` claim footnoted to an S-ID; ≥2 concession rows; disclaimer
  present; zero unresolved `[SHIP-GATE]` markers on publishable pages (CI grep).
- `0001_waitlist.sql` lints (applied later by Andrew via runbook 04).
- Gate 3 memo complete per the option anatomy with the dogfood-vs-market section.
