"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { importAction, type ImportState } from "../app/prospects/actions";
import {
  customNameFrom, extractEmailCell, sniffTable, suggestField, type SniffedTable,
} from "../lib/import-parse";
import type { SequenceSummary } from "../lib/queries";
import { Field, Notice, inputClass } from "./ui";

const SAMPLE = `email,first name,last name,company,title,timezone
dana@foundryco.com,Dana,Nakamura,Foundry & Co,VP Operations,America/Chicago`;

/** Where a file column can land. Standard fields come first; "custom" makes
 *  the column a {{variable}} of the user's naming; "ignore" leaves it behind. */
const TARGETS = [
  { value: "ignore", label: "Don't import" },
  { value: "email", label: "Email (required)" },
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "company", label: "Company" },
  { value: "title", label: "Title" },
  { value: "timezone", label: "Timezone" },
  { value: "custom", label: "Custom variable…" },
] as const;

type Target = (typeof TARGETS)[number]["value"];

/** Names the engine already resolves from prospect columns — a custom
 *  variable may not shadow them. */
const RESERVED = new Set(["firstName", "lastName", "company", "title", "email"]);

interface ColumnChoice {
  target: Target;
  customName: string;
}

interface LoadedFile {
  name: string;
  table: SniffedTable;
}

function initialMapping(table: SniffedTable): ColumnChoice[] {
  const width = Math.max(
    table.header?.length ?? 0, ...table.rows.slice(0, 5).map((r) => r.length), 0);
  return Array.from({ length: width }, (_, i) => {
    const header = table.header?.[i];
    if (header !== undefined) {
      const field = suggestField(header);
      return { target: field ?? "ignore", customName: customNameFrom(header) };
    }
    // Headerless file: the column whose first row holds an address is the
    // email column; everything else waits for the user to say.
    const sample = table.rows[0]?.[i] ?? "";
    return { target: extractEmailCell(sample) ? "email" : "ignore", customName: "" };
  });
}

const CUSTOM_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;

/** What is wrong with the current mapping, or null when it can submit. */
function mappingProblem(mapping: ColumnChoice[]): string | null {
  const emails = mapping.filter((m) => m.target === "email").length;
  if (emails === 0) return "Point one column at Email — without an address a row cannot exist.";
  if (emails > 1) return "Two columns are mapped to Email; pick one.";
  const seen = new Set<string>();
  for (const m of mapping) {
    if (m.target !== "custom") {
      if (m.target !== "ignore" && m.target !== "email" && seen.has(m.target)) {
        return "Two columns are mapped to the same field.";
      }
      seen.add(m.target);
      continue;
    }
    if (!CUSTOM_NAME_RE.test(m.customName)) {
      return "A custom variable needs a name: letters and digits, starting with a letter.";
    }
    if (RESERVED.has(m.customName)) {
      return `{{${m.customName}}} is already a standard field — map the column to it instead.`;
    }
    if (seen.has(`custom:${m.customName}`)) {
      return `Two columns are both named {{${m.customName}}}.`;
    }
    seen.add(`custom:${m.customName}`);
  }
  return null;
}

/** The rows exactly as the mapping reads them — what actually gets imported. */
function applyMapping(table: SniffedTable, mapping: ColumnChoice[]) {
  const offset = table.header ? 2 : 1;
  return table.rows.map((cells, i) => {
    const row: Record<string, unknown> = { line: i + offset };
    const custom: Record<string, string> = {};
    mapping.forEach((m, col) => {
      const v = (cells[col] ?? "").trim();
      if (v.length === 0 || m.target === "ignore") return;
      if (m.target === "custom") custom[m.customName] = v;
      else row[m.target] = v;
    });
    if (Object.keys(custom).length > 0) row.custom = custom;
    return row;
  });
}

/** Paste in whatever you have — the parser sniffs commas, tabs or semicolons
 *  and reports every row it could not read by line number. Or hand it a CSV
 *  file: a file gets a confirmation screen first, where each detected column
 *  is matched to a prospect field (or a custom {{variable}}, or left out) and
 *  only what you map is imported. */
export function ImportForm({
  sequences, preselected,
}: { sequences: SequenceSummary[]; preselected?: string }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAction, {});
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnChoice[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const problem = file ? mappingProblem(mapping) : null;
  const mapped = useMemo(
    () => (file && !problem ? applyMapping(file.table, mapping) : []),
    [file, mapping, problem],
  );
  const readable = useMemo(() => {
    if (!file) return 0;
    const emailCol = mapping.findIndex((m) => m.target === "email");
    if (emailCol === -1) return 0;
    return file.table.rows
      .filter((cells) => extractEmailCell(cells[emailCol] ?? "")).length;
  }, [file, mapping]);

  const loadFile = async (f: File) => {
    setFileError(null);
    if (f.size > 5_000_000) {
      setFileError("That file is over 5 MB. Export a smaller slice and retry.");
      return;
    }
    const text = await f.text();
    const table = sniffTable(text);
    if (table.rows.length === 0) {
      setFileError("Nothing readable in that file — no non-empty rows.");
      return;
    }
    if (table.rows.length > 5000) {
      setFileError(`That is ${table.rows.length.toLocaleString()} rows; the ceiling is 5,000 per import. Split the file.`);
      return;
    }
    setFile({ name: f.name, table });
    setMapping(initialMapping(table));
  };

  const columnLabel = (i: number) =>
    file?.table.header?.[i] ?? `Column ${i + 1}`;

  return (
    <>
      <form action={action} className="mt-4 grid max-w-3xl gap-5">
        {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
        {fileError ? <Notice tone="bad">{fileError}</Notice> : null}

        {file === null ? (
          <>
            <Field label="Rows" hint="CSV, tab-separated, or one address per line.">
              <textarea
                name="rows" rows={12} required placeholder={SAMPLE}
                className={`${inputClass} font-mono text-[12.5px]`}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
              or upload a file instead —
              <label className="cursor-pointer rounded-lg border border-line bg-panel px-3 py-1.5 font-semibold text-sub">
                Choose a CSV
                <input
                  type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void loadFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
              a file gets a column-matching step before anything imports.
            </div>
          </>
        ) : (
          <div className="grid gap-3 rounded-xl border border-line bg-panel px-4 py-3.5">
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-[13px] font-extrabold">Match the columns</p>
              <span className="font-mono text-[11px] text-muted">
                {file.name} · {file.table.rows.length.toLocaleString()} rows
              </span>
              <button
                type="button"
                onClick={() => { setFile(null); setMapping([]); }}
                className="ml-auto text-[12px] font-semibold text-muted"
              >
                Start over
              </button>
            </div>
            <p className="text-[11.5px] text-muted">
              Only mapped columns import. &ldquo;Custom variable&rdquo; makes a column
              usable in steps as {"{{its_name}}"}.
            </p>

            <div className="grid gap-2">
              {mapping.map((m, i) => (
                <div
                  key={i}
                  className="grid items-center gap-2 border-t border-line pt-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]"
                >
                  <span className="min-w-0">
                    <b className="block truncate text-[13px] font-semibold">{columnLabel(i)}</b>
                    <span className="block truncate font-mono text-[11px] text-muted">
                      {file.table.rows[0]?.[i]?.trim() || "—"}
                    </span>
                  </span>
                  <select
                    value={m.target}
                    onChange={(e) => setMapping((prev) => prev.map((c, j) =>
                      j === i ? { ...c, target: e.target.value as Target } : c))}
                    className={inputClass}
                  >
                    {TARGETS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {m.target === "custom" ? (
                    <input
                      value={m.customName} placeholder="variable_name"
                      onChange={(e) => setMapping((prev) => prev.map((c, j) =>
                        j === i ? { ...c, customName: e.target.value } : c))}
                      className={`${inputClass} font-mono text-[12px] sm:w-44`}
                    />
                  ) : <span className="hidden sm:block" />}
                </div>
              ))}
            </div>

            {problem ? (
              <Notice tone="bad">{problem}</Notice>
            ) : (
              <p className="text-[12.5px] text-sub">
                <b className="tabular-nums">{readable.toLocaleString()}</b> of{" "}
                <b className="tabular-nums">{file.table.rows.length.toLocaleString()}</b> rows
                carry a readable address · importing{" "}
                <b className="tabular-nums">
                  {mapping.filter((c) => c.target !== "ignore").length}
                </b>{" "}
                of {mapping.length} columns
              </p>
            )}
            <input
              type="hidden" name="mapped_rows"
              value={mapped.length > 0 ? JSON.stringify({ rows: mapped }) : ""}
            />
          </div>
        )}

        <Field
          label="Enroll them in"
          hint="Optional. Suppressed and opted-out addresses are refused here, not at send time."
        >
          <select name="sequence_id" className={inputClass} defaultValue={preselected ?? ""}>
            <option value="">Import only — do not enroll</option>
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.mailboxEmail ? ` — sends from ${s.mailboxEmail}` : ""}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <button
            type="submit" disabled={pending || (file !== null && problem !== null)}
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
