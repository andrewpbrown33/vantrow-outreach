"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importAction, type ImportState } from "../app/prospects/actions";
import type { SequenceSummary } from "../lib/queries";
import { Field, Notice, inputClass } from "./ui";

const SAMPLE = `email,first name,last name,company,title,timezone
dana@foundryco.com,Dana,Nakamura,Foundry & Co,VP Operations,America/Chicago`;

/** Paste in whatever you have. The parser sniffs commas, tabs or semicolons,
 *  decides for itself whether row one is a header, and reports every row it
 *  could not read by line number. */
export function ImportForm({
  sequences, preselected,
}: { sequences: SequenceSummary[]; preselected?: string }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAction, {});

  return (
    <>
      <form action={action} className="mt-4 grid max-w-3xl gap-5">
        {state.error ? <Notice tone="bad">{state.error}</Notice> : null}

        <Field label="Rows" hint="CSV, tab-separated, or one address per line.">
          <textarea
            name="rows" rows={12} required placeholder={SAMPLE}
            className={`${inputClass} font-mono text-[12.5px]`}
          />
        </Field>

        <Field
          label="Enroll them in"
          hint="Optional. Suppressed and opted-out addresses are refused here, not at send time."
        >
          <select name="sequence_id" className={inputClass} defaultValue={preselected ?? ""}>
            <option value="">Import only — do not enroll</option>
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>

        <div>
          <button
            type="submit" disabled={pending}
            className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background"
          >
            {pending ? "Importing…" : "Import"}
          </button>
        </div>
      </form>

      {state.report ? <Report report={state.report} /> : null}
    </>
  );
}

function Report({ report }: { report: NonNullable<ImportState["report"]> }) {
  const refused = [
    ...(report.suppressed ?? []).map((e) => ({ email: e, why: "on the suppression list" })),
    ...(report.optedOut ?? []).map((e) => ({ email: e, why: "opted out" })),
  ];
  return (
    <section className="mt-6 max-w-3xl rounded-xl border border-line bg-panel px-4 py-3.5">
      <p className="text-[13px] font-extrabold">What happened</p>
      <ul className="mt-2 grid gap-1 text-[13px] text-sub">
        <li><b className="tabular-nums">{report.created}</b> new {report.created === 1 ? "prospect" : "prospects"}</li>
        <li><b className="tabular-nums">{report.updated}</b> already known, details refreshed</li>
        {report.duplicates > 0 ? (
          <li><b className="tabular-nums">{report.duplicates}</b> repeated inside the paste, counted once</li>
        ) : null}
        {report.enrolled !== undefined ? (
          <li>
            <b className="tabular-nums">{report.enrolled}</b> enrolled
            {report.alreadyEnrolled ? `, ${report.alreadyEnrolled} were already in it` : ""}
            {report.sequenceId ? (
              <>
                {" · "}
                <Link href={`/sequences/${report.sequenceId}`} className="border-b-2 border-camel font-semibold no-underline">
                  open the sequence
                </Link>
              </>
            ) : null}
          </li>
        ) : null}
      </ul>

      {refused.length > 0 ? (
        <div className="mt-3 border-t border-line pt-2.5">
          <p className="text-[12.5px] font-bold text-state-bounced">
            Refused — imported, but not enrolled
          </p>
          <ul className="mt-1 grid gap-0.5 font-mono text-[11.5px] text-muted">
            {refused.map((r) => <li key={r.email}>{r.email} — {r.why}</li>)}
          </ul>
        </div>
      ) : null}

      {report.skipped.length > 0 ? (
        <div className="mt-3 border-t border-line pt-2.5">
          <p className="text-[12.5px] font-bold text-state-bounced">
            Could not read {report.skipped.length} {report.skipped.length === 1 ? "row" : "rows"}
          </p>
          <ul className="mt-1 grid gap-0.5 font-mono text-[11.5px] text-muted">
            {report.skipped.slice(0, 25).map((s) => (
              <li key={s.line}>line {s.line}: {s.reason} — {s.text}</li>
            ))}
          </ul>
          {report.skipped.length > 25 ? (
            <p className="mt-1 text-[11.5px] text-muted">…and {report.skipped.length - 25} more.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
