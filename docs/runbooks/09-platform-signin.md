# Runbook 09 — Turn on sign-in for the platform app

**Owner:** Andrew (Supabase + Vercel consoles) · **Prepared:** 2026-08-10 ·
**Why:** the product surfaces (Activity home, Sequences, Prospects, Settings)
are live, and they show real prospect data on a public URL. Until this runbook
is done every one of them redirects to `/signin` and the sign-in page says
which variable is missing — the app is **locked, not broken**.

The cron endpoint is unaffected: it authenticates with `CRON_SECRET` and keeps
running whether or not sign-in is configured.

**Three variables, one email provider, two clicks.** Supabase Auth is already
part of the project you use for the database, but its built-in *email sender*
cannot carry this app — see **§2b**, which is required, free, and about ten
minutes. Everything here costs nothing.

## §1 · Get the two Supabase values

Supabase dashboard → your project → **Project Settings → API**.

| Vercel variable | What to copy |
|---|---|
| `SUPABASE_URL` | **Project URL** — `https://tbphmlrapkgqmklhsnyi.supabase.co`, and **nothing after `.co`** |
| `SUPABASE_ANON_KEY` | the **anon / public** key (the long one labelled `anon`) |

> **The `/rest/v1` trap (hit live 2026-08-10).** The same page also shows a
> **RESTful endpoint**, `https://<ref>.supabase.co/rest/v1`. Pasting that into
> `SUPABASE_URL` sends every auth call to the database API instead of the auth
> server, and sign-in fails with a cryptic
> `PGRST125 · Invalid path specified in request URL`. The app now normalises
> the value to the project origin, so either form works — but the URL with no
> path is the one to paste.

Two things worth knowing:

- **The anon key is not a secret in the usual sense** — it is designed to be
  public and RLS is what protects the data. We still keep it server-side (no
  `NEXT_PUBLIC_` prefix) because this app never needs it in a browser.
- **Do NOT copy the `service_role` key.** Nothing here wants it, and it
  bypasses RLS.

## §2 · The third value: `AUTH_SECRET`

This one is ours, not Supabase's — it signs the session cookie. Mint one:

```bash
openssl rand -hex 32
```

Paste the output straight into Vercel (§3) and keep a copy in your password
manager. **It does not go in this file** — the same rule as every other secret
here (runbook 08 §2). Changing it later is harmless: it signs everyone out,
nothing else.

> An earlier draft of this runbook printed a generated value inline. That was
> wrong by our own rule and the value is not in use; if you already pasted it
> into Vercel, replace it with a fresh `openssl rand -hex 32`.

## §2b · Custom SMTP — do this, it is not optional

**Supabase's built-in email sender cannot run this app.** Three separate
limits, each of which blocks us (hit live 2026-08-13, symptom:
`500 unexpected_failure · "Error sending magic link email"`):

| Limit | What it does to us |
|---|---|
| Delivers **only to members of your Supabase organization** | your sign-in address is refused unless it happens to be your Supabase login |
| Rate-limited to a handful per hour | fine for one operator, useless past that |
| **Since 3 June 2026, new free-tier projects on the default sender cannot edit auth email templates** | §4a's template edit — the whole cross-device fix — silently will not stick |

That third one is the trap: the project was created in August 2026, so it is
on the wrong side of that date. §4a cannot work until custom SMTP is on.
Configuring SMTP lifts all three at once.

### Which domain sends it — read before touching DNS

Use **nudgerow.com**, not getvantrow.com / eaverow.com / parcelrow.com.

> **A domain may carry only ONE SPF TXT record.** The sending domains are
> Google Workspace domains that already have `v=spf1 include:_spf.google.com`.
> If a provider's setup adds a *second* SPF record rather than merging into the
> existing one, **both become invalid** and the deliverability of the cold
> outreach this product exists to send degrades. Never risk an outreach domain
> for the sake of a login email.

`nudgerow.com` is the product's own domain, its DNS lives in Vercel, and it
carries no mail records yet — nothing to collide with. Auth mail arriving from
the product's own domain is also simply correct.

**No mailbox purchase is required.** A `From:` address on transactional mail
does not have to be a real mailbox — verify the *domain*, then send as
`noreply@nudgerow.com` even though nothing receives there. This is independent
of the `andrew@nudgerow.com` question in §2c.

### Steps (~10 minutes, free tier)

1. **[resend.com](https://resend.com)** → sign up → **Domains → Add Domain** →
   `nudgerow.com`.
2. Resend shows DNS records (DKIM `resend._domainkey`, an SPF/MX pair, usually
   scoped to a `send.` subdomain). Add them in **Vercel → Domains →
   nudgerow.com → DNS**. Wait for Resend to show **Verified**.
   - If Resend offers to put SPF on the **root** rather than a subdomain,
     prefer the subdomain. Root SPF on nudgerow.com is harmless today but
     becomes a merge problem the day §2c adds Workspace to that domain.
3. **API Keys → Create API Key** (sending permission is enough). Copy it — it
   is shown once.
4. Supabase → **Authentication → Emails → SMTP Settings** → enable custom SMTP:

   | Field | Value |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | the API key from step 3 |
   | Sender email | `noreply@nudgerow.com` |
   | Sender name | `Nudgerow` |

5. **Now go back and do §4a.** The template edit is unlocked once SMTP is
   custom, and it will not stick before that.

The API key is a secret: Supabase's SMTP settings and your password manager,
never this repo.

## §2c · `andrew@nudgerow.com`, and the phone-verification wall

**This does not block sign-in.** §2b needs DNS on nudgerow.com and a `From:`
header — no Google account, no mailbox. Do §2b today regardless of where this
lands.

The wall: Google rate-limits phone verification across account creations, the
limit decays over days, and it rejects most VoIP numbers. Fighting it is not
the answer, because **the flow that needs a phone is the wrong flow.**

**Do this instead — no phone verification exists anywhere in it:** add
`nudgerow.com` as a **secondary domain** on the Google Workspace tenant you
already administer (getvantrow.com), then create `andrew@nudgerow.com` there
as a user (one paid seat) or as a free **alias** on your existing user.

Admin console → **Account → Domains → Manage domains → Add a domain** → verify
by TXT record (nudgerow.com DNS is in Vercel) → then Directory → Users.

> **If you already started a separate Workspace tenant for nudgerow.com**, the
> add will fail with *"domain already in use"* — a domain can belong to only
> one Workspace account at a time. Remove it from the new tenant first (Admin
> → Account → Domains → Remove), or cancel that subscription if it is inside
> the refund window, then add it as a secondary domain on the existing tenant.

Why it matters beyond convenience: the live site publishes
`andrew@nudgerow.com` as the support contact (footer, pricing, privacy, terms,
early-access form, llms.txt, JSON-LD), so until this exists, mail to the
published support address bounces. Standing operational flag, also tracked in
runbook 07 §8b.

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

## §4a · Make the link work from any device (do this one)

**Paste one line into the email template and §4's redirect list stops
mattering.** By default Supabase's magic link bounces the browser through its
own `/verify` endpoint and back to your app, which drags in two fragile things:
the redirect allow-list, and a one-time secret stored in the browser that
*requested* the link. Since people open magic links on their phone, from the
mail app, that second one fails constantly — and it is not the user's fault.

Supabase dashboard → **Authentication → Emails → Magic Link** → edit the
template body so the link is:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">Sign in to Nudgerow</a>
```

That points straight at `/auth/confirm`, which verifies the token server-side
with no cookie involved. It works from any device, in any browser, and never
touches the redirect allow-list.

You still need **Site URL** set correctly (§4 below) because `{{ .SiteURL }}`
is where the link points.

## §4 · Tell Supabase where the link may land (the step people miss)

**Do not skip this one.** A new Supabase project ships with **Site URL =
`http://localhost:3000`**, so until you change it the magic link points at a
machine that isn't there. The symptom is not an error page — it is a browser
that cannot connect at all, which reads like a broken deploy rather than a
missing setting. (Hit live 2026-08-10.)

Supabase dashboard → **Authentication → URL Configuration**.

1. **Site URL:** your platform domain, e.g. `https://nudgerow-platform.vercel.app`
   (or `https://app.nudgerow.com` once that domain points here).
2. **Redirect URLs → Add URL:** `https://<your-platform-domain>/auth/callback`

Both fields matter, and they fail differently:

| Wrong | What you get |
|---|---|
| Site URL still `localhost:3000` | the link goes nowhere — browser can't connect |
| Callback missing from Redirect URLs | Supabase silently falls back to Site URL; you land on the app root, not signed in |

After fixing either, **request a fresh link** — the one already in your inbox
is spent.

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

## §6 · `APP_ORIGIN` — required in production (changed 2026-09-16)

The sign-in link's callback used to be derived from the incoming request's
host headers. It no longer is in production: a URL that lands in someone's
inbox — and the Gmail `redirect_uri` that Google matches exactly — must come
from configuration, not from whoever sent the request. Set `APP_ORIGIN` to
`https://app.nudgerow.com` (no trailing slash) on the platform project,
alongside the §3 values; runbook 08 §2 lists it with the rest. Until it is
set, the sign-in page answers every request with a message naming it, and
the Connect button on Settings does the same. Local runs on `localhost`
still need nothing.

## §7 · Troubleshooting

- **"Sign-in is not configured yet: … unset."** — exactly what it says; §3 and
  redeploy. If it says `SUPABASE_URL (not a valid https URL)`, the value is
  missing its `https://` or is not a URL at all.
- **"The auth server refused: 404 … PGRST125 … Invalid path specified in
  request URL."** — `SUPABASE_URL` points at a path (almost always
  `/rest/v1`), so the call reached the database API instead of the auth
  server. Set it to the bare project URL and redeploy. See §1's trap note.
- **The link goes to a page that will not load** (address bar shows
  `localhost:3000`). — §4. Supabase's **Site URL** is still the factory
  default. Set it to the platform domain, then request a new link.
- **The link opens the sign-in page again, with no error.** — §4. The callback
  URL is not in Supabase's redirect allow-list.
- **"That link is missing its code. Ask for a new one."** — the redirect came
  back without `?code=`, which again points at §4: the allow-list rejected our
  callback and Supabase fell back to the Site URL.
- **"Open the link in the same browser you asked for it from."** — you are on
  the PKCE path (`/auth/callback`), which binds the link to the requesting
  browser. Either request the link from the device you will open it on, or —
  better — do **§4a** and the constraint disappears for good.
- **"That address is signed in but is not a member of any workspace."** — the
  address passed §5's check but matched no workspace. Either use a mailbox
  address, or add it to `NUDGEROW_ALLOWED_EMAILS`.
- **`500 unexpected_failure · "Error sending magic link email"`** — Supabase's
  built-in sender refused. Do **§2b**; that error is what the three built-in
  limits look like from the app's side. The `error_id` in the message resolves
  to the real reason in
  [Auth logs](https://supabase.com/dashboard/project/tbphmlrapkgqmklhsnyi/logs/auth-logs)
  if you want to see which of the three it was.
- **`"Email address not authorized"`** — the built-in sender only mails members
  of your Supabase organization. Also §2b.
- **The §4a template edit will not save, or saves and changes nothing.** Free
  tier + default sender cannot customise templates for projects created after
  3 June 2026. §2b first, then §4a.
- **No email arrives at all, custom SMTP configured.** Check the provider's own
  log (Resend → Emails) — the send left Supabase and failed downstream, which
  is usually an unverified domain or a `From:` address on a domain you have not
  verified there.
- **Rotating anything.** `AUTH_SECRET` signs everyone out. The anon key and
  project URL come from §1 if they ever change. None of it touches the engine —
  the cron keeps sending throughout.
