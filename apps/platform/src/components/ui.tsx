/** The shared vocabulary of the product surfaces.
 *
 *  Every one of these renders its label in words. Colour is redundant here by
 *  law, not by taste — a chip says "Paused" and happens to be amber; a dot
 *  strip is always accompanied by the written counts. Two of the pinned state
 *  colours sit close for some colour-blind readers, and grouping plus words is
 *  what covers that until the palette round re-steps them.
 */

import Link from "next/link";
import { DOT_STATES, STATE_LABEL, type DotState } from "../lib/states";

export { STATE_LABEL };

const STATE_TEXT: Record<DotState, string> = {
  active: "text-state-active",
  scheduled: "text-state-scheduled",
  paused: "text-state-paused",
  replied: "text-state-replied",
  finished_no_reply: "text-state-fnr",
  bounced: "text-state-bounced",
};

const STATE_BG: Record<DotState, string> = {
  active: "bg-state-active",
  scheduled: "bg-state-scheduled",
  paused: "bg-state-paused",
  replied: "bg-state-replied",
  finished_no_reply: "bg-state-fnr",
  bounced: "bg-state-bounced",
};

const STATE_WASH: Record<DotState, string> = {
  active: "bg-wash-active",
  scheduled: "bg-wash-scheduled",
  paused: "bg-wash-paused",
  replied: "bg-wash-replied",
  finished_no_reply: "bg-wash-fnr",
  bounced: "bg-wash-bounced",
};

/** Sequence-level states borrow the same encodings; draft is its own. */
export type ChipState = DotState | "draft" | "archived" | "canceled" | "queued";

function chipClasses(state: ChipState): string {
  if (state === "draft" || state === "archived" || state === "canceled" ||
      state === "queued") {
    return "bg-wash-draft text-state-draft";
  }
  return `${STATE_WASH[state]} ${STATE_TEXT[state]}`;
}

export function chipLabel(state: ChipState): string {
  if (state === "draft") return "Draft";
  if (state === "archived") return "Archived";
  if (state === "canceled") return "Canceled";
  // Said from the person's side, not the engine's: they have not been written
  // to yet and the drip decides when. "Queued" is our word, not theirs.
  if (state === "queued") return "Waiting to start";
  return STATE_LABEL[state];
}

export function Chip({ state, children }: { state: ChipState; children?: React.ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${chipClasses(state)}`}>
      {children ?? chipLabel(state)}
    </span>
  );
}

/** One dot = one person currently in the sequence, in fixed state order so
 *  runs stay contiguous. Finished-all-time is history and never gets dots. */
export function DotStrip({ counts }: { counts: Record<DotState, number> }) {
  const dots: { state: DotState; i: number }[] = [];
  for (const state of DOT_STATES) {
    for (let i = 0; i < counts[state]; i++) dots.push({ state, i });
  }
  if (dots.length === 0) return null;
  const summary = DOT_STATES
    .filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${STATE_LABEL[s].toLowerCase()}`)
    .join(", ");
  return (
    <div className="my-1.5 flex flex-wrap gap-0.5" role="img" aria-label={summary}>
      {dots.map((d) => (
        <i key={`${d.state}-${d.i}`} className={`size-2 rounded-full ${STATE_BG[d.state]}`} />
      ))}
    </div>
  );
}

/** A dot of one state's colour. Class names are looked up, never built by
 *  interpolation — Tailwind only generates classes it can see written out. */
export function StateDot({ state }: { state: DotState }) {
  return <i className={`size-2 flex-none rounded-full ${STATE_BG[state]}`} />;
}

/** The workspace's inventory, one line per state. Six states, six dots — the
 *  deck's seventh row ("finished, all-time") has no source in the schema, so
 *  it is not invented here. */
export function StateStats({ counts }: { counts: Record<DotState, number> }) {
  return (
    <div className="mt-2.5 border-t border-line pt-2">
      {DOT_STATES.map((state) => (
        <div key={state} className="flex items-center gap-2 py-0.5 text-xs text-sub">
          <StateDot state={state} />
          {STATE_LABEL[state]}
          <b className="ml-auto font-bold tabular-nums">{counts[state]}</b>
        </div>
      ))}
    </div>
  );
}

export function Legend({ counts }: { counts?: Record<DotState, number> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2.5 text-[10.5px] text-muted">
      {DOT_STATES.map((s) => (
        <span key={s} className="flex items-center gap-1">
          <i className={`size-2 flex-none rounded-full ${STATE_BG[s]}`} />
          {STATE_LABEL[s]}{counts ? ` ${counts[s]}` : ""}
        </span>
      ))}
    </div>
  );
}

export function PillStat({ state, n, label }: { state?: DotState; n: number; label: string }) {
  return (
    <span className="rounded-xl border border-line bg-panel px-4 py-2 text-xs text-muted">
      <b className={`block text-lg font-extrabold tabular-nums ${state ? STATE_TEXT[state] : "text-foreground"}`}>
        {n}
      </b>
      {label}
    </span>
  );
}

/** Monogram. `tone` picks the wash+text pair; `badge` is a single typographic
 *  glyph (never emoji — design law rule 3 carves out ✓ alone). */
export function Monogram({
  initials, tone, badge, size = "md",
}: { initials: string; tone: DotState; badge?: string | null; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-7 text-[10px]" : "size-9 text-[13px]";
  return (
    <span className={`relative flex flex-none items-center justify-center rounded-full font-bold ${box} ${STATE_WASH[tone]} ${STATE_TEXT[tone]}`}>
      {initials}
      {badge ? (
        <i className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-[color:var(--mono-ring)] bg-brand-accent text-[9px] not-italic text-night">
          {badge}
        </i>
      ) : null}
    </span>
  );
}

/** Two destinations, two underline colours — yellow opens a person, camel
 *  opens a sequence. Chrome, never state. */
export function PersonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="border-b-2 border-brand-accent font-bold text-foreground no-underline">
      {children}
    </Link>
  );
}

export function SequenceLink({
  href, children, onNight = false,
}: { href: string; children: React.ReactNode; onNight?: boolean }) {
  return (
    <Link
      href={href}
      className={`border-b-2 border-camel font-semibold no-underline ${onNight ? "text-night-fg" : "text-sub"}`}
    >
      {children}
    </Link>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-5 py-8 text-center">
      <p className="text-sm font-bold text-foreground">{title}</p>
      {children ? <div className="mt-2 text-[13px] text-muted">{children}</div> : null}
    </div>
  );
}

export function Notice({
  tone = "info", children,
}: { tone?: "info" | "good" | "bad"; children: React.ReactNode }) {
  // "good" borrows the replied encoding — the palette's affirmative — so a
  // success notice reads as success without inventing a colour outside the
  // validated set that design:palette pins.
  const colour = tone === "bad"
    ? "border-state-bounced bg-wash-bounced text-state-bounced"
    : tone === "good"
      ? "border-state-replied bg-wash-replied text-state-replied"
      : "border-line bg-panel text-sub";
  return (
    <p className={`rounded-lg border px-3.5 py-2.5 text-[13px] ${colour}`}>{children}</p>
  );
}

export function Button({
  children, variant = "primary", ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet" }) {
  const style = variant === "primary"
    ? "bg-foreground text-background"
    : "border border-line bg-panel text-sub";
  return (
    <button {...rest} className={`rounded-lg px-4 py-2 text-[13px] font-semibold ${style}`}>
      {children}
    </button>
  );
}

export function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-bold text-foreground">{label}</span>
      {hint ? <span className="mt-0.5 block text-[11.5px] text-muted">{hint}</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-panel px-3 py-2 text-[13.5px] text-foreground";
