/** Deterministic legal/claims lint for generated marketing content.
 *
 *  Forked from Eaverow (subsidiary #1) and re-aimed at the sales-engagement
 *  field. Encodes the operative rules of
 *  docs/legal/comparative-advertising-checklist.md and
 *  docs/legal/clean-room-protocol.md §5/§7/§10 as code, so every draft is
 *  checked the same way every time. Pure data + regex — no imports, safe
 *  anywhere.
 *
 *  This lint does not replace the human gate (publishing is draft → approval
 *  by design); it makes the human review reliable:
 *    - "block" findings stop the approve action until fixed;
 *    - "warn" findings are surfaced on the review screen for judgment.
 *
 *  Field-specific hazard this fork handles: "outreach" is a generic English
 *  word AND our product category, so the incumbent's mark is matched only via
 *  its domains (outreach.io / outreach.ai) or capitalized product-context
 *  usage — never the bare noun. False negatives here are acceptable; the
 *  human review catches them. False positives on every use of the word
 *  "outreach" would make the lint unusable.
 */

export type LintSeverity = "block" | "warn";

export type LintFinding = {
  severity: LintSeverity;
  code: string;
  message: string;
  /** Short excerpt around the match, for the review UI. */
  excerpt?: string;
};

export type LegalLintResult = {
  findings: LintFinding[];
  mentionsCompetitor: boolean;
  competitors: string[];
  hasDisclaimer: boolean;
  hasAsOfDate: boolean;
  /** True when nothing at "block" severity was found. */
  approvable: boolean;
};

/** Competitor marks we may reference nominatively (plain text only).
 *  Generic-word marks (Outreach, Apollo, Groove, Artisan, 11x) are
 *  context-gated to avoid flagging ordinary English. */
const COMPETITORS: { name: string; re: RegExp }[] = [
  {
    name: "Outreach",
    // Domains always count; the bare word only with a capital O in
    // product-ish context or an explicit comparison ("vs Outreach").
    re: /\b[Oo]utreach\.(io|ai)\b|\bOutreach(?:'s)?\b(?=[^.!?]{0,80}(platform|sequences?|kaia|commit|dialer|pricing|per[- ]seat|sales engagement|customers?))|\b(?:vs\.?|versus|than|leaving|from)\s+Outreach\b/,
  },
  { name: "Salesloft", re: /sales\s?loft/i },
  {
    name: "Apollo",
    re: /\bapollo\.io\b|\bApollo(?:'s)?\b(?=[^.!?]{0,80}(sales|sequenc|prospect|enrich|data|engag|pricing|free tier))/i,
  },
  { name: "HubSpot", re: /hub\s?spot/i },
  { name: "Salesforce", re: /sales\s?force\b/i },
  { name: "Reply.io", re: /\breply\.io\b/i },
  { name: "lemlist", re: /\blemlist\b/i },
  { name: "Amplemarket", re: /\bamplemarket\b/i },
  { name: "Clari", re: /\bclari\b/i },
  { name: "Groove", re: /\bgroove\b(?=[^.!?]{0,60}(sales|clari|crm|engagement))/i },
  { name: "Regie", re: /\bregie(\.ai)?\b/i },
  { name: "11x", re: /\b11x\b(?!\s*(faster|better|more|growth|improvement|return))/i },
  { name: "Artisan", re: /\bartisan\b(?=[^.!?]{0,60}(ai|sdr|sales|agent))/i },
  { name: "Instantly", re: /\binstantly\.ai\b/i },
  // Founder-flagged direct competitor (2026-08-07): AI dialer/engagement
  // platform actively marketing an "Outreach alternative". Generic word
  // ("breakfast nooks") — context-gated like Outreach/Apollo.
  { name: "Nooks", re: /\bnooks\.ai\b|\bNooks\b(?=[^.!?]{0,60}(dialer|sales|ai|outreach|alternative|platform|pricing))/i },
];

/** The disclaimer the checklist requires verbatim on anything naming a
 *  competitor. */
export function requiredDisclaimer(competitor: string, brandName: string): string {
  return `${competitor} is a trademark of its owner. ${brandName} is not affiliated with or endorsed by ${competitor}.`;
}

/** "as of 2026-08-05" / "As of August 2026" — the dated-claims requirement. */
const AS_OF_RE = /\bas of\s+(\d{4}-\d{2}-\d{2}|(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i;

function excerptAround(text: string, index: number, span = 90): string {
  const from = Math.max(0, index - span / 2);
  return text.slice(from, from + span).replace(/\s+/g, " ").trim();
}

/** Sentence-level scan: a competitor name and a claim pattern in the same
 *  sentence. Crude by design — false positives go to human review, which is
 *  exactly where we want the tie broken. */
function sentencesWith(text: string, re: RegExp): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => re.test(s));
}

/** Banned claim patterns when applied to a competitor. Default severity is
 *  "block"; entries whose truth can change (contract terms) are "warn" so a
 *  properly dated, sourced sentence survives human review. */
const BANNED_NEAR_COMPETITOR: {
  code: string;
  message: string;
  re: RegExp;
  severity?: LintSeverity;
}[] = [
  {
    code: "no-ai-claim",
    message:
      'Never claim a competitor "has no AI" — Outreach leads with agentic AI; differentiate on architecture and workflow, not AI\'s presence.',
    re: /\b(no|zero|without( any)?|lacks?|doesn'?t have( any)?)\s+(real\s+)?ai\b/i,
  },
  {
    code: "ease-characterization",
    message:
      'Never characterize a competitor as "hard/clunky to use" in our own voice. Reviews do report a steep learning curve — quote them: "customers report…" with a dated citation.',
    re: /\b(hard|difficult|painful|clunky|confusing)\s+to\s+use\b|\btoo\s+complicated\b/i,
  },
  {
    code: "price-as-fact",
    message:
      "Never state a competitor's price as fact — Outreach's pricing is quote-based and unpublished. Use \"customers report…\" with a dated citation, or omit.",
    re: /\$\s?\d[\d,]*(\.\d+)?\s*(\/|per\s+)?(user|seat|month|mo\b|year|yr\b)?/i,
  },
  {
    code: "savings-percentage",
    message:
      'No TCO/percentage-savings claims ("save 40% vs …") — the underlying competitor pricing is unverifiable.',
    re: /\b(save|savings? of|cheaper by|cut(s)? costs? by)\s+(up to\s+)?\d{1,3}\s?%|\b\d{1,3}\s?%\s+(cheaper|less expensive|savings)/i,
  },
  {
    code: "contract-terms-as-fact",
    message:
      'State competitor contract terms (annual-only, seat minimums) only as dated, sourced reports — "as of <date>, Outreach lists…" — never as timeless fact; terms change.',
    re: /\b(requires?|forces?|only offers?)\s+(an?\s+)?(annual|multi-year)\s+contracts?\b|\bseat minimums?\b/i,
    severity: "warn",
  },
  {
    code: "disparagement",
    message:
      "No disparagement — compare capabilities, never characterize the company, its people, or motives.",
    re: /\b(scam|rip-?off|dishonest|greedy|predatory|nickel[- ]and[- ]dim\w*)\b/i,
  },
];

/** Patterns banned in ANY publishable content, competitor mention or not. */
const BANNED_ALWAYS: { code: string; message: string; re: RegExp }[] = [
  {
    code: "ship-gate-unresolved",
    message:
      "Unresolved [SHIP-GATE] flag — the claim it marks requires a live capability or attached evidence before publishing (comparative-advertising checklist).",
    re: /\[SHIP-GATE[^\]]*\]/i,
  },
  {
    code: "deliverability-promise",
    message:
      'Never promise deliverability ("lands in the inbox", "never spam", "99% deliverability") — inbox placement is not ours to guarantee and the claim is unverifiable.',
    re: /\b(guarantee[sd]?|ensure[sd]?|always)\b[^.!?]{0,50}\b(inbox|deliver)|\bnever\s+(hits?|lands?\s+in)\s+spam\b|\b\d{2,3}(\.\d+)?\s?%\s+deliverability\b/i,
  },
];

/** Unshipped product claims: features that must not be described as shipping
 *  until they ship. Warn-level — tense detection is unreliable, so a human
 *  confirms framing ("built AI-native" is fine; "the AI writes your emails
 *  for you" is not, yet). Update this ledger as gates close and features ship. */
const UNSHIPPED_FEATURE_PATTERNS: { code: string; message: string; re: RegExp }[] = [
  {
    code: "unshipped-ai-does-work",
    message:
      'Mentions an AI "does-the-work" feature (drafts/personalizes emails, classifies replies, researches prospects, books meetings). Not v1 line items — verify the framing is architectural ("built AI-native"), not a shipping claim.',
    re: /\bai\b[^.!?]{0,80}\b(draft|write|writ|personaliz|classif|research|books?|generat)/i,
  },
  {
    code: "unshipped-crm-sync",
    message:
      'Mentions CRM sync (Salesforce, HubSpot, Affinity, Dynamics). No native sync has shipped — describe as "designed to integrate with" / "planned", or omit (protocol §8).',
    re: /\b(salesforce|hubspot|affinity|dynamics)\b[^.!?]{0,60}\b(sync|integrat)|\b(two[- ]way|bi[- ]?directional)\s+(crm\s+)?sync\b/i,
  },
  {
    code: "unshipped-dialer",
    message:
      "Mentions calling/dialer capability (click-to-call, local presence, voicemail drop). Telephony is a post-MVP gate — do not imply it ships.",
    re: /\b(dialer|click[- ]to[- ]call|local presence|voicemail drop|power dial)/i,
  },
  {
    code: "unshipped-meetings",
    message:
      "Mentions scheduling/booking capability (booking pages, round-robin). Meetings are a fast-follow, not v1 — verify framing.",
    re: /\b(booking (pages?|links?)|round[- ]robin|scheduling links?)\b/i,
  },
];

/** Hype vocabulary the voice rules prohibit (warn — sometimes quoted text). */
// Note: `revolutionar\w*` (not `revolutionar`) — the fork found and fixed a
// word-boundary bug in the Eaverow original, where `revolutionar\b` could
// never match "revolutionary". Same fix applied to nickel-and-dime above.
const HYPE_RE = /\b(revolutionar\w*|game-?chang(er|ing)|10x|cutting[- ]edge|next[- ]gen(eration)?|breakthrough)\b/i;

export function legalLint(input: {
  /** Full markdown body (title/excerpt/meta may be appended by the caller). */
  text: string;
  brandName: string;
}): LegalLintResult {
  const { text, brandName } = input;
  const findings: LintFinding[] = [];

  const competitors = COMPETITORS.filter((c) => c.re.test(text)).map((c) => c.name);
  const mentionsCompetitor = competitors.length > 0;
  const hasAsOfDate = AS_OF_RE.test(text);

  let hasDisclaimer = true;
  if (mentionsCompetitor) {
    for (const name of competitors) {
      const disclaimer = requiredDisclaimer(name, brandName);
      // Tolerate whitespace/markdown differences but keep the wording exact.
      const normalized = (s: string) => s.replace(/[\s*_>]+/g, " ").trim().toLowerCase();
      if (!normalized(text).includes(normalized(disclaimer))) {
        hasDisclaimer = false;
        findings.push({
          severity: "block",
          code: "missing-disclaimer",
          message: `Names ${name} but is missing the required disclaimer: "${disclaimer}"`,
        });
      }
    }

    if (!hasAsOfDate) {
      findings.push({
        severity: "block",
        code: "missing-as-of-date",
        message:
          'Comparative claims must be dated ("as of <date>") and re-verified every 90 days — no "as of" date found.',
      });
    }

    for (const { code, message, re, severity } of BANNED_NEAR_COMPETITOR) {
      for (const competitor of COMPETITORS.filter((c) => competitors.includes(c.name))) {
        for (const sentence of sentencesWith(text, competitor.re)) {
          const m = sentence.match(re);
          if (m) {
            findings.push({
              severity: severity ?? "block",
              code,
              message,
              excerpt: excerptAround(sentence, m.index ?? 0),
            });
          }
        }
      }
    }
  }

  for (const { code, message, re } of BANNED_ALWAYS) {
    const m = text.match(re);
    if (m) {
      findings.push({
        severity: "block",
        code,
        message,
        excerpt: excerptAround(text, m.index ?? 0),
      });
    }
  }

  for (const { code, message, re } of UNSHIPPED_FEATURE_PATTERNS) {
    const m = text.match(re);
    if (m) {
      findings.push({
        severity: "warn",
        code,
        message,
        excerpt: excerptAround(text, m.index ?? 0),
      });
    }
  }

  const hype = text.match(HYPE_RE);
  if (hype) {
    findings.push({
      severity: "warn",
      code: "hype-vocabulary",
      message: "Voice rule: no hype (\"revolutionary\", \"10x\", \"game-changer\"). Plain, specific, dated.",
      excerpt: excerptAround(text, hype.index ?? 0),
    });
  }

  // Dedupe identical findings (same code + excerpt).
  const seen = new Set<string>();
  const deduped = findings.filter((f) => {
    const key = `${f.code}|${f.excerpt ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    findings: deduped,
    mentionsCompetitor,
    competitors,
    hasDisclaimer: mentionsCompetitor ? hasDisclaimer : true,
    hasAsOfDate,
    approvable: !deduped.some((f) => f.severity === "block"),
  };
}
