import { brand } from "@vantrow/brand";

/** Pure JSON-LD node builders for the public site. Answer engines read these
 *  alongside the visible HTML — keep them truthful to what's on the page.
 *  Rendered via <script type="application/ld+json"> in the root layout.
 *
 *  Honesty rail: nothing here may claim unshipped features or pricing that
 *  isn't public. The SoftwareApplication node deliberately carries NO offers —
 *  there is no public price list yet (pre-launch; /pricing publishes the
 *  commitment, not numbers). Add offers in the same change that puts real
 *  numbers on /pricing: answer engines punish schema/page mismatches.
 */

export const SITE = `https://${brand.domain}`;
const ORG_ID = `${SITE}/#organization`;
const SITE_ID = `${SITE}/#website`;
const APP_ID = `${SITE}/#software`;
const OG_IMAGE = `${SITE}/opengraph-image`;

export type JsonLd = Record<string, unknown>;

/** The Organization entity. `sameAs` (public-profile links for Knowledge-Graph
 *  and LLM disambiguation) grows as brand accounts go live — empty is fine
 *  pre-launch. The parent tie is machine-readable via parentOrganization and
 *  comes from the brand config, never a literal. */
export function organizationNode(sameAs: string[] = []): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: brand.name,
    legalName: brand.legalName,
    url: SITE,
    logo: { "@type": "ImageObject", url: OG_IMAGE },
    description: brand.description,
    email: brand.supportEmail,
    parentOrganization: {
      "@type": "Organization",
      name: brand.parentName,
      url: brand.parentUrl,
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function webSiteNode(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: brand.name,
    url: SITE,
    publisher: { "@id": ORG_ID },
  };
}

/** The product entity — WITHOUT offers, on purpose (see honesty rail above). */
export function softwareApplicationNode(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: brand.name,
    url: SITE,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: brand.description,
    publisher: { "@id": ORG_ID },
  };
}

/** Serialize a node list for a <script type="application/ld+json"> block. */
export function jsonLdScript(nodes: (JsonLd | null)[]): string {
  const list = nodes.filter(Boolean);
  return JSON.stringify(list.length === 1 ? list[0] : list);
}
