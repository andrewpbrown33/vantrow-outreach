/** Turning the event ledger into Pulse rows.
 *
 *  The feed is person-first: every row names someone and says what happened to
 *  them, in that order. Two rules do the work here —
 *
 *  1. Only one row per real-world happening. A reply writes both
 *     `inbound.reply` (with the text) and, on the next sweep,
 *     `enrollment.stopped_on_reply`; the feed shows the first and drops the
 *     second, because a person replying once is one event to a reader.
 *  2. Sends collapse. Twelve `touch.sent` rows in one sweep are one line —
 *     "Nathan Roseman and 2 others advanced" — grouped by sequence inside an
 *     hour. Everything else stays one row per event.
 *
 *  Kinds double as the picker's filters (R-4D-2: the picker IS the reports).
 */

import type { FeedRow } from "./queries";
import type { DotState } from "./states";

export const FEED_KINDS = [
  { key: "rep", label: "Replies" },
  { key: "adv", label: "Advanced" },
  { key: "drf", label: "Drafts" },
  { key: "fin", label: "Finished" },
  { key: "pau", label: "Paused" },
  { key: "bnc", label: "Bounced" },
  { key: "err", label: "Send failures" },
] as const;

export type FeedKind = (typeof FEED_KINDS)[number]["key"];

export interface FeedPerson {
  id: string | null;
  name: string;
  initials: string;
}

export interface FeedItem {
  key: string;
  kind: FeedKind;
  /** Which state colour the monogram wears. */
  tone: DotState;
  /** A single typographic glyph, never emoji (design law rule 3). */
  badge: string | null;
  people: FeedPerson[];
  verb: string;
  at: Date;
  sequenceId: string | null;
  sequenceName: string | null;
  quote: string | null;
  detail: string | null;
  threadUrl: string | null;
}

const KIND_OF: Record<string, { kind: FeedKind; tone: DotState; badge: string | null }> = {
  "inbound.reply": { kind: "rep", tone: "replied", badge: "↩" },
  "touch.sent": { kind: "adv", tone: "active", badge: null },
  "touch.draft_due": { kind: "drf", tone: "paused", badge: null },
  "enrollment.finished_no_reply": { kind: "fin", tone: "finished_no_reply", badge: "✓" },
  "enrollment.paused": { kind: "pau", tone: "paused", badge: "∥" },
  "inbound.bounce_hard": { kind: "bnc", tone: "bounced", badge: "!" },
  "enrollment.suppression_halt": { kind: "bnc", tone: "bounced", badge: "!" },
  "touch.failed": { kind: "err", tone: "bounced", badge: "!" },
  "release.held": { kind: "pau", tone: "paused", badge: "∥" },
};

export function initialsOf(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s.@'-]/gu, " ").trim().split(/[\s.@]+/).filter(Boolean);
  if (words.length === 0) return "—";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function personOf(row: FeedRow): FeedPerson {
  // Most feed rows are about a prospect. A few — the drip holding its own ramp
  // — are about the campaign itself, and the sequence stands in the subject
  // position so the line reads "Roofing outreach paused its ramp".
  if (row.prospectId === null && row.sequenceName !== null) {
    return {
      id: null, name: row.sequenceName, initials: initialsOf(row.sequenceName),
    };
  }
  const name = row.prospectName ?? row.prospectEmail ?? "Someone";
  return { id: row.prospectId, name, initials: initialsOf(name) };
}

function detailFor(row: FeedRow): string | null {
  const step = row.stepOrder !== null ? `Step ${row.stepOrder}` : null;
  switch (row.type) {
    case "inbound.reply":
      return step ? `${step} · the sequence stopped itself` : "the sequence stopped itself";
    case "enrollment.paused": {
      const resume = row.payload.resume_at;
      const parsed = row.payload.return_date_parsed === true;
      if (typeof resume === "string") {
        const when = new Date(resume);
        const day = Number.isNaN(when.getTime())
          ? null
          : when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        return [day && `resumes ${day}`, parsed && "return date parsed from the auto-reply"]
          .filter(Boolean).join(" · ") || null;
      }
      return typeof row.payload.reason === "string" ? `held — ${row.payload.reason}` : null;
    }
    case "inbound.bounce_hard": {
      const status = row.payload.dsn_status;
      return `address suppressed, enrollment halted${typeof status === "string" ? ` · ${status}` : ""}`;
    }
    case "enrollment.suppression_halt":
      return "the address was on the suppression list — nothing was sent";
    case "touch.failed":
      return typeof row.payload.error === "string"
        ? String(row.payload.error).slice(0, 160)
        : "the send did not go out";
    case "enrollment.finished_no_reply":
      return "ran to the end without an answer";
    case "touch.draft_due":
      return step ? `${step} is drafted and waiting for you` : "a draft is waiting for you";
    case "release.held": {
      const why = row.payload.reason;
      const rate = row.payload.rate_held_at;
      const held = typeof rate === "number"
        ? `holding at ${rate} new ${rate === 1 ? "person" : "people"} a day`
        : "holding at the current rate";
      return typeof why === "string" ? `${held} — ${why}` : held;
    }
    default:
      return step;
  }
}

function threadUrlFor(row: FeedRow): string | null {
  const id = row.payload.gmail_message_id;
  if (typeof id !== "string" || id.length === 0) return null;
  return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(id)}`;
}

/** Rows must arrive newest-first (listFeed's order). */
export function buildFeed(rows: FeedRow[]): FeedItem[] {
  const items: FeedItem[] = [];
  let group: { item: FeedItem; bucket: number } | null = null;

  for (const row of rows) {
    const mapped = KIND_OF[row.type];
    if (!mapped) continue;
    const person = personOf(row);

    if (mapped.kind === "adv") {
      const bucket = Math.floor(row.createdAt.getTime() / 3_600_000);
      if (group && group.bucket === bucket &&
          group.item.sequenceId === row.sequenceId &&
          !group.item.people.some((p) => p.name === person.name)) {
        group.item.people.push(person);
        continue;
      }
      const item: FeedItem = {
        key: `adv-${row.id}`, kind: "adv", tone: mapped.tone, badge: null,
        people: [person], verb: "advanced", at: row.createdAt,
        sequenceId: row.sequenceId, sequenceName: row.sequenceName,
        quote: null, detail: detailFor(row), threadUrl: null,
      };
      items.push(item);
      group = { item, bucket };
      continue;
    }

    group = null;
    items.push({
      key: `${row.type}-${row.id}`,
      kind: mapped.kind,
      tone: mapped.tone,
      badge: mapped.badge,
      people: [person],
      verb: verbFor(row.type),
      at: row.createdAt,
      sequenceId: row.sequenceId,
      sequenceName: row.sequenceName,
      quote: row.type === "inbound.reply" ? row.snippet : null,
      detail: detailFor(row),
      threadUrl: threadUrlFor(row),
    });
  }
  return items;
}

function verbFor(type: string): string {
  switch (type) {
    case "inbound.reply": return "replied";
    case "touch.draft_due": return "has a draft waiting";
    case "enrollment.finished_no_reply": return "finished";
    case "enrollment.paused": return "paused — out of office";
    case "inbound.bounce_hard": return "hard-bounced";
    case "enrollment.suppression_halt": return "was halted";
    case "touch.failed": return "send failed";
    case "release.held": return "paused its ramp";
    default: return "changed";
  }
}

/** "and 2 others" — the aggregate row's subject line. */
export function peopleLabel(people: FeedPerson[]): { lead: string; rest: string | null } {
  const lead = people[0]?.name ?? "Someone";
  if (people.length === 1) return { lead, rest: null };
  return { lead, rest: `and ${people.length - 1} other${people.length > 2 ? "s" : ""}` };
}

export function countByKind(items: FeedItem[]): Record<FeedKind, number> {
  const counts = Object.fromEntries(FEED_KINDS.map((k) => [k.key, 0])) as Record<FeedKind, number>;
  for (const i of items) counts[i.kind] += 1;
  return counts;
}

/** Compact age — "2h", "3d". Absolute dates come from the day slugs above. */
export function shortAge(at: Date, now: Date = new Date()): string {
  const mins = Math.max(0, Math.round((now.getTime() - at.getTime()) / 60_000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** "Today" / "Yesterday" / "Mon, Aug 4" — the feed's date slugs. */
export function daySlug(at: Date, now: Date = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(at)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return at.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
