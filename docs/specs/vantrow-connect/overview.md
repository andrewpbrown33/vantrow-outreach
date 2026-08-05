# Vantrow Connect — Integration Contract Overview

> **Status: v0 DRAFT** — entity fields to be reconciled against
> `docs/research/acculynx/04-inferred-data-model.md` and
> `docs/research/acculynx/05-public-api-teardown.md` when those land
> (one revision pass expected). See [Reconciliation notes](#status--reconciliation)
> for the specific open items.

Vantrow Connect is the contract between every **Vantrow-subsidiary platform**
(the vertical SaaS products — subsidiary #1 is the roofing platform) and
**Vantrow client dashboards** (vantrow-web). Neither implementation exists
yet; both will be built against this spec, and both must validate against the
golden fixtures in this directory before they ever talk to each other.

## Actors and data flow

```
+---------------------------+          Vantrow Connect          +------------------------+
|  Subsidiary platform      |  ------------------------------>  |  Vantrow dashboard     |
|  (PRODUCER)               |                                   |  (CONSUMER)            |
|                           |   REST, read-only (pull):         |                        |
|  e.g. roofing platform:   |     GET /v1/health                |  renders projects,     |
|  owns tenants, jobs,      |     GET /v1/metrics               |  invoices, contacts,   |
|  contacts, invoices,      |     GET /v1/projects[/{id}]       |  KPIs for the client;  |
|  claims; computes KPIs    |     GET /v1/contacts              |  displays extensions   |
|                           |     GET /v1/invoices              |  it understands,       |
|  issues per-tenant        |                                   |  ignores the rest      |
|  scoped API keys          |   Webhooks (push):                |                        |
|                           |     POST <consumer endpoint>      |  dedupes by event id,  |
|                           |     signed, at-least-once         |  reconciles via GETs   |
+---------------------------+  ------------------------------>  +------------------------+
```

- The **platform is the system of record**; the dashboard is a projection.
- **v1 is read-only for dashboards**: display, don't write. There are no
  POST/PUT/PATCH/DELETE endpoints and no write scopes. Write-back (e.g. a
  homeowner approving an estimate from the dashboard) is a future major
  surface, not a v1 add-on.
- Webhooks (`events.md`) exist to make dashboards feel live without polling;
  the GET APIs remain the source of truth for reconciliation.
- Auth is per-tenant scoped API keys (`auth.md`); one credential can only
  ever see one tenant, so no endpoint takes a tenant parameter.

## The core model, and why it is small

Dashboards must work for **every** future vertical, so they code against a
deliberately small vertical-agnostic core — five entities — and nothing else:

| Entity | ID prefix | Purpose |
|---|---|---|
| `tenant` | `ten_` | The contractor account; every other record is scoped to exactly one. |
| `contact` | `ctc_` | A person/business the tenant works with. |
| `project` | `proj_` | A unit of work (the vertical's "job", "case", "matter", "engagement"...). |
| `invoice` | `inv_` | A bill issued by the tenant. |
| `metric` | `met_` | A named, pre-aggregated KPI computed by the platform. |

Every entity carries the same envelope fields: prefixed `id`, `tenant_id`,
RFC 3339 `created_at`/`updated_at`, and an `extensions` object (below).
Money is always `{ amount: <minor units>, currency: <ISO 4217> }`. Normative
field definitions live in `schemas/*.schema.json`; `openapi.yaml` mirrors
them.

`project.status` is a **frozen core enum** — `lead`, `quoted`, `approved`,
`in_progress`, `completed`, `closed`, `canceled` — that every vertical maps
into, with the vertical's native stage carried verbatim in `status_detail`.
Dashboards branch **only** on `status`; they display `status_detail` as text.

### Extensions: how verticals enrich without breaking the core

Everything vertical-specific rides in `extensions`, an object keyed by
dot-separated lowercase namespace, present on every entity (empty object when
unused):

- The namespace root is the vertical slug (`roofing.*` for subsidiary #1;
  a future `solar.*`, `plumbing.*`, ... for the next ones).
- Each namespace key maps to an object whose shape the **vertical** owns and
  documents (`schemas/roofing.claim.schema.json` is the exemplar). Core
  schemas treat extension values as opaque objects — this is the only
  intentionally open region of the model.
- **Consumers MUST ignore extension keys (and event types) they do not
  recognize.** A dashboard that knows nothing about roofing still renders a
  roofing tenant perfectly from core fields alone; a roofing-aware dashboard
  additionally renders the claim card.

### Worked example: roofing platform

The roofing platform's native object is a **job** with an insurance claim
attached. It maps into Connect like this:

| Roofing platform (native) | Vantrow Connect |
|---|---|
| Job "Whitfield Residence - Roof Replacement" | core `project.name` |
| Native stage "Build scheduled" | core `project.status = "in_progress"` + `project.status_detail = "build_scheduled"` |
| Contract value $28,410.00 | core `project.contract_value = { "amount": 2841000, "currency": "USD" }` |
| Insurance claim (carrier, peril, deductible, approval) | `project.extensions["roofing.claim"] = { ... }` |
| Roof specifics (material, squares, pitch) | `project.extensions["roofing.job"] = { ... }` |
| Claim moves to "approved" | `roofing.claim.status_changed` webhook (extension event) |

See it concretely in `fixtures/project.get.json`. An example core-status
mapping for the roofing stage machine (final mapping is a RECONCILE item):

| Roofing native stage | Core `status` | `status_detail` |
|---|---|---|
| New lead / inspection | `lead` | `"inspection_scheduled"` |
| Estimate sent | `quoted` | `"estimate_sent"` |
| Contract signed / claim approved | `approved` | `"contract_signed"` |
| Build scheduled / crew on site | `in_progress` | `"build_scheduled"`, `"build_in_progress"` |
| Final walkthrough passed | `completed` | `"final_inspection_passed"` |
| Paid & archived | `closed` | `"archived"` |
| Lost / withdrawn | `canceled` | `"lost_to_competitor"`, ... |

### Mapping guidance for future verticals

When subsidiary #N adopts Connect:

1. **Map, don't mint.** Map your primary work object onto `project`, your
   billing onto `invoice`, your people onto `contact`. New core entities
   require a contract revision and are added only when a concept has proven
   vertical-agnostic (i.e. at least two verticals need it).
2. **Every native stage maps to exactly one core `status`**, chosen by
   business meaning, not label similarity. Put the native stage string in
   `status_detail`. If a stage seems to fit nowhere, it is almost always a
   `status_detail` under `in_progress` — not a new enum value.
3. **Everything else goes in `extensions`** under your vertical's namespace.
   Publish a JSON Schema per extension key (follow
   `schemas/roofing.claim.schema.json`) and golden fixtures with it.
4. **Namespace your event types and metric keys** the same way
   (`roofing.claim.status_changed`, `roofing.claims_open`). Core event types
   and core metric keys (`revenue_mtd`, `jobs_in_progress`, `avg_cycle_days`)
   must be emitted with core semantics by every vertical.
5. **Never overload core semantics.** If `invoice` doesn't fit your billing
   model, raise a contract revision — do not reinterpret fields.

## Versioning policy

- **URL-versioned major:** all endpoints live under `/v1`; webhook envelopes
  carry `version: "v1"`. Breaking changes mean a new major (`/v2`) — there
  will be no in-place breaking change to `/v1`, ever.
- **Additive-only within a version.** May be added within v1: new endpoints,
  new optional query parameters, new event types, new metric keys, new
  extension namespaces/keys, new **response fields** (consumers MUST tolerate
  unknown response and `data` fields — parse leniently even though the
  normative schemas pin today's exact shape). Never within v1: removing or
  renaming fields, changing types/semantics, tightening auth, **or adding
  values to the core `status` enums** — core enums are frozen because
  dashboards branch on them exhaustively; new lifecycle nuance goes in
  `status_detail`.
- **Deprecation policy:** nothing in v1 is removed while v1 exists. When a
  v2 supersedes it: (1) v1 enters a deprecation window of **at least 6
  months**, announced to all consumers; (2) during the window, v1 responses
  carry `Deprecation` and `Sunset` headers; (3) v1 is switched off only after
  the sunset date. The same applies to a deprecated event type: it keeps
  firing until the sunset date.

## Fixtures are the executable test surface

**`fixtures/` is the contract's test suite.** Both future implementations
must validate against it in CI, mechanically:

- **Producers (platforms):** your API responses and webhook payloads must
  validate against `schemas/` and be shape-compatible with the fixtures; the
  fixtures are literal examples of correct output (`fixtures/<endpoint>.json`
  per endpoint, `fixtures/events/<type>.json` per event type).
- **Consumers (dashboards):** your client must parse and render every fixture
  without error — including tolerating the extension namespaces and
  populated/empty `extensions` variants they exercise. Test your webhook
  handler by replaying the event fixtures (with a locally computed
  signature, per `events.md`).
- The inline response examples in `openapi.yaml` are copies of these
  fixtures; if they ever diverge, the fixtures win.
- All fixture data is fabricated (fake people, addresses, carriers) and
  shares one consistent tenant (`ten_01jm5wq0f8kavr3x`) so cross-entity
  references resolve.

## Spec directory map

| Path | Contents |
|---|---|
| `overview.md` | This document — actors, core model, versioning. |
| `openapi.yaml` | OpenAPI 3.1 description of the REST surface (lint: `npx @redocly/cli lint`). |
| `events.md` | Webhook catalog, envelope, delivery semantics, signatures. |
| `auth.md` | API keys, scopes, rotation, transport rules, OAuth upgrade path. |
| `schemas/` | Normative JSON Schemas (draft 2020-12): core entities, shared types, event envelope, per-event `data`, `roofing.claim` exemplar extension. |
| `fixtures/` | Golden payloads: one per endpoint (`fixtures/*.json`, plus `tenant.json` as an entity fixture — no tenant endpoint in v1) and one per event type (`fixtures/events/*.json`). |

## Status & reconciliation

This is **v0 of the contract — a stub entity list written before the
AccuLynx teardown finished**. One reconciliation pass is expected (not a
blocker for other phases) once `docs/research/acculynx/04-inferred-data-model.md`
and `05-public-api-teardown.md` land. Open items marked `RECONCILE(doc-04/05)`
in the schemas and docs:

1. **Contact granularity** — does core need a contact type/role
   (lead vs customer vs company), given AccuLynx's contacts/companies split?
2. **Project fields & status mapping** — validate the core field list and the
   roofing stage → core `status` mapping table above against the real
   job-status state machine (doc 04).
3. **Invoice statuses & line items** — partial-payment representation,
   `uncollectible`/`voided` semantics, whether line items enter core or stay
   in extensions (doc 05's invoicing resources).
4. **Metric catalog** — standard core metric keys vs AccuLynx report
   primitives.
5. **`roofing.claim` shape & statuses** — reconcile the claim enum and
   supplement fields against the insurance/supplements module teardown.
6. **Event catalog gaps** — candidate `*.updated`, `invoice.voided`, and
   supplement events after doc 05's webhook inventory.
7. **Rate-limit numbers** — headers are specified; concrete default limits
   are a platform decision to be documented at implementation time.
