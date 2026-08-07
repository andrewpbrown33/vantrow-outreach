/**
 * Centralized route paths and nav labels.
 *
 * Brand policy: no competitor is named anywhere on the site (founder decision
 * 2026-08-07 — the comparison page was removed pre-launch; the claims
 * machinery in docs/legal + @vantrow/growth stands ready if comparative
 * content ever returns, and the site-copy lint enforces the absence
 * meanwhile).
 *
 * There is no product app yet (pre-launch), so unlike subsidiary #1 this file
 * exports no appLinks — the primary CTA everywhere is /early-access. Add the
 * app origin (brand.appUrl + NEXT_PUBLIC_APP_URL override) when the platform
 * ships.
 */

export const routes = {
  home: "/",
  product: "/product",
  pricing: "/pricing",
  about: "/about",
  earlyAccess: "/early-access",
  privacy: "/privacy",
  terms: "/terms",
} as const;

export interface NavLink {
  href: string;
  label: string;
}

/** Primary navigation shown in the header. */
export const primaryNav: NavLink[] = [
  { href: routes.product, label: "Product" },
  { href: routes.pricing, label: "Pricing" },
  { href: routes.about, label: "About" },
];

/** Full navigation shown in the footer. */
export const footerNav: NavLink[] = [
  ...primaryNav,
  { href: routes.earlyAccess, label: "Early access" },
  { href: routes.privacy, label: "Privacy" },
  { href: routes.terms, label: "Terms" },
];
