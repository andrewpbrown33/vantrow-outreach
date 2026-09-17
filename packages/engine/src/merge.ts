/** Merge fields, rendered at send time.
 *
 *  One regex, mirrored by the composer's highlighter (template-tokens.ts):
 *  a token this fills is one the highlighter colours, and anything else goes
 *  to the wire as typed. `missing` collects every field with nothing behind
 *  it — absent OR blank after trim — because a merge field is a claim that a
 *  value exists, and the caller refuses the send on any miss.
 *
 *  `html` escapes the substituted value. A template body is HTML; a
 *  prospect's company is not, and "A&B <Roofing>" has to arrive as those
 *  characters rather than as an unclosed tag. Subjects are text and take
 *  the value as it is. */

import { escapeHtml } from "./text-to-html";

export const MERGE_FIELD_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function fillMergeFields(
  source: string,
  vars: Record<string, string>,
  missing: Set<string>,
  opts: { html?: boolean } = {},
): string {
  return source.replace(MERGE_FIELD_RE, (_, name: string) => {
    const v = vars[name];
    if (typeof v !== "string" || v.trim() === "") {
      missing.add(name);
      return "";
    }
    return opts.html ? escapeHtml(v) : v;
  });
}
