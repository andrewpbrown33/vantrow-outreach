import { describe, expect, it } from "vitest";
import { clockOf, daysOf, intervalOf, minutesFromTime, whenOf } from "./format";

describe("clockOf", () => {
  it("renders minutes-from-midnight as a clock time", () => {
    expect(clockOf(510)).toBe("8:30");
    expect(clockOf(690)).toBe("11:30");
    expect(clockOf(0)).toBe("0:00");
    expect(clockOf(1439)).toBe("23:59");
  });

  it("wraps rather than producing a negative or 25th hour", () => {
    expect(clockOf(1440)).toBe("0:00");
    expect(clockOf(-30)).toBe("23:30");
  });
});

describe("daysOf", () => {
  it("collapses a contiguous run into a range", () => {
    expect(daysOf([2, 3, 4, 5])).toBe("Tue–Fri");
  });

  it("lists a scattered set", () => {
    expect(daysOf([1, 3, 5])).toBe("Mon, Wed, Fri");
  });

  it("names the whole week and the empty week", () => {
    expect(daysOf([1, 2, 3, 4, 5, 6, 7])).toBe("every day");
    expect(daysOf([])).toBe("no days");
  });

  it("sorts, de-duplicates and ignores out-of-range values", () => {
    expect(daysOf([5, 2, 2, 9, 0, 3, 4])).toBe("Tue–Fri");
  });
});

describe("intervalOf", () => {
  it("calls the first step day zero, whatever it stores", () => {
    expect(intervalOf(3, 4, true)).toBe("Day 0");
  });

  it("renders days and hours verbatim — both are first-class (R2)", () => {
    expect(intervalOf(5, 4, false)).toBe("+5 days +4 hours");
    expect(intervalOf(1, 0, false)).toBe("+1 day");
    expect(intervalOf(0, 1, false)).toBe("+1 hour");
    expect(intervalOf(0, 0, false)).toBe("immediately after");
  });
});

describe("minutesFromTime", () => {
  it("parses a time input's value", () => {
    expect(minutesFromTime("08:30")).toBe(510);
    expect(minutesFromTime("8:30")).toBe(510);
    expect(minutesFromTime("23:59")).toBe(1439);
  });

  it("returns zero for anything it cannot read, and never throws", () => {
    expect(minutesFromTime("")).toBe(0);
    expect(minutesFromTime("half eight")).toBe(0);
    expect(minutesFromTime("99:99")).toBe(23 * 60 + 59);
  });
});

describe("whenOf", () => {
  it("is null when there is no time to show", () => {
    expect(whenOf(null)).toBeNull();
  });

  it("names the weekday inside a week and the date beyond it", () => {
    const now = new Date(2026, 7, 10, 9, 0);
    expect(whenOf(new Date(2026, 7, 13, 9, 10), now)).toMatch(/Thu/);
    expect(whenOf(new Date(2026, 8, 14, 9, 10), now)).toMatch(/Sep 14/);
  });
});
