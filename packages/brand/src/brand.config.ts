/**
 * Single source of truth for all brand identity used by every app in this repo.
 *
 * The apps are 100% brand-agnostic: every brand string, color, font, and
 * domain they render comes from this package. To rebrand, edit this file only.
 *
 * Identity applied at Gate 2 (2026-08-06, decision log): Nudgerow /
 * nudgerow.com. Color/typography identity is interim until the Phase 2 design
 * pass. The launch checklist greps apps+packages for the unbranded placeholder
 * sentinels (see the launch runbook) to prove none survives to production.
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
  /**
   * Semantic colors — every founder base color holds a product job (palette
   * round 2 rule, decision log 2026-08-07). Constant across schemes; in-app
   * components may derive lifted variants for dark grounds.
   */
  semantic: {
    /** Bounces, failures, urgent cracks. */
    alert: string;
    /** Replies, delivered, warmed-up. */
    success: string;
    /** Neutral/info states, empty states, secondary charts. */
    info: string;
    /** Selection + the cracked-prospect flag — the signature gesture. */
    highlight: string;
  };
  /**
   * The Vantrow family thread: the camel that colors the "row" in every
   * subsidiary wordmark and the endorsement tick (sourced from the parent
   * mark, getvantrow.com).
   */
  rowThread: string;
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
  name: "Nudgerow",
  // Entity formation is deferred (founder decision 2026-08-07) — no "Inc."
  // exists yet, so the legal name is the plain brand name until an entity is
  // formed; the copyright line and legal pages render this truthfully.
  legalName: "Nudgerow",
  tagline: "Sales outreach that runs itself",
  description:
    "Nudgerow is the AI-native sales-engagement platform: sequences, tasks, and outreach your whole team can actually use — with transparent pricing.",
  domain: "nudgerow.com",
  appUrl: "https://app.nudgerow.com",
  supportEmail: "andrew@nudgerow.com",
  endorsement: "a Vantrow company",
  parentName: "Vantrow",
  parentUrl: "https://getvantrow.com",
  colors: {
    // "Clarity Ink" — palette F, chosen by Andrew 2026-08-07 (decision log;
    // specimens in docs/brand/palette-preview.html). Violet-gray ink on
    // yellow-cast cream; the clarity yellow is the signature highlight and
    // takes the wordmark after dark.
    light: {
      primary: "#4A4952",
      primaryDark: "#201F24",
      accent: "#F3DD6D",
      background: "#FDFBF2",
      foreground: "#201F24",
      muted: "#7E7D81",
    },
    dark: {
      primary: "#F3DD6D",
      primaryDark: "#F7E794",
      accent: "#7DA1C4",
      background: "#16151A",
      foreground: "#EFEDE6",
      muted: "#9B99A3",
    },
  },
  semantic: {
    alert: "#E10600",
    success: "#006D46",
    info: "#7DA1C4",
    highlight: "#F3DD6D",
  },
  rowThread: "#B8956A",
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
    `--brand-alert:${b.semantic.alert};`,
    `--brand-success:${b.semantic.success};`,
    `--brand-info:${b.semantic.info};`,
    `--brand-highlight:${b.semantic.highlight};`,
    `--brand-row-thread:${b.rowThread};`,
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
