/** Inbound classification and the engine behaviors it triggers:
 *  reply -> I2 (stop-on-reply, engine law) · OOO -> I6 (pause with return
 *  date, never a reply) · hard bounce -> I7 (classify, suppress, halt).
 *  Classification is pure and fixture-tested; the behaviors run in one
 *  transaction per message against the substrate, idempotent by Gmail
 *  message id. */

import type { Pool } from "pg";
import { emitSequenceProgress } from "../connect-emit";
import { parseTouchMessageId } from "./rfc822";

export interface NormalizedInbound {
  gmailMessageId: string;
  /** Lowercased header record. */
  headers: Record<string, string>;
  fromEmail: string;
  subject: string;
  snippet: string;
  bodyText: string;
  receivedAt: Date;
}

export type Classification =
  | "reply" | "ooo" | "bounce_hard" | "bounce_soft" | "unsubscribe" | "other";

export interface ClassifiedInbound {
  classification: Classification;
  /** For bounces: the address the DSN reports as failed. */
  bouncedAddress?: string;
  dsnStatus?: string;
  /** For OOO: parsed return date, when one is stated. */
  oooReturnDate?: Date;
  /** Touch linkage recovered from In-Reply-To/References. */
  touch?: { enrollmentId: string; stepOrder: number };
  /** A human reply whose own words ask off the list (feeds I3's suppression). */
  optOut?: boolean;
}

const OOO_SUBJECT_RE =
  /^((auto(matic)?[ -]?reply)|out of (the )?office|ooo\b)/i;
const RETURN_DATE_RE =
  /(?:return(?:ing)?|back)(?:\s+\S+){0,3}?\s+on\s+([A-Z][a-z]+\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i;

const UNSUB_SUBJECT_RE = /^(\s*re:\s*)*\s*unsubscribe\b/i;

// Opt-out intent in a human reply. Strong verbs count anywhere in the
// prospect's own words; the polite forms ("no thanks" — the exact phrase the
// close-out email invites) only when they ARE the message, so a longer answer
// that merely contains them never suppresses. Quoted lines are stripped
// first: every reply to the close-out quotes our own `reply "no thanks"` line.
const OPTOUT_STRONG_RE =
  /\b(unsubscribe|remove me|take me off|stop (?:e-?mail|messag|contact)\w*|opt (?:me )?out|do(?:n'?t| not) (?:e-?mail|contact|message) me)\b/i;
const OPTOUT_POLITE_RE = /\b(?:no,? thank(?:s| you)|not interested)\b/i;

/** The prospect's own words: drop `>` quote lines and everything under an
 *  "On ... wrote:" / "-- Original Message --" attribution line. */
export function stripQuoted(body: string): string {
  let text = body;
  const wrote = text.search(/^\s*On .{0,200}wrote:\s*$/im);
  if (wrote >= 0) text = text.slice(0, wrote);
  const original = text.search(/^-{2,}\s*Original Message\s*-{2,}\s*$/im);
  if (original >= 0) text = text.slice(0, original);
  return text.split(/\r?\n/).filter((l) => !/^\s*>/.test(l)).join("\n");
}

export function detectOptOut(bodyText: string): boolean {
  const own = stripQuoted(bodyText);
  if (OPTOUT_STRONG_RE.test(own)) return true;
  const compact = own.trim();
  return compact.length > 0 && compact.length <= 80 && OPTOUT_POLITE_RE.test(compact);
}

export function classifyInbound(msg: NormalizedInbound): ClassifiedInbound {
  const touch =
    parseTouchMessageId(msg.headers["in-reply-to"]) ??
    parseTouchMessageId(msg.headers["references"]) ??
    undefined;

  // Bounce: DSN report or the classic daemon sender. Machine-readable status
  // decides hard vs soft (5.x.x permanent, 4.x.x transient) — I7.
  const isDsn =
    /report-type=delivery-status/i.test(msg.headers["content-type"] ?? "") ||
    /^(mailer-daemon|postmaster)@/i.test(msg.fromEmail);
  if (isDsn) {
    const status = /(?:^|\n)\s*Status:\s*([245]\.\d+\.\d+)/i.exec(msg.bodyText)?.[1];
    const recipient =
      /(?:Final|Original)-Recipient:[^;\n]*;\s*<?([^\s<>;]+@[^\s<>;]+)>?/i.exec(
        msg.bodyText,
      )?.[1];
    return {
      classification: status?.startsWith("4") ? "bounce_soft" : "bounce_hard",
      bouncedAddress: recipient?.toLowerCase(),
      dsnStatus: status,
      touch,
    };
  }

  // Unsubscribe-by-mail: the List-Unsubscribe mailto points at the sending
  // mailbox with exactly this subject. Suppression is the law either way
  // (I3); the classification keeps it out of the reply counts.
  if (UNSUB_SUBJECT_RE.test(msg.subject)) {
    return { classification: "unsubscribe", touch };
  }

  // OOO: auto-submitted machinery or the subject idiom. Never a reply (I6).
  const autoSubmitted = msg.headers["auto-submitted"];
  const isOoo =
    (autoSubmitted !== undefined && autoSubmitted.toLowerCase() !== "no") ||
    msg.headers["x-autoreply"] !== undefined ||
    OOO_SUBJECT_RE.test(msg.subject);
  if (isOoo) {
    const dateText = RETURN_DATE_RE.exec(msg.bodyText)?.[1];
    let oooReturnDate: Date | undefined;
    if (dateText) {
      const parsed = new Date(
        /\d{4}|\//.test(dateText)
          ? dateText
          : `${dateText} ${new Date().getFullYear()}`,
      );
      if (!Number.isNaN(parsed.getTime())) oooReturnDate = parsed;
    }
    return { classification: "ooo", oooReturnDate, touch };
  }

  // A human wrote back. A synthetic touch reference proves it outright; with
  // Gmail (which rewrites Message-ID) the caller resolves the quoted provider
  // id against the ledger, or falls back to the sender address.
  const optOut = detectOptOut(msg.bodyText) || undefined;
  return { classification: touch ? "reply" : "other", touch, optOut };
}

/** The headers the classifier reads, and the only ones the ledger keeps.
 *  The rest of an inbox message's headers — Received chains, tracking ids,
 *  the sender's infrastructure — are data about the sender's mail, not
 *  about the engine's, and the row is member-readable. */
export const STORED_HEADERS = [
  "from", "to", "subject", "message-id", "in-reply-to", "references", "date",
  "authentication-results", "list-unsubscribe", "auto-submitted",
  "x-autoreply", "return-path",
] as const;

export function storedHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of STORED_HEADERS) {
    const value = headers[name];
    if (value !== undefined) out[name] = value;
  }
  return out;
}

/** What the engine acts on — and therefore records in full. Everything else
 *  in an inbox is someone's ordinary mail. */
const ACTED_ON: ReadonlySet<Classification> = new Set(
  ["reply", "bounce_hard", "bounce_soft", "unsubscribe"] as const,
);

export interface ProcessResult {
  classification: Classification;
  enrollmentId: string | null;
  duplicate: boolean;
}

/** Ingest one normalized inbound message: record it, link it, and apply the
 *  engine law it triggers. Idempotent by (mailbox, gmail message id). */
export async function processInbound(
  pool: Pool,
  mailboxId: string,
  msg: NormalizedInbound,
): Promise<ProcessResult> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const mb = (await client.query<{ workspace_id: string }>(
      "select workspace_id from mailboxes where id = $1", [mailboxId],
    )).rows[0];
    if (!mb) throw new Error(`unknown mailbox ${mailboxId}`);
    const ws = mb.workspace_id;

    const cls = classifyInbound(msg);

    // Link an enrollment. Exact linkage comes from the ledger: a reply quotes
    // the PROVIDER's Message-ID (Gmail rewrites ours), and that id was
    // persisted when the touch sent. Legacy synthetic-id parsing is kept as a
    // secondary path for non-rewriting providers on the same seam; sender
    // address is the final fallback.
    let enrollment: {
      id: string; prospect_id: string; state: string; prospect_email: string;
      sequence_id: string;
    } | null = null;

    const quoted = [
      ...(msg.headers["in-reply-to"] ?? "").split(/\s+/),
      ...(msg.headers["references"] ?? "").split(/\s+/),
    ].filter((t) => t.startsWith("<") && t.endsWith(">"));
    if (quoted.length > 0) {
      enrollment = (await client.query(
        `select e.id, e.prospect_id, e.state, e.sequence_id, p.email as prospect_email
           from touch_ledger t
           join enrollments e on e.id = t.enrollment_id
           join prospects p on p.id = e.prospect_id
          where t.workspace_id = $1
            and t.provider_rfc822_message_id = any($2::text[])
          order by t.created_at desc limit 1`,
        [ws, quoted],
      )).rows[0] ?? null;
    }
    if (!enrollment && cls.touch) {
      enrollment = (await client.query(
        `select e.id, e.prospect_id, e.state, e.sequence_id, p.email as prospect_email
           from enrollments e join prospects p on p.id = e.prospect_id
          where e.id = $1 and e.workspace_id = $2`,
        [cls.touch.enrollmentId, ws],
      )).rows[0] ?? null;
    }
    if (!enrollment && cls.classification !== "bounce_soft") {
      enrollment = (await client.query(
        `select e.id, e.prospect_id, e.state, e.sequence_id, p.email as prospect_email
           from enrollments e join prospects p on p.id = e.prospect_id
          where e.workspace_id = $1 and e.mailbox_id = $2
            and lower(p.email) = lower($3)
            and e.state in ('scheduled', 'active', 'paused')
          order by e.created_at desc limit 1`,
        [ws, mailboxId, cls.bouncedAddress ?? msg.fromEmail],
      )).rows[0] ?? null;
    }

    const classification: Classification =
      cls.classification === "other" && enrollment ? "reply" : cls.classification;
    const seqId = enrollment?.sequence_id;

    // A full row only for mail the engine acts on: linked to one of its own
    // enrollments, or a reply, bounce or unsubscribe. Everything else in the
    // inbox is somebody's ordinary correspondence; it leaves an id-only row so
    // the at-least-once sync can dedupe, and nothing more — no sender, no
    // subject, no snippet, no headers.
    const keep = enrollment !== null || ACTED_ON.has(classification);
    const inserted = keep
      ? await client.query(
        `insert into inbound_messages
           (workspace_id, mailbox_id, enrollment_id, prospect_id,
            gmail_message_id, classification, from_email, subject, snippet,
            headers, received_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         on conflict (mailbox_id, gmail_message_id) do nothing
         returning id`,
        [ws, mailboxId, enrollment?.id ?? null, enrollment?.prospect_id ?? null,
         msg.gmailMessageId, classification, msg.fromEmail, msg.subject,
         msg.snippet, storedHeaders(msg.headers), msg.receivedAt],
      )
      : await client.query(
        `insert into inbound_messages
           (workspace_id, mailbox_id, gmail_message_id, classification)
         values ($1, $2, $3, 'other')
         on conflict (mailbox_id, gmail_message_id) do nothing
         returning id`,
        [ws, mailboxId, msg.gmailMessageId],
      );
    if (inserted.rowCount === 0) {
      // Sync is at-least-once; this message was already processed.
      await client.query("rollback");
      return { classification, enrollmentId: enrollment?.id ?? null, duplicate: true };
    }

    const events = (type: string, payload: Record<string, unknown> = {}) =>
      client.query(
        `insert into events
           (workspace_id, type, enrollment_id, prospect_id, mailbox_id, payload)
         values ($1, $2, $3, $4, $5, $6)`,
        [ws, type, enrollment?.id ?? null, enrollment?.prospect_id ?? null,
         mailboxId, payload],
      );

    // Org-wide opt-out writes, shared by the explicit unsubscribe message and
    // the opt-out-worded reply. The suppression row is what I3's final
    // dispatch check reads; opted_out_at is the visible mark on the prospect.
    const suppressOptOut = async (address: string) => {
      await client.query(
        `insert into suppression_entries (workspace_id, email, reason)
         values ($1, $2, 'unsubscribe')
         on conflict (workspace_id, lower(email)) do nothing`,
        [ws, address],
      );
      await client.query(
        `update prospects
            set opted_out_at = coalesce(opted_out_at, now()), updated_at = now()
          where workspace_id = $1 and lower(email) = lower($2)`,
        [ws, address],
      );
    };

    if (classification === "unsubscribe") {
      // The ask needs no enrollment to be honored: suppress the sender (or
      // the linked prospect) org-wide, and cancel any live enrollment.
      const addr = enrollment?.prospect_email ?? msg.fromEmail;
      await suppressOptOut(addr);
      if (enrollment) {
        await client.query(
          `update enrollments
              set state = 'canceled', error_reason = 'unsubscribed',
                  next_touch_at = null, resume_at = null, pause_reason = null,
                  claimed_at = null, claim_token = null, updated_at = now()
            where id = $1 and state in ('scheduled', 'active', 'paused')`,
          [enrollment.id],
        );
      }
      await events("inbound.unsubscribe", { address: addr });
    } else if (enrollment) {
      if (classification === "reply") {
        // I2: the reply cancels every pending timer, atomically, whatever the
        // enrollment was doing (scheduled, active, even paused).
        await client.query(
          `update enrollments
              set replied_at = coalesce(replied_at, now()), state = 'replied',
                  next_touch_at = null, resume_at = null, pause_reason = null,
                  claimed_at = null, claim_token = null, updated_at = now()
            where id = $1 and state in ('scheduled', 'active', 'paused')`,
          [enrollment.id],
        );
        await events("inbound.reply", { gmail_message_id: msg.gmailMessageId });
        if (seqId) {
          await emitSequenceProgress(client, {
            workspaceId: ws, sequenceId: seqId, reason: "inbound.reply",
            occurredAt: msg.receivedAt,
          });
        }
        if (cls.optOut) {
          // The reply both stops this sequence (I2, above) and asks off the
          // list entirely — honor both. State stays 'replied': that is what
          // happened; the suppression row is what prevents the next sequence.
          await suppressOptOut(enrollment.prospect_email);
          await events("prospect.opted_out", { via: "reply" });
        }
      } else if (classification === "ooo") {
        // I6: pause with the return date; NEVER marks a reply. Default resume
        // is +3 days when the auto-reply names no date.
        const resumeAt = cls.oooReturnDate ??
          new Date(Date.now() + 3 * 86_400_000);
        await client.query(
          `update enrollments
              set state = 'paused', pause_reason = 'out of office',
                  resume_at = $2, next_touch_at = null,
                  claimed_at = null, claim_token = null, updated_at = now()
            where id = $1 and state in ('scheduled', 'active')`,
          [enrollment.id, resumeAt],
        );
        await events("enrollment.paused", {
          reason: "ooo",
          resume_at: resumeAt.toISOString(),
          return_date_parsed: cls.oooReturnDate !== undefined,
        });
      } else if (classification === "bounce_hard") {
        // I7: classify, suppress, halt — and the suppression write is what
        // makes I3's final check catch every future path to this address.
        const addr = cls.bouncedAddress ?? enrollment.prospect_email;
        await client.query(
          `insert into suppression_entries (workspace_id, email, reason)
           values ($1, $2, 'hard_bounce')
           on conflict (workspace_id, lower(email)) do nothing`,
          [ws, addr],
        );
        await client.query(
          `update enrollments
              set state = 'bounced', error_reason = $2, next_touch_at = null,
                  claimed_at = null, claim_token = null, updated_at = now()
            where id = $1 and state in ('scheduled', 'active', 'paused')`,
          [enrollment.id, `hard bounce${cls.dsnStatus ? ` (${cls.dsnStatus})` : ""}`],
        );
        await events("inbound.bounce_hard", {
          address: addr, dsn_status: cls.dsnStatus ?? null,
        });
        if (seqId) {
          await emitSequenceProgress(client, {
            workspaceId: ws, sequenceId: seqId, reason: "inbound.bounce_hard",
            occurredAt: msg.receivedAt,
          });
        }
      } else if (classification === "bounce_soft") {
        // Soft bounces retry within provider policy before classifying (I7);
        // the ledger row + event are the record. Retry orchestration is B4/B5.
        await events("inbound.bounce_soft", { dsn_status: cls.dsnStatus ?? null });
      }
    }

    await client.query("commit");
    return { classification, enrollmentId: enrollment?.id ?? null, duplicate: false };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
