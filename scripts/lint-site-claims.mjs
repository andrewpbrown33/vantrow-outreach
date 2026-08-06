#!/usr/bin/env node
/**
 * Claims lint for the marketing site (Phase-2 verification row: this script
 * exits 0 only when the site's marketing copy passes @vantrow/growth
 * legal-lint with zero "block" findings).
 *
 * Method — the linting itself lives in apps/site/src/lib/claims.test.ts,
 * which:
 *   (a) imports the /vs-outreach copy from its single source of truth
 *       (apps/site/src/lib/claims.ts) and runs legalLint over every claim row
 *       and over the assembled page copy (asserting approvable === true, the
 *       verbatim disclaimer, the "as of" date, >= 2 concession rows, S-ID
 *       footnotes, and zero [SHIP-GATE] markers), and
 *   (b) crudely extracts the user-visible string literals from every
 *       page.tsx under apps/site/src/app (JSX text nodes + prose-like string
 *       literals; extraction method documented in the test) and lints each
 *       page, additionally asserting that no page outside /vs-outreach names
 *       a competitor.
 *
 * Running the lint inside vitest keeps this dependency-light: legal-lint.ts
 * is plain TypeScript and vitest (already a root devDependency, already run
 * by CI's `pnpm test`) transpiles it — no extra transpiler dependency for
 * this script. This wrapper exists so the verification row has a single
 * command; it simply invokes that test file and propagates the exit code.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const result = spawnSync(
  "npx",
  ["vitest", "run", "apps/site/src/lib/claims.test.ts"],
  { cwd: repoRoot, stdio: "inherit" },
);

if (result.error) {
  console.error("lint-site-claims: failed to launch vitest:", result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
