/** Fire-time planning (engine invariant I4): days+hours intervals land inside
 *  the sequence's send window, computed in the prospect's (or sequence's)
 *  timezone, DST-true, skipping US federal holidays when the schedule says so.
 *  Deferred work never drops (I5) — callers re-plan from the deferral moment. */

import { usFederalHolidays } from "./holidays";
import { localParts, shiftDate, zonedWallTimeToUtc } from "./tz";

export interface StepInterval {
  days: number;
  hours: number;
}

export interface SendSchedule {
  /** ISO weekday numbers 1=Mon..7=Sun that may send. */
  windowDays: number[];
  /** Window bounds, minutes from local midnight; end is exclusive. */
  windowStartMinute: number;
  windowEndMinute: number;
  timeZone: string;
  skipUsHolidays: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isLegalDay(
  s: SendSchedule,
  year: number, month: number, day: number, isoWeekday: number,
): boolean {
  if (!s.windowDays.includes(isoWeekday)) return false;
  if (s.skipUsHolidays &&
      usFederalHolidays(year).has(`${year}-${pad(month)}-${pad(day)}`)) {
    return false;
  }
  return true;
}

/** The earliest legal send instant at or after `candidate`.
 *  `jitterFraction` in [0,1) spreads snapped-to-window-start sends across the
 *  first `jitterCapMinutes` of the window (0 = deterministic, for tests). */
export function snapToWindow(
  candidate: Date,
  schedule: SendSchedule,
  jitterFraction = 0,
  jitterCapMinutes = 30,
): Date {
  let p = localParts(candidate, schedule.timeZone);
  let { year, month, day } = p;

  for (let hop = 0; hop < 400; hop++) {
    const wd = hop === 0
      ? p.isoWeekday
      : localParts(
          zonedWallTimeToUtc(year, month, day, 720, schedule.timeZone),
          schedule.timeZone,
        ).isoWeekday;

    if (isLegalDay(schedule, year, month, day, wd)) {
      const sameDay = hop === 0;
      const minute = sameDay ? p.minuteOfDay : 0;
      if (minute < schedule.windowEndMinute) {
        if (sameDay && minute >= schedule.windowStartMinute) {
          return candidate; // already inside the window
        }
        const jitter = Math.floor(
          jitterFraction *
          Math.min(jitterCapMinutes,
            schedule.windowEndMinute - schedule.windowStartMinute),
        );
        return zonedWallTimeToUtc(
          year, month, day,
          schedule.windowStartMinute + jitter, schedule.timeZone,
        );
      }
    }
    ({ year, month, day } = shiftDate(year, month, day, 1));
    p = { ...p, minuteOfDay: 0 };
  }
  throw new Error(
    `planner: no legal send day within 400 days of ${candidate.toISOString()} ` +
    `for window days [${schedule.windowDays.join(",")}]`,
  );
}

/** Next fire time for a step: interval from `after`, snapped into the window. */
export function nextFireTime(
  after: Date,
  interval: StepInterval,
  schedule: SendSchedule,
  jitterFraction = 0,
): Date {
  const candidate = new Date(
    after.getTime() +
    interval.days * 86_400_000 +
    interval.hours * 3_600_000,
  );
  return snapToWindow(candidate, schedule, jitterFraction);
}
