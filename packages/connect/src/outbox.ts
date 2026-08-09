/** The transactional outbox and its delivery worker.
 *
 *  Why an outbox at all: a webhook fired inline could describe a transaction
 *  that then rolled back, and a crash between commit and POST loses the
 *  notification outright. Enqueueing in the SAME transaction as the state
 *  change makes emission exactly as durable as the change it reports.
 *
 *  Delivery follows the spec's schedule (1m, 5m, 30m, 2h, 12h) and then
 *  dead-letters, retained for replay. The event id is minted once and reused
 *  on every attempt — it is the consumer's dedup key under at-least-once. */

import type { Pool, PoolClient } from "pg";
import { buildEnvelope, newEventId, signPayload, type Envelope } from "./envelope";

/** Spec §Delivery semantics. Index = attempts already made. */
const RETRY_BACKOFF_MS = [
  60_000, 5 * 60_000, 30 * 60_000, 2 * 3_600_000, 12 * 3_600_000,
];

export interface EnqueueArgs {
  workspaceId: string;
  tenantId: string;
  type: string;
  occurredAt: Date;
  data: unknown;
}

/** Enqueue inside the caller's transaction — pass the SAME client the state
 *  change is using, never the pool, or the durability guarantee is lost. */
export async function enqueueEvent(
  client: PoolClient,
  args: EnqueueArgs,
): Promise<Envelope> {
  const envelope = buildEnvelope({
    type: args.type,
    tenantId: args.tenantId,
    occurredAt: args.occurredAt,
    data: args.data,
    eventId: newEventId(),
  });
  await client.query(
    `insert into public.connect_outbox
       (workspace_id, event_id, event_type, occurred_at, payload)
     values ($1, $2, $3, $4, $5)`,
    [args.workspaceId, envelope.id, envelope.type, envelope.occurred_at, envelope],
  );
  return envelope;
}

export interface DeliveryStats {
  attempted: number;
  delivered: number;
  retrying: number;
  deadLettered: number;
  skipped: number;
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface DrainOpts {
  fetchImpl?: FetchLike;
  now?: () => number;
  batchSize?: number;
  timeoutMs?: number;
}

/** Drain due outbox rows. Called by the same minute cron that runs the engine
 *  sweep once the platform app lands. */
export async function drainOutbox(
  pool: Pool,
  opts: DrainOpts = {},
): Promise<DeliveryStats> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? Date.now;
  const timeoutMs = opts.timeoutMs ?? 10_000; // spec: 10s ack window
  const stats: DeliveryStats = {
    attempted: 0, delivered: 0, retrying: 0, deadLettered: 0, skipped: 0,
  };

  const due = await pool.query<{
    id: string; event_id: string; event_type: string; payload: unknown;
    attempts: number; url: string; secret: string; event_types: string[];
  }>(
    `select o.id, o.event_id, o.event_type, o.payload, o.attempts,
            e.url, e.secret, e.event_types
       from public.connect_outbox o
       join public.connect_endpoints e
         on e.workspace_id = o.workspace_id and e.enabled
      where o.state = 'pending' and o.next_attempt_at <= now()
      order by o.next_attempt_at
      limit $1`,
    [opts.batchSize ?? 50],
  );

  for (const row of due.rows) {
    // An endpoint may subscribe to a subset; an empty list means "all".
    if (row.event_types.length > 0 && !row.event_types.includes(row.event_type)) {
      await pool.query(
        `update public.connect_outbox
            set state = 'delivered', delivered_at = now(),
                last_error = 'not subscribed by endpoint'
          where id = $1`,
        [row.id]);
      stats.skipped += 1;
      continue;
    }
    if (!row.url.startsWith("https://")) {
      await pool.query(
        `update public.connect_outbox
            set state = 'dead_lettered', last_error = 'endpoint url is not https'
          where id = $1`,
        [row.id]);
      stats.deadLettered += 1;
      continue;
    }

    stats.attempted += 1;
    // Sign the exact bytes that go on the wire.
    const rawBody = JSON.stringify(row.payload);
    const signature = signPayload(rawBody, row.secret, now());

    let ok = false;
    let error = "";
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(row.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-vantrow-signature": signature,
          "x-vantrow-event-id": row.event_id,
        },
        body: rawBody,
        signal: ctl.signal,
        redirect: "manual", // spec: a 3xx is a failure, never followed
      });
      ok = res.status >= 200 && res.status < 300;
      if (!ok) error = `http_${res.status}`;
    } catch (err) {
      error = `transport: ${String(err).slice(0, 200)}`;
    } finally {
      clearTimeout(timer);
    }

    if (ok) {
      await pool.query(
        `update public.connect_outbox
            set state = 'delivered', delivered_at = now(),
                attempts = attempts + 1, last_error = null
          where id = $1`,
        [row.id]);
      stats.delivered += 1;
      continue;
    }

    const nextAttempt = row.attempts;
    const backoff = RETRY_BACKOFF_MS[nextAttempt];
    if (backoff === undefined) {
      await pool.query(
        `update public.connect_outbox
            set state = 'dead_lettered', attempts = attempts + 1, last_error = $2
          where id = $1`,
        [row.id, error]);
      stats.deadLettered += 1;
    } else {
      await pool.query(
        `update public.connect_outbox
            set attempts = attempts + 1, last_error = $2,
                next_attempt_at = now() + make_interval(secs => $3)
          where id = $1`,
        [row.id, error, backoff / 1000]);
      stats.retrying += 1;
    }
  }
  return stats;
}
