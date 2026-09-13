import Link from "next/link";
import { notFound } from "next/navigation";
import { replySubject } from "@vantrow/engine/subject";
import { AppBar } from "../../../components/app-bar";
import { Drawer } from "../../../components/drawer";
import { Chip, Empty, Monogram, Notice, PersonLink } from "../../../components/ui";
import { initialsOf } from "../../../lib/feed";
import { clockOf, dayNumbers, daysOf, intervalOf, whenOf } from "../../../lib/format";
import { getSequence, listEnrollments, listSteps, type EnrollmentRow, type StepRow } from "../../../lib/queries";
import type { EnrollmentState } from "../../../lib/states";
import { requireSession } from "../../../lib/workspace";
import { approveDraftAction, setStateAction } from "../actions";

/** What a reply step's subject will read on the wire: Re: + the nearest
 *  earlier thread-opening step. Mirrors the engine's derivation for display —
 *  the ledger's recorded subject is the truth once a touch has sent. */
function displaySubject(steps: StepRow[], i: number): { text: string; derived: boolean } {
  const step = steps[i]!;
  if (!step.threadAsReply) {
    return { text: step.subject ?? "(no subject)", derived: false };
  }
  for (let j = i - 1; j >= 0; j--) {
    const opener = steps[j]!;
    if (!opener.threadAsReply && (opener.subject ?? "").trim().length > 0) {
      return { text: replySubject(opener.subject!), derived: true };
    }
  }
  return { text: "Re: — the subject of the step it threads under", derived: true };
}

export const dynamic = "force-dynamic";

/** The pause_reason the sweep writes when it parks a draft-first step. Matched
 *  exactly so the approve control appears for that state and nothing else. */
const AWAITING_DRAFT = "awaiting draft approval";

/** The enrollment states that get a monogram tone. `canceled` reads as draft
 *  grey — it is not a state the engine is working on. */
const TONE: Record<EnrollmentState, Parameters<typeof Monogram>[0]["tone"]> = {
  active: "active", scheduled: "scheduled", paused: "paused", replied: "replied",
  finished_no_reply: "finished_no_reply", bounced: "bounced", canceled: "scheduled",
  // Waiting on the drip, not yet in play — same quiet tone as canceled.
  queued: "scheduled",
};

const BADGE: Partial<Record<EnrollmentState, string>> = {
  replied: "↩", paused: "∥", finished_no_reply: "✓", bounced: "!",
};

export default async function SequenceDetail({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { workspaceId } = await requireSession();

  const seq = await getSequence(workspaceId, id);
  if (!seq) notFound();

  const [steps, enrollments] = await Promise.all([
    listSteps(workspaceId, id),
    listEnrollments(workspaceId, id),
  ]);

  const cue = [
    daysOf(seq.windowDays),
    `${clockOf(seq.windowStartMinute)}–${clockOf(seq.windowEndMinute)}`,
    seq.skipUsHolidays ? "US holidays skipped" : null,
    seq.dailyCap !== null ? `cap ${seq.dailyCap}/day` : null,
  ].filter(Boolean).join(" · ");

  return (
    <>
      <AppBar here="/sequences" trailing={<span>{seq.mailboxEmail ?? "no mailbox"}</span>} />
      <div className="px-4 pt-3.5 pb-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[21px] font-extrabold tracking-tight">{seq.name}</h1>
          <Chip state={seq.state === "archived" ? "archived" : seq.state} />
          <span className="font-mono text-[10px] text-muted">
            {seq.mailboxEmail ? `sends as ${seq.mailboxEmail}` : "no sending mailbox"}
          </span>
          <form action={setStateAction} className="ml-auto flex gap-2">
            <input type="hidden" name="id" value={seq.id} />
            <input
              type="hidden" name="state"
              value={seq.state === "active" ? "paused" : "active"}
            />
            <button
              type="submit"
              className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background"
            >
              {seq.state === "active" ? "Pause sending" : "Start sending"}
            </button>
          </form>
        </div>

        {error ? <div className="mt-3"><Notice tone="bad">{error}</Notice></div> : null}

        <Drawer title="Schedule &amp; rules" cue={cue}>
          <div className="flex flex-wrap gap-3.5 py-0.5">
            <span>
              <span className="text-muted">Window</span>{" "}
              <b>{daysOf(seq.windowDays)} · {clockOf(seq.windowStartMinute)}–{clockOf(seq.windowEndMinute)}</b>{" "}
              <span className="text-muted">
                {seq.timezoneSource === "prospect"
                  ? `each prospect's timezone (${seq.fallbackTimezone} when unknown)`
                  : seq.fallbackTimezone}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-3.5 py-0.5">
            <span>
              <span className="text-muted">Holidays</span>{" "}
              <b>{seq.skipUsHolidays ? "skipped (US federal)" : "not skipped"}</b>
            </span>
          </div>
          {seq.dailyCap !== null ? (
            <div className="flex flex-wrap gap-3.5 py-0.5">
              <span>
                <span className="text-muted">Daily cap</span> <b>{seq.dailyCap} per mailbox</b>{" "}
                <span className="text-muted">
                  over-cap sends defer to the next legal slot — never dropped
                </span>
              </span>
            </div>
          ) : null}
          <div className="mt-2 border-t border-dashed border-line pt-2 text-sub">
            A reply stops the sequence instantly — engine law, not a setting.
            <span className="ml-1.5 font-mono text-[10px] text-muted">I2</span>
          </div>
          <div className="pt-0.5 text-sub">
            An out-of-office pauses with the return date; it never counts as a reply.
            <span className="ml-1.5 font-mono text-[10px] text-muted">I6</span>
          </div>
        </Drawer>

        <p className="mt-3.5 mb-1 text-[13px] font-extrabold">Steps</p>
        {steps.length === 0 ? (
          <Empty title="No steps yet.">This sequence cannot run until it has one.</Empty>
        ) : null}
        <div className="grid gap-2.5">
          {steps.map((step, i) => {
            const subject = displaySubject(steps, i);
            const day = dayNumbers(steps.map(
              (s) => ({ days: s.intervalDays, hours: s.intervalHours })))[i];
            return (
            <div
              key={step.id}
              className="grid gap-3 rounded-lg border border-line bg-panel px-3.5 py-3 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="font-mono text-[11px] font-bold text-sub">
                Day {day}
                <span className="block font-normal text-muted">
                  {i === 0 ? "on enroll" : intervalOf(step.intervalDays, step.intervalHours, false)}
                </span>
                <span className="block font-normal text-muted">
                  {i === 0 ? "opens the thread" : step.threadAsReply ? "same thread" : "new thread"}
                </span>
              </span>
              <span>
                <b className={subject.derived ? "font-semibold text-sub" : "font-semibold"}>
                  {subject.text}
                </b>
                <span className="block text-xs text-muted">
                  {subject.derived ? "subject written at send time · " : ""}
                  {step.templateName ?? "no template"}
                </span>
              </span>
              <span className="font-mono text-[10.5px] font-bold">
                <span className={step.mode === "auto"
                  ? "rounded-full bg-wash-active px-2.5 py-1 text-state-active"
                  : "rounded-full bg-wash-paused px-2.5 py-1 text-state-paused"}>
                  {step.mode === "auto" ? "AUTO-SEND" : "DRAFT FIRST"}
                </span>
              </span>
            </div>
            );
          })}
        </div>

        <div className="mt-4 mb-1 flex flex-wrap items-baseline gap-3">
          <p className="text-[13px] font-extrabold">Enrollments · {enrollments.length}</p>
          <Link
            href={`/prospects/import?sequence=${seq.id}`}
            className="border-b-2 border-camel text-[12px] font-semibold text-sub no-underline"
          >
            Add people
          </Link>
        </div>
        {enrollments.length === 0 ? (
          <Empty title="Nobody is enrolled yet.">
            <Link
              href={`/prospects/import?sequence=${seq.id}`}
              className="border-b-2 border-camel font-semibold text-sub no-underline"
            >
              Import prospects into this sequence
            </Link>
          </Empty>
        ) : null}
        {enrollments.map((e) => (
          <EnrollmentLine key={e.id} row={e} sequenceId={seq.id} />
        ))}
      </div>
    </>
  );
}

function EnrollmentLine({ row, sequenceId }: { row: EnrollmentRow; sequenceId: string }) {
  const name = row.prospectName ?? row.prospectEmail;
  const awaitingDraft = row.state === "paused" && row.pauseReason === AWAITING_DRAFT;
  return (
    <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-t border-line px-0.5 py-2.5 text-sm">
      <Monogram initials={initialsOf(name)} tone={TONE[row.state]} badge={BADGE[row.state] ?? null} />
      <span>
        <PersonLink href={`/prospects?q=${encodeURIComponent(row.prospectEmail)}`}>{name}</PersonLink>
        <span className="block text-xs text-muted">{describe(row)}</span>
      </span>
      {awaitingDraft ? (
        // The only way out of a draft-first park. Without it the enrollment sits
        // here forever: the sweep cleared next_touch_at, and that is the timer.
        <form action={approveDraftAction} className="flex items-center gap-2">
          <input type="hidden" name="enrollment_id" value={row.id} />
          <input type="hidden" name="sequence_id" value={sequenceId} />
          <button
            type="submit"
            className="rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-semibold text-background"
          >
            Approve step {row.currentStepOrder}
          </button>
        </form>
      ) : (
        <Chip state={row.state} />
      )}
    </div>
  );
}

function describe(row: EnrollmentRow): string {
  const parts: string[] = [];
  if (row.company) parts.push(row.company);
  switch (row.state) {
    case "replied":
      parts.push(`stopped at step ${row.currentStepOrder} — see the thread`);
      break;
    case "paused": {
      const at = whenOf(row.resumeAt);
      parts.push(at ? `resumes ${at}` : `held${row.pauseReason ? ` — ${row.pauseReason}` : ""}`);
      if (row.pauseReason === "ooo") parts.push("return date parsed from the auto-reply");
      break;
    }
    case "bounced":
      parts.push("address suppressed, enrollment halted");
      break;
    case "finished_no_reply":
      parts.push(`ran ${row.currentStepOrder} ${
        row.currentStepOrder === 1 ? "step" : "steps"} without an answer`);
      break;
    case "canceled":
      parts.push("canceled");
      break;
    default: {
      const at = whenOf(row.nextTouchAt);
      parts.push(at
        ? `next: step ${row.currentStepOrder} · ${at}${row.timezone ? " (their timezone)" : ""}`
        : `step ${row.currentStepOrder} · waiting`);
    }
  }
  return parts.join(" · ");
}
