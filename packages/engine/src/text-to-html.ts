/** From the composer's textarea to the wire.
 *
 *  A step body is typed as plain text and sent as text/html (rfc822.ts).
 *  Stored verbatim, it reached the wire with every newline collapsed into one
 *  run-on paragraph, and with any `<` or `&` the writer typed read as markup.
 *  This is the one place text becomes HTML: blank lines separate paragraphs,
 *  a single newline is a line break, and everything is escaped first, so the
 *  characters the writer typed are the characters that arrive.
 *
 *  Shared with scripts/seed-campaign.mjs (which imports it through tsx), so a
 *  campaign seeded from markdown and one typed into the form produce the
 *  same HTML. Bodies already stored keep sending as they are: this runs when
 *  a body is written, never on the send path. Merge fields pass through
 *  untouched — `{{firstName}}` contains nothing HTML needs escaped — and are
 *  filled, and escaped, at send time (merge.ts). */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function textToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${escapeHtml(p.trim()).split("\n").join("<br>")}</p>`)
    .join("\n");
}
