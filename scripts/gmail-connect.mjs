#!/usr/bin/env node
// Dogfood mailbox connect (runbook 07): mints a Gmail refresh token via the
// loopback OAuth flow and prints the SQL that stores it. Zero dependencies —
// run from anywhere with node 22+. The platform app owns the real connect UI
// later (workstream C); this is the operator path until then.
//
//   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... \
//   node scripts/gmail-connect.mjs andrew@getvantrow.com
//
// Then run the printed psql against the Supabase project (service role).

import { createServer } from "node:http";

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const mailboxEmail = process.argv[2];
const PORT = Number(process.env.PORT ?? 8765);

if (!clientId || !clientSecret || !mailboxEmail) {
  console.error(
    "usage: GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... " +
    "node scripts/gmail-connect.mjs <mailbox-email>",
  );
  process.exit(1);
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];
const redirectUri = `http://127.0.0.1:${PORT}/callback`;

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    login_hint: mailboxEmail,
  }).toString();

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

const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }).toString(),
});
const grant = await tokenRes.json();
if (!tokenRes.ok || !grant.refresh_token) {
  console.error("token exchange failed:", JSON.stringify(grant, null, 2));
  process.exit(1);
}

console.log("Refresh token minted. Store it with the SERVICE ROLE (never a client):\n");
console.log(
  `psql "$SUPABASE_DB_URL" <<'SQL'
insert into public.mailbox_credentials
  (mailbox_id, workspace_id, refresh_token, scopes)
select m.id, m.workspace_id, '${grant.refresh_token}', array[${SCOPES.map((s) => `'${s}'`).join(",")}]
  from public.mailboxes m
 where lower(m.email) = lower('${mailboxEmail}')
on conflict (mailbox_id) do update
  set refresh_token = excluded.refresh_token,
      scopes = excluded.scopes,
      connected_at = now(),
      last_refresh_error = null,
      updated_at = now();
SQL`,
);
console.log(
  "\n(If no row was inserted, the mailbox doesn't exist yet — create it in " +
  "public.mailboxes first, then re-run the SQL.)",
);
