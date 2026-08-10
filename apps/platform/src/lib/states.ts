/** The state vocabulary, with no database behind it.
 *
 *  This lives apart from queries.ts on purpose: components render state names
 *  and dot orders, and a value import from queries.ts would drag node-postgres
 *  into the browser bundle. Types are erased; constants are not.
 */

export type EnrollmentState =
  | "scheduled" | "active" | "paused" | "replied"
  | "finished_no_reply" | "bounced" | "canceled";

/** The six states a dot strip can show — fixed order so runs stay contiguous
 *  (deck v2.1). `canceled` is not a dot: it left the sequence on purpose. */
export const DOT_STATES = [
  "active", "scheduled", "paused", "replied", "finished_no_reply", "bounced",
] as const;

export type DotState = (typeof DOT_STATES)[number];

export const STATE_LABEL: Record<DotState, string> = {
  active: "Active",
  scheduled: "Scheduled",
  paused: "Paused",
  replied: "Replied",
  finished_no_reply: "In the cracks",
  bounced: "Bounced",
};
