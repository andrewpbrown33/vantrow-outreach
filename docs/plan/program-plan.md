# Vantrow White-Label Platform #3 — Outreach-Competitor Program Plan

## Context

Vantrow is building a family of white-label vertical-SaaS subsidiaries, each connecting to
personalized client dashboards built through Vantrow. Subsidiary #1 is **Eaverow**
(vs AccuLynx, roofing); subsidiary #2 is **Parcelrow** (vs Knakal Map Room, CRE).
Subsidiary #3 — this repo — is a competitor to **Outreach** (outreach.io / outreach.ai),
the platform that created the sales-engagement category: multi-channel sequences, a
prioritized rep task queue, activity capture, and (in its current form) an agentic-AI
layer across the revenue cycle. This repo (`andrewpbrown33/vantrow-outreach`) is the
**monorepo** for everything: plan, legal, competitive teardown, brand, marketing site,
integration spec, and eventually the product.

**Positioning (working):** the AI-native sales-engagement platform that is radically
simpler and transparently priced vs. Outreach's dense, opaque, per-seat enterprise
model — with live Vantrow client dashboards as the family hook.

**Method:** this program follows `docs/playbook/replication-playbook.md` (the process
extracted from Eaverow) — *decide → fan out in parallel → gate on the founder →
converge → iterate* — with that playbook's recorded mistakes corrected (tests from
Phase 0, global gate numbers, cloud-first runbooks, token-drift rule, fixture validation
in CI).

### Decisions locked in with Andrew (2026-08-05)

| Decision | Choice |
|---|---|
| Business model | Commercial SaaS + dogfood: Vantrow/PEAK is customer #1 |
| Repo | This monorepo; **flipped PRIVATE before any research content lands** (runbook 01 — Gate 1 precondition) |
| Research method | Clean-room protocol (`docs/legal/clean-room-protocol.md`); founder's paid-account posture decided at **Gate 1** |
| Founder's Outreach license | **Engage core only** — sequences/email/tasks/reporting. Unlicensed modules (dialer, CI, deals, forecast) are Tier-P research regardless of Gate 1 |
| Vantrow Connect | Producer implemented **from MVP** — this subsidiary is the contract's first real producer |
| Gate cadence | **Deliberate**: one gate at a time; a phase is fully done + reviewed before its gate |
| Naming | Family pattern: `-row` suffix, `.com` available, registered same day as the gate (pre-screen logged in `docs/legal/trademark-screens.md`) |
| Stack | Family stack reused: pnpm monorepo, Next.js 16 / React 19 / Tailwind 4, Supabase (auth+Postgres+RLS+storage), Stripe, Resend, Vercel (site + platform), Anthropic SDK, adapter-pattern env-gated data layer, Vercel cron. **New platforms only via explicit gate decisions** |

### Dogfood profile — customer #1

PEAK Technology Partners (M&A advisory) runs low-volume, high-stakes outbound: Affinity
CRM, Microsoft 365 + Gmail mailboxes, personalized sequences to founders/executives,
meetings as the conversion event. Dogfood **informs** scope; it must not silently
**define** it — PEAK is an atypical sales-engagement buyer (tiny volume, no SDR team),
so every scope/provider gate memo carries an explicit *dogfood-vs-market* section.

### Legal guardrails (baked into every phase)

- **Clean-room protocol** adopted before research starts (three source tiers; describe
  and re-implement; never copy Outreach text, images, UI, or docs; provenance for every
  claim; per-doc self-certification).
- **The paid account is gated:** the agent never authenticates; posture decided at Gate 1;
  incumbent-ToS competitive-use exposure is a named counsel question (protocol §9).
- **Trademark:** no Outreach-confusable mark (`outreachrow` pre-flagged); screens are
  first-pass only, never clearance.
- **Trade dress:** functional inspiration only; screenshots internal-only; repo private.
- **Comparative advertising:** factual, dated, sourced, nominative; enforced in code by
  `packages/growth/src/legal-lint.ts` (`[SHIP-GATE]` markers block approval).
- **Integrations honesty:** verification- or partner-gated integrations are "designed to
  integrate with" until real (protocol §8).
- **Outbound surfaces:** our content is draft→founder-approval always; tenant auto-send
  is per-step opt-in with unbypassable suppression (protocol §10).

---

## Repo layout (additive — no restructuring as the program grows)

```
/
├── README.md
├── docs/
│   ├── plan/            program-plan.md · decision-log.md · gates/gate-NN-<slug>.md ·
│   │                    phase-N-plan.md (written at each phase open) ·
│   │                    hard-problems.md · long-lead-register.md
│   ├── legal/           clean-room-protocol.md · comparative-advertising-checklist.md ·
│   │                    trademark-screens.md
│   ├── brand/           naming-decision-memo.md (Phase 1) · brand-guidelines.md (post-Gate 2)
│   ├── research/
│   │   ├── inputs/      replication-scope-brief.md (committed once repo is private)
│   │   └── outreach/    teardown docs 00–14 (Phase 1; map + tier table in its README)
│   ├── specs/vantrow-connect/   vendored contract + adoption-outreach.md + outreach.* extensions
│   ├── playbook/        replication-playbook.md (from Eaverow, provenance-headed)
│   └── runbooks/        cloud-first founder runbooks, numbered, each with "You're done when"
├── apps/                site/ (Phase 2) · platform/ (Phase 4) — deferred by design
├── packages/            brand/ (white-label tokens) · growth/ (legal-lint; pricing later)
├── scripts/             validate-connect-fixtures.mjs
├── supabase/            migrations/ (Phase 2+)
├── .github/             workflows/ci.yml · PULL_REQUEST_TEMPLATE.md
└── pnpm-workspace.yaml
```

Brand tokens live in `packages/brand` (CSS variables consumed by Tailwind) so every app
is brand-agnostic until Gate 2; the chosen name is a one-package diff. The schema is
deliberately fuller than subsidiary #1's (parent linkage, dark palette, typography,
shape tokens) so subsidiaries #4+ inherit a complete system.

---

## The gate cadence rule

> Every phase opens by writing `docs/plan/phase-N-plan.md`: scope, workstreams, additions
> to the verification table, and **which gate memos the phase must produce**. A phase is
> DONE when its verification rows pass and its memo(s) exist. A **gate** is a founder
> review that (a) accepts the finished phase and (b) decides the next question(s) from
> the memo(s). **Decision gates** present 3–4 options in the option-memo anatomy below;
> **acceptance gates** present verification evidence. One gate at a time; no next-phase
> work before the gate closes. **Gates are numbered globally, never reused, never
> renumbered** — a reversed decision gets a new gate number and a supersede row in the
> decision log. Every decision that touches config/tokens is applied in the same commit
> that logs it.

**Option-memo anatomy** (from Eaverow, all its memos): (1) summary table of options with
a one-line rationale + risk/verdict grade per row; (2) a detail section per option —
rationale, evidence (dated), collisions/objections, and an explicit **"Biggest
weakness"**; (3) ranked top-N; (4) **"#1 pick"** with why it beats #2; (5) a
**"Next steps — do these in order"** blockquote flagging any decaying/expiring actions;
(6) an adversarial review where the stakes warrant one.

---

## Phases

```
Phase 0  Foundations (THIS session): scaffold + CI/tests + legal + plan + Gate-1 memo   [serial, fast]
   ── GATE 1: research account posture (decision · precondition: repo PRIVATE) ──
Phase 1  Clean-room teardown fan-out (docs 00–14 per posture & tier map)
         + naming sprint tail (after doc 10 lands, for collision input)
   ── GATE 2: brand name (decision · register the .com the same day) ──
Phase 2  Synthesis & storefront: doc-11 matrix → MVP-cutline memo · brand applied to
         tokens · marketing site + /vs-outreach + waitlist · launch runbooks
   ── GATE 3: MVP scope & cutline (decision) + site-launch acceptance ──
Phase 3  MVP architecture: spikes + phase plan + three option memos
   ── GATE 4: mailbox provider & connection path (decision) ──
   ── GATE 5: sequence-engine substrate (decision) ──
   ── GATE 6: Vantrow Connect outreach.* mapping (decision) ──
Phase 4  MVP build: engagement loop + Connect producer + adversarial review
   ── GATE 7: dogfood go-live — PEAK live as customer #1 (acceptance) ──
Phase 5  Trust bar: deliverability ops · CRM v1 · billing plumbing · per-org COGS
   ── GATE 8: first CRM target & sync depth (decision) ──
   ── GATE 9: pricing & packaging (decision) ──
Phase 6  Commercial launch prep: onboarding · docs · counsel pass · claims lint clean
   ── GATE 10: commercial launch / GA (acceptance) ──
Phase 7+ Expansion, one phase-plan + gate each:
   GATE 11 telephony/dialer build-vs-buy + compliance posture
   GATE 12 second mailbox provider (whichever lost Gate 4)
   GATE 13 conversation-intelligence stack (buy: recording/STT vendors)
   GATE 14 second CRM
   GATE 15 AI-agent layer autonomy posture
```

**Depth-first rule:** Phases 0–4 go deep on the irreducible core loop — sequences +
task queue + activity capture + one mailbox provider + deliverability foundations.
Breadth (dialer, conversation intelligence, forecasting, agent library) waits until the
core is trusted. A shallow clone of fifteen modules is worth less than a correct core
loop; the research brief and Eaverow's matrix discipline both say so.

### Phase 0 — Foundations (this session)
Scaffold per the layout above; legal protocol **before any research content**; program
plan + seeded decision log; Gate-1 option memo; standing registers; Connect spec
vendored with fixture validation in CI; draft PR; **stop at Gate 1**.

### Phase 1 — Teardown + naming (opens with `phase-1-plan.md`)
Parallel research fan-out, one agent per doc, all appending to the sources log(s), page
budgets enforced, every doc with an "Unknowns" section and the self-certification line.
The doc set (license tiers in `docs/research/outreach/README.md`):

| Doc | Contents |
|---|---|
| `00-sources-log.md` | Every URL, access date, what was extracted (Tier-P provenance record) |
| `00b-founder-input-log.md` | Tier-F record — founder descriptions of his licensed usage (only if Gate 1 activates it) |
| `01-product-overview.md` | Positioning, ICP, module/packaging map (Engage/Call/Meet/Deal/Forecast + agents), roles, glossary |
| `02-feature-inventory/` | One file per module: sequences · email-deliverability · tasks-workflow · dialer-voice · meetings-scheduling · prospecting-data · opportunities-deals · conversation-intelligence · forecasting · reporting-analytics · crm-sync · admin-governance · mobile · ai-agents |
| `03-ui-walkthrough.md` | Nav IA, key screens (the 360° dashboard + play-through task flow especially), design language, praised/complained patterns — function only, per protocol §6 |
| `04-inferred-data-model.md` | Entities, fields, relationships; the **SequenceState machine**; engagement events; permission model — cross-checked vs 05 |
| `05-public-api-teardown.md` | api.outreach.io v2: resources, fields, webhooks, auth, rate limits — the highest-fidelity public window into their data model |
| `06-assumed-architecture.md` | Inferred stack/scale from job posts, eng blog, press — OBSERVED vs INFERENCE tagged |
| `07-pricing-packaging.md` | Tier ladder, add-on modules, AI credits, seat minimums, ACV benchmarks — dated, confidence-flagged |
| `08-review-mining.md` | G2/Capterra/TrustRadius/Reddit pains quantified (frequency × severity), praise themes, churn triggers — drives all marketing copy |
| `09-integration-landscape.md` | Every integration with an access-model column: **OPEN-API / VERIFICATION-REQUIRED (Google restricted-scope, Microsoft publisher, A2P) / PARTNER-REQUIRED / PROHIBITED (LinkedIn automation)** — feeds doc 11's third axis and the long-lead register |
| `10-market-landscape.md` | Salesloft, Apollo, Reply, lemlist, Amplemarket, AI-SDR wave — deltas; feeds naming-collision checks |
| `11-copy-priority-matrix.md` | **Keystone**: every doc-02 feature scored value × build-lift × gated-dependency → MVP cutline (value anchored to doc 08; lift anchored to the family stack; PARTNER-REQUIRED/PROHIBITED = MVP veto). All later build phases execute from this |
| `12-differentiation-thesis.md` | Honest audit of Outreach's shipped AI; where we genuinely win (simplicity, transparent pricing, AI-native core, live client dashboards); evidence grade per claim |
| `13-migration-feasibility.md` | How a team actually leaves Outreach (exports, API, sequence portability, concierge) — research-gated before any capture tooling is imagined |
| `14-deliverability-playbook.md` | Bulk-sender rules (Google/Yahoo/Microsoft), SPF/DKIM/DMARC, secondary domains, warmup curves, monitoring — seeds the Phase 5 ops runbook |

**Naming sprint (tail of Phase 1, after doc 10):** domain-first per playbook mistake #2 —
generate 40–50 `-row` candidates, auto-filter to available `.com` (seeded from the
2026-08-05 pre-screen in `docs/legal/trademark-screens.md`), deep-screen survivors
(collisions vs doc 10, trademark quick-screens, three-axis similarity to "Outreach",
endorsement fit), memo per the option anatomy → **Gate 2**, domain registered same day,
tokens applied in the gate-record commit.

### Phase 2 — Synthesis & storefront (opens with `phase-2-plan.md`)
Matrix → MVP-cutline memo (with dogfood-bias section) for Gate 3 · brand applied
everywhere via the one-package diff · marketing site (waitlist adapter pattern from the
family: Supabase when configured, file fallback in dev, 503-never-silent) · copy driven
by doc 08 pains · `/vs-outreach` last (claims table + concession rows + legal-lint
clean) · runbooks: domain, Vercel, Supabase, legal-counsel checklist · site-launch
acceptance rides with Gate 3.

### Phase 3 — MVP architecture (opens with `phase-3-plan.md`)
Three option memos, each with spike evidence where cheap: **Gate 4** mailbox provider
(M365 Graph vs Gmail API vs unified vendor vs SMTP-fallback-only; verification calendars
from the long-lead register; dogfood-vs-market section) · **Gate 5** sequence-engine
substrate (Postgres durable timers + claim-and-execute on the family stack vs
Supabase-native queues vs a purpose-built workflow platform; the memo states the honest
scaling ceiling and the swappable-dispatcher port path) · **Gate 6** Connect
`outreach.*` mapping (what is `project` — client campaign/engagement vs opportunity vs
sequence; metric catalog; extension schemas + fixtures).

### Phase 4 — MVP build (opens with `phase-4-plan.md`)
The engagement loop from the Gate 3 cutline; engine-correctness test suite in CI
(exactly-once under crash/retry, reply-vs-send race cancellation, timezone/DST
fire-times, per-mailbox throttling, OOO-classified-not-replied, unbypassable
suppression); Connect producer with `outreach.*` fixtures green in CI; per-org COGS
instrumentation from day one; adversarial functional review with an edge-case mock
dataset before any real tenant; dogfood onboarding → **Gate 7** acceptance.

### Phase 5 — Trust bar (opens with `phase-5-plan.md`)
Deliverability operations (secondary domains, warmup state on the Mailbox entity,
monitoring, auto-pause) per doc 14 · CRM v1 per **Gate 8** · Stripe billing plumbing
(build now, charge at GA — the family pattern) · pricing analysis on measured COGS →
**Gate 9**.

### Phase 6 — Commercial launch prep → **Gate 10** GA acceptance.

### Phase 7+ — Expansion gates 11–15, one phase-plan each. Never bundled.

---

## Verification

Every row mechanically checkable. Phase plans append their rows here.

| Phase/Gate | Check |
|---|---|
| 0 | `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` green locally and in CI on the draft PR; `pnpm spec:lint` and `pnpm spec:fixtures` green; git history shows `docs/legal/clean-room-protocol.md` committed before any research content; decision log seeded with all locked decisions; Gate-1 memo complete per the option anatomy; grep: no brand literals outside `@vantrow/brand`, no `F-` references anywhere, research dirs contain scaffolds only |
| Gate 1 pre | Repo shows **Private** on GitHub; posture recorded in the decision log with a Gate record block |
| 1 | Self-cert line count == research doc count; 10 random claims resolve to sources-log entries; every doc has an Unknowns section; Tier-P-only docs contain zero `F-` refs; every S/F row dated; naming memo: ≥40 generated, domain filter documented, every survivor carries dated RDAP evidence + collision screen + risk grade |
| 2 | Doc-11 row count reconciles 100% against doc-02 features; cutline rule stated with named exceptions; site lint/typecheck/build green; brand-literal grep clean; waitlist file-fallback works via local `curl`; legal-lint passes on all site copy in CI; every `/vs-outreach` claim footnoted to an S-ID; zero unresolved `[SHIP-GATE]` markers on publishable pages; ≥2 concession rows present |
| 3 | Three gate memos complete per anatomy; spikes confined to `docs/plan/spikes/` or scratch branches; `phase-3-plan.md` predates the memos |
| 4 | Engine-correctness suite green in CI (exactly-once ledger dedupe · reply-race cancellation · timezone/DST · throttle ceiling · OOO≠reply · a test proving no code path sends tenant email without an approved draft or an explicitly enabled auto step); Connect producer output validates against schemas incl. `outreach.*`; adversarial-review doc executed with findings dispositioned |
| Gate 7 | Production evidence: real mailbox connected; one live sequence completed end-to-end; one live reply observed cancelling a scheduled touch; unsubscribe suppresses org-wide; producer output rendered by the dashboard or the fixture-replay harness |
| 5 | CRM reconciliation-sweep test detects and repairs seeded divergence; Stripe test-mode end-to-end; per-org COGS rows queryable |
| Gate 10 | Counsel checklist signed off; legal-lint clean across the site; billing live; launch-checklist runbook's final step (founder's end-to-end production test) done |

## Key risks

1. **Incumbent-ToS / competitive-use exposure via the founder's paid account** — the
   reason Gate 1 exists; agent-never-authenticates + Tier-F internal-only + named
   counsel question.
2. **OAuth verification calendars** (Google restricted-scope assessment; Microsoft
   publisher verification) can block *commercial* mailbox connection for months —
   dogfood runs on tenant-consented/test-mode paths; applications start per the
   long-lead register, not when engineering needs them.
3. **Deliverability is earned in calendar time, not code** — secondary domains, warmup
   weeks, reputation ops; founder-side infra stood up early; warmup state modeled on the
   Mailbox entity from the first migration.
4. **Sequence-engine correctness on serverless** — minute granularity and timeouts are a
   known ceiling; claim-and-execute design + correctness suite + swappable dispatcher so
   a substrate port is not a rewrite. The Gate 5 memo states the ceiling honestly.
5. **We ship an outbound tool — abuse lands on our reputation** (CAN-SPAM, GDPR, spam
   rates): org-wide suppression, rate ceilings, one-click unsubscribe from MVP; our own
   growth outreach dogfoods the same rules.
6. **Naming decay + a crowded namespace** — same-day registration rule; `outreachrow`
   trap pre-flagged.
7. **Fifteen-module scope creep** — matrix discipline ("research that doesn't change a
   doc-11 score is done"), page budgets, depth-first rule.
8. **Connect producer slips to 0% again** (Eaverow precedent) — fixture validation in CI
   from session 1; producer-green is a Gate 7 acceptance row.
9. **Dogfood bias** — PEAK is an atypical buyer; every scope/provider/pricing memo
   carries a dogfood-vs-market section.
10. **Vendored-spec divergence** — `PROVENANCE.md` rule: this repo owns `outreach.*`;
    core-model changes are coordinated contract revisions with the Eaverow copy.

## Execution in this session (post-approval)

1. Scaffold + CI + packages; legal docs; this plan + decision log + Gate-1 memo +
   registers; research scaffolds + playbook + runbook 01; Connect vendored + fixture
   validation. Six commits, verified at each step.
2. Push `claude/repo-setup-check-l19ssc`, open **draft PR** onto `main` with the
   honest-scoping section and Andrew's checklist (flip private → read Gate-1 memo →
   decide). Subscribe to PR activity.
3. Present the Gate 1 memo in chat. **Stop.** No research, no Phase 1, until Gate 1
   closes and the privacy precondition is verified.
