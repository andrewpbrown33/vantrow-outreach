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
   * Nudgerow's signal amber — the one warm value in the identity. It fills
   * the mark's ball on every ground and is available for small accents.
   *
   * It REPLACES `rowThread`, the Vantrow camel #B8956A (Andrew, 2026-10-04:
   * the shared camel is no longer a cross-brand thread). That retirement also
   * fixed a defect the old law was hiding — `assets/README.md` recorded camel
   * at 2.5:1 on the light ground and waved it through as "display-only".
   *
   * Not a graphical token for text on dark: see the arithmetic at the value.
   */
  signal: string;
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
    // Damson over Clarity Ink's violet-gray (Andrew, 2026-09-30, family-plan
    // D9): the structural colors now come from the family register so this app
    // sits beside its siblings on the getvantrow.com console, while the
    // clarity yellow accent — the part of palette F Andrew kept — stays.
    //
    // Sourced, not picked. getvantrow.com BRANDBOOK §6 gives Nudgerow three
    // tokens: damson #403243 (deep/primary), newsprint #CFCABE (thread), soft
    // #FAFAF7 (ground). Damson is engineered to the family OKLCH register
    // (L 0.340 · C 0.035, H 320) so no sibling reads louder than another.
    //
    // The two values the book does NOT give, derived with the arithmetic
    // recorded so it can be checked rather than trusted:
    //   primaryDark #1C151D — Eaverow's proportional method (decision log
    //     2026-08-25): the old #4A4952 → #201F24 channel ratios (0.4324,
    //     0.4247, 0.4390) applied to damson. 17.10:1 on soft.
    //   muted #6E6C77 — the old #7E7D81 measured 3.91:1 on this ground,
    //     failing AA for body text. This is an accessibility fix riding
    //     along, not a brand change: 4.93:1, and it is the same value the
    //     state palette already uses for `draft`.
    //
    // Contrast on the new ground, all computed: damson 11.44:1 · primaryDark
    // 17.10:1 · foreground 15.65:1 · muted 4.93:1 · accent 8.76:1 against
    // damson (ink on accent 11.98:1). The dark scheme is untouched — clarity
    // yellow is 13.30:1 on #16151A and remains the after-dark signature.
    light: {
      primary: "#403243",
      primaryDark: "#1C151D",
      accent: "#F3DD6D",
      background: "#FAFAF7",
      foreground: "#201F24",
      muted: "#6E6C77",
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
  // Signal amber: clarity yellow's OWN hue, taken to full saturation and
  // darkened until it clears the light ground. #F3DD6D is hue 50.1° at
  // saturation 0.551; holding hue (G/R = 50.1/60 = 0.8350) with B driven to 0
  // gives this ramp, and #887200 is the first rung that clears 4.5:1 on soft.
  //
  // Computed, not recalled — the ball sits on a ground in every cut, so each
  // cut is checked against ITS ground:
  //   on soft #FAFAF7          4.51:1  ✓ clears 4.5 text-grade
  //   on dark #16151A          3.85:1  ✓ clears the 3:1 graphical floor
  //   vs damson arcs (light)   2.54:1  — aesthetic only
  //   vs clarity-yellow (dark) 3.45:1  — aesthetic only
  //
  // Ball-vs-arc is deliberately NOT a floor here: a logo is exempt from WCAG
  // 1.4.11, and the real requirement is that each element reads against the
  // ground, which both do. How they separate differs by cut, and it is worth
  // being exact about it — on light, amber (hue 50.3°) sits 120.9° from damson
  // (289.4°), so hue does the work; on dark, amber and clarity yellow are the
  // SAME hue (50.3° vs 50.1°), so the only separation is value, 3.45:1, plus
  // the geometric gap. Forcing 3:1 on all four at once is arithmetically
  // impossible on this hue — checked rung by rung, no value clears all four.
  //
  // One value serves every cut, which is what the retired camel law promised
  // and did not deliver. It cannot ALSO carry text on dark, and that is a
  // proof, not an oversight: 4.5:1 vs soft needs luminance ≤ 0.1731 while
  // 4.5:1 vs dark needs ≥ 0.2102 — an empty window. Hence the wordmark is
  // single-tone and inherits the per-scheme `primary` instead.
  signal: "#887200",
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
    `--brand-signal:${b.signal};`,
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
