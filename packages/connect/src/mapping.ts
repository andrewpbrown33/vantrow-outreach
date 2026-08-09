/** Gate 6 applied: `project` = sequence, always populated.
 *
 *  Nudgerow's domain expressed in Connect's frozen core vocabulary. The core
 *  `status` enum is deliberately small and shared across every Vantrow
 *  vertical, so a dashboard can rely on it; our native state rides verbatim in
 *  `status_detail`, which dashboards display but never branch on. */

/** Connect ids are prefixed and `[0-9a-z]{8,32}`; our UUIDs dashed-stripped
 *  are 32 hex chars, which satisfies that — and stays deterministic, so the
 *  same row always maps to the same Connect id (retries stay idempotent). */
export function connectId(prefix: string, uuid: string): string {
  return `${prefix}_${uuid.replace(/-/g, "").toLowerCase()}`;
}

export type SequenceState = "draft" | "active" | "paused" | "archived" | "canceled";
export type CoreStatus =
  | "lead" | "quoted" | "approved" | "in_progress" | "completed" | "closed" | "canceled";

/** The Gate-6 mapping row, in code. `scheduled` is an enrollment-level state
 *  that a sequence reaches when it has queued work but has not sent yet. */
export function mapSequenceStatus(
  state: SequenceState | "scheduled" | "finished",
): { status: CoreStatus; status_detail: string } {
  switch (state) {
    case "draft": return { status: "lead", status_detail: "draft" };
    case "scheduled": return { status: "quoted", status_detail: "scheduled" };
    case "active": return { status: "in_progress", status_detail: "active" };
    case "paused": return { status: "in_progress", status_detail: "paused" };
    case "finished": return { status: "completed", status_detail: "finished" };
    case "archived": return { status: "closed", status_detail: "archived" };
    case "canceled": return { status: "canceled", status_detail: "canceled" };
  }
}

export interface SequenceRow {
  id: string;
  workspace_id: string;
  name: string;
  state: SequenceState;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ProjectPayload {
  id: string;
  tenant_id: string;
  name: string;
  status: CoreStatus;
  status_detail: string | null;
  contact_id: string | null;
  address: null;
  contract_value: null;
  created_at: string;
  updated_at: string;
  extensions: Record<string, unknown>;
}

const iso = (v: Date | string): string =>
  (v instanceof Date ? v : new Date(v)).toISOString();

/** A sequence as a Connect project.
 *
 *  Honest nulls: outreach sequences have no job-site address and no contract
 *  value, and the core schema allows null for both — better an explicit null
 *  than a fabricated field. Outreach-specific counts ride in `extensions`
 *  (namespaced `outreach`), which consumers ignore unless they know it. */
export function sequenceToProject(
  seq: SequenceRow,
  tenantId: string,
  stats?: OutreachStats,
): ProjectPayload {
  const { status, status_detail } = mapSequenceStatus(seq.state);
  return {
    id: connectId("proj", seq.id),
    tenant_id: tenantId,
    name: seq.name,
    status,
    status_detail,
    contact_id: null,
    address: null,
    contract_value: null,
    created_at: iso(seq.created_at),
    updated_at: iso(seq.updated_at),
    // Extension keys must be dot-namespaced (`^…(\.…)+$`) — a bare "outreach"
    // fails the contract, which is exactly the sort of thing schema-validating
    // our own output catches before a consumer does.
    extensions: stats ? { "outreach.sequence": stats } : {},
  };
}

/** The `outreach.*` shape carried on projects and rolled into metrics. */
export interface OutreachStats {
  enrolled: number;
  active: number;
  replied: number;
  /** The cracks stat — finished with no reply (Gate 3's R4 surface). */
  finished_no_reply: number;
  bounced: number;
  sent: number;
}

export interface ProspectRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ContactPayload {
  id: string;
  tenant_id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: null;
  address: null;
  created_at: string;
  updated_at: string;
  extensions: Record<string, unknown>;
}

/** A prospect as a Connect contact. `phone` is always null and always will be:
 *  customer #1 excluded telephony (R-REQ), so we have no phone data to send —
 *  the null is the truth, not a gap. */
export function prospectToContact(p: ProspectRow, tenantId: string): ContactPayload {
  return {
    id: connectId("ctc", p.id),
    tenant_id: tenantId,
    first_name: p.first_name,
    last_name: p.last_name,
    company_name: p.company,
    email: p.email,
    phone: null,
    address: null,
    created_at: iso(p.created_at),
    updated_at: iso(p.updated_at),
    extensions: {},
  };
}
