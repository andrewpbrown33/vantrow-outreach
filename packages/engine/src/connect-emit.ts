/** Where the engine meets the Connect producer.
 *
 *  Every enrollment outcome the engine owns — replied, finished-no-reply,
 *  bounced — changes what a sequence looks like to a dashboard, so each one
 *  enqueues a `project.status_changed` in the SAME transaction as the state
 *  change (workstream D, Gate 6: project = sequence).
 *
 *  A workspace with no Connect endpoint configured emits nothing: the lookup
 *  is one indexed query and the common (unconnected) case costs a no-op. */

import type { PoolClient } from "pg";
import {
  connectId, enqueueEvent, mapSequenceStatus, sequenceToProject,
  type OutreachStats, type SequenceState,
} from "@vantrow/connect";

/** Tenant id for a workspace, or null when Connect isn't wired up here. */
async function tenantFor(
  client: PoolClient,
  workspaceId: string,
): Promise<string | null> {
  const { rows } = await client.query<{ tenant_id: string }>(
    "select tenant_id from public.connect_endpoints where workspace_id = $1 and enabled limit 1",
    [workspaceId],
  );
  return rows[0]?.tenant_id ?? null;
}

/** Live outreach counts for one sequence — the `outreach.sequence` extension
 *  block and the substance a dashboard actually wants. */
async function statsFor(
  client: PoolClient,
  sequenceId: string,
): Promise<OutreachStats> {
  const { rows } = await client.query<{
    enrolled: string; active: string; replied: string;
    finished_no_reply: string; bounced: string; sent: string;
  }>(
    `select
       count(*) filter (where true) as enrolled,
       count(*) filter (where e.state in ('scheduled','active','paused')) as active,
       count(*) filter (where e.state = 'replied') as replied,
       count(*) filter (where e.state = 'finished_no_reply') as finished_no_reply,
       count(*) filter (where e.state = 'bounced') as bounced,
       (select count(*) from public.touch_ledger t
         where t.enrollment_id in (select id from public.enrollments where sequence_id = $1)
           and t.state = 'sent') as sent
       from public.enrollments e
      where e.sequence_id = $1`,
    [sequenceId],
  );
  const r = rows[0]!;
  return {
    enrolled: Number(r.enrolled), active: Number(r.active),
    replied: Number(r.replied), finished_no_reply: Number(r.finished_no_reply),
    bounced: Number(r.bounced), sent: Number(r.sent),
  };
}

/** Enqueue `project.status_changed` for the sequence an enrollment belongs to.
 *  Call INSIDE the transaction that changed the enrollment. */
export async function emitSequenceProgress(
  client: PoolClient,
  args: {
    workspaceId: string;
    sequenceId: string;
    /** What just happened, for the event's detail — not a core status. */
    reason: string;
    occurredAt?: Date;
  },
): Promise<void> {
  const tenantId = await tenantFor(client, args.workspaceId);
  if (!tenantId) return; // Connect not configured for this workspace

  const seq = (await client.query<{
    id: string; workspace_id: string; name: string; state: SequenceState;
    created_at: Date; updated_at: Date;
  }>(
    `select id, workspace_id, name, state, created_at, updated_at
       from public.sequences where id = $1`,
    [args.sequenceId],
  )).rows[0];
  if (!seq) return;

  const stats = await statsFor(client, args.sequenceId);
  const project = sequenceToProject(seq, tenantId, stats);
  const { status, status_detail } = mapSequenceStatus(seq.state);

  await enqueueEvent(client, {
    workspaceId: args.workspaceId,
    tenantId,
    type: "project.status_changed",
    occurredAt: args.occurredAt ?? new Date(),
    data: {
      project,
      // The sequence's core status did not move — the enrollment mix under it
      // did. The contract wants both previous fields present; reporting the
      // same value is the truthful answer, and the reason rides in the
      // project's extension block rather than being faked into the enum.
      previous_status: status,
      previous_status_detail: status_detail,
    },
  });
  await client.query(
    `insert into public.events
       (workspace_id, type, sequence_id, payload)
     values ($1, 'connect.event_enqueued', $2, $3)`,
    [args.workspaceId, args.sequenceId,
     { connect_type: "project.status_changed", reason: args.reason,
       project_id: connectId("proj", args.sequenceId) }],
  );
}
