#!/usr/bin/env node
/**
 * Site copy lint for the marketing site (Phase-2 verification row: this
 * script exits 0 only when the site's copy passes @vantrow/growth legal-lint
 * with zero findings).
 *
 * Method — the linting itself lives in apps/site/src/lib/site-copy-lint.test.ts,
 * which crudely extracts the user-visible string literals from every page.tsx
 * under apps/site/src/app (JSX text nodes + prose-like string literals;
 * extraction method documented in the test) and lints each page, asserting
 * zero findings, no [SHIP-GATE] markers, and that NO page names a competitor
 * (founder decision 2026-08-07: the comparison page was removed pre-launch).
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
  ["vitest", "run", "apps/site/src/lib/site-copy-lint.test.ts"],
  { cwd: repoRoot, stdio: "inherit" },
);

if (result.error) {
  console.error("lint-site-claims: failed to launch vitest:", result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
