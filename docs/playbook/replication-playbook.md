> **Provenance:** copied verbatim from `andrewpbrown33/vantrow-acculynx`
> (`docs/playbook/replication-playbook.md`) on 2026-08-05 so sessions in this repo have
> the method without cross-repo attachment. It is subsidiary #1's retrospective; where
> this program deliberately diverges (tests in Phase 0, globally numbered gates,
> account-posture gate, vendored Connect spec with CI fixture validation, cloud-first
> runbooks from the start), `docs/plan/program-plan.md` and the decision log are
> authoritative. Do not edit this copy except to append a dated addendum.

# Playbook — Cloning a Validated Platform as a Vantrow Subsidiary

_How Eaverow (an AccuLynx competitor for roofing contractors) went from an empty repo to a
live, multi-tenant SaaS with a migration on-ramp — captured so the next one goes faster and
cleaner. This is a **decision framework, not a script**. The next build differs in platform,
style, and vertical; use the machinery, re-decide the specifics._

**Legend:** ♻️ = reusable machinery (do it again as-is) · 🎯 = platform-specific (re-decide) ·
⚠️ = mistake we made / thing to front-load next time.

---

## 0. The thesis this method serves

Take a **validated incumbent** in a vertical (proven demand, known feature set, real pain
points), **re-implement its high-value / low-lift core** from public sources only (clean-room),
and **differentiate** on three axes: modern & AI-native, radically simpler/cheaper, and — the
Vantrow wedge — **live client dashboards**. Ship the marketing brand first, the product second,
and a **migration on-ramp** that converts the incumbent's frustrated users.

**When it fits:** the incumbent is legacy/clunky, has a documentable surface (marketing site,
help center, public API, reviews), the vertical benefits from a client-facing dashboard, and the
MVP loop has few hard partner dependencies. **When it doesn't:** the moat is a data/partnership
network you can't reach (e.g. exclusive supplier pricing), or the value is all in an integration
you can't get. (Handle those by *neutralizing* them in v1 and running BD in parallel — see §3.)

---

## 1. The phase map (the flow that worked)

```
Phase 0  Foundations        repo + trunk + CI + legal guardrails + plan        [serial, fast]
Phase 1  (all in parallel)  ├─ 1A clean-room teardown of the incumbent
                            ├─ 1B naming sprint (domain-first)
                            ├─ 1C brand-agnostic marketing site scaffold
                            └─ 1D cross-subsidiary integration contract
  ── GATE: founder picks the brand name ──
Phase 2  Brand + copy       apply brand tokens; real marketing copy from the teardown
Phase 3  Launch prep        runbooks (human-only steps) + draft PR + founder deploys
  ── GATE: founder registers domain, stands up hosting, legal clearance ──
Phase 4+ Iterative builds   product loop → multi-tenant backend → onboarding/migration → …
                            (research-gate anything uncertain BEFORE building it)
```

The shape is: **decide → fan out in parallel → gate on the founder → converge → iterate.**
Everything before the brand-name gate is built **brand-agnostic** so the parallel work doesn't
stall waiting on the name.

---

## 2. The methods that worked — lean HARDER on these

1. **♻️ Front-load clarifying questions into decision gates.** Before any building, we settled:
   brand approach, research method, architecture, stack, positioning, repo scope. Each answer
   removed a whole branch of rework. _Ask the expensive-to-reverse questions first._
2. **♻️ Brand-agnostic config from line one — the single biggest win.** Every brand string and
   color lived in one `@vantrow/brand` package; the site and app rendered from it. This let the
   teardown, scaffold, and integration contract all proceed **before the name existed**, and made
   "pick the name" a one-file change. It's also the white-label mechanism itself: subsidiary #2 =
   a new brand config. _Build the swap-point before you need it._
3. **♻️ Clean-room legal guardrails written BEFORE research starts.** A `clean-room-protocol.md`,
   a comparative-advertising checklist, and dated trademark screens. Every teardown claim traces
   to a dated public source. This is what makes "copy the incumbent" defensible: describe and
   re-implement, never copy code/text/images; competitive claims are factual, dated, sourced.
4. **♻️ Parallel agent/workflow fan-out for the heavy, decomposable work.** The 24-doc teardown
   and the naming sprint ran as multi-agent workflows; the site scaffold and integration spec ran
   as focused single agents — all concurrently. Days of work compressed into one working session.
5. **♻️ Adapter-pattern data layer + env-gating.** Every data surface had two implementations
   behind one interface: a **local file/in-memory store** (zero-setup dev, fully runnable and
   testable in-session) and a **real backend** (Supabase) that switches on when env vars are
   present. This meant the app was **verifiable without live infrastructure**, and "go to
   production" was a config step, not a rewrite. _The waitlist, the platform store, everything._
6. **♻️ Verify-before-commit, independently.** For every subagent build I re-ran
   `lint/typecheck/build` myself, **drove the feature end-to-end at runtime** (e.g. lead → paid;
   CSV import → deduped rows on the pipeline), and **read the security-critical code** (RLS,
   auth, money math) — then committed. Nothing shipped on a subagent's say-so alone.
7. **♻️ One PR per phase, as a draft, with CI, and watch it.** Small reviewable units; CI
   (lint/typecheck/build both apps + spec lint) gated each; I subscribed to PR activity to catch
   failures. The founder merged each himself after a look.
8. **♻️ Runbooks that separate human-only steps from agent work.** Domain registration, Vercel,
   Supabase, legal counsel, domain+email — each a numbered "you're done when…" runbook. The agent
   never pretends it can register a domain; the founder never has to reverse-engineer the steps.
9. **♻️ Research-gate risky assumptions before building.** Before the migration flow, a dedicated
   feasibility pass proved the API path was a dead end and the CSV+concierge path was how
   competitors actually win switchers. We built the validated approach, not the assumed one.
10. **♻️ The keystone artifact: a value × build-lift × gated-dependency matrix → MVP cutline.**
    Every incumbent feature scored on three axes; the cutline falls out. It's the doc the product
    build executes from, and it keeps scope honest ("does this change a matrix score? no? it's
    done").
11. **♻️ Honest scoping, always visible.** Every PR and page states what's deferred and what
    *doesn't* work (e.g. "photos don't migrate — that's an API limitation, not a shortcut").
    Trust compounds; hand-waving gets found out.

---

## 3. The clean-room teardown doc set (reusable template) ♻️

This is the research spine and it generalizes to any platform. One folder, ~two dozen docs:

| Doc | Captures |
|---|---|
| `00-sources-log` | Every URL + access date + what was extracted (the provenance record — non-negotiable) |
| `01-product-overview` | Positioning, ICP, module map, roles, glossary |
| `02-feature-inventory/` | One file per module; feature tables (name, description, roles, workflow) |
| `03-ui-walkthrough` | Screen-by-screen prose + nav map (screenshots internal-only) |
| `04-inferred-data-model` | Entities, fields, relationships, the core state machine, permissions |
| `05-public-api-teardown` | The incumbent's API surface — the highest-fidelity data-model source |
| `06-assumed-architecture` | Inferred stack/multi-tenancy from job posts, network signals, press |
| `07-pricing-packaging` | Tiers/seats/fees (dated; usually quote-based → weak-evidence, hedge) |
| `08-review-mining` | G2/Capterra/Reddit pain points, quantified, verbatim quotes + links |
| `09-integration-landscape` | Integrations with an **open-API vs partner-required** column |
| `10-market-landscape` | Competitors + name-collision input |
| `11-copy-priority-matrix` | **KEYSTONE** — value×lift×gate → MVP cutline |
| `12-differentiation-thesis` | Honest audit of the incumbent's strengths (incl. their AI) + your real edge |
| `13-migration-feasibility` | (added later) how a customer actually moves their data to you |

🎯 The *contents* are incumbent-specific; the *structure* is not. Run it as a parallel workflow
(one agent per doc/module), all appending to the sources log, with page budgets and an "unknowns"
section per doc (recording what public sources can't reveal beats chasing it).

---

## 4. Working with Claude / agents — the orchestration mechanics ♻️

- **Delegate a well-specified build to ONE focused subagent; verify it yourself.** The platform
  loop, the Supabase backend, and the onboarding flow were each one subagent + my verification.
  The spec is everything: pin exact versions, name the patterns to mirror (with file paths), state
  the guardrails, and **list the verification steps the agent must run and report**.
- **Use a Workflow (multi-agent fan-out) for big, decomposable research/generation** — the
  teardown (24 docs) and naming (52 candidates → domain-filter → screen → memo). Not for a single
  coherent build (one agent keeps voice/architecture consistent and avoids file conflicts).
- **Verify-before-commit is the load-bearing habit.** Re-run the checks, drive the runtime, read
  the risky code. Subagents report success confidently; trust the artifact, not the report.
- **Keep the founder in the loop through PRs and gates**, and **hand off human-only work as
  runbooks.** The agent's job ends at "verified + pushed + PR"; the founder's begins at "merge +
  deploy."
- **Prompts that worked** are archived in the repo (the teardown, naming, and build agent specs
  live in `docs/` and the workflow scripts). Reuse them as templates, swap the vertical.

---

## 5. Honest post-mortem — what I'd do differently / front-load ⚠️

1. **⚠️ Set up the trunk (`main`) + default branch + CI + a deploy target in Phase 0, before any
   code.** The repo started empty, my working branch became the default, and creating `main`
   later turned into an orphan-branch fumble that tripped safety guards and cost round-trips.
   _Next time: first commit creates `main`, sets it default, adds CI; all work branches off it, so
   PR #1 is clean._
2. **⚠️ Go domain-first on naming from the very first round.** Round 1 generated clever short
   names and then discovered almost none had an available `.com`. The winning method — generate
   40–50, **auto-filter to available `.com` before a human looks**, then deep-screen the
   survivors — should be round 1, not round 2. (It found "Eaverow" immediately once we did it.)
3. **⚠️ Match runbooks to the founder's ACTUAL workflow (cloud-first), not an assumed local-dev
   setup.** The Supabase runbook led with "create a local `.env.local` file," which is meaningless
   to a founder who works through GitHub + the web and deploys on Vercel. It caused real confusion
   ("how do I save a local file in a cloud repo?"). _Next time: lead with "deploy to Vercel, paste
   keys in the dashboard — there is no local file," and offer local-dev only as an aside._
4. **⚠️ Bake diagnostic error handling in from the start — never mask errors behind generic
   messages.** Signup failed with "Could not create your account," which hid the real Supabase
   cause and turned a 2-minute fix into a debugging round-trip. _Every failure path should log
   detail and surface an actionable cause, especially on infra the agent can't test live._
5. **⚠️ Name up front which verification is inherently the founder's, and build self-diagnostics
   for it.** Anything needing live infra (Supabase auth/RLS, domains, email) couldn't be verified
   in my environment. That's fine — but say so early, make the runbook's final step BE the
   end-to-end test, and instrument those paths so the founder isn't staring at a black box.
6. **⚠️ Stand up the founder's cloud accounts (Vercel/Supabase/domain) earlier.** Live
   verification was blocked until they existed; pulling that forward shortens the feedback loop.
7. **⚠️ Have a fallback when an interaction tool fails.** The structured question tool dropped
   several times; the right move (which we landed on) is: state a sensible default, proceed, and
   invite correction — don't stall.
8. **Minor:** keep a base branch so PRs show clean diffs; when a PR merges, restart the working
   branch from the new `main` before the next change (we did this consistently after the first
   stumble — just do it from PR #1).

---

## 6. Reusable machinery vs. what was roofing-specific

| ♻️ Reuse as-is (the machinery) | 🎯 Re-decide per platform |
|---|---|
| The phase map + gate structure | The vertical + the incumbent |
| The teardown doc-set structure + sources discipline | Entities (job/estimate/invoice…), the state machine |
| Brand-agnostic config package (the swap-point) | Brand name, palette, positioning specifics |
| Adapter-pattern data layer + env-gating | Which integrations are partner-gated |
| Verify-before-commit loop | The MVP loop's exact steps |
| PR-per-phase + CI + runbooks | The migration method (API? CSV? concierge?) |
| Value×lift×gate matrix → MVP cutline | What's "high value" in this vertical |
| Legal guardrails (clean-room, comparative-ad) | Trademark/naming specifics |
| The Vantrow live-dashboard differentiator + integration contract | The vertical extensions on the core model |

---

## 7. Next-time quickstart (the adapted checklist)

For build #2, run this order — with the ⚠️ fixes already applied:

1. **Foundations first, done right:** create repo → first commit on `main` (set default) → CI
   (lint/typecheck/build) → `clean-room-protocol.md` + comparative-ad checklist → program plan.
2. **Fan out Phase 1 in parallel:** teardown workflow (doc set §3) · **domain-first** naming
   workflow · brand-agnostic scaffold · integration contract (extend the same vertical-agnostic
   core: tenant/contact/project/invoice/metric + `<vertical>.*` extensions).
3. **Gate on the brand** → apply the one-file brand config.
4. **Copy from the teardown** (review-mining pains → messaging; matrix → feature emphasis;
   honest, sourced `/vs-incumbent` page).
5. **Cloud-first launch runbooks** (deploy to Vercel; keys in dashboard, not local files) —
   and stand up the founder's accounts early.
6. **Iterate:** product loop from the matrix cutline → multi-tenant backend (auth + RLS,
   env-gated) → **migration on-ramp** (research-gate the feasibility first) → the dashboard hook →
   payments. Each: one focused agent, verified, PR'd.
7. **Founder-side, in parallel:** domain, email, legal clearance, live end-to-end tests of the
   infra paths the agent can't reach.

---

## 8. Picking the next target (criteria)

A good clone target: a **validated incumbent** (proven market), **legacy/clunky UX** with loud
review-mined pain, a **documentable public surface** (site/help/API/reviews), a vertical where a
**live client dashboard** genuinely adds value (the Vantrow wedge), and an **MVP loop reachable
with few hard partner dependencies** (neutralize the gated moat in v1, run BD in parallel). Score
candidates on those five and the winner is usually obvious.

> Want me to suggest specific candidate verticals/incumbents against these criteria, and/or turn
> this playbook into a one-page visual? Say the word.
