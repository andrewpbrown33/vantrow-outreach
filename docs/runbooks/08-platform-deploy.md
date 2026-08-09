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

Add under Settings → Environment Variables (Production + Preview):

| Name | Value | Notes |
|---|---|---|
| `SUPABASE_DB_URL` | the **service-role** Postgres connection string | Supabase → Project Settings → Database → Connection string (URI). Use the **pooler** (port 6543) — serverless opens many short connections. |
| `CRON_SECRET` | a long random string | `openssl rand -hex 32`. Vercel sends it to the cron route as a bearer token. |
| `GOOGLE_OAUTH_CLIENT_ID` | from runbook 07 §4 | Without it, Gmail jobs skip (visible in the tick report). |
| `GOOGLE_OAUTH_CLIENT_SECRET` | from runbook 07 §4 | Server-only; never a `NEXT_PUBLIC_` name. |

**None of these may be prefixed `NEXT_PUBLIC_`** — that prefix ships a value
to the browser, and every one of these is a server secret.

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

After the deploy is green:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-platform-domain>/api/cron/tick | jq
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
   `0005`, then `bootstrap-dogfood.sql` (runbook 07 §6a).
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
