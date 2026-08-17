import { describe, expect, it } from "vitest";
import { STANDARD_VARIABLES, tokenizeTemplate } from "./template-tokens";

const KNOWN = new Set<string>([...STANDARD_VARIABLES, "opening_line"]);

describe("tokenizeTemplate", () => {
  it("splits text around variables and labels what it knows", () => {
    expect(tokenizeTemplate("Hi {{firstName}}, saw {{company}} on {{blorp}}.", KNOWN))
      .toEqual([
        { text: "Hi ", kind: "text" },
        { text: "{{firstName}}", kind: "known" },
        { text: ", saw ", kind: "text" },
        { text: "{{company}}", kind: "known" },
        { text: " on ", kind: "text" },
        { text: "{{blorp}}", kind: "unknown" },
        { text: ".", kind: "text" },
      ]);
  });

  it("tolerates the spacing the engine tolerates", () => {
    expect(tokenizeTemplate("{{ firstName }}", KNOWN))
      .toEqual([{ text: "{{ firstName }}", kind: "known" }]);
  });

  it("marks imported custom variables as known", () => {
    expect(tokenizeTemplate("{{opening_line}}", KNOWN))
      .toEqual([{ text: "{{opening_line}}", kind: "known" }]);
  });

  it("leaves half-typed braces as plain text, exactly like the engine", () => {
    expect(tokenizeTemplate("{{firstName and {oops}", KNOWN))
      .toEqual([{ text: "{{firstName and {oops}", kind: "text" }]);
  });

  it("hands back one text token for variable-free input", () => {
    expect(tokenizeTemplate("plain words", KNOWN))
      .toEqual([{ text: "plain words", kind: "text" }]);
  });

  it("returns nothing for an empty string", () => {
    expect(tokenizeTemplate("", KNOWN)).toEqual([]);
  });
});
