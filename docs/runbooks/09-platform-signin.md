# Runbook 09 — Turn on sign-in for the platform app

**Owner:** Andrew (Supabase + Vercel consoles) · **Prepared:** 2026-08-10 ·
**Why:** the product surfaces (Activity home, Sequences, Prospects, Settings)
are live, and they show real prospect data on a public URL. Until this runbook
is done every one of them redirects to `/signin` and the sign-in page says
which variable is missing — the app is **locked, not broken**.

The cron endpoint is unaffected: it authenticates with `CRON_SECRET` and keeps
running whether or not sign-in is configured.

**Three variables and two clicks.** Ten minutes, no cost, no new services —
Supabase Auth is already part of the project you are using for the database.

## §1 · Get the two Supabase values

Supabase dashboard → your project → **Project Settings → API**.

| Vercel variable | What to copy |
|---|---|
| `SUPABASE_URL` | **Project URL** — `https://tbphmlrapkgqmklhsnyi.supabase.co` |
| `SUPABASE_ANON_KEY` | the **anon / public** key (the long one labelled `anon`) |

Two things worth knowing:

- **The anon key is not a secret in the usual sense** — it is designed to be
  public and RLS is what protects the data. We still keep it server-side (no
  `NEXT_PUBLIC_` prefix) because this app never needs it in a browser.
- **Do NOT copy the `service_role` key.** Nothing here wants it, and it
  bypasses RLS.

## §2 · The third value: `AUTH_SECRET`

This one is ours, not Supabase's — it signs the session cookie. Any long random
string works. Generated for you:

```
84fa6e6e8fec4ddfde755b4e24225e9a12189b6ee10bdc58094ec0d711a461a4
```

(Or mint your own with `openssl rand -hex 32`.) Changing it later is harmless:
it signs everyone out, nothing else.

## §3 · Add them in Vercel

`nudgerow-platform` → Settings → Environment Variables → **Production and
Preview** ticked on each:

| Name | Value |
|---|---|
| `SUPABASE_URL` | from §1 |
| `SUPABASE_ANON_KEY` | from §1 |
| `AUTH_SECRET` | from §2 |

Or from a terminal:

```bash
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_ANON_KEY production
npx vercel env add AUTH_SECRET production
```

**Redeploy after adding them** — Vercel only picks up new variables on a new
deployment.

## §4 · Tell Supabase where the link may land (the step people miss)

Supabase dashboard → **Authentication → URL Configuration**.

1. **Site URL:** your platform domain, e.g. `https://nudgerow-platform.vercel.app`
   (or `https://app.nudgerow.com` once that domain points here).
2. **Redirect URLs → Add URL:** `https://<your-platform-domain>/auth/callback`

If the callback URL is not on that list, Supabase silently sends you to the
Site URL instead and the link appears to "do nothing". That is the single most
common failure here.

Preview deploys get a different hostname each time; add
`https://nudgerow-platform-*.vercel.app/auth/callback` as a wildcard entry if
you want previews to sign in too, or just use production.

## §5 · Sign in

1. Open `https://<your-platform-domain>/` → it redirects to `/signin`.
2. Enter **`andrew@getvantrow.com`** and submit.
3. Check that inbox, click the link, and you land on the Activity home.

**Who is allowed in.** An address gets a link only if it is either (a) already
a connected sending mailbox in a workspace — which `andrew@getvantrow.com`,
`andrew@eaverow.com` and `andrew@parcelrow.com` all are — or (b) listed in the
optional `NUDGEROW_ALLOWED_EMAILS` variable (comma-separated). Anything else
gets the same "check your inbox" answer and **no mail is sent**: no address
enumeration, and no stray auth users. First sign-in joins you to the workspace
as `owner`; after that, membership is the rule.

To sign in with a personal address instead, add it:

```
NUDGEROW_ALLOWED_EMAILS=andrewbrown2017@gmail.com
```

(That key only opens a workspace when exactly one exists, which is true today.)

## §6 · Optional: `APP_ORIGIN`

The callback URL is derived from the incoming request, which is correct on
Vercel. Set `APP_ORIGIN` (e.g. `https://app.nudgerow.com`) only if you put the
app behind a proxy that rewrites the host header, or if links start arriving
with the wrong domain.

## §7 · Troubleshooting

- **"Sign-in is not configured yet: … unset."** — exactly what it says; §3 and
  redeploy.
- **The link opens the sign-in page again, with no error.** — §4. The callback
  URL is not in Supabase's redirect allow-list.
- **"Open the link in the same browser you asked for it from."** — the PKCE
  verifier cookie lives in the browser that requested the link. Request a new
  one where you will open it.
- **"That address is signed in but is not a member of any workspace."** — the
  address passed §5's check but matched no workspace. Either use a mailbox
  address, or add it to `NUDGEROW_ALLOWED_EMAILS`.
- **No email arrives.** Supabase's built-in SMTP is rate-limited (a handful of
  messages per hour) and is for development volumes. For the dogfood operator
  that is plenty; a real user base needs a custom SMTP provider configured under
  Authentication → Emails.
- **Rotating anything.** `AUTH_SECRET` signs everyone out. The anon key and
  project URL come from §1 if they ever change. None of it touches the engine —
  the cron keeps sending throughout.
