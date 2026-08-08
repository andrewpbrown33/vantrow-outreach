/** Engine invariant I4: fire-times are timezone-true. These pins are the
 *  America/New_York DST boundaries phase-4 §1 names, plus the holiday skip,
 *  the window straddle, and the days+hours interval verbatim (R2). */

import { describe, expect, it } from "vitest";
import { usFederalHolidays } from "./holidays";
import { nextFireTime, snapToWindow, type SendSchedule } from "./planner";
import { localParts, zonedWallTimeToUtc } from "./tz";

// The product default: Tue-Fri, 8:30-11:30, prospect's zone (deck v2.1).
const NY: SendSchedule = {
  windowDays: [2, 3, 4, 5],
  windowStartMinute: 8 * 60 + 30,
  windowEndMinute: 11 * 60 + 30,
  timeZone: "America/New_York",
  skipUsHolidays: true,
};

describe("planner (I4: timezone-true fire times)", () => {
  it("keeps the local wall clock across the spring-forward boundary", () => {
    // Fri 2026-03-06 09:00 EST (UTC-5) + 3 days lands Mon 2026-03-09 — after
    // DST began (Mar 8). Candidate is 10:00 EDT: inside the window, so it
    // fires exactly there; the UTC offset changed underneath.
    const after = new Date("2026-03-06T14:00:00Z");
    const fire = nextFireTime(after, { days: 3, hours: 0 },
      { ...NY, windowDays: [1, 2, 3, 4, 5] });
    expect(fire.toISOString()).toBe("2026-03-09T14:00:00.000Z");
    expect(localParts(fire, NY.timeZone).minuteOfDay).toBe(10 * 60);
  });

  it("snaps to a DST-correct window start after the change", () => {
    // Sat 2026-03-07 08:30 EST + 1 day = Sun 09:30 EDT; Sunday is not a send
    // day, so it snaps to Tue 2026-03-10 08:30 EDT = 12:30Z. An EST-frozen
    // implementation would say 13:30Z — one hour late.
    const after = new Date("2026-03-07T13:30:00Z");
    const fire = nextFireTime(after, { days: 1, hours: 0 }, NY);
    expect(fire.toISOString()).toBe("2026-03-10T12:30:00.000Z");
  });

  it("keeps the window true across fall-back", () => {
    // Fri 2026-10-30 08:30 EDT + 4 days = Tue 2026-11-03 07:30 EST (fall-back
    // happened Nov 1) — before the window, so it fires at 08:30 EST = 13:30Z.
    const after = new Date("2026-10-30T12:30:00Z");
    const fire = nextFireTime(after, { days: 4, hours: 0 }, NY);
    expect(fire.toISOString()).toBe("2026-11-03T13:30:00.000Z");
  });

  it("supports days + hours intervals verbatim and straddles the window", () => {
    // Thu 2026-06-04 10:00 EDT + 5 days + 4 hours = Tue 2026-06-09 14:00 EDT —
    // past the window end, so the next legal slot is Wed 08:30 EDT.
    const after = new Date("2026-06-04T14:00:00Z");
    const fire = nextFireTime(after, { days: 5, hours: 4 }, NY);
    expect(fire.toISOString()).toBe("2026-06-10T12:30:00.000Z");
  });

  it("skips observed US federal holidays", () => {
    // July 4 2026 is a Saturday; observed Friday July 3. A candidate on the
    // observed holiday hops Sat/Sun/Mon (not send days) to Tue July 7.
    expect(usFederalHolidays(2026).has("2026-07-03")).toBe(true);
    const candidate = new Date("2026-07-03T13:00:00Z"); // Fri 09:00 EDT
    const fire = snapToWindow(candidate, NY);
    expect(fire.toISOString()).toBe("2026-07-07T12:30:00.000Z");
  });

  it("applies deterministic jitter inside the window cap", () => {
    const candidate = new Date("2026-06-08T04:00:00Z"); // Mon 00:00 EDT
    const fire = snapToWindow(candidate, NY, 0.5, 30);
    // Tue 08:30 + 15 minutes of jitter.
    expect(fire.toISOString()).toBe("2026-06-09T12:45:00.000Z");
  });

  it("resolves wall times inside the spring-forward gap to after the jump", () => {
    // 02:30 on 2026-03-08 does not exist in New York; the engine lands at
    // 03:30 EDT rather than firing early.
    const utc = zonedWallTimeToUtc(2026, 3, 8, 2 * 60 + 30, "America/New_York");
    expect(utc.toISOString()).toBe("2026-03-08T07:30:00.000Z");
  });

  it("computes observed holiday shifts both directions", () => {
    const h2027 = usFederalHolidays(2027);
    // July 4 2027 is a Sunday -> observed Monday July 5.
    expect(h2027.has("2027-07-05")).toBe(true);
    // Christmas 2027 is a Saturday -> observed Friday Dec 24.
    expect(h2027.has("2027-12-24")).toBe(true);
    expect(h2027.has("2027-11-25")).toBe(true); // Thanksgiving, 4th Thu Nov
  });
});
