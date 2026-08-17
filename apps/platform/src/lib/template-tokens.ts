/** Tokenize template text for the composer's highlighter.
 *
 *  The token regex mirrors the engine's fill() in sweep.ts exactly — a token
 *  this scanner colours as a variable is one the engine will substitute, and
 *  anything else goes to the wire as typed. `known` decides the colour only:
 *  a well-formed token whose name nobody's prospect data carries is the typo
 *  the highlighter exists to catch. */

export interface TemplateToken {
  text: string;
  kind: "text" | "known" | "unknown";
}

const TOKEN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function tokenizeTemplate(
  text: string, known: ReadonlySet<string>,
): TemplateToken[] {
  const out: TemplateToken[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at), kind: "text" });
    out.push({ text: m[0], kind: known.has(m[1] ?? "") ? "known" : "unknown" });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: "text" });
  return out;
}

/** The variables every prospect row carries, template-name spelled. Custom
 *  jsonb keys extend this set per workspace (listCustomVariableKeys). */
export const STANDARD_VARIABLES = [
  "firstName", "lastName", "company", "title", "email",
] as const;
