/** The feed's contract: one row per real-world happening, sends collapse, and
 *  no glyph in a row is an emoji. */

import { describe, expect, it } from "vitest";
import { buildFeed, countByKind, daySlug, initialsOf, peopleLabel, shortAge } from "./feed";
import type { FeedRow } from "./queries";

const BASE: FeedRow = {
  id: "1", type: "touch.sent", createdAt: new Date("2026-08-10T14:00:00Z"),
  payload: {}, enrollmentId: "e1", sequenceId: "s1", sequenceName: "Intro",
  prospectId: "p1", prospectName: "Ana Ruiz", prospectEmail: "ana@x.com",
  stepOrder: 2, snippet: null,
};

const row = (over: Partial<FeedRow>): FeedRow => ({ ...BASE, ...over });

describe("buildFeed", () => {
  it("collapses sends in one sequence inside one hour into a single row", () => {
    const items = buildFeed([
      row({ id: "3", prospectId: "p3", prospectName: "Cy Doe", createdAt: new Date("2026-08-10T14:50:00Z") }),
      row({ id: "2", prospectId: "p2", prospectName: "Bo Chen", createdAt: new Date("2026-08-10T14:20:00Z") }),
      row({ id: "1", prospectId: "p1", prospectName: "Ana Ruiz", createdAt: new Date("2026-08-10T14:05:00Z") }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].people.map((p) => p.name)).toEqual(["Cy Doe", "Bo Chen", "Ana Ruiz"]);
    expect(peopleLabel(items[0].people)).toEqual({ lead: "Cy Doe", rest: "and 2 others" });
  });

  it("does not collapse sends across different sequences", () => {
    const items = buildFeed([
      row({ id: "2", sequenceId: "s2", prospectId: "p2", prospectName: "Bo Chen" }),
      row({ id: "1", sequenceId: "s1" }),
    ]);
    expect(items).toHaveLength(2);
  });

  it("does not collapse sends into a different hour", () => {
    const items = buildFeed([
      row({ id: "2", prospectId: "p2", prospectName: "Bo Chen", createdAt: new Date("2026-08-10T15:10:00Z") }),
      row({ id: "1", createdAt: new Date("2026-08-10T14:50:00Z") }),
    ]);
    expect(items).toHaveLength(2);
  });

  it("keeps one person once inside a collapsed row", () => {
    const items = buildFeed([
      row({ id: "2", createdAt: new Date("2026-08-10T14:40:00Z") }),
      row({ id: "1", createdAt: new Date("2026-08-10T14:10:00Z") }),
    ]);
    expect(items[0].people).toHaveLength(1);
    expect(peopleLabel(items[0].people).rest).toBeNull();
  });

  it("a reply carries its text and stops the collapse run", () => {
    const items = buildFeed([
      row({ id: "2", type: "inbound.reply", snippet: "Happy to take a look.",
            payload: { gmail_message_id: "abc" } }),
      row({ id: "1" }),
    ]);
    expect(items).toHaveLength(2);
    expect(items[0].kind).toBe("rep");
    expect(items[0].quote).toBe("Happy to take a look.");
    expect(items[0].threadUrl).toContain("abc");
  });

  it("drops the sweep's follow-up event so one reply is one row", () => {
    const items = buildFeed([
      row({ id: "2", type: "enrollment.stopped_on_reply" }),
      row({ id: "1", type: "inbound.reply", snippet: "Sure." }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("rep");
  });

  it("routes a send failure to its own kind, never to Bounced", () => {
    const items = buildFeed([
      row({ id: "2", type: "touch.failed", payload: { error: "429 rate limited" } }),
      row({ id: "1", type: "inbound.bounce_hard", payload: { dsn_status: "5.1.1" } }),
    ]);
    expect(items.map((i) => i.kind)).toEqual(["err", "bnc"]);
    expect(items[0].detail).toContain("429");
    expect(items[1].detail).toContain("5.1.1");
  });

  it("uses no emoji — only typographic glyphs (design law rule 3)", () => {
    const items = buildFeed([
      row({ id: "1", type: "inbound.reply" }),
      row({ id: "2", type: "enrollment.paused" }),
      row({ id: "3", type: "enrollment.finished_no_reply" }),
      row({ id: "4", type: "inbound.bounce_hard" }),
    ]);
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{2712}\u{2714}-\u{27BF}\u{FE0F}]/u;
    for (const item of items) {
      expect(item.badge === null || !emoji.test(item.badge)).toBe(true);
    }
  });

  it("falls back to the address when a prospect has no name", () => {
    const items = buildFeed([row({ prospectName: null, prospectEmail: "x@y.com" })]);
    expect(items[0].people[0].name).toBe("x@y.com");
  });

  it("counts each kind for the picker", () => {
    const counts = countByKind(buildFeed([
      row({ id: "1", type: "inbound.reply" }),
      row({ id: "2", type: "enrollment.paused" }),
    ]));
    expect(counts.rep).toBe(1);
    expect(counts.pau).toBe(1);
    expect(counts.adv).toBe(0);
  });
});

describe("initialsOf", () => {
  it("takes first and last initials, or two letters from one word", () => {
    expect(initialsOf("Ana Maria Ruiz")).toBe("AR");
    expect(initialsOf("Cher")).toBe("CH");
  });

  it("makes something readable out of a bare address", () => {
    expect(initialsOf("derek.smith@x.com")).toBe("DC");
  });

  it("never throws on empty or punctuation-only input", () => {
    expect(initialsOf("")).toBe("—");
    expect(initialsOf("!!!")).toBe("—");
  });
});

describe("time rendering", () => {
  const now = new Date("2026-08-10T12:00:00Z");

  it("shortens ages without inventing precision", () => {
    expect(shortAge(new Date("2026-08-10T11:58:00Z"), now)).toBe("2m");
    expect(shortAge(new Date("2026-08-10T10:00:00Z"), now)).toBe("2h");
    expect(shortAge(new Date("2026-08-07T12:00:00Z"), now)).toBe("3d");
  });

  it("never reports a future event as negative", () => {
    expect(shortAge(new Date("2026-08-10T12:30:00Z"), now)).toBe("now");
  });

  it("slugs today and yesterday by name", () => {
    const local = new Date(2026, 7, 10, 9, 0, 0);
    const yesterday = new Date(2026, 7, 9, 9, 0, 0);
    const older = new Date(2026, 7, 4, 9, 0, 0);
    expect(daySlug(local, local)).toBe("Today");
    expect(daySlug(yesterday, local)).toBe("Yesterday");
    expect(daySlug(older, local)).toMatch(/Aug 4/);
  });
});
