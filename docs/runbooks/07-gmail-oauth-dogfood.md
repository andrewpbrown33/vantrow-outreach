# Runbook 07 — Gmail OAuth app, dogfood test mode (workstream B3)

**Owner:** Andrew (console steps) · **Prepared:** 2026-08-08 · **Gate 4 record:**
Gmail API direct, first; dogfood runs in OAuth **test mode** (≤100 test users, no
verification wait). The **restricted-scope verification + CASA clock** is already
running in the long-lead register and gates *commercial* Gmail connections — not
this dogfood setup.

Every step below happens in the Google Cloud console; nothing here requires code.
When you finish §1–§4, hand the agent the two values in §5 and connect mailboxes
with §6.

## §1 · Project

1. https://console.cloud.google.com → project picker → **New project**.
2. Name: `nudgerow-dogfood` (any org/no org is fine). Create, then select it.

## §2 · Enable the Gmail API

1. **APIs & Services → Library** → search "Gmail API" → **Enable**.

## §3 · OAuth consent screen (test mode — this is the important part)

1. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding
   on newer consoles).
2. User type: **External** → Create.
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
