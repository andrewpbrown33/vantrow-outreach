/** Paste-in prospect parsing.
 *
 *  The import box takes whatever a person actually has: a CSV exported from a
 *  CRM, a TSV pasted out of a spreadsheet, or a bare column of addresses. So
 *  the parser sniffs the delimiter, decides for itself whether the first row
 *  is a header, and maps loose column names onto our fields.
 *
 *  It refuses rather than guesses. A row with no recognisable address is
 *  reported back by line number with a reason — nobody should discover at send
 *  time that a third of an import quietly vanished.
 */

export interface ParsedProspect {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  timezone?: string;
}

export interface ParseResult {
  rows: ParsedProspect[];
  skipped: { line: number; text: string; reason: string }[];
  /** Header names we recognised, for the confirmation screen. */
  mapped: string[];
  duplicates: number;
}

/** RFC-shaped enough to catch typos without rejecting real addresses. */
const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>".]+\.[^\s@,;<>".]{2,}$/;

const FIELD_ALIASES: Record<keyof ParsedProspect, string[]> = {
  email: ["email", "email address", "e-mail", "work email", "mail", "address"],
  firstName: ["first name", "firstname", "first", "given name", "fname"],
  lastName: ["last name", "lastname", "last", "surname", "family name", "lname"],
  company: ["company", "company name", "account", "organization", "organisation", "employer"],
  title: ["title", "job title", "position", "role", "headline"],
  timezone: ["timezone", "time zone", "tz", "iana timezone"],
};

/** Split one delimited line, honouring double quotes and "" escapes. */
export function splitRow(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { quoted = false; }
      } else cur += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function sniffDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 5);
  const score = (d: string) =>
    sample.reduce((n, l) => n + (splitRow(l, d).length - 1), 0);
  const tab = score("\t");
  const comma = score(",");
  const semi = score(";");
  if (tab >= comma && tab >= semi && tab > 0) return "\t";
  if (semi > comma && semi > 0) return ";";
  return ",";
}

function normalise(header: string): string {
  return header.toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Column index per field, or -1. */
function mapHeader(cells: string[]): Record<keyof ParsedProspect, number> {
  const map = {
    email: -1, firstName: -1, lastName: -1, company: -1, title: -1, timezone: -1,
  } as Record<keyof ParsedProspect, number>;
  cells.forEach((raw, i) => {
    const h = normalise(raw);
    for (const [field, aliases] of Object.entries(FIELD_ALIASES) as
         [keyof ParsedProspect, string[]][]) {
      if (map[field] === -1 && aliases.includes(h)) map[field] = i;
    }
  });
  return map;
}

/** A header row is one whose first cells name fields and hold no address. */
function looksLikeHeader(cells: string[]): boolean {
  if (cells.some((c) => EMAIL.test(c))) return false;
  const map = mapHeader(cells);
  return map.email !== -1 || map.firstName !== -1 || map.lastName !== -1;
}

/** Pull an address out of a cell that may be "Name <a@b.com>". */
function extractEmail(cell: string): string | null {
  const angled = /<([^>]+)>/.exec(cell);
  const candidate = (angled ? angled[1] : cell).trim().replace(/^mailto:/i, "");
  return EMAIL.test(candidate) ? candidate.toLowerCase() : null;
}

/** Fall back to splitting a full name when only one name column exists. */
function splitFullName(value: string): { firstName?: string; lastName?: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function parseProspects(text: string): ParseResult {
  const lines = text.split(/\r\n|\r|\n/).map((l) => l.trimEnd());
  const result: ParseResult = { rows: [], skipped: [], mapped: [], duplicates: 0 };
  const firstContent = lines.findIndex((l) => l.trim().length > 0);
  if (firstContent === -1) return result;

  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const delimiter = sniffDelimiter(nonEmpty);

  let map: Record<keyof ParsedProspect, number> | null = null;
  let startLine = 0;
  const headerCells = splitRow(lines[firstContent], delimiter);
  if (looksLikeHeader(headerCells)) {
    map = mapHeader(headerCells);
    startLine = firstContent + 1;
    // A single unmatched name column ("name", "full name", "contact") still
    // carries a person; remember it so the rows below can be split.
    result.mapped = (Object.keys(FIELD_ALIASES) as (keyof ParsedProspect)[])
      .filter((f) => map![f] !== -1);
  } else {
    startLine = firstContent;
  }
  const fullNameIdx = map
    ? headerCells.findIndex((c) => ["name", "full name", "contact", "contact name"]
        .includes(normalise(c)))
    : -1;

  const seen = new Set<string>();
  for (let i = startLine; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim().length === 0) continue;
    const cells = splitRow(raw, delimiter);

    let email: string | null = null;
    if (map && map.email !== -1) email = extractEmail(cells[map.email] ?? "");
    if (!email) {
      for (const cell of cells) {
        email = extractEmail(cell);
        if (email) break;
      }
    }
    if (!email) {
      result.skipped.push({ line: i + 1, text: raw.slice(0, 120), reason: "no email address" });
      continue;
    }
    if (seen.has(email)) { result.duplicates += 1; continue; }
    seen.add(email);

    const pick = (field: keyof ParsedProspect): string | undefined => {
      if (!map) return undefined;
      const idx = map[field];
      if (idx === -1) return undefined;
      const v = (cells[idx] ?? "").trim();
      return v.length > 0 ? v : undefined;
    };

    const row: ParsedProspect = { email };
    const first = pick("firstName");
    const last = pick("lastName");
    if (first) row.firstName = first;
    if (last) row.lastName = last;
    if (!first && !last && fullNameIdx !== -1) {
      const split = splitFullName(cells[fullNameIdx] ?? "");
      if (split.firstName) row.firstName = split.firstName;
      if (split.lastName) row.lastName = split.lastName;
    }
    const company = pick("company");
    const title = pick("title");
    const timezone = pick("timezone");
    if (company) row.company = company;
    if (title) row.title = title;
    if (timezone) row.timezone = timezone;

    result.rows.push(row);
  }
  return result;
}
