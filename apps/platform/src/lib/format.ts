/** Small, testable renderings shared by the surfaces. */

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Minutes from local midnight → "8:30". */
export function clockOf(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** ISO weekdays → "Tue–Fri", "Mon, Wed, Fri", "every day". */
export function daysOf(days: number[]): string {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (sorted.length === 0) return "no days";
  if (sorted.length === 7) return "every day";
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (contiguous && sorted.length > 2) {
    return `${DAY_NAMES[sorted[0] - 1]}–${DAY_NAMES[sorted[sorted.length - 1] - 1]}`;
  }
  return sorted.map((d) => DAY_NAMES[d - 1]).join(", ");
}

/** A step's offset from the one before it. Step 1 is "on enroll". */
export function intervalOf(days: number, hours: number, isFirst: boolean): string {
  if (isFirst) return "Day 0";
  const parts = [
    days > 0 ? `+${days} day${days === 1 ? "" : "s"}` : "",
    hours > 0 ? `+${hours} hour${hours === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "immediately after";
}

/** "08:30" → 510. Anything unparseable returns 0 rather than throwing; the
 *  caller's start-before-end check is what rejects a nonsense pair. */
export function minutesFromTime(value: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return 0;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return h * 60 + min;
}

/** Absolute-but-brief: "Thu 9:10", "Aug 14, 9:10". */
export function whenOf(at: Date | null, now: Date = new Date()): string | null {
  if (!at) return null;
  const withinAWeek = Math.abs(at.getTime() - now.getTime()) < 7 * 86_400_000;
  return at.toLocaleString("en-US", withinAWeek
    ? { weekday: "short", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
