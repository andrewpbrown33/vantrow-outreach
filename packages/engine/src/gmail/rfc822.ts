/** RFC822 composition and Gmail-payload parsing.
 *
 *  The load-bearing trick: the engine CONTROLS the Message-ID, and Gmail's
 *  search supports `rfc822msgid:`. So a touch's identity (enrollment x step,
 *  epoch-agnostic) IS its Message-ID — which makes the provider's checkSent an
 *  exact search, lets send() pre-check before firing (idempotent by touch,
 *  I1/I8), and makes reply-matching deterministic: a prospect's reply carries
 *  our Message-ID in In-Reply-To/References. */

export function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function fromB64url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

/** `<touch-{enrollmentId}-{stepOrder}@{domain}>` from a `${id}:${step}` ref. */
export function touchMessageId(touchRef: string, domain: string): string {
  return `<touch-${touchRef.replace(/:/g, "-")}@${domain}>`;
}

const TOUCH_MID_RE = /touch-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(\d+)@/i;

/** Recover the touch identity from a Message-ID-bearing header value. */
export function parseTouchMessageId(
  value: string | undefined,
): { enrollmentId: string; stepOrder: number } | null {
  if (!value) return null;
  const m = TOUCH_MID_RE.exec(value);
  if (!m) return null;
  return { enrollmentId: m[1]!.toLowerCase(), stepOrder: Number(m[2]) };
}

/** RFC2047-encode a header word when it needs it (UTF-8 subjects). */
function encodeHeaderWord(value: string): string {
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${b64url(value).replace(/-/g, "+").replace(/_/g, "/")}?=`;
}

export interface ComposeInput {
  from: string;
  to: string;
  subject: string;
  bodyHtml: string;
  messageId: string; // with angle brackets
  idempotencyKey: string;
  inReplyTo?: string; // prior touch's Message-ID, when threading as a reply
}

/** Base64url-encoded raw message for gmail users.messages.send. */
export function composeRaw(input: ComposeInput): string {
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeaderWord(input.subject)}`,
    `Message-ID: ${input.messageId}`,
    `X-Nudgerow-Key: ${input.idempotencyKey}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  if (input.inReplyTo) {
    lines.push(`In-Reply-To: ${input.inReplyTo}`);
    lines.push(`References: ${input.inReplyTo}`);
  }
  // Body base64 folded to 76-char lines per MIME.
  const body = Buffer.from(input.bodyHtml, "utf8").toString("base64");
  const folded = body.match(/.{1,76}/g)?.join("\r\n") ?? "";
  return b64url(`${lines.join("\r\n")}\r\n\r\n${folded}\r\n`);
}

/** The shape Gmail returns for message payloads (format=full). */
export interface GmailPayload {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: GmailPayload[];
}

export function headerValue(
  payload: GmailPayload | undefined,
  name: string,
): string | undefined {
  return payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase(),
  )?.value;
}

/** All headers lowercased into a flat record (first value wins). */
export function headerRecord(payload: GmailPayload | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of payload?.headers ?? []) {
    const k = h.name.toLowerCase();
    if (!(k in out)) out[k] = h.value;
  }
  return out;
}

/** Best-effort text body: prefer text/plain, fall back to text/html, walk
 *  nested multiparts (message/delivery-status parts included — the bounce
 *  classifier greps their machine-readable fields). */
export function decodeBody(payload: GmailPayload | undefined): string {
  if (!payload) return "";
  const chunks: string[] = [];
  const walk = (p: GmailPayload): void => {
    if (p.body?.data) chunks.push(fromB64url(p.body.data));
    for (const part of p.parts ?? []) walk(part);
  };
  walk(payload);
  return chunks.join("\n");
}
