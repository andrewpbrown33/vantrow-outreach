"use client";

import { useActionState, useState } from "react";
import { createSequenceAction, type ActionState } from "../app/sequences/actions";
import type { MailboxRow } from "../lib/queries";
import { Field, Notice, inputClass } from "./ui";

const DAYS = [
  { n: 1, label: "Mon" }, { n: 2, label: "Tue" }, { n: 3, label: "Wed" },
  { n: 4, label: "Thu" }, { n: 5, label: "Fri" }, { n: 6, label: "Sat" },
  { n: 7, label: "Sun" },
];

const ZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "Europe/London", "Europe/Berlin", "Europe/Paris",
  "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "UTC",
];

interface DraftStep {
  key: number;
  subject: string;
  body: string;
  days: number;
  hours: number;
  mode: "auto" | "draft_first";
  thread: boolean;
}

const firstStep = (): DraftStep => ({
  key: 1, subject: "", body: "", days: 0, hours: 0, mode: "auto", thread: false,
});

export function SequenceForm({ mailboxes }: { mailboxes: MailboxRow[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createSequenceAction, {});
  const [steps, setSteps] = useState<DraftStep[]>([firstStep()]);

  const update = (key: number, patch: Partial<DraftStep>) =>
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const connected = mailboxes.filter((m) => m.connected);

  return (
    <form action={action} className="mt-4 grid max-w-3xl gap-5">
      {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
      {connected.length === 0 ? (
        <Notice tone="bad">
          No mailbox is connected, so nothing could send. Connect one first.
        </Notice>
      ) : null}

      <Field label="Name">
        <input name="name" required className={inputClass} placeholder="Vantrow intro — industrials" />
      </Field>

      <Field label="Sends from" hint="The mailbox every step goes out through.">
        <select name="mailbox_id" required className={inputClass} defaultValue="">
          <option value="" disabled>Choose a mailbox</option>
          {mailboxes.map((m) => (
            <option key={m.id} value={m.id} disabled={!m.connected}>
              {m.email}{m.connected ? "" : " — not connected"}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="grid gap-3 rounded-xl border border-line bg-panel px-4 py-3.5">
        <legend className="px-1 text-[13px] font-bold">Sending window</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <label key={d.n} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[13px]">
              <input
                type="checkbox" name="window_day" value={d.n}
                defaultChecked={d.n >= 2 && d.n <= 5}
              />
              {d.label}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Field label="From">
            <input type="time" name="window_start" defaultValue="08:30" className={inputClass} />
          </Field>
          <Field label="Until">
            <input type="time" name="window_end" defaultValue="11:30" className={inputClass} />
          </Field>
        </div>
        <Field
          label="Timezone"
          hint="Times are read in each prospect's own timezone when we know it."
        >
          <select name="timezone_source" className={inputClass} defaultValue="prospect">
            <option value="prospect">Each prospect&apos;s timezone</option>
            <option value="sequence">One timezone for everyone</option>
          </select>
        </Field>
        <Field label="Fall back to" hint="Used when a prospect has no timezone of their own.">
          <input
            name="fallback_timezone" list="tz-options" className={inputClass}
            defaultValue="America/New_York"
          />
          <datalist id="tz-options">
            {ZONES.map((z) => <option key={z} value={z} />)}
          </datalist>
        </Field>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" name="skip_us_holidays" defaultChecked />
          Skip US federal holidays
        </label>
      </fieldset>

      <div>
        <p className="text-[13px] font-extrabold">Steps</p>
        <div className="mt-2 grid gap-3">
          {steps.map((step, i) => (
            <div key={step.key} className="grid gap-3 rounded-xl border border-line bg-panel px-4 py-3.5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-[13px] font-bold">Step {i + 1}</span>
                {i === 0 ? (
                  <span className="text-[11.5px] text-muted">sends when someone is enrolled</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                    after
                    <input
                      type="number" name="step_days" min={0} max={365} value={step.days}
                      onChange={(e) => update(step.key, { days: Number(e.target.value) })}
                      className="w-16 rounded-md border border-line px-2 py-1 text-[13px]"
                    />
                    days
                    <input
                      type="number" name="step_hours" min={0} max={23} value={step.hours}
                      onChange={(e) => update(step.key, { hours: Number(e.target.value) })}
                      className="w-16 rounded-md border border-line px-2 py-1 text-[13px]"
                    />
                    hours
                  </span>
                )}
                {steps.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setSteps((prev) => prev.filter((s) => s.key !== step.key))}
                    className="ml-auto text-[12px] font-semibold text-muted"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              {i === 0 ? (
                <>
                  <input type="hidden" name="step_days" value={0} />
                  <input type="hidden" name="step_hours" value={0} />
                </>
              ) : null}

              <Field label="Subject" hint="{{firstName}}, {{lastName}}, {{company}} and {{title}} resolve at send.">
                <input
                  name="step_subject" value={step.subject} className={inputClass}
                  onChange={(e) => update(step.key, { subject: e.target.value })}
                />
              </Field>
              <Field label="Body">
                <textarea
                  name="step_body" rows={6} value={step.body}
                  className={`${inputClass} font-mono text-[12.5px]`}
                  onChange={(e) => update(step.key, { body: e.target.value })}
                />
              </Field>

              <div className="flex flex-wrap items-center gap-4 text-[13px]">
                <label className="flex items-center gap-2">
                  <input
                    type="radio" name={`mode_${step.key}`} checked={step.mode === "auto"}
                    onChange={() => update(step.key, { mode: "auto" })}
                  />
                  Send automatically
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio" name={`mode_${step.key}`} checked={step.mode === "draft_first"}
                    onChange={() => update(step.key, { mode: "draft_first" })}
                  />
                  Draft first, I&apos;ll send it
                </label>
                <input type="hidden" name="step_mode" value={step.mode} />
                {i > 0 ? (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox" checked={step.thread}
                      onChange={(e) => update(step.key, { thread: e.target.checked })}
                    />
                    Reply on the first thread
                  </label>
                ) : null}
                <input type="hidden" name="step_thread" value={step.thread ? "true" : "false"} />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSteps((prev) => [
            ...prev,
            { ...firstStep(), key: Math.max(...prev.map((s) => s.key)) + 1, days: 3 },
          ])}
          className="mt-2.5 rounded-lg border border-line bg-panel px-4 py-2 text-[13px] font-semibold text-sub"
        >
          Add a step
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit" disabled={pending}
          className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background"
        >
          {pending ? "Saving…" : "Create sequence"}
        </button>
        <span className="text-[12px] text-muted">
          It is created paused — nothing sends until you start it.
        </span>
      </div>
    </form>
  );
}
