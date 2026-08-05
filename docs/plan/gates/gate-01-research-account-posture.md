# Gate 1 — Research Account Posture

**Type:** Decision gate (the program's first).
**Question:** How may Andrew's paid Outreach account (Engage core tier) be used in the
Phase 1 competitive teardown and beyond?
**Precondition before deciding:** `vantrow-outreach` is **Private** on GitHub
(`docs/runbooks/01-repo-privacy.md`).
**Where the decision lands:** the decision log's Gate 1 record; clean-room protocol §1
Tier-F rules activate accordingly. No research content is written before this gate
closes.

## Why this is Gate 1

Eaverow's clean-room protocol banned all in-account research — and its retrospective
flags the unanswered question "can we get authorized access to a live account?" as its
single biggest research gap. This program *starts* with that asset: the founder is a
paying customer of the exact product being replicated. The posture must be decided
before one research word is written, because it determines what every teardown doc may
contain, and because the risk it manages is a **contract** risk on Andrew's own account
(SaaS terms routinely restrict using a service to build a competitive product), not a
research-legality question.

Two fixed points, whatever is chosen (protocol §9): **the agent never authenticates to
Outreach**, and **modules outside the Engage-core license (dialer, conversation
intelligence, deals, forecasting) are public-sources-only regardless** — there is no
account access to them anyway.

## Options

| # | Posture | One-line | Risk to account | Research fidelity | Verdict |
|---|---|---|---|---|---|
| A | Strict public-only | Eaverow's protocol verbatim; the account is quarantined | Minimal | Good — Outreach's public surface is unusually rich | Safe, wasteful |
| B | Founder-as-design-partner (split corpus) | Andrew describes his own licensed usage; internal-only F-corpus | Low, managed | Best available | **Recommended** |
| C | Full authenticated teardown | Systematic in-app research walks | High | Highest | Present to reject |
| D | Requirements-framed interviews only | Andrew speaks only as "customer #1 needs X" | Minimal | Medium | Awkward middle |

### A — Strict public-sources-only

The teardown uses only Tier P: outreach.io/outreach.ai marketing pages,
support.outreach.io, developers.outreach.io (a large public REST API — the best public
window into their data model), YouTube demos, G2/Capterra/TrustRadius/Reddit, job posts,
press. The paid account is never referenced; the F-log stays dormant forever.

- **For:** cleanest possible describe-and-reimplement narrative; zero new ToS surface;
  the public corpus for Outreach is genuinely deep (help center + API docs + a decade of
  reviews), so the floor is high.
- **Evidence:** Eaverow produced a 793-source, 14-doc teardown from public sources alone
  on a target with a *far thinner* public surface.
- **Biggest weakness:** it wastes the program's unique asset. The product's most-praised
  surface — the 360° dashboard and play-through task queue, the exact daily-workflow
  feel — is only partially visible in public demos, and that texture is what separates a
  faithful replication from a brochure-level one.

### B — Founder-as-design-partner, split corpus ★ recommended

Modeled on Eaverow's own sanctioned pattern (its design-partner runbook: the *customer*
drives their own account and describes what they see; the vendor never touches it).
Here the founder **is** the customer. Three tiers, per protocol §1:

- **Tier P** (public, S-IDs) — the only material quotable in deliverables. Every
  teardown doc is written to stand on Tier P alone.
- **Tier F** (founder corpus, F-IDs) — Andrew narrates his own licensed workflows,
  answers questions, optionally supplies screenshots **for internal reference only**.
  Used to *verify, prioritize, and fill gaps* — never quoted, never reproduced, never
  the sole source for a published claim. The agent never logs in; nothing is
  bulk-exported for research; capture is Andrew-paced (his descriptions, his ordinary
  use), not a harvesting operation.
- **Tier R** (PEAK's own process — sequences, Affinity workflow, needs) — first-party
  requirements, unconstrained.

- **For:** best real fidelity on exactly the licensed modules that form the MVP core
  (sequences, email, tasks, reporting); keeps the publishable corpus 100% public-sourced,
  so the clean-room defense reads the same as option A where it matters; uses the
  design-partner precedent rather than inventing a new posture.
- **Account-risk management:** the account's primary use remains PEAK's real outreach;
  Tier F is the founder's knowledge as a user, which no ToS can un-know; the exposure
  that remains (competitive-use clauses reaching "assisted by his own usage
  descriptions") is a named counsel question, and the fallback is graceful — losing the
  account would be an inconvenience, not a program blocker, since every doc stands on
  Tier P.
- **Biggest weakness:** the F-corpus discipline must be policed forever — every future
  session must keep F-material out of deliverables (mechanically: the tier table + grep
  check), and founder-supplied screenshots remain copyrighted material that can never
  leave internal docs. Discipline has a maintenance cost that option A simply doesn't
  have.

### C — Full authenticated teardown

Systematic research walks through the live product: guided screen-by-screen sessions,
comprehensive screenshot sets, exhaustive in-app verification of every doc.

- **For:** highest fidelity; fastest verification loop.
- **Biggest weakness:** maximal ToS exposure — this *is* the "using the service to build
  a competitive product" fact pattern, systematically and provably; it also taints the
  clean-room narrative for every doc it touches (the corpus can no longer claim to stand
  on public sources), and it risks the account mid-program. Presented for completeness;
  the recommendation is to reject it.

### D — Public-only research + requirements-framed founder interviews

Research is strict Tier P; Andrew's knowledge enters only rephrased as first-party
requirements ("customer #1 needs a one-click task queue"), never as descriptions of
Outreach ("Outreach's task flow does X").

- **For:** near-A safety with some founder signal; no F-corpus to police.
- **Biggest weakness:** the line is artificial and will not hold in real conversation —
  the founder's requirements *are* shaped by the product he uses daily, and forcing
  every sentence through a "don't say what Outreach does" filter loses precisely the
  verification value option B captures, while the underlying exposure (his knowledge
  comes from licensed use) is identical. Discipline cost of B, fidelity of A.

## Ranked

1. **B** — the only option that uses the program's unique asset while keeping every
   published claim public-sourced. Weakness (permanent F-discipline) is mechanically
   enforceable.
2. **A** — the safe floor. Right answer if counsel later advises hard against B; the
   program loses verification texture, not viability.
3. **D** — strictly dominated by B: same knowledge source, worse capture, same residual
   exposure.
4. **C** — rejected: converts a manageable contract risk into a systematic one and
   damages the clean-room story.

### #1 pick: **B — founder-as-design-partner, split corpus**

It is the only posture that treats the paid account as what it is — the founder's own
licensed tool and the program's best verification instrument — without ever letting
authenticated material into a deliverable. The publishable corpus stays as clean as
option A's; the teardown gets the daily-workflow fidelity that public demos cannot
provide; and the residual contract exposure is explicitly named, counsel-reviewed, and
survivable (every doc stands on Tier P if the account ever goes away). Option A remains
the documented fallback posture, switchable by a single decision-log row.

> ## Next steps — do these in order
> 1. **Andrew:** flip the repo private — `docs/runbooks/01-repo-privacy.md` ("You're
>    done when the repo shows the Private badge"). *Precondition; nothing else starts.*
> 2. **Andrew:** decide this gate (A/B/C/D or a variant, in chat or on the PR).
> 3. **Agent:** record the decision in the decision log's Gate 1 block (date, posture,
>    activated protocol rules) in the same commit as any protocol-text activation.
> 4. **Agent:** open Phase 1 with `docs/plan/phase-1-plan.md` (teardown fan-out plan +
>    naming sprint tail) — the research brief lands in `docs/research/inputs/` in Phase
>    1's first commit, now that the repo is private.
> 5. **Flagged for Phase 2's legal-counsel runbook:** Outreach ToS competitive-use /
>    benchmarking clause review against the chosen posture. *(Not blocking research
>    under B — blocking any public claim that depends on Tier-F material, of which
>    there must be none anyway.)*
