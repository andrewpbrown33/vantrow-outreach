# Runbook 08 — Deploy the platform app + the minute heartbeat

**Owner:** Andrew (Vercel console) · **Prepared:** 2026-08-09 · **Why:** until
this runs, the engine only moves when someone calls it by hand. After it,
sending, inbound sync, and Connect delivery are automatic.

`apps/platform` is a second Vercel project in the same repo (the site is the
first). Its only live route today is the cron endpoint; product surfaces land
next.

## §1 · Create the project

1. Vercel → **Add New → Project** → import `andrewpbrown33/vantrow-outreach`.
2. **Root Directory: `apps/platform`** (this is the important one).
3. Framework preset: Next.js. Build/output settings: defaults.
4. Project name: `nudgerow-platform`. Create — the first deploy will fail
   until §2 adds env vars; that's expected.

## §2 · Environment variables

Four values. Three you can copy straight from here; only the database string
needs looking up.

### Where the database string lives (this trips people up)

**NOT** in Settings → Database (that page is pooler *configuration* and
logging). It's behind the green **Connect** button at the **top of the
dashboard**, beside the project/branch name.

1. Click **Connect**.
2. The modal opens on the **Framework** tab — that is a client-library code
   generator, NOT what we need. Click the third tab: **Direct — "Connection
   string"** (database icon).
3. That tab lists **Direct connection**, **Transaction pooler**, and **Session
   pooler**. **Copy the Transaction pooler one** — its host contains
   `pooler.supabase.com` and it ends `:6543/postgres`. Serverless opens many
   short-lived connections, which is exactly what that pooler exists for.
   (The direct `db.<ref>.supabase.co:5432` string also works if you can't find
   the pooler; switching later is a one-variable edit.)
4. Replace `[YOUR-PASSWORD]` with the database password. Don't know it?
   Settings → Database → **Reset database password** (it is NOT your Supabase
   login password).

The result looks like:

```
postgresql://postgres.abcdefghijklm:REAL-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**You do NOT need the $4/mo IPv4 add-on.** If the modal shows a *Dedicated*
pooler string (`db.<ref>.supabase.co:6543`) and warns "Transaction pooler uses
IPv6 by default / Enable IPv4 add-on", flip the **"Use IPv4 connection"**
toggle just above the Type selector instead — it switches to the **shared**
pooler, which is free and reaches Vercel over IPv4. The host then becomes
`aws-0-<region>.pooler.supabase.com` and the username gains the project ref
(`postgres.<ref>`). Vercel functions need IPv4, so the shared pooler is the
right choice on the merits, not just the cheap one.

If the database password contains special characters, percent-encode them in
the URI (`@` → `%40`, `#` → `%23`, `/` → `%2F`) — or reset it to something
alphanumeric and avoid the problem.

### The four variables

In Vercel → the `nudgerow-platform` project → Settings → Environment
Variables. Add each with **Production and Preview** both ticked.

| Name | Where it comes from |
|---|---|
| `SUPABASE_DB_URL` | the Transaction-pooler string above |
| `CRON_SECRET` | any long random string — `openssl rand -hex 32`, or use the one the agent generated for you |
| `GOOGLE_OAUTH_CLIENT_ID` | `517832856056-pamqalipsibcm05j5j32du018qmbe8dd.apps.googleusercontent.com` (public by design; also in runbook 07 §5) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | **not in the repo** — Andrew's password manager. Lost it? Console → APIs & Services → Credentials → `nudgerow-connect` → **Reset secret**, then update this one variable. Nothing else breaks; connected mailboxes keep working. |

Both live at
https://console.cloud.google.com/apis/credentials?project=nudgerow-dogfood
→ **OAuth 2.0 Client IDs** → `nudgerow-connect`. Google shows a client secret
only once at creation, so if it was never saved, resetting is the path — not
a lookup.

**None may be prefixed `NEXT_PUBLIC_`** — that prefix ships a value to the
browser, and all four are server secrets.

> **Sign-in needs three more (runbook 09).** These four run the engine. The
> product surfaces additionally need `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
> `AUTH_SECRET`; without them every surface redirects to a sign-in page that
> names what is missing, while the cron below keeps running normally.

### Faster: the Vercel CLI

If you'd rather not click through the console four times:

```bash
npx vercel link            # pick the nudgerow-platform project, once
npx vercel env add SUPABASE_DB_URL production
npx vercel env add CRON_SECRET production
npx vercel env add GOOGLE_OAUTH_CLIENT_ID production
npx vercel env add GOOGLE_OAUTH_CLIENT_SECRET production
```

Each prompts for the value and reads it without echoing to screen — better
for secrets than pasting into a browser field. Repeat with `preview` in place
of `production` if you want preview deploys working too.

## §3 · The cron

`apps/platform/vercel.json` already declares it:

```json
{ "crons": [{ "path": "/api/cron/tick", "schedule": "* * * * *" }] }
```

Vercel picks this up on deploy. Verify: Project → **Cron Jobs** shows
`/api/cron/tick` every minute. (Hobby plans limit cron frequency; if the
console rejects one-minute, use `*/5 * * * *` — the engine's granularity is
minutes and sends land inside hours-wide windows, so a 5-minute heartbeat
costs nothing but freshness.)

## §4 · Verify it works

**You do not need a terminal.** The cron fires itself every minute — read the
result in **Vercel → the `nudgerow-platform` project → Logs**, filtered to
`/api/cron/tick`. Each invocation shows its status code and the JSON report.
(The **Cron Jobs** tab shows the schedule and last-run status.)

To trigger it on demand instead:

```bash
# macOS / Linux
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-platform-domain>/api/cron/tick | jq
```

```powershell
# Windows PowerShell — use curl.exe; bare `curl` is an alias for
# Invoke-WebRequest and handles the header differently
curl.exe -H "Authorization: Bearer <CRON_SECRET>" https://<your-platform-domain>/api/cron/tick
```

A healthy tick returns 200 and a report like:

```json
{
  "at": "2026-08-09T22:31:00.000Z",
  "inbound": { "andrew@getvantrow.com": { "fetched": 3, "processed": 3, "mode": "history" } },
  "sweep": { "claimed": 0, "sent": 0, "deferred": 0, "skipped": 0, "failed": 0 },
  "connect": { "attempted": 0, "delivered": 0, "retrying": 0, "deadLettered": 0, "skipped": 0 }
}
```

- **401** — `CRON_SECRET` mismatch (or unset, which locks the route by design).
- **207** — some job failed; the `errors` array names which. The other jobs
  still ran: a Gmail outage must never stop Connect delivery.
- **"skipped: … not configured"** — that job's env vars are missing.

## §5 · Preconditions (do these first)

1. Migrations applied to prod Supabase, in order: `0002`, `0003`, `0004`,
   `0005`, then `bootstrap-dogfood.sql` (runbook 07 §6a). **Added 2026-08-16:
   `0006_reply_subjects.sql`** — one `alter table`, applies in seconds, same
   SQL-editor procedure as the others (runbook 04 §2 shows the clicks).
   Without it every send fails with `column "sent_subject" does not exist`;
   nothing is lost (failures re-arm with a 15-minute backoff), but nothing
   sends until it runs. **Added 2026-08-22: `0007_draft_approval.sql` and
   `0008_unsubscribe_and_rpc_lockdown.sql`** — same procedure, run after
   `0006`, both idempotent. `0007` closes the draft-first dead end; `0008`
   revokes public RPC execute on the two security-definer engine functions
   and teaches inbound classification the `unsubscribe` value the engine now
   writes. Apply all three in one SQL-editor sitting.
2. At least one mailbox connected (runbook 07 §6) — otherwise the sweep has
   no provider and defers everything with `mailbox_not_connected`.

## §6 · Operating notes

- **Token expiry (test mode):** refresh tokens die after ~7 days. The symptom
  is a 207 with `inbound(...)` errors, and `mailbox_credentials
  .last_refresh_error` filled in — the tick writes it there deliberately so a
  dead mailbox is visible rather than silent. Fix = reconnect (runbook 07 §6).
- **Nothing sends without enrollments.** An idle tick reporting all zeros is
  the engine working correctly, not a failure.
- **Cost posture:** the tick is one small function invocation per minute plus a
  few short queries. Per-org COGS counters increment on every provider call
  (program overlay), so spend is attributable from day one.
