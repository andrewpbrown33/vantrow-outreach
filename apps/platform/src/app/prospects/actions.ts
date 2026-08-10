"use server";

import { revalidatePath } from "next/cache";
import { parseProspects } from "../../lib/import-parse";
import { enrollProspects, upsertProspects } from "../../lib/queries";
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

/** Import, then optionally enroll. The screening happens in enrollProspects
 *  (suppression and opt-out are checked before a row is written), and what it
 *  refused comes back here by address — a silent drop would be the one
 *  outcome an operator must never get. */
export async function importAction(
  _prev: ImportState, formData: FormData,
): Promise<ImportState> {
  const { workspaceId } = await requireSession();

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

  let upserted;
  try {
    upserted = await upsertProspects(workspaceId, parsed.rows);
  } catch (err) {
    return { error: String(err instanceof Error ? err.message : err).slice(0, 200) };
  }

  const report: NonNullable<ImportState["report"]> = {
    created: upserted.created,
    updated: upserted.updated,
    duplicates: parsed.duplicates,
    skipped: parsed.skipped,
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
