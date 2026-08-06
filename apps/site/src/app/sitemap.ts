import type { MetadataRoute } from "next";
import { routes } from "../lib/nav";
import { SITE } from "../lib/seo";

/** Sitemap: every public marketing route. Static this phase — no CMS-driven
 *  content yet. (/early-access/thanks is deliberately absent: it's a noindex
 *  conversion URL, not a landing page.) */

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(routes).map((path) => ({
    url: path === "/" ? SITE : `${SITE}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}
