/** The composer's text becomes real HTML: paragraphs from blank lines, a
 *  break from a single newline, and the writer's characters escaped so `<`
 *  and `&` arrive as typed rather than as markup. */

import { describe, expect, it } from "vitest";
import { escapeHtml, textToHtml } from "./text-to-html";

describe("textToHtml", () => {
  it("makes paragraphs from blank lines and breaks from single newlines", () => {
    expect(textToHtml("Hi {{firstName}},\n\nLine one\nline two\n\n\n\nBye")).toBe(
      "<p>Hi {{firstName}},</p>\n<p>Line one<br>line two</p>\n<p>Bye</p>",
    );
  });

  it("escapes what the writer typed, and leaves merge fields alone", () => {
    expect(textToHtml("Tom & Jerry <the cats> said \"hi\" to {{company}}")).toBe(
      "<p>Tom &amp; Jerry &lt;the cats&gt; said &quot;hi&quot; to {{company}}</p>",
    );
  });

  it("normalises Windows newlines and trims the edges", () => {
    expect(textToHtml("\r\n  one\r\n\r\ntwo  \r\n")).toBe("<p>one</p>\n<p>two</p>");
  });

  it("produces nothing from nothing — no empty paragraph", () => {
    expect(textToHtml("")).toBe("");
    expect(textToHtml("\n\n  \n")).toBe("");
  });
});

describe("escapeHtml", () => {
  it("escapes the five characters HTML cares about, and nothing else", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
    expect(escapeHtml("Nakamura, Dana — Foundry & Co")).toBe("Nakamura, Dana — Foundry &amp; Co");
  });
});
