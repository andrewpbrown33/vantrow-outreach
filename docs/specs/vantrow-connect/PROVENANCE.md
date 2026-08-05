# Provenance & Divergence Rule

This directory is a **verbatim vendored copy** of the Vantrow Connect contract from
subsidiary #1:

- **Source repo:** `andrewpbrown33/vantrow-acculynx`
- **Source path:** `docs/specs/vantrow-connect/`
- **Source commit:** `da1d75210ac976ba97d16e536ab26e229bbfc9a0`
- **Vendored:** 2026-08-05

Vendored so that sessions in this repo always have the contract without cross-repo
attachment — the failure mode that left the contract 0% implemented after two
subsidiaries.

## Divergence rule

- **This repo owns the `outreach.*` extension namespace** (schemas, event types, metric
  keys, fixtures — see `adoption-outreach.md`). Add them here freely; they do not exist
  in the source copy.
- **Core-model changes** (the five entities, the frozen `project.status` enum, the
  envelope, auth, delivery semantics) are **contract revisions**: they must be
  coordinated with the Eaverow copy, not made unilaterally here. Per the contract's own
  versioning rules: additive-only within v1; never add values to the core `status` enum.
- The roofing exemplar files (`roofing.claim.*`) are retained untouched as the reference
  extension pattern.
- If the source repo revises the core spec, re-vendor and update this file's commit SHA
  in the same change.

CI validates every fixture against the schemas (`scripts/validate-connect-fixtures.mjs`)
and lints `openapi.yaml` on every push — the fixtures are the contract's test suite.
