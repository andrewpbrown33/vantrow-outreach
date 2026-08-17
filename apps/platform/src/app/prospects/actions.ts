"use server";

import { revalidatePath } from "next/cache";
import { extractEmailCell, parseProspects } from "../../lib/import-parse";
import { enrollProspects, upsertProspects, type ImportCandidate } from "../../lib/queries";
import { requireSession } from "../../lib/workspace";

export interface ImportState {
  error?: string;
  report?: {
    created: number;
    updated: number;
    duplicates: number;
    skipped: { line: number; text: string; reason: string }[];
    enrolled?: number;
    alreadyEnrolled?: number;
    suppressed?: string[];
    optedOut?: string[];
    sequenceId?: string;
  };
}

interface Screened {
  rows: ImportCandidate[];
  skipped: { line: number; text: string; reason: string }[];
  duplicates: number;
}

const CUSTOM_NAME = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
/** Standard prospect columns — a custom variable may not shadow them. */
const RESERVED = new Set(["firstName", "lastName", "company", "title", "email"]);

const str = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t.slice(0, 500) : undefined;
};

/** The file path: rows the mapping screen already shaped, re-validated here —
 *  a hidden form field is still attacker-writable, so the server re-checks
 *  every address, every custom name, and every cap the client claims to have
 *  enforced. Refusals keep their CSV line numbers. */
function screenMapped(raw: string): Screened | { error: string } {
  if (raw.length > 6_000_000) return { error: "That import is too large. Split the file." };
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { error: "The mapped rows did not survive the trip — reload and retry." };
  }
  const rows = (body as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) return { error: "The mapped rows are malformed — reload and retry." };
  if (rows.length === 0) return { error: "Nothing to import — every row was empty." };
  if (rows.length > 5000) return { error: "That is more than 5,000 rows. Split the file." };

  const out: Screened = { rows: [], skipped: [], duplicates: 0 };
  const seen = new Set<string>();
  for (const [i, entry] of rows.entries()) {
    const r = (entry ?? {}) as Record<string, unknown>;
    const line = typeof r.line === "number" && Number.isFinite(r.line)
      ? Math.trunc(r.line) : i + 1;
    const email = extractEmailCell(String(r.email ?? ""));
    if (!email) {
      out.skipped.push({
        line, text: String(r.email ?? "").slice(0, 120), reason: "no email address",
      });
      continue;
    }
    if (seen.has(email)) { out.duplicates += 1; continue; }
    seen.add(email);

    const custom: Record<string, string> = {};
    if (r.custom !== null && typeof r.custom === "object") {
      for (const [k, v] of Object.entries(r.custom as Record<string, unknown>)) {
        if (!CUSTOM_NAME.test(k) || RESERVED.has(k)) continue;
        // Custom values run longer than name fields — a hand-written context
        // line is the point of them — so they get their own, roomier cap.
        if (typeof v !== "string") continue;
        const value = v.trim().slice(0, 2000);
        if (value.length > 0) custom[k] = value;
      }
    }
    out.rows.push({
      email,
      firstName: str(r.firstName),
      lastName: str(r.lastName),
      company: str(r.company),
      title: str(r.title),
      timezone: str(r.timezone),
      ...(Object.keys(custom).length > 0 ? { custom } : {}),
    });
  }
  if (out.rows.length === 0) {
    return { error: "No row in that file carried a readable email address." };
  }
  return out;
}

/** Import, then optionally enroll. Two front doors — pasted rows, or a file's
 *  mapped rows — converge here; the screening happens in enrollProspects
 *  (suppression and opt-out are checked before a row is written), and what it
 *  refused comes back by address — a silent drop would be the one outcome an
 *  operator must never get. */
export async function importAction(
  _prev: ImportState, formData: FormData,
): Promise<ImportState> {
  const { workspaceId } = await requireSession();

  let screened: Screened;
  const mappedRaw = String(formData.get("mapped_rows") ?? "");
  if (mappedRaw.length > 0) {
    const outcome = screenMapped(mappedRaw);
    if ("error" in outcome) return { error: outcome.error };
    screened = outcome;
  } else {
    const text = String(formData.get("rows") ?? "");
    if (text.trim().length === 0) return { error: "Paste some rows first." };
    const parsed = parseProspects(text);
    if (parsed.rows.length === 0) {
      return {
        error: "No email addresses in that. Each row needs one — a header line is optional.",
      };
    }
    if (parsed.rows.length > 5000) {
      return { error: "That is more than 5,000 rows. Split it into smaller pastes." };
    }
    screened = { rows: parsed.rows, skipped: parsed.skipped, duplicates: parsed.duplicates };
  }

  let upserted;
  try {
    upserted = await upsertProspects(workspaceId, screened.rows);
  } catch (err) {
    return { error: String(err instanceof Error ? err.message : err).slice(0, 200) };
  }

  const report: NonNullable<ImportState["report"]> = {
    created: upserted.created,
    updated: upserted.updated,
    duplicates: screened.duplicates,
    skipped: screened.skipped,
  };

  const sequenceId = String(formData.get("sequence_id") ?? "");
  if (sequenceId.length > 0) {
    try {
      const outcome = await enrollProspects(workspaceId, sequenceId, upserted.ids);
      report.enrolled = outcome.enrolled;
      report.alreadyEnrolled = outcome.alreadyEnrolled;
      report.suppressed = outcome.suppressed;
      report.optedOut = outcome.optedOut;
      report.sequenceId = sequenceId;
      revalidatePath(`/sequences/${sequenceId}`);
    } catch (err) {
      return {
        report,
        error: `Imported, but enrolling failed: ${
          String(err instanceof Error ? err.message : err).slice(0, 160)}`,
      };
    }
  }

  revalidatePath("/prospects");
  revalidatePath("/");
  return { report };
}
