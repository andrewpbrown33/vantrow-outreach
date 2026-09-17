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
import { emitSequenceProgress } from "./connect-emit";
import { fillMergeFields } from "./merge";
import { nextFireTime, snapToWindow, type SendSchedule } from "./planner";
import { replySubject } from "./subject";

/** The subject a reply step threads under when the ledger has no record: the
 *  nearest earlier step that opens its own thread, rendered with the same
 *  variables. Null when no such subject exists — the caller parks the
 *  enrollment rather than send an empty subject. */
async function rootSubject(
  client: PoolClient,
  sequenceId: string,
  beforeOrder: number,
  fill: (s: string) => string,
): Promise<string | null> {
  const { rows } = await client.query<{ subject: string }>(
    `select t.subject
       from public.sequence_steps st
       join public.email_templates t on t.id = st.template_id
      where st.sequence_id = $1 and st.step_order < $2 and not st.thread_as_reply
      order by st.step_order desc limit 1`,
    [sequenceId, beforeOrder],
  );
  const raw = rows[0]?.subject;
  if (raw === undefined) return null;
  const rendered = fill(raw);
  return rendered.trim().length > 0 ? rendered : null;
}

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
  provider: ProviderSource,
  opts: SweepOptions = {},
): Promise<SweepStats> {
  const stats: SweepStats = { claimed: 0, sent: 0, deferred: 0, skipped: 0, failed: 0 };
  await resumeDueOoo(pool, opts);
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

/** One provider, or one per mailbox — R10 means an org sends as several
 *  identities at once, and each needs its own credentials. */
export type ProviderSource =
  | Provider
  | ((mailboxId: string) => Provider | undefined);

function resolveProvider(
  source: ProviderSource,
  mailboxId: string,
): Provider | undefined {
  return typeof source === "function" ? source(mailboxId) : source;
}

/** I6's second half: OOO pauses auto-resume when their return date passes —
 *  through the planner, so the re-armed touch lands inside the send window,
 *  never at whatever hour the sweep happened to run. Sequences that disable
 *  auto-resume keep their pauses until a human acts. */
async function resumeDueOoo(pool: Pool, opts: SweepOptions): Promise<void> {
  const due = await pool.query<{
    id: string; workspace_id: string; sequence_id: string; mailbox_id: string;
    prospect_tz: string | null; timezone_source: string;
    fallback_timezone: string; window_days: number[];
    window_start_minute: number; window_end_minute: number;
    skip_us_holidays: boolean;
  }>(
    `select e.id, e.workspace_id, e.sequence_id, e.mailbox_id,
            p.timezone as prospect_tz, s.timezone_source, s.fallback_timezone,
            s.window_days, s.window_start_minute, s.window_end_minute,
            s.skip_us_holidays
       from public.enrollments e
       join public.prospects p on p.id = e.prospect_id
       join public.sequences s on s.id = e.sequence_id
      where e.state = 'paused' and e.pause_reason = 'out of office'
        and e.resume_at is not null and e.resume_at <= now()
        and s.ooo_auto_resume`,
  );
  for (const r of due.rows) {
    const schedule: SendSchedule = {
      windowDays: r.window_days,
      windowStartMinute: r.window_start_minute,
      windowEndMinute: r.window_end_minute,
      timeZone: r.timezone_source === "prospect"
        ? (r.prospect_tz ?? r.fallback_timezone)
        : r.fallback_timezone,
      skipUsHolidays: r.skip_us_holidays,
    };
    const nta = snapToWindow(new Date(), schedule,
      (opts.jitterFraction ?? Math.random)());
    await pool.query(
      `update public.enrollments
          set state = 'active', pause_reason = null, resume_at = null,
              next_touch_at = $2, updated_at = now()
        where id = $1 and state = 'paused'`,
      [r.id, nta],
    );
    await pool.query(
      `insert into public.events
         (workspace_id, type, enrollment_id, sequence_id, mailbox_id, payload)
       values ($1, 'enrollment.resumed', $2, $3, $4, $5)`,
      [r.workspace_id, r.id, r.sequence_id, r.mailbox_id,
       { reason: "ooo_auto_resume", next_touch_at: nta.toISOString() }],
    );
  }
}

interface WorkRow {
  workspace_id: string;
  state: string;
  current_step_order: number;
  draft_approved_step: number | null;
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
  min_send_gap_secs: number;
  jitter_secs: number;
  send_disabled: boolean;
  suppressed: boolean;
}

/** Execute one claimed enrollment in a single transaction. Exported for the
 *  invariant suite, which needs to interleave state changes between the claim
 *  and the execution (the I2 reply race). */
export async function executeOne(
  pool: Pool,
  providerSource: ProviderSource,
  claim: { id: string; claim_token: string; attempt_epoch: number },
  opts: SweepOptions = {},
): Promise<Outcome> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const work = await client.query<WorkRow>(
      `select e.workspace_id, e.state, e.current_step_order, e.attempt_epoch,
              e.draft_approved_step, e.replied_at, e.claim_token,
              p.email as prospect_email, p.first_name, p.last_name, p.company,
              p.title, p.custom, p.timezone as prospect_tz, p.opted_out_at,
              s.id as sequence_id, s.state as seq_state, s.timezone_source,
              s.fallback_timezone, s.window_days, s.window_start_minute,
              s.window_end_minute, s.skip_us_holidays,
              m.id as mailbox_id, m.email as mailbox_email,
              public.mailbox_daily_cap(m.*, current_date) as daily_cap,
              m.min_send_gap_secs, m.jitter_secs, m.send_disabled,
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

    const provider = resolveProvider(providerSource, w.mailbox_id);
    if (!provider) {
      // No credentials for this mailbox (never connected, or revoked). Defer
      // rather than fail: the work is still due once it is reconnected.
      await client.query(
        `update public.enrollments
            set next_touch_at = now() + interval '1 hour',
                claimed_at = null, claim_token = null, updated_at = now()
          where id = $1`, [claim.id]);
      await client.query(
        `insert into public.events
           (workspace_id, type, enrollment_id, sequence_id, mailbox_id, payload)
         values ($1, 'touch.deferred', $2, $3, $4, $5)`,
        [w.workspace_id, claim.id, w.sequence_id, w.mailbox_id,
         { reason: "mailbox_not_connected" }]);
      await client.query("commit");
      return "deferred";
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
    // The cap is the WARMUP-AWARE one (mailbox_daily_cap): a warming mailbox
    // earns its ceiling week by week. Without that, the drip's growing entrant
    // rate would quietly collide with a flat cap around week three and the
    // campaign would stretch with nothing in the UI to explain why.
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

    // I5 (second half): per-mailbox send spacing. sweepOnce awaits executeOne
    // per claimed row with no spacing between them, so one tick could empty the
    // entire daily cap onto the wire in seconds — the most deliverability-
    // hostile behaviour in the engine, and 0002 already calls these columns law
    // the sweep enforces. Defer rather than sleep: a cron tick must not block,
    // and deferring keeps the "caps defer, never drop" rule intact.
    //
    // Spacing is per mailbox by construction (the gap is measured against this
    // mailbox's own last send), so separate mailboxes still send concurrently.
    if (w.min_send_gap_secs > 0) {
      const lastRes = await client.query<{ last_sent: Date | null }>(
        `select max(created_at) as last_sent from public.touch_ledger
          where mailbox_id = $1 and state = 'sent'`,
        [w.mailbox_id],
      );
      const lastSent = lastRes.rows[0]?.last_sent ?? null;
      const gapMs = w.min_send_gap_secs * 1000;
      if (lastSent && Date.now() - lastSent.getTime() < gapMs) {
        // Jitter on top of the floor so a queue never emits on an audible beat.
        const jitterMs =
          Math.floor((opts.jitterFraction ?? Math.random)() * w.jitter_secs * 1000);
        // snapToWindow returns its candidate untouched when already legal, so a
        // gap landing inside the window costs nothing but still respects it.
        const readyAt = snapToWindow(
          new Date(lastSent.getTime() + gapMs + jitterMs),
          schedule,
          (opts.jitterFraction ?? Math.random)(),
        );
        await resolve("next_touch_at = $2", [readyAt]);
        await events("touch.deferred", {
          reason: "min_send_gap",
          resumes_at: readyAt.toISOString(),
        });
        await client.query("commit");
        return "deferred";
      }
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
    // auto-sends them. Approval (approveDraft, on the sequence screen) records
    // the approved step order and re-arms the timer — the comparison is against
    // THIS step, so approving step 2 never carries forward to step 3.
    //
    // Parking clears next_touch_at, and next_touch_at is the schedule, so
    // before 0007 recorded the approval this branch was a permanent dead end:
    // re-arming alone would meet the same draft_first step on the next tick and
    // park it again, forever, with nothing surfaced anywhere.
    if (step.mode === "draft_first" && w.draft_approved_step !== w.current_step_order) {
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
    // A merge field with nothing behind it used to render as "" and go out
    // anyway — "Hi ," to a live prospect. The product promise is the opposite
    // (site/product: "a send with an unfilled variable is blocked and flagged —
    // never sent broken, never skipped silently"), so render first, collect the
    // misses across BOTH subject and body, and refuse the send if there are any.
    //
    // "Unfilled" means absent OR blank after trim, whatever the source: a merge
    // field is a claim that a value exists, and whitespace produces the same
    // broken output as nothing. An operator who wants an optional value should
    // not be using a merge field for it.
    const missing = new Set<string>();
    const fill = (s: string) => fillMergeFields(s, vars, missing);
    // `let`, because a reply step overwrites this below with the derived
    // "Re: " subject once the thread it belongs to is known.
    let subject = fill(template.subject);
    // The body is HTML, so a prospect's value is escaped on the way in:
    // "A&B <Roofing>" is a company name, not markup. Subjects are text.
    const bodyHtml = fillMergeFields(template.body_html, vars, missing, { html: true });

    // Paused, not dropped: this is a data gap a human fixes on the prospect,
    // after which the enrollment is re-armed like any other paused work.
    const blockUnfilled = async () => {
      const fields = [...missing].sort();
      const reason = `unfilled merge fields: ${fields.join(", ")}`;
      await client.query(
        "update public.touch_ledger set state = 'skipped', error = $2 where id = $1",
        [ledgerId, reason]);
      await resolve(
        "state = 'paused', next_touch_at = null, pause_reason = $2", [reason]);
      await events("touch.blocked", {
        reason: "unfilled_merge_fields",
        fields,
        step_order: w.current_step_order,
      });
      await client.query("commit");
    };

    if (missing.size > 0) {
      await blockUnfilled();
      return "skipped";
    }

    // Threading quotes the PROVIDER's ids from the previous touch (Gmail
    // rewrites Message-ID, so an id we invented threads nowhere). The subject
    // must match the conversation too — Gmail refuses to thread a message
    // whose subject differs — so a reply step ignores its own template subject
    // and derives "Re: " + whatever its thread actually opened with.
    let inReplyToMessageId: string | undefined;
    let threadId: string | undefined;
    if (step.thread_as_reply && w.current_step_order > 1) {
      const prev = await client.query<{
        provider_rfc822_message_id: string | null; provider_thread_id: string | null;
        sent_subject: string | null;
      }>(
        `select provider_rfc822_message_id, provider_thread_id, sent_subject
           from public.touch_ledger
          where enrollment_id = $1 and state = 'sent' and step_order < $2
          order by step_order desc limit 1`,
        [claim.id, w.current_step_order],
      );
      inReplyToMessageId = prev.rows[0]?.provider_rfc822_message_id ?? undefined;
      threadId = prev.rows[0]?.provider_thread_id ?? undefined;
      // What the wire saw, in preference order: the previous touch's recorded
      // subject; this step's own template subject (pre-0006 sequences carried
      // one); the nearest earlier thread-opening step, re-rendered. Blank
      // counts as absent at every rung — "Re:" over nothing is not a thread.
      const nonBlank = (s: string | null | undefined): string | null =>
        s !== null && s !== undefined && s.trim().length > 0 ? s : null;
      const threadSubject = nonBlank(prev.rows[0]?.sent_subject)
        ?? nonBlank(subject)
        ?? await rootSubject(client, w.sequence_id, w.current_step_order, fill);
      if (threadSubject === null) {
        // Unreachable through the forms (step 1 can never be a reply; every
        // thread-opening step requires a subject) — but an empty subject on
        // the wire is not an acceptable fallback, so park it visibly.
        await client.query(
          "update public.touch_ledger set state = 'skipped', error = 'reply step has no thread subject' where id = $1",
          [ledgerId]);
        await resolve(
          "state = 'paused', next_touch_at = null, pause_reason = 'reply step has no thread subject'",
          []);
        await events("enrollment.paused", { reason: "missing_thread_subject" });
        await client.query("commit");
        return "skipped";
      }
      subject = replySubject(threadSubject);
    }

    // Re-check: the threading branch renders further templates through the same
    // `fill` — the previous touch's subject, or an earlier thread-opening step
    // via rootSubject — so a miss can appear after the first check. rootSubject
    // only rejects a subject that is blank *entirely*; a partial miss like
    // "{{company}} update" survives as " update" and would reach the wire as
    // "Re:  update", which is the exact output this step exists to prevent.
    if (missing.size > 0) {
      await blockUnfilled();
      return "skipped";
    }

    // The provider call — the transaction's one side effect. COGS ticks on
    // every call (program overlay), success or failure.
    const result = await provider.send({
      idempotencyKey,
      touchRef,
      workspaceId: w.workspace_id,
      fromEmail: w.mailbox_email,
      toEmail: w.prospect_email,
      subject,
      bodyHtml,
      threadAsReply: step.thread_as_reply,
      inReplyToMessageId,
      threadId,
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
      `update public.touch_ledger
          set state = 'sent', provider_message_id = $2,
              provider_thread_id = $3, provider_rfc822_message_id = $4,
              sent_subject = $5
        where id = $1`,
      [ledgerId, result.providerMessageId, result.threadId ?? null,
       result.rfc822MessageId ?? null, subject]);
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
    // Workstream D: the cracks count just moved — tell the dashboard, in this
    // same transaction.
    await emitSequenceProgress(client, {
      workspaceId: w.workspace_id, sequenceId: w.sequence_id,
      reason: "enrollment.finished_no_reply",
    });
  }
}
