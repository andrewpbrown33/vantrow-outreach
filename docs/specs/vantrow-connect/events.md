# Vantrow Connect — Webhook Events (v1 surface)

> **Status: v0 DRAFT** — entity fields to be reconciled against
> `docs/research/acculynx/04-inferred-data-model.md` and
> `docs/research/acculynx/05-public-api-teardown.md` when those land
> (one revision pass expected).

Webhooks are how a Vantrow-subsidiary platform (producer) pushes changes to a
Vantrow client dashboard (consumer) without polling. They are a **notification
channel, not a source of truth**: delivery is at-least-once and unordered, so
consumers always reconcile against the GET APIs in `openapi.yaml`.

The JSON Schemas under `schemas/` are normative and the payloads under
`fixtures/events/` are the golden examples both implementations validate
against.

## Envelope

Every delivery is an HTTP `POST` to the consumer's endpoint with a JSON body
in the standard envelope (`schemas/event-envelope.schema.json`):

```json
{
  "id": "evt_01jm6b2ye7tz0nhv",
  "type": "project.status_changed",
  "occurred_at": "2026-07-08T14:32:11Z",
  "tenant_id": "ten_01jm5wq0f8kavr3x",
  "version": "v1",
  "data": { "...": "type-specific, see catalog" }
}
```

| Field | Meaning |
|---|---|
| `id` | Globally unique event id (`evt_...`). The idempotency key. |
| `type` | Event type from the catalog below. Extension events are namespaced by vertical (`roofing.*`). |
| `occurred_at` | RFC 3339 time the change happened on the platform (not delivery time). |
| `tenant_id` | Tenant the event belongs to. One endpoint may receive events for one tenant only in v0. |
| `version` | Contract version of the payload; matches the REST major version (`"v1"`). |
| `data` | Type-specific payload; schema per type under `schemas/events/`. |

**Snapshot semantics:** entity objects inside `data` are snapshots **as of
`occurred_at`**, validating against the same core entity schemas as the GET
APIs. A `project.created` event carries the project as it looked at creation
(typically `status: "lead"`), even if it has moved on by the time the event is
delivered or retried.

## Event catalog

| Type | Fired when | `data` payload | Schema | Fixture |
|---|---|---|---|---|
| `contact.created` | A contact is created | `{ contact }` | `schemas/events/contact.created.data.schema.json` | `fixtures/events/contact.created.json` |
| `project.created` | A project is created | `{ project }` | `schemas/events/project.created.data.schema.json` | `fixtures/events/project.created.json` |
| `project.status_changed` | A project's **core** `status` changes (`status_detail`-only changes do not fire) | `{ project, previous_status, previous_status_detail }` | `schemas/events/project.status_changed.data.schema.json` | `fixtures/events/project.status_changed.json` |
| `invoice.created` | An invoice is created | `{ invoice }` | `schemas/events/invoice.created.data.schema.json` | `fixtures/events/invoice.created.json` |
| `invoice.paid` | An invoice's `amount_due` reaches 0 (`status` becomes `paid`, `paid_at` set) | `{ invoice }` | `schemas/events/invoice.paid.data.schema.json` | `fixtures/events/invoice.paid.json` |
| `roofing.claim.status_changed` | *(extension exemplar)* The insurance claim on a roofing project changes status | `{ project_id, previous_status, claim }` | `schemas/events/roofing.claim.status_changed.data.schema.json` | `fixtures/events/roofing.claim.status_changed.json` |

Notes:

- Core event types (`contact.*`, `project.*`, `invoice.*`) are emitted by
  **every** vertical platform. Extension event types are namespaced by
  vertical (`roofing.claim.status_changed` is the exemplar) and follow the
  same rule as entity extensions: consumers MUST ignore event types they do
  not recognize (ack with 2xx and drop).
- Extension events reference core entities **by id** (`project_id`) rather
  than embedding them; fetch via `GET /v1/projects/{id}` when needed.
- New event types are additive within v1 (see versioning in `overview.md`).
- RECONCILE(doc-04/05): candidate additional events (`project.updated`,
  `contact.updated`, `invoice.voided`, roofing supplement events) after the
  AccuLynx webhook catalog teardown lands.

## Delivery semantics

- **At-least-once.** The same event may be delivered more than once (retries,
  redeliveries). Consumers MUST deduplicate on `id` — processing an already
  seen `id` must be a no-op acked with a 2xx.
- **Ordering is NOT guaranteed** — across types or even for the same entity.
  Do not build state machines off webhook arrival order. Reconcile with
  `occurred_at` plus the GET APIs: on receipt, either (a) treat the event as a
  hint and re-fetch the entity, or (b) apply the snapshot only if its
  `occurred_at`/`updated_at` is newer than what you have stored.
- **Acknowledgement:** any `2xx` response acks the delivery. Anything else —
  non-2xx, connection failure, or no response within **10 seconds** — counts
  as a failed attempt. Respond fast; do heavy work asynchronously.
- **Retry schedule** after a failed attempt: **1m, 5m, 30m, 2h, 12h**, then
  the event is **dead-lettered** (retained 30 days). In v0, dead-lettered
  events are replayed manually by the platform operator on request; a replay
  API is deferred alongside subscription management. Missed windows are
  always recoverable via `GET ... ?updated_since=` — that is the reason the
  list endpoints carry it.
- **Timeouts and redirects:** deliveries do not follow redirects; a 3xx is a
  failure.

## Signatures

Every delivery carries:

```
X-Vantrow-Signature: t=1720000000,v1=5f8b2c4d9e1a7f3b6c0d8e2a4b9f1c3d5e7a0b2c4d6e8f0a1b3c5d7e9f1a3b5c
```

- `t` — Unix seconds at signing time.
- `v1` — lowercase hex `HMAC-SHA256` of the string `"<t>.<raw body>"` (the
  timestamp, a literal `.`, then the **raw, unmodified** request body bytes),
  keyed with the endpoint's webhook secret (`whsec_...`, see `auth.md`).

Verification steps:

1. Parse the header into `t` and one or more `v1` values (during secret
   rotation the header contains a `v1=` entry per active secret,
   comma-appended; see `auth.md`).
2. Compute `HMAC-SHA256(secret, "<t>." + rawBody)` over the raw bytes —
   before any JSON parsing or re-serialization.
3. Constant-time-compare against each `v1` value; any match passes.
4. Reject if `|now - t|` exceeds **5 minutes** (replay protection). Retries
   are re-signed with a fresh `t`.

Pseudocode:

```
expected = hex(hmac_sha256(secret, t + "." + raw_body))
ok = any(constant_time_eq(expected, sig) for sig in v1_values) and abs(now() - t) <= 300
```

## Subscription management

**v0: manual provisioning.** The platform operator configures, per tenant:
the consumer endpoint URL (HTTPS only), the subscribed event types, and the
webhook secret (delivered out-of-band, see `auth.md`). Changes are operator
tickets, not API calls.

**Future (documented intent, NOT in v1):** a `/v1/webhook-endpoints` CRUD API
— create/list/update/delete endpoints, per-endpoint event-type filters,
secret rotation, and dead-letter replay — is the planned upgrade path. It
will be additive; the envelope and signature scheme above will not change
within v1.
