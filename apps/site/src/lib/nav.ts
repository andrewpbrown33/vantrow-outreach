/**
 * Centralized route paths and nav labels.
 *
 * Note on brand policy: the competitor name "Outreach" appears here only as
 * the nominative label/path for the comparison page, and nowhere else in the
 * site outside that page (docs/legal/comparative-advertising-checklist.md;
 * family precedent: subsidiary #1's nav.ts). Everywhere else, links to the
 * comparison use neutral text such as "How we compare".
 *
 * There is no product app yet (pre-launch), so unlike subsidiary #1 this file
 * exports no appLinks — the primary CTA everywhere is /early-access. Add the
 * app origin (brand.appUrl + NEXT_PUBLIC_APP_URL override) when the platform
 * ships.
 */

export const routes = {
  home: "/",
  product: "/product",
  compare: "/vs-outreach",
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
  { href: routes.compare, label: "vs. Outreach" },
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
