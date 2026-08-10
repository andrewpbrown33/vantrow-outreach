/** Every read and write the product surfaces make.
 *
 *  House rule, enforced by shape: the first argument of every function here is
 *  the workspace id, and every statement filters on it. The pool is a
 *  service-role connection (the engine's), so RLS does not constrain it —
 *  which makes these WHERE clauses the tenancy boundary, not a nicety. A query
 *  that cannot name its workspace does not belong in this file.
 *
 *  Counts come back from Postgres as bigint, which node-postgres hands over as
 *  a string; every aggregate is cast to int here so callers get numbers.
 */

import type { PoolClient } from "pg";
import { nextFireTime, type SendSchedule } from "@vantrow/engine";
import { getPool } from "./db";
import { DOT_STATES, type DotState, type EnrollmentState } from "./states";

export { DOT_STATES } from "./states";
export type { DotState, EnrollmentState } from "./states";

export interface SequenceSummary {
  id: string;
  name: string;
  state: "draft" | "active" | "paused" | "archived";
  mailboxEmail: string | null;
  counts: Record<DotState, number>;
  inPlay: number;
}

const COUNT_COLUMNS = DOT_STATES
  .map((s) => `count(e.id) filter (where e.state = '${s}')::int as "${s}"`)
  .join(",\n           ");

function toSummary(row: Record<string, unknown>): SequenceSummary {
  const counts = Object.fromEntries(
    DOT_STATES.map((s) => [s, Number(row[s] ?? 0)]),
  ) as Record<DotState, number>;
  return {
    id: String(row.id),
    name: String(row.name),
    state: row.state as SequenceSummary["state"],
    mailboxEmail: (row.mailbox_email as string | null) ?? null,
    counts,
    inPlay: DOT_STATES.reduce((n, s) => n + counts[s], 0),
  };
}

export async function listSequenceSummaries(ws: string): Promise<SequenceSummary[]> {
  const { rows } = await getPool().query(
    `select s.id, s.name, s.state, mb.email as mailbox_email,
            ${COUNT_COLUMNS}
       from public.sequences s
       left join public.mailboxes mb on mb.id = s.mailbox_id
       left join public.enrollments e
              on e.sequence_id = s.id and e.workspace_id = s.workspace_id
      where s.workspace_id = $1 and s.state <> 'archived'
      group by s.id, mb.email
      order by (s.state = 'active') desc, s.updated_at desc`,
    [ws],
  );
  return rows.map(toSummary);
}

export async function workspaceStateCounts(ws: string): Promise<Record<DotState, number>> {
  const { rows } = await getPool().query(
    `select e.state, count(*)::int as n
       from public.enrollments e
      where e.workspace_id = $1
      group by e.state`,
    [ws],
  );
  const counts = Object.fromEntries(DOT_STATES.map((s) => [s, 0])) as Record<DotState, number>;
  for (const r of rows) {
    const s = r.state as DotState;
    if (s in counts) counts[s] = Number(r.n);
  }
  return counts;
}

// --- The feed --------------------------------------------------------------

/** Event types that describe something a person did or something that happened
 *  to a person. Bookkeeping types (connect.event_enqueued, touch.recovered,
 *  touch.deferred) stay out of the feed and remain in the ledger. */
export const FEED_TYPES = [
  "inbound.reply", "touch.sent", "touch.draft_due",
  "enrollment.finished_no_reply", "enrollment.paused",
  "inbound.bounce_hard", "enrollment.suppression_halt", "touch.failed",
] as const;

export interface FeedRow {
  id: string;
  type: string;
  createdAt: Date;
  payload: Record<string, unknown>;
  enrollmentId: string | null;
  sequenceId: string | null;
  sequenceName: string | null;
  prospectId: string | null;
  prospectName: string | null;
  prospectEmail: string | null;
  stepOrder: number | null;
  snippet: string | null;
}

export async function listFeed(ws: string, limit = 120): Promise<FeedRow[]> {
  const { rows } = await getPool().query(
    `select ev.id, ev.type, ev.created_at, ev.payload,
            ev.enrollment_id, coalesce(ev.sequence_id, en.sequence_id) as sequence_id,
            s.name as sequence_name,
            p.id as prospect_id, p.first_name, p.last_name, p.email as prospect_email,
            coalesce((ev.payload->>'step_order')::int, en.current_step_order) as step_order,
            im.snippet
       from public.events ev
       left join public.enrollments en on en.id = ev.enrollment_id
       left join public.prospects p
              on p.id = coalesce(ev.prospect_id, en.prospect_id)
       left join public.sequences s
              on s.id = coalesce(ev.sequence_id, en.sequence_id)
       left join public.inbound_messages im
              on im.workspace_id = ev.workspace_id
             and im.gmail_message_id = ev.payload->>'gmail_message_id'
      where ev.workspace_id = $1
        and ev.type = any($2::text[])
      order by ev.created_at desc, ev.id desc
      limit $3`,
    [ws, [...FEED_TYPES], limit],
  );
  return rows.map((r) => ({
    id: String(r.id),
    type: String(r.type),
    createdAt: r.created_at as Date,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    enrollmentId: (r.enrollment_id as string | null) ?? null,
    sequenceId: (r.sequence_id as string | null) ?? null,
    sequenceName: (r.sequence_name as string | null) ?? null,
    prospectId: (r.prospect_id as string | null) ?? null,
    prospectName: displayName(r.first_name, r.last_name, r.prospect_email),
    prospectEmail: (r.prospect_email as string | null) ?? null,
    stepOrder: r.step_order === null ? null : Number(r.step_order),
    snippet: (r.snippet as string | null) ?? null,
  }));
}

export function displayName(
  first: unknown, last: unknown, email: unknown,
): string | null {
  const parts = [first, last].filter((p): p is string => typeof p === "string" && p.length > 0);
  if (parts.length > 0) return parts.join(" ");
  if (typeof email === "string" && email.length > 0) return email;
  return null;
}

// --- Sequence detail -------------------------------------------------------

export interface SequenceDetail {
  id: string;
  name: string;
  state: SequenceSummary["state"];
  mailboxId: string | null;
  mailboxEmail: string | null;
  dailyCap: number | null;
  timezoneSource: "prospect" | "sequence";
  fallbackTimezone: string;
  windowDays: number[];
  windowStartMinute: number;
  windowEndMinute: number;
  skipUsHolidays: boolean;
  oooAutoResume: boolean;
}

export async function getSequence(ws: string, id: string): Promise<SequenceDetail | null> {
  const { rows } = await getPool().query(
    `select s.*, mb.email as mailbox_email, mb.daily_cap
       from public.sequences s
       left join public.mailboxes mb on mb.id = s.mailbox_id
      where s.workspace_id = $1 and s.id = $2`,
    [ws, id],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id, name: r.name, state: r.state,
    mailboxId: r.mailbox_id ?? null,
    mailboxEmail: r.mailbox_email ?? null,
    dailyCap: r.daily_cap === null || r.daily_cap === undefined ? null : Number(r.daily_cap),
    timezoneSource: r.timezone_source,
    fallbackTimezone: r.fallback_timezone,
    windowDays: (r.window_days as number[]) ?? [],
    windowStartMinute: Number(r.window_start_minute),
    windowEndMinute: Number(r.window_end_minute),
    skipUsHolidays: r.skip_us_holidays,
    oooAutoResume: r.ooo_auto_resume,
  };
}

export interface StepRow {
  id: string;
  stepOrder: number;
  mode: "auto" | "draft_first";
  intervalDays: number;
  intervalHours: number;
  threadAsReply: boolean;
  subject: string | null;
  templateName: string | null;
}

export async function listSteps(ws: string, sequenceId: string): Promise<StepRow[]> {
  const { rows } = await getPool().query(
    `select st.id, st.step_order, st.mode, st.interval_days, st.interval_hours,
            st.thread_as_reply, t.subject, t.name as template_name
       from public.sequence_steps st
       left join public.email_templates t on t.id = st.template_id
      where st.workspace_id = $1 and st.sequence_id = $2
      order by st.step_order`,
    [ws, sequenceId],
  );
  return rows.map((r) => ({
    id: r.id,
    stepOrder: Number(r.step_order),
    mode: r.mode,
    intervalDays: Number(r.interval_days),
    intervalHours: Number(r.interval_hours),
    threadAsReply: r.thread_as_reply,
    subject: r.subject ?? null,
    templateName: r.template_name ?? null,
  }));
}

export interface EnrollmentRow {
  id: string;
  state: EnrollmentState;
  prospectName: string | null;
  prospectEmail: string;
  company: string | null;
  currentStepOrder: number;
  nextTouchAt: Date | null;
  pauseReason: string | null;
  resumeAt: Date | null;
  timezone: string | null;
}

export async function listEnrollments(
  ws: string, sequenceId: string, limit = 200,
): Promise<EnrollmentRow[]> {
  const { rows } = await getPool().query(
    `select e.id, e.state, e.current_step_order, e.next_touch_at,
            e.pause_reason, e.resume_at,
            p.first_name, p.last_name, p.email, p.company, p.timezone
       from public.enrollments e
       join public.prospects p on p.id = e.prospect_id
      where e.workspace_id = $1 and e.sequence_id = $2
      order by array_position(
                 array['replied','paused','bounced','active','scheduled',
                       'finished_no_reply','canceled']::text[], e.state),
               e.next_touch_at nulls last, p.email
      limit $3`,
    [ws, sequenceId, limit],
  );
  return rows.map((r) => ({
    id: r.id,
    state: r.state,
    prospectName: displayName(r.first_name, r.last_name, null),
    prospectEmail: r.email,
    company: r.company ?? null,
    currentStepOrder: Number(r.current_step_order),
    nextTouchAt: r.next_touch_at ?? null,
    pauseReason: r.pause_reason ?? null,
    resumeAt: r.resume_at ?? null,
    timezone: r.timezone ?? null,
  }));
}

// --- Mailboxes and prospects ----------------------------------------------

export interface MailboxRow {
  id: string;
  email: string;
  displayName: string | null;
  dailyCap: number;
  sendDisabled: boolean;
  connected: boolean;
  lastRefreshError: string | null;
}

export async function listMailboxes(ws: string): Promise<MailboxRow[]> {
  const { rows } = await getPool().query(
    `select m.id, m.email, m.display_name, m.daily_cap, m.send_disabled,
            (c.mailbox_id is not null) as connected, c.last_refresh_error
       from public.mailboxes m
       left join public.mailbox_credentials c on c.mailbox_id = m.id
      where m.workspace_id = $1
      order by m.email`,
    [ws],
  );
  return rows.map((r) => ({
    id: r.id, email: r.email, displayName: r.display_name ?? null,
    dailyCap: Number(r.daily_cap), sendDisabled: r.send_disabled,
    connected: r.connected, lastRefreshError: r.last_refresh_error ?? null,
  }));
}

export interface ProspectRow {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  title: string | null;
  timezone: string | null;
  optedOut: boolean;
  suppressed: boolean;
  liveEnrollments: number;
}

export async function listProspects(
  ws: string, limit = 200, search = "",
): Promise<ProspectRow[]> {
  const like = search.trim() ? `%${search.trim().toLowerCase()}%` : null;
  const { rows } = await getPool().query(
    `select p.id, p.email, p.first_name, p.last_name, p.company, p.title,
            p.timezone, p.opted_out_at,
            exists (select 1 from public.suppression_entries su
                     where su.workspace_id = p.workspace_id
                       and lower(su.email) = lower(p.email)) as suppressed,
            count(e.id) filter (
              where e.state in ('scheduled','active','paused'))::int as live
       from public.prospects p
       left join public.enrollments e
              on e.prospect_id = p.id and e.workspace_id = p.workspace_id
      where p.workspace_id = $1
        and ($3::text is null
             or lower(p.email) like $3
             or lower(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) like $3
             or lower(coalesce(p.company,'')) like $3)
      group by p.id
      order by p.created_at desc
      limit $2`,
    [ws, limit, like],
  );
  return rows.map((r) => ({
    id: r.id, email: r.email,
    name: displayName(r.first_name, r.last_name, null),
    company: r.company ?? null, title: r.title ?? null,
    timezone: r.timezone ?? null,
    optedOut: r.opted_out_at !== null,
    suppressed: r.suppressed,
    liveEnrollments: Number(r.live),
  }));
}

/** How much work the engine expects to do before midnight — the feed's "live"
 *  line. Counts due-or-scheduled touches, not sends that already happened. */
export async function countQueuedToday(ws: string): Promise<number> {
  const { rows } = await getPool().query(
    `select count(*)::int as n
       from public.enrollments
      where workspace_id = $1
        and state in ('scheduled','active')
        and next_touch_at is not null
        and next_touch_at < date_trunc('day', now()) + interval '1 day'`,
    [ws],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function countProspects(ws: string): Promise<number> {
  const { rows } = await getPool().query(
    `select count(*)::int as n from public.prospects where workspace_id = $1`, [ws]);
  return Number(rows[0]?.n ?? 0);
}

// --- Writes ----------------------------------------------------------------

export interface NewStepInput {
  subject: string;
  bodyHtml: string;
  intervalDays: number;
  intervalHours: number;
  mode: "auto" | "draft_first";
  threadAsReply: boolean;
}

export interface NewSequenceInput {
  name: string;
  mailboxId: string;
  timezoneSource: "prospect" | "sequence";
  fallbackTimezone: string;
  windowDays: number[];
  windowStartMinute: number;
  windowEndMinute: number;
  skipUsHolidays: boolean;
  steps: NewStepInput[];
}

/** One transaction: the sequence, a template per step, and the steps. A
 *  half-built sequence is worse than none — the engine would run it. */
export async function createSequence(ws: string, input: NewSequenceInput): Promise<string> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");

    // The mailbox must belong to this workspace: the id arrives from a form.
    const mb = await client.query(
      `select id from public.mailboxes where workspace_id = $1 and id = $2`,
      [ws, input.mailboxId],
    );
    if (mb.rowCount === 0) throw new Error("that mailbox is not in this workspace");

    const seq = await client.query<{ id: string }>(
      `insert into public.sequences
         (workspace_id, name, state, mailbox_id, timezone_source, fallback_timezone,
          window_days, window_start_minute, window_end_minute, skip_us_holidays)
       values ($1, $2, 'draft', $3, $4, $5, $6, $7, $8, $9)
       returning id`,
      [ws, input.name, input.mailboxId, input.timezoneSource, input.fallbackTimezone,
       input.windowDays, input.windowStartMinute, input.windowEndMinute,
       input.skipUsHolidays],
    );
    const sequenceId = seq.rows[0].id;

    for (const [i, step] of input.steps.entries()) {
      const tpl = await client.query<{ id: string }>(
        `insert into public.email_templates (workspace_id, name, subject, body_html)
         values ($1, $2, $3, $4) returning id`,
        [ws, `${input.name} · step ${i + 1}`, step.subject, step.bodyHtml],
      );
      await client.query(
        `insert into public.sequence_steps
           (workspace_id, sequence_id, step_order, template_id, mode,
            interval_days, interval_hours, thread_as_reply)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [ws, sequenceId, i + 1, tpl.rows[0].id, step.mode,
         // Step 1 fires on enrollment: its interval is always zero (R2).
         i === 0 ? 0 : step.intervalDays, i === 0 ? 0 : step.intervalHours,
         i === 0 ? false : step.threadAsReply],
      );
    }

    await client.query("commit");
    return sequenceId;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function setSequenceState(
  ws: string, id: string, state: "draft" | "active" | "paused" | "archived",
): Promise<void> {
  await getPool().query(
    `update public.sequences set state = $3, updated_at = now()
      where workspace_id = $1 and id = $2`,
    [ws, id, state],
  );
}

/** Turning a sequence on is not just a state flip.
 *
 *  The sweep pauses any enrollment whose sequence is not active, and it clears
 *  `next_touch_at` when it does — which is correct (nothing should be armed
 *  while the sequence is off) but leaves those rows with no timer. Since the
 *  timer IS the schedule, flipping the sequence back to active would strand
 *  everyone who was enrolled while it was a draft: paused forever, invisible
 *  to the claim query, silently never sent.
 *
 *  So activation re-plans them. Only enrollments the sweep parked for THIS
 *  reason are revived — an out-of-office pause carries its own return date and
 *  reviving it early would break I6.
 *
 *  One transaction, and every revival leaves an event (I10).
 */
export async function activateSequence(
  ws: string, id: string, now: Date = new Date(),
): Promise<{ activated: boolean; revived: number }> {
  const seq = await getSequence(ws, id);
  if (!seq) return { activated: false, revived: 0 };

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `update public.sequences set state = 'active', updated_at = now()
        where workspace_id = $1 and id = $2`,
      [ws, id],
    );

    const { rows } = await client.query<{
      id: string; mailbox_id: string; prospect_tz: string | null;
    }>(
      `select e.id, e.mailbox_id, p.timezone as prospect_tz
         from public.enrollments e
         join public.prospects p on p.id = e.prospect_id
        where e.workspace_id = $1 and e.sequence_id = $2
          and e.claimed_at is null
          and (
            (e.state = 'paused' and e.pause_reason = 'sequence not active')
            or (e.state in ('scheduled', 'active') and e.next_touch_at is null)
          )
        for update of e`,
      [ws, id],
    );

    for (const r of rows) {
      const fireAt = nextFireTime(now, { days: 0, hours: 0 },
        scheduleFor(seq, r.prospect_tz), Math.random());
      await client.query(
        `update public.enrollments
            set state = 'scheduled', pause_reason = null, next_touch_at = $2,
                updated_at = now()
          where id = $1`,
        [r.id, fireAt],
      );
      await client.query(
        `insert into public.events
           (workspace_id, type, enrollment_id, sequence_id, mailbox_id, payload)
         values ($1, 'enrollment.resumed', $2, $3, $4, $5)`,
        [ws, r.id, id, r.mailbox_id,
         { reason: "sequence_activated", next_touch_at: fireAt.toISOString() }],
      );
    }

    await client.query("commit");
    return { activated: true, revived: rows.length };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// --- Enrollment ------------------------------------------------------------

export interface EnrollOutcome {
  enrolled: number;
  alreadyEnrolled: number;
  suppressed: string[];
  optedOut: string[];
}

function scheduleFor(seq: SequenceDetail, prospectTz: string | null): SendSchedule {
  return {
    windowDays: seq.windowDays,
    windowStartMinute: seq.windowStartMinute,
    windowEndMinute: seq.windowEndMinute,
    timeZone: seq.timezoneSource === "prospect" && prospectTz
      ? prospectTz
      : seq.fallbackTimezone,
    skipUsHolidays: seq.skipUsHolidays,
  };
}

/** Enroll prospects, screening suppression and opt-out FIRST (I3 lives in the
 *  dispatch transaction too — this is the early, visible half of the same law:
 *  a suppressed address never becomes an enrollment in the first place). */
export async function enrollProspects(
  ws: string, sequenceId: string, prospectIds: string[],
  now: Date = new Date(),
): Promise<EnrollOutcome> {
  const out: EnrollOutcome = {
    enrolled: 0, alreadyEnrolled: 0, suppressed: [], optedOut: [],
  };
  if (prospectIds.length === 0) return out;

  const seq = await getSequence(ws, sequenceId);
  if (!seq) throw new Error("sequence not found");
  if (!seq.mailboxId) throw new Error("that sequence has no sending mailbox");

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `select p.id, p.email, p.timezone, p.opted_out_at,
              exists (select 1 from public.suppression_entries su
                       where su.workspace_id = p.workspace_id
                         and lower(su.email) = lower(p.email)) as suppressed
         from public.prospects p
        where p.workspace_id = $1 and p.id = any($2::uuid[])`,
      [ws, prospectIds],
    );

    for (const p of rows) {
      if (p.suppressed) { out.suppressed.push(p.email); continue; }
      if (p.opted_out_at !== null) { out.optedOut.push(p.email); continue; }

      // Step 1 has a zero interval, so the first fire time is simply the next
      // legal slot in the window.
      const fireAt = nextFireTime(now, { days: 0, hours: 0 },
        scheduleFor(seq, p.timezone ?? null), Math.random());

      const ins = await client.query(
        `insert into public.enrollments
           (workspace_id, sequence_id, prospect_id, mailbox_id, state,
            current_step_order, next_touch_at)
         values ($1, $2, $3, $4, 'scheduled', 1, $5)
         on conflict (sequence_id, prospect_id)
           where state in ('scheduled','active','paused') do nothing`,
        [ws, sequenceId, p.id, seq.mailboxId, fireAt],
      );
      if ((ins.rowCount ?? 0) > 0) out.enrolled += 1;
      else out.alreadyEnrolled += 1;
    }
    await client.query("commit");
    return out;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// --- Import ----------------------------------------------------------------

export interface ImportCandidate {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  timezone?: string;
}

export interface ImportOutcome {
  created: number;
  updated: number;
  ids: string[];
}

/** Upsert by (workspace, lower(email)) — the same key the schema's unique
 *  index uses, so a re-import enriches rather than duplicates. Blank incoming
 *  fields never erase what is already stored. */
export async function upsertProspects(
  ws: string, rows: ImportCandidate[],
): Promise<ImportOutcome> {
  const out: ImportOutcome = { created: 0, updated: 0, ids: [] };
  if (rows.length === 0) return out;

  const pool = getPool();
  const client: PoolClient = await pool.connect();
  try {
    await client.query("begin");
    for (const r of rows) {
      const res = await client.query<{ id: string; inserted: boolean }>(
        `insert into public.prospects
           (workspace_id, email, first_name, last_name, company, title, timezone)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (workspace_id, lower(email)) do update
           set first_name = coalesce(nullif(excluded.first_name, ''), public.prospects.first_name),
               last_name  = coalesce(nullif(excluded.last_name, ''),  public.prospects.last_name),
               company    = coalesce(nullif(excluded.company, ''),    public.prospects.company),
               title      = coalesce(nullif(excluded.title, ''),      public.prospects.title),
               timezone   = coalesce(nullif(excluded.timezone, ''),   public.prospects.timezone),
               updated_at = now()
         returning id, (xmax = 0) as inserted`,
        [ws, r.email, r.firstName ?? null, r.lastName ?? null,
         r.company ?? null, r.title ?? null, r.timezone ?? null],
      );
      const row = res.rows[0];
      out.ids.push(row.id);
      if (row.inserted) out.created += 1; else out.updated += 1;
    }
    await client.query("commit");
    return out;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
