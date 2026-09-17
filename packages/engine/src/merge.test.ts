/** Merge fields: filled from the prospect, escaped where the template is
 *  HTML, and every empty one reported so the send is refused rather than
 *  going out as "Hi ,". */

import { describe, expect, it } from "vitest";
import { fillMergeFields } from "./merge";

const vars = { firstName: "Dana", company: "A&B <Roofing>", title: "  " };

describe("fillMergeFields", () => {
  it("escapes a prospect's value inside an HTML body", () => {
    const missing = new Set<string>();
    expect(fillMergeFields("<p>Hi {{firstName}} at {{ company }}</p>", vars, missing, { html: true }))
      .toBe("<p>Hi Dana at A&amp;B &lt;Roofing&gt;</p>");
    expect(missing.size).toBe(0);
  });

  it("leaves a value as typed in a subject line", () => {
    const missing = new Set<string>();
    expect(fillMergeFields("A question for {{company}}", vars, missing))
      .toBe("A question for A&B <Roofing>");
    expect(missing.size).toBe(0);
  });

  it("reports absent and blank fields, and renders them empty", () => {
    const missing = new Set<string>();
    expect(fillMergeFields("{{firstName}} {{title}} {{lastName}}", vars, missing)).toBe("Dana  ");
    expect([...missing].sort()).toEqual(["lastName", "title"]);
  });

  it("touches nothing that is not a well-formed field", () => {
    const missing = new Set<string>();
    expect(fillMergeFields("{{ not a field }} {{}} {firstName}", vars, missing))
      .toBe("{{ not a field }} {{}} {firstName}");
    expect(missing.size).toBe(0);
  });
});
