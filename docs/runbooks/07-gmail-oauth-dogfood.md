# Runbook 07 — Gmail OAuth app, dogfood test mode (workstream B3)

**Owner:** Andrew (console steps) · **Prepared:** 2026-08-08 · **Gate 4 record:**
Gmail API direct, first; dogfood runs in OAuth **test mode** (≤100 test users, no
verification wait). The **restricted-scope verification + CASA clock** is already
running in the long-lead register and gates *commercial* Gmail connections — not
this dogfood setup.

Every step below happens in the Google Cloud console; nothing here requires code.
When you finish §1–§4, hand the agent the two values in §5 and connect mailboxes
with §6.

## §0 · Which Google account does all this? (read first)

**Sign in as an account you already have — `andrew@getvantrow.com` is the right
choice.** The Cloud project owner is just an admin identity: it does NOT have to
be a nudgerow.com account, and **nothing in this runbook requires creating any
new Google account**. The sending mailboxes (§3's test users, §6's connects)
are your three EXISTING Workspace mailboxes (getvantrow / eaverow / parcelrow —
the Gate 4 record).

`andrew@nudgerow.com` plays no role in dogfood sending. If Google's signup flow
blocked you creating it ("phone number used too many times"), stop — you don't
need it here, and when you do want that address, §8b gets it with **no phone
verification at all**.

**Cost: zero.** No subscription, no billing account, no free trial. Ignore
every "$300 credits / Try for free / Start free" banner — those sell compute
products this runbook never touches. Gmail-API OAuth in test mode is free.

**Fastest path (skips the org picker entirely):** open Cloud Shell (the `>_`
icon in the console top bar) and paste:

```bash
ORG=$(gcloud organizations list --format='value(name)' 2>/dev/null | head -1 | tr -dc 0-9)
if [ -n "$ORG" ]; then gcloud projects create nudgerow-dogfood --organization="$ORG"; else gcloud projects create nudgerow-dogfood; fi
gcloud config set project nudgerow-dogfood
gcloud services enable gmail.googleapis.com
```

That covers §1–§2. Then three direct links finish the UI part:
consent screen → https://console.cloud.google.com/auth/overview?project=nudgerow-dogfood
("Get started": name `Nudgerow`, External, stay in Testing) · test users →
https://console.cloud.google.com/auth/audience?project=nudgerow-dogfood (add
the three mailboxes) · client →
https://console.cloud.google.com/auth/clients/create?project=nudgerow-dogfood
(**Desktop app**) — then copy the Client ID + secret (§5).

## §1 · Project

1. https://console.cloud.google.com → project picker → **New project**.
2. Name: `nudgerow-dogfood`. **Parent resource:** signing in with a Workspace
   account makes the console auto-create your domain's Organization
   ("Created getvantrow.com organization…") and then REQUIRE a parent — click
   **Browse** and select the **getvantrow.com organization**. No folder needed.
   Picker quirks: its search box filters FOLDERS only — **leave it empty** and
   the org shows as the root row; and a just-created org can lag ("No
   resources to display") — reload the New Project page and Browse again.
   If only a "No organization" row appears (warning triangle) and **Select
   stays grayed** — Workspace accounts must parent under their real org, and
   the picker hasn't caught up. **Bypass the picker with Cloud Shell** (the
   `>_` icon in the console's top bar):

   ```bash
   gcloud organizations list                     # shows the org + its ID
   gcloud projects create nudgerow-dogfood --organization=ORG_ID
   gcloud config set project nudgerow-dogfood
   gcloud services enable gmail.googleapis.com   # this IS §2 — skip to §3
   ```

   If `organizations list` prints nothing, the new org hasn't propagated:
   retry in a fresh incognito session first, else wait ~15 minutes and rerun.
3. The org is only the project's resource-hierarchy home; it does not limit
   which mailboxes can connect. But it changes §3: the console will now offer
   **User type: Internal** — see the warning there.

## §2 · Enable the Gmail API

1. **APIs & Services → Library** → search "Gmail API" → **Enable**.

## §3 · OAuth consent screen (test mode — this is the important part)

1. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding
   on newer consoles).
2. User type: **External** → Create. **Do NOT pick Internal**, even though it
   advertises "no verification": Internal restricts sign-in to getvantrow.com
   Workspace users only, which would lock out `andrew@eaverow.com` and
   `andrew@parcelrow.com` (different Workspace domains). External + Testing is
   the required combination.
3. App name `Nudgerow` · support email + developer email: your address.
   No logo (a logo can trigger early review), no scopes on this page yet.
4. **Audience / Publishing status: leave in `Testing`. Do NOT publish.**
   Test mode is what lets us run unverified with restricted scopes.
5. **Test users → Add users** — add exactly the sending mailboxes:
   - `andrew@getvantrow.com`
   - `andrew@eaverow.com`
   - `andrew@parcelrow.com`
   (≤100 allowed; add future dogfood mailboxes here the same way.)

Note: in test mode Google expires refresh tokens after **7 days** ONLY for apps
whose consent screen is unverified AND uses certain sensitive scope sets — Gmail
restricted scopes fall under this. Practical consequence: dogfood mailboxes may
need re-connecting weekly (re-run §6) until verification. This is the documented
cost of test mode; the CASA/verification track removes it later.

## §4 · OAuth client

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Desktop app** (the connect script uses the loopback
   redirect, which Desktop clients allow without registering URLs).
3. Name: `nudgerow-connect`. Create.
4. Copy the **Client ID** and **Client secret**.

## §5 · Hand-off values

Give the agent (or put in the deploy env when the platform app exists):

| Env var | Value |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | from §4 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | from §4 |

Secrets live in env/Vercel project settings — never in the repo.

> **Status 2026-08-08: DONE.** Client created in project `nudgerow-dogfood`
> (Desktop app). Client ID (public by design):
> `517832856056-pamqalipsibcm05j5j32du018qmbe8dd.apps.googleusercontent.com`.
> The secret lives only in Andrew's env — rotate anytime via Credentials →
> the client → Reset secret; only the env value changes.

## §6a · Database prep (once, before the first connect)

In the Supabase SQL editor, three pastes in order (each idempotent):
1. `supabase/migrations/0002_engine_substrate.sql`
2. `supabase/migrations/0003_gmail_adapter.sql`
3. `supabase/bootstrap-dogfood.sql` — creates the dogfood workspace + the
   three mailbox rows the credential upsert attaches to.

## §6 · Connect a mailbox (per mailbox, repeatable)

On any machine with node 22+ and this repo:

```bash
GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... \
  node scripts/gmail-connect.mjs andrew@getvantrow.com
```

1. Open the printed URL **in a browser signed in as that mailbox**, approve the
   two scopes (`gmail.send`, `gmail.readonly`).
2. The script finishes itself and prints a `psql` block; run it against the
   Supabase project **with the service-role connection** — it upserts
   `mailbox_credentials` for that mailbox. (The mailbox row itself must exist
   in `public.mailboxes` first.)
3. Repeat per mailbox (getvantrow / eaverow / parcelrow).

## §7 · What this unlocks / what still gates

- Unlocked: the engine's `GmailProvider` can send as connected mailboxes and
  sync their inboxes (replies → stop-on-reply; OOO → pause with return date;
  bounces → suppress + halt).
- Still gated elsewhere: the minute cron endpoint rides the platform app
  scaffold (workstream C); **commercial** connections (anyone outside the test
  users) wait on the restricted-scope verification + CASA assessment already on
  the long-lead register.

## §8 · Troubleshooting & the andrew@nudgerow.com question

- **"Phone number has been used too many times" at Google signup.** Google
  rate-limits phone verification across account creations; the limit decays
  over days (not hours) and rejects most VoIP numbers outright. But per §0, no
  step in this runbook needs a new Google account — if you hit this while
  creating `andrew@nudgerow.com`, abandon that flow and use §8b when the
  address is actually wanted.
- **§8b · The right way to mint andrew@nudgerow.com** (when wanted): add
  `nudgerow.com` as a **secondary domain** on a Google Workspace tenant you
  already admin — Admin console → Account → Domains → Manage domains → **Add a
  domain** → verify via the TXT record (nudgerow.com DNS lives in Vercel,
  registered at Gate 2) → then either create the user `andrew@nudgerow.com`
  (one paid seat) or add it as a free **email alias** on your existing user
  (receives immediately; configure "Send mail as" for outbound). **No phone
  verification exists anywhere in that flow.**
- **Why that address matters soon regardless of B3:** the live site publishes
  `andrew@nudgerow.com` as the support contact (footer, pricing, privacy,
  terms, the early-access form, llms.txt, JSON-LD) and it is the waitlist
  notifier's default MAIL_FROM — until §8b (or a forwarder) exists, inbound
  mail to the published support address **bounces**. Standing operational flag;
  §8b closes it in ~10 minutes.
