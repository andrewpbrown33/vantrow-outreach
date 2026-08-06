import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { legalLint, requiredDisclaimer } from "@vantrow/growth";
import { brand } from "@vantrow/brand";
import {
  assembleCompareCopy,
  compareNote,
  compareRows,
  compareSources,
  disclaimer,
} from "./claims";

/**
 * The site claims lint (Phase-2 verification row; run by CI via `pnpm test`
 * and by scripts/lint-site-claims.mjs).
 *
 * Two layers:
 *  1. The /vs-outreach copy is linted from its single source of truth
 *     (src/lib/claims.ts) — per claim and as the assembled page.
 *  2. Every apps/site page.tsx has its user-visible strings crudely extracted
 *     (method documented on extractCopy below) and linted, enforcing that
 *     "block" rules — hype, deliverability promises, [SHIP-GATE] leaks — hold
 *     everywhere, and that no page other than /vs-outreach mentions a
 *     competitor (the nav.ts brand policy, as a test).
 */

const BRAND = brand.name;
const APP_DIR = fileURLToPath(new URL("../app", import.meta.url));

function lint(text: string) {
  return legalLint({ text, brandName: BRAND });
}

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...pageFiles(p));
    else if (entry === "page.tsx") out.push(p);
  }
  return out.sort();
}

/**
 * Crude extraction of user-visible copy from a page.tsx source — documented
 * method (fancier parsing is not the point; the lint is defense in depth):
 *   1. JSX text nodes: runs of text between `>` and `<` containing no braces.
 *   2. String literals: "…" / '…' plus template literals with `${…}`
 *      interpolations stripped.
 *   3. Filtered to prose-like strings (>= 3 words AND a capital letter or
 *      sentence punctuation), which drops class lists, paths, and plumbing.
 * False negatives are acceptable — the load-bearing comparative copy lives in
 * claims.ts and is linted in full above; false positives just lint extra
 * harmless text. Each fragment is sentence-terminated so concatenation never
 * merges fragments for the lint's sentence-level scan.
 */
function extractCopy(source: string): string {
  const found: string[] = [];
  for (const m of source.matchAll(/>([^<>{}]+)</g)) found.push(m[1]!);
  for (const m of source.matchAll(/"([^"\\\n]{4,})"/g)) found.push(m[1]!);
  for (const m of source.matchAll(/'([^'\\\n]{4,})'/g)) found.push(m[1]!);
  for (const m of source.matchAll(/`([^`]{4,})`/g)) {
    found.push(m[1]!.replace(/\$\{[^}]*\}/g, " "));
  }
  return found
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => {
      if (s.split(" ").length < 3) return false;
      return /[A-Z]/.test(s) || /[.!?](\s|$)/.test(s);
    })
    .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`))
    .join("\n");
}

describe("/vs-outreach claims (single source of truth)", () => {
  // Each claim is always published inside the page frame (dated note +
  // disclaimer), so per-claim linting appends that frame — mirroring reality
  // while still catching claim-local violations.
  const frame = `${compareNote}\n${disclaimer}`;

  it.each(compareRows.map((r) => [r.capability, r] as const))(
    "row %s is approvable under legal lint",
    (_capability, row) => {
      const result = lint(`${row.us}\n${row.them}\n${frame}`);
      expect(result.findings).toEqual([]);
      expect(result.approvable).toBe(true);
    },
  );

  it("assembled page copy is approvable, disclaimed, and dated", () => {
    const result = lint(assembleCompareCopy());
    expect(result.findings).toEqual([]);
    expect(result.approvable).toBe(true);
    expect(result.mentionsCompetitor).toBe(true);
    // Exactly one competitor named — a second would require its own verbatim
    // disclaimer (and violate the one-competitor page design).
    expect(result.competitors).toEqual(["Outreach"]);
    expect(result.hasDisclaimer).toBe(true);
    expect(result.hasAsOfDate).toBe(true);
  });

  it("uses the checklist's verbatim disclaimer, built from the shared helper", () => {
    expect(disclaimer).toBe(requiredDisclaimer("Outreach", BRAND));
    expect(assembleCompareCopy()).toContain(disclaimer);
  });

  it("keeps at least two honest concession rows", () => {
    expect(compareRows.filter((r) => r.conceded).length).toBeGreaterThanOrEqual(2);
  });

  it("footnotes every row to an existing source with S-IDs", () => {
    const notes = new Set(compareSources.map((s) => s.note));
    for (const row of compareRows) {
      expect(notes.has(row.note)).toBe(true);
    }
    for (const source of compareSources) {
      expect(source.text).toMatch(/\[S-(PRC|REV|DIF)-\d{3}\]/);
    }
  });

  it("contains no unresolved [SHIP-GATE] markers", () => {
    expect(assembleCompareCopy()).not.toMatch(/\[SHIP-GATE/i);
  });
});

describe("every site page passes the legal lint", () => {
  const pages = pageFiles(APP_DIR);

  it("finds the expected page set", () => {
    const rel = pages.map((p) => path.relative(APP_DIR, p));
    expect(rel).toContain("page.tsx");
    expect(rel).toContain(path.join("vs-outreach", "page.tsx"));
    expect(rel.length).toBeGreaterThanOrEqual(9);
  });

  it.each(pageFiles(APP_DIR).map((p) => [path.relative(APP_DIR, p), p] as const))(
    "%s is approvable (and names no competitor unless it is the comparison page)",
    (rel, file) => {
      const source = readFileSync(file, "utf8");
      // [SHIP-GATE] markers must never survive into any publishable source.
      expect(source).not.toMatch(/\[SHIP-GATE/i);

      const isComparePage = rel === path.join("vs-outreach", "page.tsx");
      // The compare page renders its copy from claims.ts — lint what it
      // actually shows: extracted literals plus the assembled claims copy.
      const text = isComparePage
        ? `${extractCopy(source)}\n${assembleCompareCopy()}`
        : extractCopy(source);

      const result = lint(text);
      expect(result.findings).toEqual([]);
      expect(result.approvable).toBe(true);
      if (!isComparePage) {
        // Brand policy: the competitor is named nowhere outside /vs-outreach.
        expect(result.mentionsCompetitor).toBe(false);
      }
    },
  );
});
