/** The minute heartbeat (Gate 5's dispatcher: a Vercel cron invokes this).
 *
 *  Three jobs, in deliberate order:
 *    1. inbound sync — a reply that arrived must be seen BEFORE we send the
 *       next step to that person (I2 in practice, not just in theory),
 *    2. the engine sweep — claim due enrollments and send,
 *    3. Connect outbox drain — deliver what the sweep just enqueued.
 *
 *  Auth: CRON_SECRET, the family's pattern. Vercel Cron sends it as a bearer
 *  token; a plain GET from the internet gets 401.
 *
 *  Failure posture: each job is isolated, so a Gmail outage cannot stop
 *  Connect deliveries and a bad endpoint cannot stop sending. The response
 *  body is the tick's own report — it is what an operator reads when asking
 *  "did the heartbeat do anything?" — and a job failure returns 207 with the
 *  errors named, never a silent 200. */

import { NextResponse } from "next/server";
import type { Pool } from "pg";
import { drainOutbox } from "@vantrow/connect";
import {
  RefreshTokenSource, GmailProvider, canStoreToken, isEncryptedToken,
  loadTokenKey, openToken, releaseDue, sealToken, sweepOnce,
  syncMailboxInbound,
} from "@vantrow/engine";
import { getPool } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface MailboxRow {
  id: string;
  email: string;
  refresh_token: string;
}

/** The refresh token in usable form. A token stored before MAILBOX_TOKEN_KEY
 *  existed is re-sealed on this first read under the key, so setting the key
 *  is the whole migration — no reconnect, no SQL. A token this deployment
 *  cannot open (key missing or wrong) throws, and the caller records that
 *  against the mailbox where an operator will see it. */
async function refreshTokenFor(pool: Pool, mb: MailboxRow): Promise<string> {
  const plain = openToken(mb.refresh_token);
  if (!isEncryptedToken(mb.refresh_token) && loadTokenKey() !== null) {
    await pool.query(
      `update public.mailbox_credentials
          set refresh_token = $2, updated_at = now()
        where mailbox_id = $1 and refresh_token = $3`,
      [mb.id, sealToken(plain), mb.refresh_token]);
  }
  return plain;
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // unset means locked, never open
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const pool = getPool();
  const report: Record<string, unknown> = { at: new Date().toISOString() };
  const errors: string[] = [];

  // --- 1 · Inbound sync, per connected mailbox --------------------------
  if (clientId && clientSecret) {
    const { rows } = await pool.query<MailboxRow>(
      `select m.id, m.email, c.refresh_token
         from public.mailboxes m
         join public.mailbox_credentials c on c.mailbox_id = m.id
        where m.send_disabled = false`,
    );
    const inbound: Record<string, unknown> = {};
    for (const mb of rows) {
      try {
        const tokenSource = new RefreshTokenSource(
          { clientId, clientSecret },
          await refreshTokenFor(pool, mb),
          async (accessToken, expiresAt) => {
            // Short-lived and read by nothing yet: without a key in
            // production it is simply not written, never in the clear.
            const stored = canStoreToken() ? sealToken(accessToken) : null;
            await pool.query(
              `update public.mailbox_credentials
                  set access_token = $2, access_token_expires_at = $3,
                      last_refresh_error = null, updated_at = now()
                where mailbox_id = $1`,
              [mb.id, stored, expiresAt]);
          },
        );
        inbound[mb.email] = await syncMailboxInbound(pool, mb.id, tokenSource);
      } catch (err) {
        const message = String(err).slice(0, 300);
        errors.push(`inbound(${mb.email}): ${message}`);
        // Record it where an operator will look — a mailbox whose token
        // expired (test mode does that weekly) must be visibly broken, not
        // quietly skipped.
        await pool.query(
          `update public.mailbox_credentials
              set last_refresh_error = $2, updated_at = now()
            where mailbox_id = $1`,
          [mb.id, message]).catch(() => {});
      }
    }
    report.inbound = inbound;
  } else {
    report.inbound = "skipped: GOOGLE_OAUTH_CLIENT_ID/SECRET not configured";
  }

  // --- 2 · The drip: today's release ------------------------------------
  // Ahead of the sweep, so a prospect released this minute can take their
  // first touch in the same tick instead of waiting for the next one.
  // Isolated like every other job: a release failure must never stop sending.
  try {
    report.release = await releaseDue(pool);
  } catch (err) {
    errors.push(`release: ${String(err).slice(0, 300)}`);
  }

  // --- 3 · The engine sweep ---------------------------------------------
  try {
    if (clientId && clientSecret) {
      const { rows } = await pool.query<MailboxRow>(
        `select m.id, m.email, c.refresh_token
           from public.mailboxes m
           join public.mailbox_credentials c on c.mailbox_id = m.id`,
      );
      // R10: one provider per connected mailbox; the sweep resolves the one
      // that owns each enrollment's sending identity. A mailbox with no
      // credentials — or a token this deployment cannot open — simply has no
      // provider, and its work defers; the inbound job above has already
      // named the broken one.
      const providers = new Map<string, GmailProvider>();
      for (const mb of rows) {
        try {
          providers.set(mb.id, new GmailProvider({
            tokenSource: new RefreshTokenSource(
              { clientId, clientSecret }, await refreshTokenFor(pool, mb)),
            senderDomain: mb.email.split("@")[1] ?? "getvantrow.com",
          }));
        } catch (err) {
          errors.push(`sweep(${mb.email}): ${String(err).slice(0, 300)}`);
        }
      }
      report.sweep = await sweepOnce(pool, (mailboxId) => providers.get(mailboxId));
    } else {
      report.sweep = "skipped: Gmail credentials not configured";
    }
  } catch (err) {
    errors.push(`sweep: ${String(err).slice(0, 300)}`);
  }

  // --- 4 · Connect outbox ------------------------------------------------
  try {
    report.connect = await drainOutbox(pool);
  } catch (err) {
    errors.push(`connect: ${String(err).slice(0, 300)}`);
  }

  // Log the report as well as returning it: an operator reading Vercel's log
  // list should see what the heartbeat DID without expanding a row or curling
  // the endpoint. Errors go to console.error so Vercel's Error filter counts
  // them.
  if (errors.length > 0) {
    console.error("[tick] partial failure", JSON.stringify({ ...report, errors }));
    return NextResponse.json({ ...report, errors }, { status: 207 });
  }
  console.log("[tick]", JSON.stringify(report));
  return NextResponse.json(report);
}
