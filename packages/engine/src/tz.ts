/** Wall-clock math in an IANA zone with no dependencies. DST-correct by
 *  construction: offsets come from Intl at the instant in question, and
 *  local->UTC conversion is the standard two-pass fixpoint (a time inside a
 *  spring-forward gap resolves to the instant after the gap — never before). */

export interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  minuteOfDay: number; // 0-1439 local wall clock
  isoWeekday: number; // 1=Mon .. 7=Sun
}

const partFormatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = partFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
      hour12: false,
    });
    partFormatters.set(timeZone, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
};

export function localParts(instant: Date, timeZone: string): LocalParts {
  const parts = formatterFor(timeZone).formatToParts(instant);
  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  // "24" appears for midnight under hourCycle h24 quirks; normalize.
  const hour = Number(get("hour")) % 24;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    minuteOfDay: hour * 60 + Number(get("minute")),
    isoWeekday: WEEKDAYS[get("weekday")] ?? 0,
  };
}

/** UTC-offset (ms) that `timeZone` applies at `instant`. */
function offsetMs(instant: Date, timeZone: string): number {
  const p = localParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day,
    Math.floor(p.minuteOfDay / 60), p.minuteOfDay % 60,
    instant.getUTCSeconds());
  return asUtc - instant.getTime();
}

/** The UTC instant at which `timeZone`'s wall clock reads y-m-d + minuteOfDay.
 *  Inside a DST gap (the skipped hour) the returned instant lands after the
 *  jump — the engine never fires early. */
export function zonedWallTimeToUtc(
  year: number, month: number, day: number,
  minuteOfDay: number, timeZone: string,
): Date {
  const naive = Date.UTC(year, month - 1, day,
    Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0);
  let guess = new Date(naive - offsetMs(new Date(naive), timeZone));
  guess = new Date(naive - offsetMs(guess, timeZone));
  // Gap check: if the wall clock we landed on is earlier than asked (spring
  // forward swallowed it), push forward by the discrepancy.
  const landed = localParts(guess, timeZone);
  const landedMinute = landed.minuteOfDay;
  if (landed.year === year && landed.month === month && landed.day === day &&
      landedMinute < minuteOfDay) {
    guess = new Date(guess.getTime() + (minuteOfDay - landedMinute) * 60_000);
  }
  return guess;
}

/** y-m-d in `timeZone` shifted by `days` calendar days (pure date math). */
export function shiftDate(
  year: number, month: number, day: number, days: number,
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day + days, 12));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}
