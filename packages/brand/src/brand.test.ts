import { describe, expect, it } from "vitest";
import { brand, brandCssVars, type BrandPalette } from "./brand.config";

const HEX = /^#[0-9a-fA-F]{6}$/;

function expectValidPalette(p: BrandPalette) {
  for (const [key, value] of Object.entries(p)) {
    expect(value, `palette color "${key}"`).toMatch(HEX);
  }
}

describe("brand config shape", () => {
  it("has no empty identity strings", () => {
    const identity = [
      brand.name,
      brand.legalName,
      brand.tagline,
      brand.description,
      brand.domain,
      brand.appUrl,
      brand.supportEmail,
      brand.endorsement,
      brand.parentName,
      brand.parentUrl,
    ];
    for (const value of identity) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it("carries parent linkage (Vantrow must be clickable everywhere)", () => {
    expect(brand.parentName).toBe("Vantrow");
    expect(() => new URL(brand.parentUrl)).not.toThrow();
  });

  it("appUrl is a valid URL", () => {
    expect(() => new URL(brand.appUrl)).not.toThrow();
  });

  it("has valid hex colors in BOTH light and dark palettes", () => {
    expectValidPalette(brand.colors.light);
    expectValidPalette(brand.colors.dark);
  });

  it("gives every founder color a semantic job and carries the row thread", () => {
    expect(brand.semantic.alert).toMatch(HEX);
    expect(brand.semantic.success).toMatch(HEX);
    expect(brand.semantic.info).toMatch(HEX);
    expect(brand.semantic.highlight).toMatch(HEX);
    // The family thread is the Vantrow camel, by definition.
    expect(brand.rowThread.toUpperCase()).toBe("#B8956A");
  });

  it("has non-empty typography, radius, and spacing tokens", () => {
    expect(brand.typography.sans.length).toBeGreaterThan(0);
    expect(brand.typography.display.length).toBeGreaterThan(0);
    expect(brand.typography.mono.length).toBeGreaterThan(0);
    expect(brand.radius.sm.length).toBeGreaterThan(0);
    expect(brand.radius.md.length).toBeGreaterThan(0);
    expect(brand.radius.lg.length).toBeGreaterThan(0);
    expect(brand.spacingUnit.length).toBeGreaterThan(0);
  });
});

describe("brandCssVars", () => {
  it("emits light palette on :root and dark palette on the data-theme block", () => {
    const css = brandCssVars(brand);
    expect(css).toContain(`:root{--brand-primary:${brand.colors.light.primary};`);
    expect(css).toContain(':root[data-theme="dark"]{');
    expect(css).toContain(`--brand-primary:${brand.colors.dark.primary};`);
  });

  it("emits typography and shape tokens", () => {
    const css = brandCssVars(brand);
    expect(css).toContain("--brand-font-sans:");
    expect(css).toContain("--brand-radius-md:");
    expect(css).toContain("--brand-spacing-unit:");
  });

  it("emits semantic and row-thread tokens", () => {
    const css = brandCssVars(brand);
    expect(css).toContain(`--brand-alert:${brand.semantic.alert};`);
    expect(css).toContain(`--brand-success:${brand.semantic.success};`);
    expect(css).toContain(`--brand-highlight:${brand.semantic.highlight};`);
    expect(css).toContain(`--brand-row-thread:${brand.rowThread};`);
  });
});
