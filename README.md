# Vantrow Subsidiary #3 — a Vantrow company

Monorepo for Vantrow's third white-label vertical-SaaS subsidiary: a modern, AI-native,
transparently priced competitor to **Outreach** (the sales-engagement platform —
sequences, task queue, activity capture), connected to personalized client dashboards
built through Vantrow. The family: Eaverow (roofing, vs AccuLynx) → Parcelrow (CRE) →
this.

> **Name status:** not yet chosen. The brand is a placeholder (`packages/brand`) until
> **Gate 2** runs the domain-first naming sprint. Everything is built brand-agnostic;
> the chosen name is a one-package diff.

> **This repository must be PRIVATE.** It will contain clean-room competitive research
> and internal decision memos (`docs/legal/clean-room-protocol.md` §4). Flip it before
> any research lands: `docs/runbooks/01-repo-privacy.md`.

**Program status: Phase 0 complete — awaiting Gate 1** (research account posture):
`docs/plan/gates/gate-01-research-account-posture.md`. No research content exists yet,
by design.

## Map

| Path | Contents |
|---|---|
| `docs/plan/` | **Program plan** (phases, the 15-gate ledger, verification, risks) · decision log (dated, supersede-don't-delete) · gate memos · hard-problems + long-lead registers |
| `docs/legal/` | Clean-room protocol (three source tiers; the paid-account rules) · comparative-advertising checklist · trademark/domain screens (dated RDAP evidence) |
| `docs/research/` | Outreach teardown docs 00–14 (Phase 1; scaffolds + license-tier table now) · `inputs/` research brief (lands once private) |
| `docs/specs/vantrow-connect/` | The cross-subsidiary dashboard contract, vendored (see `PROVENANCE.md`) — this subsidiary implements the **first producer**; fixtures validated in CI |
| `docs/playbook/` | The replication playbook from subsidiary #1 (provenance-headed copy) |
| `docs/runbooks/` | Founder-only actions, cloud-first, each with a "You're done when" check |
| `packages/brand/` | `@vantrow/brand` — white-label tokens (identity, parent linkage, light+dark palettes, typography, shape); placeholder until Gate 2 |
| `packages/growth/` | `@vantrow/growth` — deterministic legal/claims lint (`block` findings disable publishing); pricing module arrives Phase 2 |
| `scripts/` | `validate-connect-fixtures.mjs` — the Connect contract's test suite, run in CI |
| `apps/` | `site/` arrives Phase 2 (post-name) · `platform/` arrives Phase 4 |

## Quick start

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm spec:lint        # redocly lint on the Connect OpenAPI spec
pnpm spec:fixtures    # validate all Connect fixtures against the schemas
```

## How this program runs

One gate at a time (deliberate cadence): each phase opens with its own
`docs/plan/phase-N-plan.md`, finishes against mechanically checkable verification rows,
and ends in a numbered founder gate — decision gates present 3–4 options with a
recommendation; acceptance gates present evidence. Gates are numbered globally and
never reused. The whole method: `docs/plan/program-plan.md`.
