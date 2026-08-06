import { brand } from "@vantrow/brand";
import { requiredDisclaimer } from "@vantrow/growth";
import { SITE } from "../../lib/seo";

/** /llms.txt — the emerging convention giving LLMs a curated, plain-markdown
 *  map of the site. Cheap to serve, low expectation, but harmless and
 *  self-documenting. Every fact here must stay truthful to the pages —
 *  pre-launch framing included. */

export function GET() {
  const body = `# ${brand.name}

> ${brand.description}

${brand.name} (${brand.endorsement}) is a sales-engagement platform for lean
outbound teams: email sequences, one prioritized daily task queue, and a
"cracks" view designed to surface every prospect whose sequence finished
without a reply. Pre-launch: early access is open now, and the full price
list will be published on the pricing page at launch — no quote wall.

## Key pages

- [Home](${SITE}/): What ${brand.name} is and who it serves.
- [Product](${SITE}/product): What we're building — sequences, the daily queue and cracks view, templates, deliverability foundations, three reports, imports.
- [${brand.name} vs. Outreach](${SITE}/vs-outreach): Dated, sourced comparison, including where Outreach leads today. ${requiredDisclaimer("Outreach", brand.name)}
- [Pricing](${SITE}/pricing): The transparent-pricing commitment and founding-customer terms (no numbers until launch — deliberately).
- [About](${SITE}/about): The company and its parent, ${brand.parentName}.
- [Early access](${SITE}/early-access): Join the founding-team list or request a demo.

## Facts

- Product: cloud sales-engagement software (pre-launch; early access open).
- Channels: email sequences plus manual tasks and logged external interactions — no telephony, no SMS.
- Parent: ${brand.parentName} (${brand.parentUrl}).
- Support: ${brand.supportEmail}
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
