# Clean-Room Research & Build Protocol

**Status:** Binding for all research and development in this repository.
**Adopted:** 2026-08-05 — before any competitive research document was created.
**Lineage:** Adapted from Eaverow's protocol (`vantrow-acculynx/docs/legal/clean-room-protocol.md`),
extended where that protocol was silent: the founder's paid incumbent account (§1, §9) and
outbound content produced *by* the product (§10).

## Purpose

This repository contains competitive research on Outreach (outreach.io / outreach.ai — the
sales-engagement platform) and, eventually, the implementation of a competing product.
Competitive analysis and building competing products with similar features are lawful,
standard business practice. What is *not* lawful is copying protected expression. This
protocol keeps the line bright.

One fact makes this program different from Eaverow's: **the founder is a paying Outreach
customer** (Engage core tier). That is an asset and a risk. How it may be used is decided
at **Gate 1** (`docs/plan/gates/gate-01-research-account-posture.md`) and recorded in the
decision log; §1 below defines both postures so the winning one activates without editing
this protocol's structure.

## Rules

### 1. Sources — three tiers, one gate

Research material is classified into three tiers. Every research doc states which tiers it
may draw from (the license-tier table in `docs/research/outreach/README.md`).

- **Tier P — Public sources.** Marketing websites, public help centers
  (support.outreach.io), public API documentation (developers.outreach.io), published
  videos (YouTube demos, webinars), review sites (G2, Capterra, TrustRadius, Reddit,
  r/sales), job postings, press coverage, engineering blogs, and public filings.
  Logged as `S-` entries. **Tier P is always permitted** and is the only tier quotable
  in deliverables.
- **Tier F — Founder corpus.** The founder's first-hand descriptions of his own licensed
  Outreach usage (workflow narrations, answers to questions, screenshots he supplies).
  Logged as `F-` entries, **internal-only, never quotable or reproducible in any
  deliverable or public surface.** DORMANT until Gate 1 activates it; the activated
  posture's exact rules are recorded in the Gate 1 decision-log entry. Regardless of
  posture: **the agent never authenticates to Outreach, never operates the founder's
  session, and never receives bulk-exported authenticated content.** Modules outside the
  founder's license tier (dialer, conversation intelligence, deals, forecasting) stay
  Tier P no matter what Gate 1 decides.
- **Tier R — First-party requirements.** PEAK/Vantrow's own outbound process: their
  sequences, templates, Affinity workflow, prospecting practices, and needs. This is the
  founder's own material — **no clean-room constraint applies.** Recording it as
  requirements ("customer #1 needs X") is always permitted and encouraged.

- No research is conducted **by the agent** from inside an Outreach account, and no
  authenticated or paywalled surface is scraped.
- No circumvention of technical access controls of any kind.

### 2. Provenance for every claim
- Every factual claim in a research doc must be traceable to an entry in
  `docs/research/outreach/00-sources-log.md` (Tier P: URL + access date + what was
  extracted) or `00b-founder-input-log.md` (Tier F: date + what the founder described).
- Claims that cannot be sourced are labeled **ASSUMPTION** or **INFERENCE** inline.
- Unknowables are recorded in each doc's "Unknowns" section rather than guessed silently.

### 3. Describe, never copy
- Research docs *describe* features, workflows, and structures in our own words.
- Never copy Outreach's marketing copy, help-center text, UI text (beyond short factual
  labels needed to identify a feature), images, icons, code, or documentation into any
  deliverable.
- Verbatim quotes are allowed only from *customer reviews* (with citation), never from
  Outreach-authored material beyond short nominative references.

### 4. Screenshots
- Screenshots of Outreach UI — whether from public videos/help docs **or supplied by the
  founder from his own account** — are copyrighted material. They may be referenced by
  URL/date + a prose description in internal research docs. Embedding image files is a
  last resort where prose genuinely fails, and never for founder-supplied captures of
  authenticated surfaces.
- Screenshots or reproductions of Outreach UI must **never** appear on any public surface
  (website, LinkedIn, PR, public repo).
- **This repository stays private** while it contains competitor UI references. Making
  the repo private is a precondition of Gate 1 (`docs/runbooks/01-repo-privacy.md`);
  no research content is committed before both are true.

### 5. Trademarks
- The product name, domain, and branding must not be confusingly similar to "Outreach"
  or any mark in the sales-engagement/sales-software space (Salesloft, Apollo, Reply.io,
  lemlist, Amplemarket, Clari, and the doc-10 landscape).
- "Outreach" is also a generic English word and the category's everyday vocabulary.
  Nominative use of the mark (a truthful "vs" page) is clean; ordinary use of the word
  ("sales outreach") is not a trademark question at all. What is **not** permitted:
  embedding their mark in our product name or domain (`outreachrow` is pre-flagged
  elevated-risk in `docs/legal/trademark-screens.md` for exactly this), using their
  logo, or ad keywords implying affiliation.
- Automated screens in this repo are a first-pass filter only — **they are not legal
  clearance**. Final name requires a professional trademark clearance search
  (legal-counsel runbook, written at Phase 2).

### 6. Trade dress and UI
- Our product UI takes *functional* inspiration (what a screen accomplishes, what data
  it shows) — never visual copies of layout, color schemes, icons, or distinctive design
  elements.
- The implementation team works from the research docs' functional descriptions, not
  from side-by-side pixel comparison.

### 7. Comparative advertising
- Every public comparative claim must be factual, current, dated, and sourced.
- Pricing claims about Outreach are hedged appropriately (their pricing is quote-based
  and unpublished; rely on dated customer reports, clearly attributed).
- No disparagement; compare capabilities, don't characterize the competitor.
- Checklist: `docs/legal/comparative-advertising-checklist.md`. Enforced in code by
  `packages/growth/src/legal-lint.ts` — `block` findings disable approval.

### 8. Integrations honesty
- Third-party integrations that require partner agreements or platform verification
  (Salesforce/HubSpot/Affinity sync, Gmail restricted-scope access, Microsoft publisher
  verification, telephony/A2P, LinkedIn) are described as "designed to integrate with"
  or "planned" until the agreement or verification exists. No implied partnerships.

### 9. The incumbent's terms of service — named risk, named rules
- Outreach's customer terms (like most SaaS terms) should be assumed to restrict using
  the service to build a competitive product and to restrict benchmarking disclosure.
  This is a **contract** exposure on the founder's account — not a research-legality
  question — and it is the reason Gate 1 exists.
- Standing rules regardless of Gate 1's outcome:
  - The agent never holds, requests, or uses Outreach credentials.
  - No systematic research activity is *directed at* the authenticated product (no
    crawling, no bulk export for research, no automated interaction).
  - The founder's account is used for his ordinary business first; Tier F captures his
    knowledge as a user, not a harvesting operation.
  - **Counsel question (logged in the legal-counsel runbook when written):** review
    Outreach's current customer terms for competitive-use and benchmarking clauses and
    advise on the chosen Gate 1 posture and on account-termination risk.

### 10. Outbound surfaces — two different rules
The Eaverow rule "draft → founder approval → publish, never auto-publish" needs a split
here, because in a sequence product **auto-send is the product**:
- **Our own content** (marketing site, insights, social, our growth outreach): always
  draft → founder approval → publish. The cron/agents may stage; nothing publishes
  without a human. `legal-lint` `block` findings disable the approve action.
- **The product's tenant content** (emails our customers send through the platform):
  AI-drafted content defaults to review-before-send; automatic sending is an explicit
  tenant-level opt-in per step type; suppression-list and unsubscribe enforcement is
  unbypassable by any code path, human or automated. This is a product-architecture
  commitment, tested in CI from the first engine build.

## Enforcement

- Every research doc ends with a self-certification line:
  *"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
- Tier-P-only docs must contain zero `F-` references (mechanically checked: grep against
  the license-tier table).
- PR review includes a spot-check of claims against the sources log.
