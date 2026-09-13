/** The drip: a sequence's prospects enter as a throttled, ramping daily
 *  trickle rather than all at once.
 *
 *  Enrollment creates a 'queued' row with no timer. Once a day this releases
 *  a bounded number of them into 'scheduled', which is the moment their first
 *  touch gets planned. The rate grows weekly while deliverability holds, and
 *  freezes the moment it doesn't.
 *
 *  Exactly-once is structural, not scheduled: `release_log` is uniquely
 *  constrained on (sequence_id, released_on), so the first tick of the day to
 *  insert that row owns the day's release and every later tick conflicts and
 *  stands down. The minute-cron can fire a thousand times; the day happens
 *  once.
 *
 *  Releases only land on the sequence's own sending days. Releasing on a
 *  Saturday would pile Saturday, Sunday and Monday's entrants onto Tuesday's
 *  window — the exact spike the drip exists to prevent. */

import type { Pool, PoolClient } from "pg";
import { nextFireTime, type SendSchedule } from "./planner";

export interface ReleaseOptions {
  /** Deterministic jitter for tests; defaults to Math.random per enrollment. */
  jitterFraction?: () => number;
  /** Clock injection for tests. */
  now?: Date;
  /** Trailing window for the health read. */
  healthWindowDays?: number;
  /** Below this many recent sends, health is "not enough evidence" and the
   *  ramp continues — three bounces out of four sends is not a trend. */
  healthMinSends?: number;
  /** Hard-bounce share of recent sends that stops the ramp. */
  maxBounceRate?: number;
  /** Unsubscribe share of recent sends that stops the ramp. */
  maxUnsubRate?: number;
}

export interface SequenceReleaseResult {
  sequenceId: string;
  released: number;
  rate: number;
  state: string;
  grew: boolean;
  held?: string;
}

export interface ReleaseStats {
  sequencesConsidered: number;
  sequencesReleased: number;
  enrollmentsReleased: number;
  held: number;
  results: SequenceReleaseResult[];
}

const DEFAULTS = {
  healthWindowDays: 7,
  healthMinSends: 20,
  maxBounceRate: 0.03,
  maxUnsubRate: 0.005,
};

interface PolicyRow {
  sequence_id: string;
  workspace_id: string;
  start_per_day: number;
  growth_pct: number;
  max_per_day: number;
  current_per_day: number;
  state: string;
  last_grown_on: string | null;
  window_days: number[];
  window_start_minute: number;
  window_end_minute: number;
  timezone_source: string;
  fallback_timezone: string;
  skip_us_holidays: boolean;
}

/** The day, in the sequence's own fallback zone — the zone a human running
 *  this campaign thinks in. A UTC date would roll over mid-evening in the US
 *  and make "today's release" land on yesterday's row. */
export function localDayString(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

function isoWeekdayIn(now: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" })
    .format(now);
  const map: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  return map[name] ?? 1;
}

export interface HealthRead {
  sends: number;
  bounces: number;
  unsubs: number;
  bounceRate: number;
  unsubRate: number;
  /** Null when there is not enough evidence to judge. */
  verdict: "healthy" | "unhealthy" | null;
  reason?: string;
}

/** Deliverability over the trailing window, measured per workspace: a bad
 *  reputation is earned by everything the domain sent, not by one sequence. */
export async function readHealth(
  client: PoolClient,
  workspaceId: string,
  opts: ReleaseOptions = {},
): Promise<HealthRead> {
  const windowDays = opts.healthWindowDays ?? DEFAULTS.healthWindowDays;
  const minSends = opts.healthMinSends ?? DEFAULTS.healthMinSends;
  const maxBounce = opts.maxBounceRate ?? DEFAULTS.maxBounceRate;
  const maxUnsub = opts.maxUnsubRate ?? DEFAULTS.maxUnsubRate;

  const { rows } = await client.query<{
    sends: string; bounces: string; unsubs: string;
  }>(
    `select
       (select count(*) from public.touch_ledger t
         where t.workspace_id = $1 and t.state = 'sent'
           and t.created_at > now() - make_interval(days => $2)) as sends,
       (select count(*) from public.suppression_entries s
         where s.workspace_id = $1 and s.reason = 'hard_bounce'
           and s.created_at > now() - make_interval(days => $2)) as bounces,
       (select count(*) from public.suppression_entries s
         where s.workspace_id = $1 and s.reason = 'unsubscribe'
           and s.created_at > now() - make_interval(days => $2)) as unsubs`,
    [workspaceId, windowDays],
  );
  const sends = Number(rows[0]?.sends ?? 0);
  const bounces = Number(rows[0]?.bounces ?? 0);
  const unsubs = Number(rows[0]?.unsubs ?? 0);
  const bounceRate = sends > 0 ? bounces / sends : 0;
  const unsubRate = sends > 0 ? unsubs / sends : 0;

  if (sends < minSends) {
    return { sends, bounces, unsubs, bounceRate, unsubRate, verdict: null };
  }
  if (bounceRate > maxBounce) {
    return {
      sends, bounces, unsubs, bounceRate, unsubRate, verdict: "unhealthy",
      reason: `${bounces} hard bounces in the last ${windowDays} days ` +
        `(${(bounceRate * 100).toFixed(1)}% of sends, limit ` +
        `${(maxBounce * 100).toFixed(0)}%)`,
    };
  }
  if (unsubRate > maxUnsub) {
    return {
      sends, bounces, unsubs, bounceRate, unsubRate, verdict: "unhealthy",
      reason: `${unsubs} unsubscribes in the last ${windowDays} days ` +
        `(${(unsubRate * 100).toFixed(1)}% of sends, limit ` +
        `${(maxUnsub * 100).toFixed(1)}%)`,
    };
  }
  return { sends, bounces, unsubs, bounceRate, unsubRate, verdict: "healthy" };
}

/** One day's release for every active sequence carrying an enabled policy. */
export async function releaseDue(
  pool: Pool,
  opts: ReleaseOptions = {},
): Promise<ReleaseStats> {
  const now = opts.now ?? new Date();
  const stats: ReleaseStats = {
    sequencesConsidered: 0, sequencesReleased: 0,
    enrollmentsReleased: 0, held: 0, results: [],
  };

  // last_grown_on comes back ::text on purpose: node-postgres decodes a `date`
  // column into a JS Date, and comparing that against an ISO day string
  // stringifies it ("Tue Sep 15 2026 …") — never equal, never less, so the
  // weekly growth check would silently never fire.
  const { rows: policies } = await pool.query<PolicyRow>(
    `select rp.sequence_id, rp.workspace_id, rp.start_per_day, rp.growth_pct,
            rp.max_per_day, rp.current_per_day, rp.state,
            rp.last_grown_on::text as last_grown_on,
            s.window_days, s.window_start_minute, s.window_end_minute,
            s.timezone_source, s.fallback_timezone, s.skip_us_holidays
       from public.release_policies rp
       join public.sequences s on s.id = rp.sequence_id
      where rp.enabled and rp.state <> 'paused' and s.state = 'active'`,
  );
  stats.sequencesConsidered = policies.length;

  for (const p of policies) {
    const result = await releaseOne(pool, p, now, opts);
    if (result === null) continue;          // already released today
    stats.results.push(result);
    stats.sequencesReleased += 1;
    stats.enrollmentsReleased += result.released;
    if (result.held) stats.held += 1;
  }
  return stats;
}

/** Null when this sequence's day is already done (or is not a sending day). */
async function releaseOne(
  pool: Pool,
  p: PolicyRow,
  now: Date,
  opts: ReleaseOptions,
): Promise<SequenceReleaseResult | null> {
  const zone = p.fallback_timezone;
  const today = localDayString(now, zone);

  // Releasing on a non-sending day would stack its entrants onto the next
  // window alongside that day's own — the spike the drip exists to prevent.
  if (!p.window_days.includes(isoWeekdayIn(now, zone))) return null;

  const client = await pool.connect();
  try {
    await client.query("begin");

    // The day's lock IS this insert. Lose the race, do nothing.
    const claimed = await client.query(
      `insert into public.release_log
         (workspace_id, sequence_id, released_on, rate_used, policy_state)
       values ($1, $2, $3::date, $4, $5)
       on conflict (sequence_id, released_on) do nothing
       returning id`,
      [p.workspace_id, p.sequence_id, today, p.current_per_day, p.state],
    );
    if (claimed.rowCount === 0) {
      await client.query("rollback");
      return null;
    }
    const logId = claimed.rows[0].id as string;

    // Health decides whether the rate may grow — never whether the campaign
    // continues. Andrew's rule: hold steady and tell me, never auto-cut.
    const health = await readHealth(client, p.workspace_id, opts);
    let state = p.state;
    let rate = p.current_per_day;
    let grew = false;
    let held: string | undefined;

    if (state === "ramping" && health.verdict === "unhealthy") {
      state = "holding";
      held = health.reason;
      await client.query(
        `update public.release_policies
            set state = 'holding', hold_reason = $2, held_at = now(),
                updated_at = now()
          where sequence_id = $1`,
        [p.sequence_id, held],
      );
      await client.query(
        `insert into public.events
           (workspace_id, type, sequence_id, payload)
         values ($1, 'release.held', $2, $3)`,
        [p.workspace_id, p.sequence_id, {
          reason: held, rate_held_at: rate,
          bounce_rate: health.bounceRate, unsub_rate: health.unsubRate,
        }],
      );
    } else if (state === "ramping") {
      // Grow at most once a week, measured from the last growth day, so a
      // missed day never compounds into a double step.
      const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
      if (p.last_grown_on === null) {
        // First release: the campaign runs at its STARTING rate today and the
        // weekly clock starts now. Growing on day one would silently ignore
        // the rate the operator actually chose.
        await client.query(
          `update public.release_policies
              set last_grown_on = $2::date, updated_at = now()
            where sequence_id = $1`,
          [p.sequence_id, today],
        );
      } else if (p.last_grown_on <= localDayString(weekAgo, zone)) {
        const grown = Math.min(
          p.max_per_day,
          Math.max(rate + 1, Math.round(rate * (1 + p.growth_pct / 100))),
        );
        if (grown > rate) {
          rate = grown;
          grew = true;
          await client.query(
            `update public.release_policies
                set current_per_day = $2, last_grown_on = $3::date,
                    updated_at = now()
              where sequence_id = $1`,
            [p.sequence_id, rate, today],
          );
          await client.query(
            `insert into public.events
               (workspace_id, type, sequence_id, payload)
             values ($1, 'release.rate_raised', $2, $3)`,
            [p.workspace_id, p.sequence_id,
             { from: p.current_per_day, to: rate }],
          );
        }
      }
    }

    // Take the day's allowance, oldest first. FOR UPDATE SKIP LOCKED keeps
    // this honest if a second connection somehow reaches the same rows.
    const picked = await client.query<{
      id: string; prospect_tz: string | null;
    }>(
      `select e.id, p.timezone as prospect_tz
         from public.enrollments e
         join public.prospects p on p.id = e.prospect_id
        where e.sequence_id = $1 and e.state = 'queued'
        order by e.created_at
        limit $2
        for update of e skip locked`,
      [p.sequence_id, rate],
    );

    const schedule = (prospectTz: string | null): SendSchedule => ({
      windowDays: p.window_days,
      windowStartMinute: p.window_start_minute,
      windowEndMinute: p.window_end_minute,
      timeZone: p.timezone_source === "prospect"
        ? (prospectTz ?? p.fallback_timezone)
        : p.fallback_timezone,
      skipUsHolidays: p.skip_us_holidays,
    });
    const jitter = opts.jitterFraction ?? Math.random;

    for (const row of picked.rows) {
      const fireAt = nextFireTime(
        now, { days: 0, hours: 0 }, schedule(row.prospect_tz), jitter(),
      );
      await client.query(
        `update public.enrollments
            set state = 'scheduled', next_touch_at = $2, updated_at = now()
          where id = $1 and state = 'queued'`,
        [row.id, fireAt],
      );
      await client.query(
        `insert into public.events
           (workspace_id, type, enrollment_id, sequence_id, payload)
         values ($1, 'enrollment.released', $2, $3, $4)`,
        [p.workspace_id, row.id, p.sequence_id,
         { first_touch_at: fireAt.toISOString() }],
      );
    }

    const released = picked.rowCount ?? 0;
    await client.query(
      `update public.release_log
          set released_count = $2, rate_used = $3, policy_state = $4
        where id = $1`,
      [logId, released, rate, state],
    );
    await client.query(
      `update public.release_policies
          set last_released_on = $2::date, updated_at = now()
        where sequence_id = $1`,
      [p.sequence_id, today],
    );

    await client.query("commit");
    return { sequenceId: p.sequence_id, released, rate, state, grew, held };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
