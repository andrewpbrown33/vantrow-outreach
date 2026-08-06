import { describe, expect, it } from "vitest";
import { legalLint, requiredDisclaimer } from "./legal-lint";

const BRAND = "Testrow";

function lint(text: string) {
  return legalLint({ text, brandName: BRAND });
}

describe("competitor detection — the generic-word hazard", () => {
  it("does NOT flag ordinary use of the word 'outreach'", () => {
    const r = lint(
      "Our outreach platform helps your team run thoughtful outreach at scale. Sales outreach should feel personal."
    );
    expect(r.mentionsCompetitor).toBe(false);
    expect(r.competitors).toEqual([]);
    expect(r.approvable).toBe(true);
  });

  it("flags outreach.io / outreach.ai domains", () => {
    expect(lint("Compare us with outreach.io today.").competitors).toContain("Outreach");
    expect(lint("They rebranded to outreach.ai recently.").competitors).toContain("Outreach");
  });

  it("flags capitalized Outreach in product context", () => {
    const r = lint("Outreach charges for its platform per seat, customers report.");
    expect(r.competitors).toContain("Outreach");
  });

  it("flags explicit comparisons (vs Outreach)", () => {
    expect(lint("Why teams switch vs Outreach").competitors).toContain("Outreach");
  });

  it("does not flag 11x used as a multiplier, but flags 11x the company", () => {
    expect(lint("Our importer is 11x faster than before.").competitors).toEqual([]);
    expect(lint("Unlike 11x, we publish our pricing.").competitors).toContain("11x");
  });

  it("detects the rest of the field", () => {
    const r = lint("Salesloft and lemlist and apollo.io and hubspot all compete here.");
    expect(r.competitors).toEqual(
      expect.arrayContaining(["Salesloft", "lemlist", "Apollo", "HubSpot"])
    );
  });
});

describe("disclaimer and dating requirements", () => {
  it("blocks a competitor mention with no disclaimer and no as-of date", () => {
    const r = lint("Salesloft is our closest competitor.");
    expect(r.approvable).toBe(false);
    const codes = r.findings.map((f) => f.code);
    expect(codes).toContain("missing-disclaimer");
    expect(codes).toContain("missing-as-of-date");
  });

  it("approves a properly disclaimed, dated, factual mention", () => {
    const text = [
      "As of 2026-08-05, Salesloft lists three plan tiers on its website.",
      requiredDisclaimer("Salesloft", BRAND),
    ].join("\n\n");
    const r = lint(text);
    expect(r.hasDisclaimer).toBe(true);
    expect(r.hasAsOfDate).toBe(true);
    expect(r.approvable).toBe(true);
  });
});

describe("banned claims near a competitor", () => {
  const disclaimer = requiredDisclaimer("Outreach", BRAND);

  it("blocks stating a competitor price as fact", () => {
    const r = lint(
      `As of August 2026, Outreach pricing for its platform is $130 per seat. ${disclaimer}`
    );
    expect(r.findings.map((f) => f.code)).toContain("price-as-fact");
    expect(r.approvable).toBe(false);
  });

  it("blocks 'has no AI' claims", () => {
    const r = lint(
      `As of August 2026, Outreach sequences ship without any AI. ${disclaimer}`
    );
    expect(r.findings.map((f) => f.code)).toContain("no-ai-claim");
  });

  it("blocks disparagement", () => {
    const r = lint(
      `As of August 2026, Outreach pricing nickel-and-dimes customers. ${disclaimer}`
    );
    expect(r.findings.map((f) => f.code)).toContain("disparagement");
    expect(r.approvable).toBe(false);
  });

  it("warns (not blocks) on contract-term claims so a dated, sourced sentence survives review", () => {
    const r = lint(
      `As of 2026-08-05, customers report Outreach requires annual contracts for its platform. ${disclaimer}`
    );
    const finding = r.findings.find((f) => f.code === "contract-terms-as-fact");
    expect(finding?.severity).toBe("warn");
    expect(r.approvable).toBe(true);
  });
});

describe("always-banned patterns (no competitor needed)", () => {
  it("blocks unresolved [SHIP-GATE] flags", () => {
    const r = lint("We sync every reply to your CRM. [SHIP-GATE: CRM sync must be live]");
    expect(r.findings.map((f) => f.code)).toContain("ship-gate-unresolved");
    expect(r.approvable).toBe(false);
  });

  it("blocks deliverability promises", () => {
    for (const text of [
      "We guarantee your emails land in the inbox.",
      "Your mail never lands in spam.",
      "Enjoy 99% deliverability.",
    ]) {
      const r = lint(text);
      expect(r.findings.map((f) => f.code), text).toContain("deliverability-promise");
      expect(r.approvable, text).toBe(false);
    }
  });
});

describe("unshipped-feature warnings", () => {
  it("warns on AI does-the-work claims but stays approvable", () => {
    const r = lint("Our AI drafts every follow-up for you.");
    const finding = r.findings.find((f) => f.code === "unshipped-ai-does-work");
    expect(finding?.severity).toBe("warn");
    expect(r.approvable).toBe(true);
  });

  it("warns on CRM-sync and dialer claims", () => {
    const r = lint(
      "Two-way sync with Salesforce integration, plus click-to-call from any record."
    );
    const codes = r.findings.map((f) => f.code);
    expect(codes).toContain("unshipped-crm-sync");
    expect(codes).toContain("unshipped-dialer");
  });

  it("warns on hype vocabulary", () => {
    const r = lint("A revolutionary way to sell.");
    expect(r.findings.map((f) => f.code)).toContain("hype-vocabulary");
  });
});
