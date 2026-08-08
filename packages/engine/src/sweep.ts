/** The minute sweep (Gate 5, workstream B2): claim due enrollments with
 *  FOR UPDATE SKIP LOCKED (via claim_due_enrollments), then execute each in
 *  ONE transaction — final pause/reply/suppression recheck immediately before
 *  the send call (I2/I3/I6), idempotency-ledger insert before side effects
 *  (I1), caps defer and never drop (I5), everything appends to events (I10),
 *  COGS counters tick on every provider call. Crash-safety: claims expire by
 *  TTL and re-sweep under a bumped attempt_epoch; before a bumped-epoch send
 *  fires, the provider seam is asked whether a prior epoch already reached the
 *  wire (I8). */

import type { Pool, PoolClient } from "pg";
import type { Provider } from "./dispatcher";
import { nextFireTime, snapToWindow, type SendSchedule } from "./planner";

export interface SweepOptions {
  batchSize?: number;
  claimTtlMinutes?: number;
  /** Deterministic jitter for tests; defaults to Math.random per touch. */
  jitterFraction?: () => number;
}

export interface SweepStats {
  claimed: number;
  sent: number;
  deferred: number;
  skipped: number;
  failed: number;
}

interface ClaimedRow {
  id: string;
  claim_token: string;
  attempt_epoch: number;
}

export async function sweepOnce(
  pool: Pool,
  provider: Provider,
  opts: SweepOptions = {},
): Promise<SweepStats> {
  const stats: SweepStats = { claimed: 0, sent: 0, deferred: 0, skipped: 0, failed: 0 };
  const claimed = await pool.query<ClaimedRow>(
    "select id, claim_token, attempt_epoch from public.claim_due_enrollments($1, make_interval(mins => $2))",
    [opts.batchSize ?? 50, opts.claimTtlMinutes ?? 5],
  );
  stats.claimed = claimed.rowCount ?? 0;
  for (const row of claimed.rows) {
    const outcome = await executeOne(pool, provider, row, opts);
    stats[outcome] += 1;
  }
  return stats;
}

export type Outcome = "sent" | "deferred" | "skipped" | "failed";

interface WorkRow {
  workspace_id: string;
  state: string;
  current_step_order: number;
  attempt_epoch: number;
  replied_at: Date | null;
  claim_token: string | null;
  prospect_email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  custom: Record<string, unknown>;
  prospect_tz: string | null;
  opted_out_at: Date | null;
  sequence_id: string;
  seq_state: string;
  timezone_source: string;
  fallback_timezone: string;
  window_days: number[];
  window_start_minute: number;
  window_end_minute: number;
  skip_us_holidays: boolean;
  mailbox_id: string;
  mailbox_email: string;
  daily_cap: number;
  send_disabled: boolean;
  suppressed: boolean;
}

/** Execute one claimed enrollment in a single transaction. Exported for the
 *  invariant suite, which needs to interleave state changes between the claim
 *  and the execution (the I2 reply race). */
export async function executeOne(
  pool: Pool,
  provider: Provider,
  claim: { id: string; claim_token: string; attempt_epoch: number },
  opts: SweepOptions = {},
): Promise<Outcome> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const work = await client.query<WorkRow>(
      `select e.workspace_id, e.state, e.current_step_order, e.attempt_epoch,
              e.replied_at, e.claim_token,
              p.email as prospect_email, p.first_name, p.last_name, p.company,
              p.title, p.custom, p.timezone as prospect_tz, p.opted_out_at,
              s.id as sequence_id, s.state as seq_state, s.timezone_source,
              s.fallback_timezone, s.window_days, s.window_start_minute,
              s.window_end_minute, s.skip_us_holidays,
              m.id as mailbox_id, m.email as mailbox_email, m.daily_cap,
              m.send_disabled,
              exists (
                select 1 from public.suppression_entries sup
                where sup.workspace_id = e.workspace_id
                  and lower(sup.email) = lower(p.email)
              ) as suppressed
         from public.enrollments e
         join public.prospects p on p.id = e.prospect_id
         join public.sequences s on s.id = e.sequence_id
         join public.mailboxes m on m.id = e.mailbox_id
        where e.id = $1
        for update of e`,
      [claim.id],
    );
    const w = work.rows[0];
    // Someone else resolved it, or our claim was superseded: leave quietly.
    if (!w || w.claim_token !== claim.claim_token ||
        (w.state !== "scheduled" && w.state !== "active")) {
      await client.query("rollback");
      return "skipped";
    }

    const events = (type: string, payload: Record<string, unknown> = {}) =>
      client.query(
        `insert into public.events
           (workspace_id, type, enrollment_id, sequence_id, mailbox_id, payload)
         values ($1, $2, $3, $4, $5, $6)`,
        [w.workspace_id, type, claim.id, w.sequence_id, w.mailbox_id, payload],
      );
    const resolve = (fields: string, params: unknown[]) =>
      client.query(
        `update public.enrollments
            set ${fields}, claimed_at = null, claim_token = null, updated_at = now()
          where id = $1`,
        [claim.id, ...params],
      );

    // --- Final rechecks, in law order (I2 reply > I3 suppression > gates) ---
    if (w.replied_at !== null) {
      await resolve("state = 'replied', next_touch_at = null", []);
      await events("enrollment.stopped_on_reply", { at_step: w.current_step_order });
      await client.query("commit");
      return "skipped";
    }
    if (w.suppressed || w.opted_out_at !== null) {
      await resolve(
        "state = 'canceled', next_touch_at = null, error_reason = $2", [
        w.suppressed ? "address suppressed" : "prospect opted out",
      ]);
      await events("enrollment.suppression_halt", {
        reason: w.suppressed ? "suppressed" : "opted_out",
      });
      await client.query("commit");
      return "skipped";
    }
    if (w.seq_state !== "active") {
      await resolve(
        "state = 'paused', next_touch_at = null, pause_reason = 'sequence not active'",
        []);
      await events("enrollment.paused", { reason: "sequence_not_active" });
      await client.query("commit");
      return "skipped";
    }

    const schedule: SendSchedule = {
      windowDays: w.window_days,
      windowStartMinute: w.window_start_minute,
      windowEndMinute: w.window_end_minute,
      timeZone: w.timezone_source === "prospect"
        ? (w.prospect_tz ?? w.fallback_timezone)
        : w.fallback_timezone,
      skipUsHolidays: w.skip_us_holidays,
    };

    if (w.send_disabled) {
      await resolve("next_touch_at = now() + interval '15 minutes'", []);
      await events("touch.deferred", { reason: "mailbox_disabled" });
      await client.query("commit");
      return "deferred";
    }

    // I5: per-mailbox daily cap defers to the next legal window, never drops.
    const capRes = await client.query<{ sent_today: string }>(
      `select count(*) as sent_today from public.touch_ledger
        where mailbox_id = $1 and state = 'sent'
          and created_at >= date_trunc('day', now())`,
      [w.mailbox_id],
    );
    if (Number(capRes.rows[0]?.sent_today ?? 0) >= w.daily_cap) {
      const endOfWindow = endOfCurrentWindow(new Date(), schedule);
      const nta = snapToWindow(endOfWindow, schedule, (opts.jitterFraction ?? Math.random)());
      await resolve("next_touch_at = $2", [nta]);
      await events("touch.deferred", { reason: "daily_cap", resumes_at: nta.toISOString() });
      await client.query("commit");
      return "deferred";
    }

    const stepRes = await client.query<{
      step_order: number; template_id: string | null; mode: string;
      thread_as_reply: boolean;
    }>(
      `select step_order, template_id, mode, thread_as_reply
         from public.sequence_steps
        where sequence_id = $1 and step_order = $2`,
      [w.sequence_id, w.current_step_order],
    );
    const step = stepRes.rows[0];
    if (!step) {
      // Ran off the end: every step already fired — the cracks state.
      await resolve(
        "state = 'finished_no_reply', next_touch_at = null, finished_at = now()", []);
      await events("enrollment.finished_no_reply", {});
      await client.query("commit");
      return "skipped";
    }

    // Protocol §10: draft-first steps wait for a human; the engine never
    // auto-sends them. Approval re-arms the enrollment (workstream C surface).
    if (step.mode === "draft_first") {
      await resolve(
        "state = 'paused', next_touch_at = null, pause_reason = 'awaiting draft approval'",
        []);
      await events("touch.draft_due", { step_order: step.step_order });
      await client.query("commit");
      return "skipped";
    }

    const touchRef = `${claim.id}:${w.current_step_order}`;
    const idempotencyKey = `${touchRef}:${w.attempt_epoch}`;

    // I8: a bumped epoch means a prior attempt may have reached the wire after
    // its transaction died. Ask the provider before firing again.
    if (w.attempt_epoch > 0) {
      const prior = await provider.checkSent(touchRef);
      if (prior.sent) {
        await recordLedger(client, w, claim.id, idempotencyKey, "sent",
          prior.providerMessageId ?? null, "recovered after crashed attempt");
        await events("touch.recovered", { step_order: w.current_step_order });
        await advance(client, claim.id, w, schedule, opts);
        await client.query("commit");
        return "sent";
      }
    }

    // I1: ledger insert before side effects; the unique key is the backstop.
    const ledger = await client.query(
      `insert into public.touch_ledger
         (workspace_id, enrollment_id, mailbox_id, step_order, attempt_epoch,
          idempotency_key, state)
       values ($1, $2, $3, $4, $5, $6, 'claimed')
       on conflict (idempotency_key) do nothing
       returning id`,
      [w.workspace_id, claim.id, w.mailbox_id, w.current_step_order,
       w.attempt_epoch, idempotencyKey],
    );
    if (ledger.rowCount === 0) {
      // Another holder owns this exact attempt; nothing to do here.
      await client.query("rollback");
      return "skipped";
    }
    const ledgerId = ledger.rows[0].id as string;

    const template = step.template_id
      ? (await client.query<{ subject: string; body_html: string }>(
          "select subject, body_html from public.email_templates where id = $1",
          [step.template_id],
        )).rows[0]
      : undefined;
    if (!template) {
      await client.query(
        "update public.touch_ledger set state = 'skipped', error = 'missing template' where id = $1",
        [ledgerId]);
      await resolve(
        "state = 'paused', next_touch_at = null, pause_reason = 'step has no template'",
        []);
      await events("enrollment.paused", { reason: "missing_template" });
      await client.query("commit");
      return "skipped";
    }

    const vars: Record<string, string> = {
      firstName: w.first_name ?? "",
      lastName: w.last_name ?? "",
      company: w.company ?? "",
      title: w.title ?? "",
      email: w.prospect_email,
    };
    for (const [k, v] of Object.entries(w.custom ?? {})) {
      if (typeof v === "string") vars[k] = v;
    }
    const fill = (s: string) =>
      s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, name) => vars[name] ?? "");

    // The provider call — the transaction's one side effect. COGS ticks on
    // every call (program overlay), success or failure.
    const result = await provider.send({
      idempotencyKey,
      touchRef,
      workspaceId: w.workspace_id,
      fromEmail: w.mailbox_email,
      toEmail: w.prospect_email,
      subject: fill(template.subject),
      bodyHtml: fill(template.body_html),
      threadAsReply: step.thread_as_reply,
    });
    await client.query("select public.increment_cogs($1, 'provider_send_calls', 1)",
      [w.workspace_id]);

    if (!result.ok) {
      await client.query(
        "update public.touch_ledger set state = 'failed', error = $2 where id = $1",
        [ledgerId, result.error]);
      // New epoch => new idempotency key for the retry; 15-minute backoff.
      await resolve(
        `error_reason = $2, attempt_epoch = attempt_epoch + 1,
         next_touch_at = now() + interval '15 minutes'`,
        [result.error]);
      await events("touch.failed", {
        step_order: w.current_step_order, error: result.error,
      });
      await client.query("commit");
      return "failed";
    }

    await client.query(
      "update public.touch_ledger set state = 'sent', provider_message_id = $2 where id = $1",
      [ledgerId, result.providerMessageId]);
    await events("touch.sent", {
      step_order: w.current_step_order,
      provider_message_id: result.providerMessageId,
    });
    await advance(client, claim.id, w, schedule, opts);
    await client.query("commit");
    return "sent";
  } catch (err) {
    await client.query("rollback").catch(() => {});
    // The claim stays on the row; the TTL re-sweep path (bumped epoch +
    // provider checkSent) owns recovery — nothing is lost, nothing doubles.
    return "failed";
  } finally {
    client.release();
  }
}

/** End of the current local window (or `now` if already past it) — the
 *  starting point for a cap deferral's re-plan. */
function endOfCurrentWindow(now: Date, schedule: SendSchedule): Date {
  // snapToWindow from a candidate at/after window end hops to the next legal
  // window start; feeding it now + (end-start) minutes is a safe overshoot.
  const overshootMs =
    (schedule.windowEndMinute - schedule.windowStartMinute) * 60_000;
  return new Date(now.getTime() + Math.max(overshootMs, 60_000));
}

async function recordLedger(
  client: PoolClient,
  w: WorkRow,
  enrollmentId: string,
  idempotencyKey: string,
  state: "sent" | "failed" | "skipped",
  providerMessageId: string | null,
  note: string | null,
): Promise<void> {
  await client.query(
    `insert into public.touch_ledger
       (workspace_id, enrollment_id, mailbox_id, step_order, attempt_epoch,
        idempotency_key, state, provider_message_id, error)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (idempotency_key) do nothing`,
    [w.workspace_id, enrollmentId, w.mailbox_id, w.current_step_order,
     w.attempt_epoch, idempotencyKey, state, providerMessageId, note],
  );
}

/** Advance to the next step (planning its fire time) or finish the
 *  enrollment; either way the claim clears and the epoch resets. */
async function advance(
  client: PoolClient,
  enrollmentId: string,
  w: WorkRow,
  schedule: SendSchedule,
  opts: SweepOptions,
): Promise<void> {
  const next = await client.query<{ interval_days: number; interval_hours: number }>(
    `select interval_days, interval_hours from public.sequence_steps
      where sequence_id = $1 and step_order = $2`,
    [w.sequence_id, w.current_step_order + 1],
  );
  const n = next.rows[0];
  if (n) {
    const nta = nextFireTime(
      new Date(),
      { days: n.interval_days, hours: n.interval_hours },
      schedule,
      (opts.jitterFraction ?? Math.random)(),
    );
    await client.query(
      `update public.enrollments
          set state = 'active', current_step_order = current_step_order + 1,
              next_touch_at = $2, attempt_epoch = 0,
              claimed_at = null, claim_token = null, updated_at = now()
        where id = $1`,
      [enrollmentId, nta],
    );
  } else {
    await client.query(
      `update public.enrollments
          set state = 'finished_no_reply', next_touch_at = null,
              finished_at = now(), attempt_epoch = 0,
              claimed_at = null, claim_token = null, updated_at = now()
        where id = $1`,
      [enrollmentId],
    );
    await client.query(
      `insert into public.events
         (workspace_id, type, enrollment_id, sequence_id, mailbox_id, payload)
       values ($1, 'enrollment.finished_no_reply', $2, $3, $4, '{}')`,
      [w.workspace_id, enrollmentId, w.sequence_id, w.mailbox_id],
    );
  }
}
