/** The import parser's contract: read what people actually paste, and never
 *  swallow a row it could not read. */

import { describe, expect, it } from "vitest";
import {
  customNameFrom, parseProspects, sniffTable, splitRow, suggestField,
} from "./import-parse";

describe("splitRow", () => {
  it("honours quotes, embedded delimiters and escaped quotes", () => {
    expect(splitRow('a,"b,c","say ""hi""",d', ",")).toEqual(["a", "b,c", 'say "hi"', "d"]);
  });

  it("keeps empty cells so column positions stay aligned", () => {
    expect(splitRow("a,,c", ",")).toEqual(["a", "", "c"]);
  });
});

describe("parseProspects", () => {
  it("reads a header-led CSV into fields", () => {
    const out = parseProspects(
      "email,first name,last name,company,title,timezone\n" +
      "dana@foundry.com,Dana,Nakamura,Foundry & Co,VP Ops,America/Chicago\n");
    expect(out.rows).toEqual([{
      email: "dana@foundry.com", firstName: "Dana", lastName: "Nakamura",
      company: "Foundry & Co", title: "VP Ops", timezone: "America/Chicago",
    }]);
    expect(out.skipped).toEqual([]);
  });

  it("reads a bare column of addresses with no header at all", () => {
    const out = parseProspects("a@x.com\nb@y.com\n");
    expect(out.rows.map((r) => r.email)).toEqual(["a@x.com", "b@y.com"]);
  });

  it("does not mistake a first data row for a header", () => {
    const out = parseProspects("a@x.com,Ana,Ruiz\nb@y.com,Bo,Chen\n");
    expect(out.rows).toHaveLength(2);
    expect(out.rows[0].email).toBe("a@x.com");
  });

  it("sniffs tabs and semicolons, not just commas", () => {
    expect(parseProspects("email\tfirst name\na@x.com\tAna").rows[0])
      .toEqual({ email: "a@x.com", firstName: "Ana" });
    expect(parseProspects("email;first name\na@x.com;Ana").rows[0])
      .toEqual({ email: "a@x.com", firstName: "Ana" });
  });

  it("finds the address wherever it sits when the header does not name it", () => {
    const out = parseProspects("name,contact\nAna Ruiz,ana@x.com\n");
    expect(out.rows[0].email).toBe("ana@x.com");
  });

  it("unwraps a display-name address and lowercases it", () => {
    expect(parseProspects('"Ruiz, Ana" <Ana@X.com>').rows[0].email).toBe("ana@x.com");
  });

  it("splits a single full-name column", () => {
    const out = parseProspects("email,full name\na@x.com,Ana Maria Ruiz\n");
    expect(out.rows[0]).toMatchObject({ firstName: "Ana", lastName: "Maria Ruiz" });
  });

  it("reports unreadable rows by line number instead of dropping them", () => {
    const out = parseProspects("email\na@x.com\nnot-an-address\nb@y.com\n");
    expect(out.rows).toHaveLength(2);
    expect(out.skipped).toEqual([
      { line: 3, text: "not-an-address", reason: "no email address" },
    ]);
  });

  it("counts a repeated address once and says so", () => {
    const out = parseProspects("a@x.com\nA@X.com\nb@y.com\n");
    expect(out.rows).toHaveLength(2);
    expect(out.duplicates).toBe(1);
  });

  it("skips blank lines without reporting them", () => {
    const out = parseProspects("\n\na@x.com\n\n");
    expect(out.rows).toHaveLength(1);
    expect(out.skipped).toEqual([]);
  });

  it("rejects near-miss addresses rather than importing garbage", () => {
    const out = parseProspects("a@x\nb@.com\n@y.com\na b@x.com\n");
    expect(out.rows).toHaveLength(0);
    expect(out.skipped).toHaveLength(4);
  });

  it("returns nothing for empty input", () => {
    expect(parseProspects("   \n  ").rows).toEqual([]);
  });
});

describe("sniffTable", () => {
  it("separates a header from its rows", () => {
    const t = sniffTable("email,first name\na@x.com,Ana\nb@y.com,Bo\n");
    expect(t.header).toEqual(["email", "first name"]);
    expect(t.rows).toEqual([["a@x.com", "Ana"], ["b@y.com", "Bo"]]);
  });

  it("returns header null when row one is already data", () => {
    const t = sniffTable("a@x.com,Ana\nb@y.com,Bo\n");
    expect(t.header).toBeNull();
    expect(t.rows).toHaveLength(2);
  });

  it("sniffs tabs and keeps quoted commas intact", () => {
    expect(sniffTable("a@x.com\tAcme, Inc.\n").rows).toEqual([["a@x.com", "Acme, Inc."]]);
    expect(sniffTable('a@x.com,"Acme, Inc."\n').rows).toEqual([["a@x.com", "Acme, Inc."]]);
  });

  it("is calm about an empty file", () => {
    expect(sniffTable("  \n ").rows).toEqual([]);
  });
});

describe("suggestField", () => {
  it("matches the aliases the paste path already trusts", () => {
    expect(suggestField("E-Mail")).toBe("email");
    expect(suggestField("First_Name")).toBe("firstName");
    expect(suggestField("Organisation")).toBe("company");
    expect(suggestField("Job Title")).toBe("title");
  });

  it("returns null for anything it will not guess at", () => {
    expect(suggestField("LinkedIn URL")).toBeNull();
    expect(suggestField("Revenue")).toBeNull();
  });
});

describe("customNameFrom", () => {
  it("turns a header into a legal variable name", () => {
    expect(customNameFrom("LinkedIn URL")).toBe("linkedin_url");
    expect(customNameFrom("  Opening Line! ")).toBe("opening_line");
  });

  it("returns empty when nothing survives", () => {
    expect(customNameFrom("!!!")).toBe("");
  });
});
