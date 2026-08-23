"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { minutesFromTime } from "../../lib/format";
import {
  activateSequence, approveDraft, createSequence, getSequence, listSteps,
  setSequenceState,
  type NewStepInput,
} from "../../lib/queries";
import { requireSession } from "../../lib/workspace";

/** Server actions carry no workspace id from the client — every one of them
 *  re-derives it from the session, then scopes its write. A form field is an
 *  attacker-controlled string; the session is not. */

export interface ActionState { error?: string }

export async function setStateAction(formData: FormData): Promise<void> {
  const { workspaceId } = await requireSession();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("state") ?? "");
  if (!["draft", "active", "paused", "archived"].includes(next)) return;

  if (next === "active") {
    // Activating is the moment the engine starts sending. Refuse to do it
    // half-configured rather than let the sweep discover the hole.
    const [seq, steps] = await Promise.all([
      getSequence(workspaceId, id), listSteps(workspaceId, id),
    ]);
    if (!seq || !seq.mailboxId || steps.length === 0) {
      redirect(`/sequences/${id}?error=${encodeURIComponent(
        "A sequence needs a sending mailbox and at least one step before it can run.")}`);
    }
    // Not a bare state flip — anyone the sweep parked while this was off has
    // no timer left, and the timer is the schedule. See activateSequence.
    await activateSequence(workspaceId, id);
  } else {
    await setSequenceState(workspaceId, id, next as "draft" | "paused" | "archived");
  }
  revalidatePath(`/sequences/${id}`);
  revalidatePath("/sequences");
}

function stepsFrom(formData: FormData): NewStepInput[] {
  const subjects = formData.getAll("step_subject").map(String);
  const bodies = formData.getAll("step_body").map(String);
  const days = formData.getAll("step_days").map(String);
  const hours = formData.getAll("step_hours").map(String);
  const modes = formData.getAll("step_mode").map(String);
  const threads = formData.getAll("step_thread").map(String);

  const steps: NewStepInput[] = [];
  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i]?.trim() ?? "";
    const body = bodies[i] ?? "";
    if (subject.length === 0 && body.trim().length === 0) continue;
    steps.push({
      subject,
      bodyHtml: body,
      intervalDays: clampInt(days[i], 0, 365),
      intervalHours: clampInt(hours[i], 0, 23),
      mode: modes[i] === "draft_first" ? "draft_first" : "auto",
      threadAsReply: threads[i] === "on" || threads[i] === "true",
    });
  }
  return steps;
}

function clampInt(raw: string | undefined, min: number, max: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export async function createSequenceAction(
  _prev: ActionState, formData: FormData,
): Promise<ActionState> {
  const { workspaceId } = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const mailboxId = String(formData.get("mailbox_id") ?? "");
  if (name.length === 0) return { error: "Give the sequence a name." };
  if (mailboxId.length === 0) return { error: "Pick the mailbox it sends from." };

  const steps = stepsFrom(formData);
  if (steps.length === 0) return { error: "A sequence needs at least one step." };
  if (steps[0]?.threadAsReply) {
    return { error: "The first step opens the conversation — it cannot be a reply." };
  }
  // Reply steps carry no subject of their own: the engine derives
  // "Re: <thread opener>" at send time. Only thread-opening steps need one.
  const blank = steps.findIndex((s) => !s.threadAsReply && s.subject.length === 0);
  if (blank !== -1) return { error: `Step ${blank + 1} has no subject line.` };

  const windowDays = formData.getAll("window_day").map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7);
  if (windowDays.length === 0) return { error: "Pick at least one sending day." };

  const startMinute = minutesFromTime(String(formData.get("window_start") ?? "08:30"));
  const endMinute = minutesFromTime(String(formData.get("window_end") ?? "11:30"));
  if (endMinute <= startMinute) return { error: "The window has to end after it starts." };

  let id: string;
  try {
    id = await createSequence(workspaceId, {
      name,
      mailboxId,
      timezoneSource: formData.get("timezone_source") === "sequence" ? "sequence" : "prospect",
      fallbackTimezone: String(formData.get("fallback_timezone") ?? "America/New_York"),
      windowDays,
      windowStartMinute: startMinute,
      windowEndMinute: endMinute,
      skipUsHolidays: formData.get("skip_us_holidays") === "on",
      steps,
    });
  } catch (err) {
    return { error: String(err instanceof Error ? err.message : err).slice(0, 200) };
  }
  redirect(`/sequences/${id}`);
}

/** Approve a parked draft-first step (protocol §10).
 *
 *  The enrollment id arrives from a form and is therefore attacker-controlled;
 *  approveDraft scopes every statement to the session's workspace and re-checks
 *  that the row really is awaiting approval, so a forged id matches nothing. */
export async function approveDraftAction(formData: FormData): Promise<void> {
  const { workspaceId } = await requireSession();
  const enrollmentId = String(formData.get("enrollment_id") ?? "");
  const sequenceId = String(formData.get("sequence_id") ?? "");
  if (!enrollmentId) return;

  await approveDraft(workspaceId, enrollmentId);
  revalidatePath(`/sequences/${sequenceId}`);
}
