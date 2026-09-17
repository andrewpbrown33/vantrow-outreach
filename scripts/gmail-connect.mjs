#!/usr/bin/env node
// Break-glass mailbox connect (runbook 07 §6). The normal path is the Connect
// button on Settings (/api/gmail/connect); this exists for the day that
// button cannot be reached. It mints a refresh token through the loopback
// OAuth flow, verifies which Google account actually consented, and writes
// the credential straight to the database — sealed under MAILBOX_TOKEN_KEY,
// exactly as the button does.
//
// The token is never printed. A refresh token in a terminal scrollback, a
// chat transcript or a pasted SQL block is a standing grant to send as that
// mailbox, held by whatever holds the text. There is no "print it and paste
// it later" mode any more; without the database URL and the key the script
// refuses before it asks Google for anything.
//
//   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... \
//   SUPABASE_DB_URL=... MAILBOX_TOKEN_KEY=... \
//   pnpm exec tsx scripts/gmail-connect.mjs andrew@getvantrow.com
//
// tsx (a dev dependency of this repo), because the exchange, the identity
// check and the sealing are the engine's own code rather than a copy of it.

import { createServer } from "node:http";

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const dbUrl = process.env.SUPABASE_DB_URL;
const mailboxEmail = process.argv[2];
const PORT = Number(process.env.PORT ?? 8765);

if (!clientId || !clientSecret || !mailboxEmail) {
  console.error(
    "usage: GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... " +
    "SUPABASE_DB_URL=... MAILBOX_TOKEN_KEY=... " +
    "pnpm exec tsx scripts/gmail-connect.mjs <mailbox-email>",
  );
  process.exit(1);
}
if (!dbUrl) {
  console.error(
    "SUPABASE_DB_URL is not set. This script writes the credential to the " +
    "database itself and never prints it — set the service-role connection " +
    "string (runbook 08 §2) and re-run.",
  );
  process.exit(1);
}

const { GMAIL_SCOPES, buildAuthUrl, exchangeCode, grantedAddress } =
  await import("../packages/engine/src/gmail/oauth.ts");
const { TOKEN_KEY_ENV, encryptToken, loadTokenKey } =
  await import("../packages/engine/src/gmail/token-crypto.ts");

// Before Google is asked for anything: the key this credential will be
// sealed under must be the one the platform runs with, or the heartbeat
// cannot open what this writes.
const key = loadTokenKey();
if (!key) {
  console.error(
    `${TOKEN_KEY_ENV} is not set — the credential would be written in ` +
    "plaintext. Use the same key the platform runs with (runbook 08 §2).",
  );
  process.exit(1);
}

const redirectUri = `http://127.0.0.1:${PORT}/callback`;
const authUrl = buildAuthUrl({ clientId, redirectUri, loginHint: mailboxEmail });

console.log("\n1) Open this URL in a browser signed in as " + mailboxEmail + ":\n");
console.log("   " + authUrl + "\n");
console.log(`2) Approve; the browser will land on 127.0.0.1:${PORT} and this`);
console.log("   script will finish on its own.\n");

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", redirectUri);
    if (url.pathname !== "/callback") { res.writeHead(404).end(); return; }
    const err = url.searchParams.get("error");
    const c = url.searchParams.get("code");
    res.writeHead(200, { "content-type": "text/plain" });
    res.end(err ? `Connect failed: ${err}` : "Connected. You can close this tab.");
    server.close();
    if (err) reject(new Error(err)); else resolve(c);
  });
  server.listen(PORT, "127.0.0.1");
});

const grant = await exchangeCode({ clientId, clientSecret }, code, redirectUri);
if (!grant.refreshToken) {
  console.error(
    "Google returned no refresh token — the account is probably already " +
    "authorised. Remove Nudgerow at myaccount.google.com/permissions and re-run.",
  );
  process.exit(1);
}
const missing = GMAIL_SCOPES.filter((s) => !grant.scopes.includes(s));
if (missing.length > 0) {
  console.error(`consent came back without: ${missing.join(" ")} — re-run and leave every box ticked`);
  process.exit(1);
}

// login_hint only pre-fills the chooser. The same check the button makes:
// the account that consented must be the address on the mailbox row.
const granted = await grantedAddress(grant.accessToken);
if (!granted || granted.toLowerCase() !== mailboxEmail.toLowerCase()) {
  console.error(
    `that consent was for ${granted ?? "an unreadable account"}, not ${mailboxEmail}. ` +
    "Nothing was saved. Sign out of the other Google account and re-run.",
  );
  process.exit(1);
}

// Imported only now, so a refused run touches no database at all.
const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString: dbUrl, max: 2 });
try {
  const mb = await pool.query(
    "select id, workspace_id from public.mailboxes where lower(email) = lower($1)",
    [mailboxEmail]);
  if (mb.rowCount === 0) {
    throw new Error(
      `no mailbox row for ${mailboxEmail} — create it in public.mailboxes first ` +
      "(supabase/bootstrap-dogfood.sql), then re-run");
  }
  const { id: mailboxId, workspace_id: workspaceId } = mb.rows[0];
  await pool.query(
    `insert into public.mailbox_credentials
       (mailbox_id, workspace_id, refresh_token, access_token,
        access_token_expires_at, scopes, last_refresh_error)
     values ($1, $2, $3, $4, $5, $6, null)
     on conflict (mailbox_id) do update
        set refresh_token = excluded.refresh_token,
            access_token = excluded.access_token,
            access_token_expires_at = excluded.access_token_expires_at,
            scopes = excluded.scopes,
            connected_at = now(),
            last_refresh_error = null,
            updated_at = now()`,
    [mailboxId, workspaceId,
     encryptToken(grant.refreshToken, key), encryptToken(grant.accessToken, key),
     new Date(grant.expiresAt), grant.scopes]);
  await pool.query(
    `insert into public.events (workspace_id, type, mailbox_id, payload)
     values ($1, 'mailbox.connected', $2, $3)`,
    [workspaceId, mailboxId, { email: mailboxEmail, by: "scripts/gmail-connect.mjs" }]);
  console.log(`Connected ${mailboxEmail}. The credential is stored, sealed; nothing to paste.`);
} finally {
  await pool.end();
}
