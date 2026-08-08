/** US federal holidays with observed-day shifts (Sat -> preceding Fri,
 *  Sun -> following Mon). Returned as "YYYY-MM-DD" strings interpreted in the
 *  schedule's zone by the planner. */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function key(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** nth (1-based) occurrence of an ISO weekday (1=Mon..7=Sun) in a month. */
function nthWeekday(y: number, m: number, isoWeekday: number, nth: number): number {
  const first = new Date(Date.UTC(y, m - 1, 1, 12));
  const firstIso = ((first.getUTCDay() + 6) % 7) + 1;
  return 1 + ((isoWeekday - firstIso + 7) % 7) + (nth - 1) * 7;
}

function lastWeekday(y: number, m: number, isoWeekday: number): number {
  const lastDay = new Date(Date.UTC(y, m, 0, 12)); // day 0 of next month
  const lastIso = ((lastDay.getUTCDay() + 6) % 7) + 1;
  return lastDay.getUTCDate() - ((lastIso - isoWeekday + 7) % 7);
}

/** Fixed-date holiday plus its observed shift when it lands on a weekend. */
function observed(y: number, m: number, d: number): string[] {
  const iso = ((new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() + 6) % 7) + 1;
  const days = [key(y, m, d)];
  if (iso === 6) {
    const s = new Date(Date.UTC(y, m - 1, d - 1, 12));
    days.push(key(s.getUTCFullYear(), s.getUTCMonth() + 1, s.getUTCDate()));
  } else if (iso === 7) {
    const s = new Date(Date.UTC(y, m - 1, d + 1, 12));
    days.push(key(s.getUTCFullYear(), s.getUTCMonth() + 1, s.getUTCDate()));
  }
  return days;
}

const cache = new Map<number, Set<string>>();

export function usFederalHolidays(year: number): Set<string> {
  let set = cache.get(year);
  if (set) return set;
  set = new Set<string>();
  const add = (days: string[] | string) => {
    for (const d of Array.isArray(days) ? days : [days]) set!.add(d);
  };
  add(observed(year, 1, 1)); // New Year's Day
  add(key(year, 1, nthWeekday(year, 1, 1, 3))); // MLK Day, 3rd Mon Jan
  add(key(year, 2, nthWeekday(year, 2, 1, 3))); // Washington's Birthday
  add(key(year, 5, lastWeekday(year, 5, 1))); // Memorial Day, last Mon May
  add(observed(year, 6, 19)); // Juneteenth
  add(observed(year, 7, 4)); // Independence Day
  add(key(year, 9, nthWeekday(year, 9, 1, 1))); // Labor Day, 1st Mon Sep
  add(key(year, 10, nthWeekday(year, 10, 1, 2))); // Columbus Day, 2nd Mon Oct
  add(observed(year, 11, 11)); // Veterans Day
  add(key(year, 11, nthWeekday(year, 11, 4, 4))); // Thanksgiving, 4th Thu Nov
  add(observed(year, 12, 25)); // Christmas
  cache.set(year, set);
  return set;
}
