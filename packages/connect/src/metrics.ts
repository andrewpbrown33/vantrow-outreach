/** The `outreach.*` metric catalog (Gate 6). Pre-aggregated by us — the
 *  contract is explicit that dashboards never re-aggregate raw data — and
 *  computed from the engine's own tables, so a dashboard number and the
 *  product's own feed can never disagree. */

import type { Pool } from "pg";
import { connectId } from "./mapping";

export interface MetricPayload {
  id: string;
  tenant_id: string;
  key: string;
  label: string;
  unit: "count" | "currency" | "percent" | "duration_days";
  value: number;
  currency: string | null;
  period: string;
  created_at: string;
  updated_at: string;
  extensions: Record<string, unknown>;
}

/** key → human label. `outreach.finished_no_reply` is the cracks stat that
 *  Gate 3 made the product's home surface — it earns dashboard space. */
const CATALOG: { key: string; label: string }[] = [
  { key: "outreach.sequences_active", label: "Active sequences" },
  { key: "outreach.enrollments_active", label: "Prospects in play" },
  { key: "outreach.sent_7d", label: "Emails sent (7 days)" },
  { key: "outreach.replied", label: "Replies" },
  { key: "outreach.finished_no_reply", label: "Through the cracks" },
  { key: "outreach.bounced", label: "Bounced" },
];

export async function computeMetrics(
  pool: Pool,
  workspaceId: string,
  tenantId: string,
  now: Date,
): Promise<MetricPayload[]> {
  const { rows } = await pool.query<{
    sequences_active: string; enrollments_active: string; sent_7d: string;
    replied: string; finished_no_reply: string; bounced: string;
  }>(
    `select
       (select count(*) from sequences
         where workspace_id = $1 and state = 'active') as sequences_active,
       (select count(*) from enrollments
         where workspace_id = $1 and state in ('scheduled','active','paused')) as enrollments_active,
       (select count(*) from touch_ledger
         where workspace_id = $1 and state = 'sent'
           and created_at >= now() - interval '7 days') as sent_7d,
       (select count(*) from enrollments
         where workspace_id = $1 and state = 'replied') as replied,
       (select count(*) from enrollments
         where workspace_id = $1 and state = 'finished_no_reply') as finished_no_reply,
       (select count(*) from enrollments
         where workspace_id = $1 and state = 'bounced') as bounced`,
    [workspaceId],
  );
  const counts = rows[0]!;
  const byKey: Record<string, number> = {
    "outreach.sequences_active": Number(counts.sequences_active),
    "outreach.enrollments_active": Number(counts.enrollments_active),
    "outreach.sent_7d": Number(counts.sent_7d),
    "outreach.replied": Number(counts.replied),
    "outreach.finished_no_reply": Number(counts.finished_no_reply),
    "outreach.bounced": Number(counts.bounced),
  };
  const stamp = now.toISOString();
  return CATALOG.map(({ key, label }) => ({
    // Stable per tenant+key, as the schema requires: same metric, same id,
    // forever — so a dashboard can upsert rather than accumulate duplicates.
    id: connectId("met", stableSuffix(`${tenantId}:${key}`)),
    tenant_id: tenantId,
    key,
    label,
    unit: "count" as const,
    value: byKey[key] ?? 0,
    currency: null,
    period: key.endsWith("_7d") ? "last_7d" : "all_time",
    created_at: stamp,
    updated_at: stamp,
    extensions: {},
  }));
}

/** Deterministic 32-hex-char suffix (FNV-1a x4) — no crypto import needed for
 *  a non-security id, and stable across processes and restarts. */
function stableSuffix(input: string): string {
  let out = "";
  for (let seed = 0; seed < 4; seed++) {
    let h = 0x811c9dc5 ^ seed;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    out += h.toString(16).padStart(8, "0");
  }
  return out;
}
