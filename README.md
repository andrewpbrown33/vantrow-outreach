# Nudgerow — a Vantrow company

Monorepo for **Nudgerow**, Vantrow's third white-label vertical-SaaS subsidiary: a
modern, AI-native, transparently priced competitor to **Outreach** (the sales-engagement
platform — sequences, task queue, activity capture), connected to personalized client
dashboards built through Vantrow. The family: Eaverow (roofing, vs AccuLynx) →
Parcelrow (CRE) → Nudgerow.

> **Name status:** "Nudgerow" chosen (Gate 2, 2026-08-06) pending same-day domain
> registration and professional trademark clearance — see
> `docs/brand/naming-decision-memo.md` and the Gate 2 record in
> `docs/plan/decision-log.md`. Nothing here is legal clearance.

> **This repository is private and must stay private.** It contains clean-room
> competitive research and internal decision memos
> (`docs/legal/clean-room-protocol.md` §4).

**Program status: Gates 1–2 closed** (posture B · name Nudgerow). Phase 1 teardown
complete and merged. **Next: Phase 2** — synthesis & storefront (marketing site,
`/vs-outreach`, launch runbooks) → **Gate 3: MVP scope & cutline**. Customer-#1
requirements: `docs/research/inputs/customer1-requirements.md`.

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
| `apps/` | `site/` — the marketing site (Phase 2, live at nudgerow.com) · `platform/` — the product app (Phase 4, deployed as `app.nudgerow.com`): sign-in, sequences, import, mailbox connect, and the minute heartbeat that runs `packages/engine` — runbooks 07–09 |

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
