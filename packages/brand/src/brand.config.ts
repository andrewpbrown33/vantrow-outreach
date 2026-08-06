/**
 * Single source of truth for all brand identity used by every app in this repo.
 *
 * The apps are 100% brand-agnostic: every brand string, color, font, and
 * domain they render comes from this package. To rebrand, edit this file only.
 *
 * Placeholder values are deliberate sentinels: `__BRAND__` and `example.com`
 * are what the launch-checklist grep (`grep -r "__BRAND__\|example.com" apps
 * packages`) hunts for, so an unbranded string can never reach production
 * unnoticed. Real values land at Gate 2 (brand name) in the same commit as the
 * decision-log gate record.
 *
 * Schema notes vs. subsidiary #1 (Eaverow): parent linkage, dark palette,
 * typography, and shape tokens are first-class here so later subsidiaries
 * inherit a full system, not just six colors.
 */

export interface BrandPalette {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
}

export interface BrandConfig {
  /** Public product/brand name shown in the wordmark, copy, and titles. */
  name: string;
  /** Legal entity name used in the copyright line and legal pages. */
  legalName: string;
  /** Short positioning line shown in the hero and default page title. */
  tagline: string;
  /** One-sentence description used for metadata and intro copy. */
  description: string;
  /** Primary domain (no protocol), used for canonical metadata. */
  domain: string;
  /**
   * Base URL of the product app (the platform origin) that the marketing site
   * links to for "Log in" / "Start free". A deploy can override this at runtime
   * with NEXT_PUBLIC_APP_URL without touching the brand config.
   */
  appUrl: string;
  /** Support/contact email surfaced in the footer and fallbacks. */
  supportEmail: string;
  /** Parent-company endorsement line, e.g. "a Vantrow company". */
  endorsement: string;
  /** Parent company name — machine-readable linkage (JSON-LD parentOrganization). */
  parentName: string;
  /** Parent company URL — the endorsement line links here wherever rendered. */
  parentUrl: string;
  /** Light is the default; dark is required so theme support is never bolted on. */
  colors: {
    light: BrandPalette;
    dark: BrandPalette;
  };
  /** CSS font-family stacks (system-stack placeholders until Gate 2 picks type). */
  typography: {
    sans: string;
    display: string;
    mono: string;
  };
  /** Corner radii used by buttons/cards/inputs. */
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  /** Base spacing unit; component spacing derives as multiples. */
  spacingUnit: string;
  /** Wordmark asset paths within packages/brand/assets (null until Gate 2). */
  logo: {
    wordmark: string | null;
    wordmarkDark: string | null;
  };
}

export const brand: BrandConfig = {
  name: "__BRAND__",
  legalName: "__BRAND__, Inc.",
  tagline: "Sales outreach that runs itself",
  description:
    "__BRAND__ is the AI-native sales-engagement platform: sequences, tasks, and outreach your whole team can actually use — with transparent pricing.",
  domain: "example.com",
  appUrl: "https://app.example.com",
  supportEmail: "founder@example.com",
  endorsement: "a Vantrow company",
  parentName: "Vantrow",
  parentUrl: "https://getvantrow.com",
  colors: {
    // Placeholder neutral palette, AA-contrast on both schemes. The real
    // identity is chosen at Gate 2 and applied here in the same commit that
    // records the gate decision (no token drift — Eaverow lesson).
    light: {
      primary: "#1f3a5f",
      primaryDark: "#12233c",
      accent: "#b45309",
      background: "#f8fafc",
      foreground: "#0f172a",
      muted: "#64748b",
    },
    dark: {
      primary: "#7ea4d4",
      primaryDark: "#a9c4e4",
      accent: "#d97706",
      background: "#0b1220",
      foreground: "#e2e8f0",
      muted: "#94a3b8",
    },
  },
  typography: {
    sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    display: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
  radius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
  },
  spacingUnit: "0.25rem",
  logo: {
    wordmark: null,
    wordmarkDark: null,
  },
};

function paletteVars(p: BrandPalette): string {
  return [
    `--brand-primary:${p.primary};`,
    `--brand-primary-dark:${p.primaryDark};`,
    `--brand-accent:${p.accent};`,
    `--brand-background:${p.background};`,
    `--brand-foreground:${p.foreground};`,
    `--brand-muted:${p.muted};`,
  ].join("");
}

/**
 * Serializes a BrandConfig as CSS custom-property blocks, ready to be injected
 * via a <style> tag in an app's root layout. Emits the light palette (plus
 * typography/shape tokens) on `:root` and the dark palette on
 * `:root[data-theme="dark"]` — the app owns how `data-theme` gets set.
 */
export function brandCssVars(b: BrandConfig): string {
  const shared = [
    `--brand-font-sans:${b.typography.sans};`,
    `--brand-font-display:${b.typography.display};`,
    `--brand-font-mono:${b.typography.mono};`,
    `--brand-radius-sm:${b.radius.sm};`,
    `--brand-radius-md:${b.radius.md};`,
    `--brand-radius-lg:${b.radius.lg};`,
    `--brand-spacing-unit:${b.spacingUnit};`,
  ].join("");
  return [
    ":root{",
    paletteVars(b.colors.light),
    shared,
    "}",
    ':root[data-theme="dark"]{',
    paletteVars(b.colors.dark),
    "}",
  ].join("");
}
