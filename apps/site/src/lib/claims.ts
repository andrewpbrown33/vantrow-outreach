import { brand } from "@vantrow/brand";
import { requiredDisclaimer } from "@vantrow/growth";

/**
 * /vs-outreach content — the single source of truth.
 *
 * Every user-visible comparative claim on the /vs-outreach page lives in this
 * file and nowhere else, so the claims test (claims.test.ts) can run
 * @vantrow/growth legalLint over exactly what the page renders. The page
 * imports these exports and renders them verbatim.
 *
 * Sourcing rules (docs/legal/comparative-advertising-checklist.md):
 *  - every row is footnoted to S-IDs from docs/research/outreach/07|08|12,
 *    each of which resolves to a public URL + access date in the sources log;
 *  - pricing and learning-curve claims are hedged ("customers report…",
 *    third-party attribution with dates) — never stated as timeless fact,
 *    and never in our own voice;
 *  - the table carries >=2 honest concession rows, the verbatim trademark
 *    disclaimer, and an "as of" date; the competitor mark is nominative
 *    plain text only (no logo, no screenshots, no stylized rendering);
 *  - our own column is design-commitment framing throughout: the product is
 *    pre-launch, so nothing reads as a shipped-feature claim.
 *
 * Rows considered and DROPPED (checklist: "rows considered and dropped"):
 *  - Contract mechanics / auto-renewal & cancellation windows: evidence is
 *    snippet-grade Trustpilot [S-REV-008] that doc 08 §6 says must be
 *    re-verified against the live page before public use. Dropped, not
 *    weakened.
 *  - Browser-extension instability (3.0/5, n=71 [S-REV-007]): strong
 *    evidence, but we ship no comparable surface, so the row would read as a
 *    jab rather than a comparison. Dropped.
 *  - The "don't edit a live sequence" footgun: not re-verified from any
 *    public source this pass (doc 08 Unknowns). Internal-only until sourced.
 *  - Seat minimums / no free trial as a standalone row: practitioner-reported
 *    only, official page silent [S-DIF-016]; the contract-norms context that
 *    IS multi-sourced appears inside the team-size row, hedged and dated.
 */

/** The date every comparative claim on the page is pinned to. Re-verify and
 *  bump within 90 days of publication (checklist "Current" rule). */
export const COMPARE_AS_OF = "2026-08-06";

/** Nominative page title (metadata + h1 suffix). */
export const compareTitle = "vs. Outreach";

export const compareIntro = `A capability-by-capability look at how ${brand.name} and Outreach approach the same job — factual, dated, and sourced, including where Outreach is genuinely ahead of us today. One thing to know up front: ${brand.name} is pre-launch, so our column describes design commitments, not shipped software, and we say so plainly.`;

export const compareNote = `Comparison based on publicly available information and customer reviews as of ${COMPARE_AS_OF}. Outreach ships updates frequently; every claim here is dated, sourced to our research log, and re-verified before republication (at least every 90 days).`;

/** Verbatim trademark disclaimer required by the checklist — built by the
 *  same helper the lint enforces with, so wording can never drift. */
export const disclaimer = requiredDisclaimer("Outreach", brand.name);

/** Label rendered on rows where the incumbent is genuinely ahead. */
export const concededLabel = "Outreach leads here today";

export interface CompareRow {
  capability: string;
  /** Our column — design-commitment framing, no shipped claims. */
  us: string;
  /** Their column — sourced, dated, hedged. */
  them: string;
  /** Footnote number keyed to compareSources below. */
  note: number;
  /** True where the row concedes the incumbent is ahead today. */
  conceded?: boolean;
}

export const compareRows: CompareRow[] = [
  {
    capability: "Pricing transparency",
    us: "Our commitment: the full price list goes on our public pricing page at launch — no quote wall, no call required to learn a number. We're pre-launch today, and we won't publish invented placeholder numbers in the meantime.",
    them: 'Publishes tier names, AI-credit allotments, and feature lists, but no prices — the official pricing page\'s only path is a "Request pricing" form (verified 2026-08-06). For scale, buyer-side data helps: Vendr\'s contract dataset (updated Feb 2026; 545 deals analyzed) reports a median annual contract of $45,540, and 2026 practitioner estimates cluster around $100–$160 per user per month. Those are third-party reported figures, not published list prices.',
    note: 1,
  },
  {
    capability: "Learning curve",
    us: "Built to be small enough to learn in a day: sequences, one queue, three reports, no admin role in the design. That is a stated goal, not a measured result — we'll publish real onboarding numbers once early-access teams generate them, not before.",
    them: 'Powerful and dense, per its own customers — we quote them rather than characterize the product ourselves. "Sometimes Outreach can be a little bit complicated and all of the bells and whistles can be overwhelming" (SDR, Capterra, Aug 2025). "The tool is so complex it can be difficult to master at first. It will take about 2-3 months of daily use to master" (enterprise SDR, Capterra, Apr 2018). On TrustRadius, 39% of reviewers describe the UI as complex or outdated (n=18 disclosed).',
    note: 2,
  },
  {
    capability: "When a sequence ends with no reply",
    us: "The \"cracks\" view is the center of our design: prospects whose sequences finished without a reply, and enrollments that stalled, surface in the daily queue until a human decides what happens next. It was our first customer's top requirement, and we're building the product around it.",
    them: 'Sequence states and reporting cover finished sequences, and automation power is the platform\'s most-praised strength in reviews. On the analytics side, customers report a setup cost: "Requires significant setup and customization for meaningful analytics" (AWS Marketplace listing of the G2 review corpus, Jun 2026), and 22% of TrustRadius reviewers flag reporting/analytics as needing improvement (n=18 disclosed).',
    note: 3,
  },
  {
    capability: "AI: architecture and cost model",
    us: "Designed AI-native from the first schema: AI as a default authoring path with review-before-send, and a stated intent to include AI in the seat price rather than meter it with separate credits. Until those capabilities ship, we describe them as design — not as product.",
    them: 'Ships real, agentic AI and has for years: named agents across the platform, an Agent Studio, and monthly release notes showing AI features reaching general availability through July 2026 — its AI Sales Agents line earned one of six 2026 TrustRadius Top Rated awards. AI usage is metered: Amplify tiers bundle 10,000–100,000 AI credits, a credit covers "a specific AI-powered task," and additional packs are sold separately (per the official pricing page, 2026-08-06).',
    note: 4,
  },
  {
    capability: "Fit for small teams",
    us: "Aimed squarely at 2–30-seat teams and agencies: no admin role in the design, a deliberately small surface, and the transparent-pricing commitment above. If your team has a revenue-operations department, the incumbent's depth may genuinely serve you better — see the concessions below.",
    them: "Positioned for scale: third-party buying guides typically place it with larger, admin-supported teams (one 2026 guide suggests 150+ reps), buyer-side sources log implementation services at $5,000–$25,000+ (Vendr, Feb 2026; practitioner guides, 2026), and those same sources consistently report annual contracts with no free trial. The official pricing page shows a request-pricing path only (verified 2026-08-06).",
    note: 5,
  },
  {
    capability: "Breadth of platform",
    us: "Deliberately narrow: email sequences, a task queue, templates, three reports, CSV import. No built-in calling, no conversation intelligence, no forecasting, no mobile apps. If you need that breadth today, we are honestly not your tool yet.",
    them: "A genuinely broad revenue platform: built-in calling, conversation intelligence, meeting workflows, deal management, forecasting, governance controls, mobile apps, a large AI-agent roster, and deep, long-standing CRM integration that its own reviewers praise. This breadth is real, and a v1 product does not match it.",
    note: 6,
    conceded: true,
  },
  {
    capability: "Track record",
    us: "Pre-launch: zero customers to cite, zero reviews, zero awards. Founding teams are betting on a design and on us — which is exactly why founding terms exist.",
    them: "Roughly 3,550 reviews averaging 4.3/5 on the largest review platform (93% at 4–5 stars), 4.4/5 on Capterra, six 2026 TrustRadius Top Rated awards, and years of enterprise deployments. New entrants — us included — have to earn what that represents.",
    note: 7,
    conceded: true,
  },
];

export interface CompareSource {
  note: number;
  text: string;
}

/** Footnotes. S-IDs point into the clean-room research log
 *  (docs/research/outreach/), where each resolves to a public URL and access
 *  date; re-verified before republication. */
export const compareSources: CompareSource[] = [
  {
    note: 1,
    text: "Official pricing page, structure only, fetched 2026-08-06 [S-PRC-001] [S-DIF-012]; Vendr contract dataset, updated Feb 2026 [S-PRC-002] [S-DIF-013]; third-party per-seat estimates, Apr–Jun 2026 [S-PRC-003] [S-PRC-004] [S-PRC-006].",
  },
  {
    note: 2,
    text: "Capterra reviews, fetched 2026-08-06 [S-REV-003] [S-REV-005]; TrustRadius insights, sample size disclosed (n=18) [S-REV-006]; G2 sub-scores context [S-REV-010].",
  },
  {
    note: 3,
    text: "AWS Marketplace mirror of the G2 review corpus, fetched 2026-08-06 [S-REV-002]; TrustRadius insights (n=18) [S-REV-006]; automation-power praise themes [S-REV-005] [S-REV-006].",
  },
  {
    note: 4,
    text: "AI release/GA timeline 2020–2026 [S-DIF-004] [S-DIF-006] [S-DIF-007] [S-DIF-009] [S-DIF-011]; AI-credit packaging on the official pricing page, fetched 2026-08-06 [S-PRC-001] [S-DIF-012]; TrustRadius 2026 Top Rated awards [S-DIF-014].",
  },
  {
    note: 5,
    text: "Third-party segment guidance, 2026 [S-REV-013]; implementation-fee reports [S-PRC-002] [S-PRC-003] [S-PRC-004]; contract-norm reports [S-PRC-003] [S-PRC-004] read with the official page's request-pricing posture [S-PRC-001].",
  },
  {
    note: 6,
    text: "Platform scope from official releases and materials [S-DIF-007] [S-DIF-009] [S-DIF-010]; CRM-integration praise in fetched reviews [S-REV-002] [S-REV-003].",
  },
  {
    note: 7,
    text: "Review volumes and score distributions [S-REV-001] [S-REV-002] [S-REV-003]; TrustRadius 2026 Top Rated awards [S-DIF-014].",
  },
];

export const compareSourcesPreamble = `References point to ${brand.name}'s internal clean-room research log for the sales-engagement category; every S-ID resolves to a public URL and access date there, re-verified before republication. Customer-review quotes are reproduced verbatim and attributed to their review platform.`;

/** Terminate a copy fragment so concatenation never merges two fragments into
 *  one "sentence" for the lint's sentence-level scan. */
function sentenceTerminate(s: string): string {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Assemble everything the /vs-outreach page renders into one lintable text,
 *  in render order. The claims test runs legalLint over this. */
export function assembleCompareCopy(): string {
  const parts: string[] = [
    `${brand.name} ${compareTitle}`,
    compareIntro,
    compareNote,
    ...compareRows.flatMap((row) => [
      row.capability,
      ...(row.conceded ? [concededLabel] : []),
      row.us,
      row.them,
    ]),
    compareSourcesPreamble,
    ...compareSources.map((s) => s.text),
    disclaimer,
  ];
  return parts.map(sentenceTerminate).join("\n");
}
