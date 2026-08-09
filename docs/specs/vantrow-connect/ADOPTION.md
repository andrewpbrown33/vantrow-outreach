# Vantrow Connect — Nudgerow adoption

**Generated** by `pnpm connect:adoption` from the producer's own code
(`packages/connect`). Do not hand-edit: re-run the script instead, so this
document can never drift from what the platform actually emits.

Producer status: **implemented** (workstream D). Gate 6 decided the mapping;
this is that decision rendered as real payloads.

## Mapping (Gate 6: `project` = sequence)

| Nudgerow | Connect | Notes |
|---|---|---|
| Sequence | `project` | Always populated; one project per sequence. |
| Prospect | `contact` | `phone` is always null — customer #1 excluded telephony (R-REQ). |
| Enrollment counts | `project.extensions["outreach.sequence"]` | Namespaced; consumers ignore what they don't know. |
| Workspace | `tenant_id` | Deterministic from the workspace UUID. |

### Status mapping

| Sequence state | `status` | `status_detail` |
|---|---|---|
| draft | `lead` | `draft` |
| scheduled | `quoted` | `scheduled` |
| active | `in_progress` | `active` |
| paused | `in_progress` | `paused` |
| finished | `completed` | `finished` |
| archived | `closed` | `archived` |
| canceled | `canceled` | `canceled` |

The core enum is frozen and shared across every Vantrow vertical; our native
state always survives verbatim in `status_detail`, which dashboards display
but must not branch on.

## What we emit, and when

| Event | Fired when |
|---|---|
| `project.status_changed` | An enrollment reaches a terminal state (replied · finished-no-reply · hard bounce) — the sequence's outreach counts moved. |
| `project.created` | A sequence is created (workstream C surface). |

Emission is a **transactional outbox**: the event is enqueued in the same
database transaction as the state change, so it can never describe a state
that rolled back, and a crash between commit and POST leaves a durable row
rather than a lost notification.

## Real payloads

### `project.status_changed`

```json
{
  "id": "evt_7k2m9x4qp1vz8n3b6c0d5f7g",
  "type": "project.status_changed",
  "occurred_at": "2026-08-09T09:41:00.000Z",
  "tenant_id": "ten_00000000000040008000000000000001",
  "version": "v1",
  "data": {
    "project": {
      "id": "proj_7c4db95a1b2c4d3e8f90a1b2c3d4e5f6",
      "tenant_id": "ten_00000000000040008000000000000001",
      "name": "Vantrow intro — industrials",
      "status": "in_progress",
      "status_detail": "active",
      "contact_id": null,
      "address": null,
      "contract_value": null,
      "created_at": "2026-08-01T12:00:00.000Z",
      "updated_at": "2026-08-09T09:41:00.000Z",
      "extensions": {
        "outreach.sequence": {
          "enrolled": 41,
          "active": 21,
          "replied": 9,
          "finished_no_reply": 6,
          "bounced": 1,
          "sent": 116
        }
      }
    },
    "previous_status": "in_progress",
    "previous_status_detail": "active"
  }
}
```

### `project.created`

```json
{
  "id": "evt_3a5b7c9d1e2f4g6h8j0k2m4n",
  "type": "project.created",
  "occurred_at": "2026-08-01T12:00:00.000Z",
  "tenant_id": "ten_00000000000040008000000000000001",
  "version": "v1",
  "data": {
    "project": {
      "id": "proj_7c4db95a1b2c4d3e8f90a1b2c3d4e5f6",
      "tenant_id": "ten_00000000000040008000000000000001",
      "name": "Vantrow intro — industrials",
      "status": "lead",
      "status_detail": "draft",
      "contact_id": null,
      "address": null,
      "contract_value": null,
      "created_at": "2026-08-01T12:00:00.000Z",
      "updated_at": "2026-08-09T09:41:00.000Z",
      "extensions": {}
    }
  }
}
```

### A contact

```json
{
  "id": "ctc_9a8b7c6d5e4f4a3b2c1d0e9f8a7b6c5d",
  "tenant_id": "ten_00000000000040008000000000000001",
  "first_name": "Derek",
  "last_name": "Smith",
  "company_name": "Meridian Fasteners",
  "email": "derek@meridian.com",
  "phone": null,
  "address": null,
  "created_at": "2026-08-02T10:00:00.000Z",
  "updated_at": "2026-08-02T10:00:00.000Z",
  "extensions": {}
}
```

## Delivery

- **Signature header** (HMAC-SHA256 over `"<t>.<raw body>"`, keyed with the
  endpoint secret), on every delivery:

```
X-Vantrow-Signature: t=1786268490,v1=f7ac82d4b3a16e88e5dce50bd9c244922dab8816ad1de732c36c455b087fdf6b
X-Vantrow-Event-Id: evt_7k2m9x4qp1vz8n3b6c0d5f7g
```

- **Retry schedule:** 1m, 5m, 30m, 2h, 12h, then dead-lettered and retained
  for replay. The event id is minted once and reused on every attempt — it is
  the consumer's dedup key under at-least-once delivery.
- **HTTPS only.** A non-HTTPS endpoint is dead-lettered without sending; a 3xx
  is a failure and is never followed; the ack window is 10 seconds.
- **Verification** is exported as `verifySignature()` from
  `@vantrow/connect` — consumer teams can copy it verbatim.

## Metrics (`outreach.*`)

Pre-aggregated by us; dashboards never re-aggregate raw data.

| Key | Label |
|---|---|
| `outreach.sequences_active` | Active sequences |
| `outreach.enrollments_active` | Prospects in play |
| `outreach.sent_7d` | Emails sent (7 days) |
| `outreach.replied` | Replies |
| `outreach.finished_no_reply` | Through the cracks |
| `outreach.bounced` | Bounced |

## Not yet

- Subscription management is manual per the spec's v0 (operator-configured
  endpoint, secret, and event-type filter in `connect_endpoints`).
- `invoice.*` events are not emitted: Nudgerow has no billing surface. The
  contract permits a producer to emit only what it has.
- Dead-letter replay is manual (operator re-queues), matching the spec.
