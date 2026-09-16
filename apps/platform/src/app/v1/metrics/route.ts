/** `GET /v1/metrics` — Nudgerow's numbers for the family console card.
 *
 *  Brand-level on purpose. This is Andrew's own view of Nudgerow across the
 *  whole install, not a tenant's view of their own outreach: the console sits
 *  behind the hub's admin gate and asks "how is this company doing", so every
 *  figure here is an aggregate and **no tenant's rows, names or addresses
 *  cross this boundary** — only counts. A client-facing widget is a separate
 *  surface with separate scoping, and must not be built on this.
 *
 *  Shape follows the hub's reader (vantrow-web lib/family/connect.ts): a
 *  `metrics` array of { key, label, unit, value }, with unknown fields
 *  ignored and metric keys treated as opaque display strings. That tolerance
 *  is what lets this list grow without a coordinated release. */

import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getPool } from "../../../lib/db";

export const dynamic = "force-dynamic";

/** Constant-time bearer check. Unset key means LOCKED, never open — the same
 *  posture as the cron tick: a missing secret must not silently publish. */
function authorized(req: Request): boolean {
  const expected = process.env.CONNECT_METRICS_KEY;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  const a = Buffer.from(header.slice(prefix.length));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

interface Row {
  workspaces: string;
  mailboxes: string;
  mailboxes_connected: string;
  sequences_active: string;
  in_play: string;
  waiting: string;
  sent_7d: string;
  replies_7d: string;
  bounces_7d: string;
  unsubscribes_7d: string;
  holds: string;
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let r: Row;
  try {
    const { rows } = await getPool().query<Row>(
      `select
         (select count(*) from public.workspaces) as workspaces,
         (select count(*) from public.mailboxes) as mailboxes,
         (select count(*) from public.mailboxes m
            join public.mailbox_credentials c on c.mailbox_id = m.id
           where c.last_refresh_error is null) as mailboxes_connected,
         (select count(*) from public.sequences where state = 'active')
           as sequences_active,
         (select count(*) from public.enrollments
           where state in ('scheduled', 'active')) as in_play,
         (select count(*) from public.enrollments where state = 'queued')
           as waiting,
         (select count(*) from public.touch_ledger
           where state = 'sent' and created_at > now() - interval '7 days')
           as sent_7d,
         (select count(*) from public.events
           where type = 'inbound.reply'
             and created_at > now() - interval '7 days') as replies_7d,
         (select count(*) from public.suppression_entries
           where reason = 'hard_bounce'
             and created_at > now() - interval '7 days') as bounces_7d,
         (select count(*) from public.suppression_entries
           where reason = 'unsubscribe'
             and created_at > now() - interval '7 days') as unsubscribes_7d,
         (select count(*) from public.release_policies where state = 'holding')
           as holds`,
    );
    r = rows[0]!;
  } catch {
    // The hub turns any non-200 into "not connected", which is the honest
    // answer when the database is unreachable — better than a card of zeros
    // that reads as "nothing is happening".
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const n = (v: string): number => Number(v ?? 0);
  const sent = n(r.sent_7d);
  const replies = n(r.replies_7d);
  const updated_at = new Date().toISOString();
  const metric = (key: string, label: string, unit: string, value: number) =>
    ({ key, label, unit, value, updated_at });

  return NextResponse.json(
    {
      metrics: [
        metric("accounts", "Accounts", "count", n(r.workspaces)),
        metric("mailboxes_connected", "Mailboxes connected", "count",
          n(r.mailboxes_connected)),
        metric("mailboxes", "Mailboxes total", "count", n(r.mailboxes)),
        metric("sequences_active", "Campaigns running", "count",
          n(r.sequences_active)),
        metric("in_play", "People in play", "count", n(r.in_play)),
        // The drip's queue: people accepted but deliberately not started yet.
        // Worth a number of its own, because a large queue beside a small
        // send count is the system working, not stalling.
        metric("waiting", "Waiting to start", "count", n(r.waiting)),
        metric("sent_7d", "Sent, last 7 days", "count", sent),
        metric("replies_7d", "Replies, last 7 days", "count", replies),
        metric("reply_rate_7d", "Reply rate, last 7 days", "percent",
          sent > 0 ? Math.round((replies / sent) * 1000) / 10 : 0),
        metric("bounces_7d", "Hard bounces, last 7 days", "count",
          n(r.bounces_7d)),
        metric("unsubscribes_7d", "Unsubscribes, last 7 days", "count",
          n(r.unsubscribes_7d)),
        // A ramp that has frozen itself is the one number here that asks for
        // action, so it rides on the card rather than waiting to be noticed.
        metric("release_holds", "Campaigns holding their ramp", "count",
          n(r.holds)),
      ],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
