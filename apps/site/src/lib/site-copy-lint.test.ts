import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { legalLint } from "@vantrow/growth";
import { brand } from "@vantrow/brand";

/**
 * The site copy lint (Phase-2 verification row; run by CI via `pnpm test` and
 * by scripts/lint-site-claims.mjs).
 *
 * Every apps/site page.tsx has its user-visible strings crudely extracted
 * (method documented on extractCopy below) and linted, enforcing that the
 * "block" rules — hype, deliverability promises, [SHIP-GATE] leaks — hold
 * everywhere, and that NO page mentions a competitor at all (founder decision
 * 2026-08-07: the comparison page was removed pre-launch; nav.ts carries the
 * policy note; the comparative-claims machinery in docs/legal +
 * @vantrow/growth stands ready if comparative content ever returns).
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
 * False negatives are acceptable; false positives just lint extra harmless
 * text. Each fragment is sentence-terminated so concatenation never merges
 * fragments for the lint's sentence-level scan.
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

describe("every site page passes the legal lint, naming no competitor", () => {
  const pages = pageFiles(APP_DIR);

  it("finds the expected page set (and the comparison page stays gone)", () => {
    const rel = pages.map((p) => path.relative(APP_DIR, p));
    expect(rel).toContain("page.tsx");
    expect(rel).not.toContain(path.join("vs-outreach", "page.tsx"));
    expect(rel.length).toBeGreaterThanOrEqual(8);
  });

  it.each(pageFiles(APP_DIR).map((p) => [path.relative(APP_DIR, p), p] as const))(
    "%s is approvable and names no competitor",
    (_rel, file) => {
      const source = readFileSync(file, "utf8");
      // [SHIP-GATE] markers must never survive into any publishable source.
      expect(source).not.toMatch(/\[SHIP-GATE/i);

      const result = lint(extractCopy(source));
      expect(result.findings).toEqual([]);
      expect(result.approvable).toBe(true);
      expect(result.mentionsCompetitor).toBe(false);
    },
  );
});
