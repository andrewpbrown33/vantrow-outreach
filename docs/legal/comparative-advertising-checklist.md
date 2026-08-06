# Comparative Advertising Checklist

Apply to every public page, post, or ad that names or references Outreach (or any
competitor — Salesloft, Apollo, HubSpot, Salesforce, Reply.io, lemlist, Amplemarket,
Clari, Regie, 11x, Artisan, Instantly) — especially the future `/vs-outreach` route.
Derived from `docs/legal/clean-room-protocol.md` §5 and §7. Enforced in code by
`packages/growth/src/legal-lint.ts`: `block` findings disable the approve action.

## Per-claim checklist

For **each** comparative claim, verify:

- [ ] **Factual & verifiable** — the claim states a checkable fact, not an opinion dressed
      as fact ("Outreach requires X" must be documented; "customers describe Outreach as
      dense" must cite reviews).
- [ ] **Sourced & dated** — footnote links to a public source with an access date; the
      source appears in `docs/research/outreach/00-sources-log.md`.
- [ ] **Current** — re-verify claims older than 90 days before re-publishing; competitors
      ship. Add "as of <date>" where staleness is plausible.
- [ ] **Pricing hedged** — Outreach pricing is quote-based and unpublished. Only "customers
      report…" phrasing with dated citations, or omit. Never state their price as fact.
- [ ] **AI claims honest** — Outreach leads with agentic AI (agents, Kaia, Agent Studio);
      never claim they "have no AI." Differentiate on architecture, simplicity, and
      transparent pricing, not AI's mere presence.
- [ ] **Learning-curve claims quoted, not asserted** — reviews widely report onboarding
      weight and density; cite them ("customers report…", dated). Never our own voice
      characterizing their product as hard to use.
- [ ] **No deliverability promises** — never "lands in the inbox," "never spam," or a
      deliverability percentage, about us or anyone. Inbox placement is not ours to
      guarantee.
- [ ] **No disparagement** — compare capabilities; never characterize the company, its
      people, or motives.

## Page-level checklist

- [ ] Outreach mark used **nominatively only**: plain text, no Outreach logo, no stylized
      rendering, no use in our headlines implying affiliation or endorsement.
- [ ] Disclaimer present: "Outreach is a trademark of its owner. <Brand> is not
      affiliated with or endorsed by Outreach."
- [ ] **No Outreach screenshots or UI reproductions** anywhere public (protocol §4 —
      including anything originating from the founder's account).
- [ ] No integration promises without signed agreements or completed platform
      verification — "designed to integrate with" / "on our roadmap" phrasing only
      (protocol §8).
- [ ] No competitor names in paid-search ad copy or display URLs (bidding on competitor
      keywords is a separate risk decision for counsel — flag before doing it).
- [ ] Superlatives ("simplest", "fastest") either substantiated or clearly framed as
      opinion/goal ("built to be the simplest…").

## Conventions this program adds

- **`[SHIP-GATE]` flags.** Any drafted claim that depends on a capability being live
  carries a literal `[SHIP-GATE: <what must be true>]` marker. The marker is a `block`
  finding in legal-lint, so the claim physically cannot be approved for publishing until
  the capability ships and the flag is removed with evidence.
- **Honest concession rows.** The `/vs-outreach` comparison table must include at least
  two rows where the incumbent is genuinely ahead — the credibility anchor for the whole
  table (Eaverow precedent).
- **Rows considered and dropped.** Claims that failed this checklist are recorded with
  the reason, so they are not re-litigated by a future session.

## Sign-off

Before launch, this page's claims table (claim → source → date) goes to counsel with the
legal-counsel runbook (written at Phase 2).
