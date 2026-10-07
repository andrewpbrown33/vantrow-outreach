# Runbook 10 — The Gmail scopes: the free fix, then verification

**Owner:** Andrew (Google Workspace admin + Cloud console) · **Prepared:** 2026-09-23
· **Why:** the weekly reconnect chore, and what it would take to be rid of it
permanently.

Andrew asked on 23 Sep to "start the clock" on Google verification, on my framing
that the clock is long and the reconnect chore has no other cure. **Checking it
properly, that framing was wrong in a way worth money.** There is a free fix that
lands in five minutes, and it covers every mailbox he will connect this year.

## §1 · The free fix — mark the app Trusted in Workspace admin

The 7-day reconnect is not a property of being unverified. It is a property of the
OAuth consent screen's publishing status being **Testing**:

> "A Google Cloud Platform project with an OAuth consent screen configured for an
> external user type and a publishing status of 'Testing' is issued a refresh token
> expiring in 7 days"
> — [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2)

And a Google Workspace administrator can override exactly that, for users in domains
they administer, by marking the app **Trusted** in App access control. Doing so lifts
both the 100-test-user cap and the 7-day refresh-token expiry
([Manage App Audience](https://support.google.com/cloud/answer/15549945),
[Control which apps access Google Workspace data](https://support.google.com/a/answer/7281227)).

Andrew administers Workspace for **getvantrow.com, eaverow.com and parcelrow.com** —
all three have `smtp.google.com` MX records, and all three of his mailboxes are seeded
in `bootstrap-dogfood.sql`. So this covers every address the platform will send from
this year, plus every Vantrow staff member on those domains.

**The clicks:**

1. [admin.google.com](https://admin.google.com) → **Security → Access and data
   control → API controls**.
2. **Manage third-party app access** → **Add app → OAuth App Name Or Client ID**.
3. Search for the `nudgerow-dogfood` project's OAuth client. Add **both** clients —
   the existing Desktop one and the new `nudgerow-platform-web` one from the sitting.
4. Set access to **Trusted: Can access all Google services**.
5. Repeat for each domain you administer that will connect a mailbox, if they are
   separate Workspace accounts rather than domain aliases of one.

**What this does not do.** It is scoped to *your* organization. A genuine third-party
client, on their own Google account, is unaffected — they are governed by the consent
screen's own publishing status and by their own admin. That is the boundary where
verification finally becomes unavoidable, and it is §3.

## §2 · What we actually ask for, and what tier that puts us in

`GMAIL_SCOPES` in `packages/engine/src/gmail/oauth.ts`:

| Scope | Google's tier | Consequence |
|---|---|---|
| `.../auth/gmail.send` | **sensitive** | Verification (brand review). No security assessment. |
| `.../auth/gmail.readonly` | **restricted** | Verification **plus** a third-party CASA security assessment, repeated annually, paid. |

`gmail.readonly` is the expensive one, and it is load-bearing rather than incidental:
the engine reads the sending mailbox to detect replies, bounces, out-of-office and
unsubscribes. "A reply stops the sequence" is the product's central safety promise
(invariant I2) and it is implemented by reading the inbox. There is no cheaper scope
that still carries message bodies — bounce classification parses
`message/delivery-status` parts and opt-out detection reads prose, neither of which
survives a metadata-only scope.

**The one architecture that would drop the restricted scope**, for the record, because
it will come up again: set `Reply-To:` to a Nudgerow-controlled address, receive
replies through an inbound-email webhook, and make Gmail send-only. That would leave
`gmail.send` alone — sensitive, no CASA. **I recommend against it for this product.**
A prospect who hits reply on the *From* address rather than the Reply-To would be
invisible to the engine, and an undetected reply means we keep mailing someone who
answered. Trading the core safety promise for an assessment fee is the wrong way
round. Worth revisiting only if CASA ever becomes a genuine blocker.

## §3 · When verification actually becomes necessary

Not on a date — on an event. **The first client who connects their own inbox from
their own Google account.** Until then §1 covers everyone.

Concretely, verification is needed when any of these becomes true:

- a client outside Andrew's Workspace domains connects a mailbox;
- more than 100 people total need to authorize (the Testing cap, which §1 lifts only
  for your own organization);
- the unverified-app warning screen becomes something you cannot ask a customer to
  click through — which, for a paying client, is roughly immediately.

That last one is the real trigger. Andrew and staff clicking "Advanced → Go to
Nudgerow (unsafe)" once is fine. Asking a roofing company's owner to do it is not.

**Lead time is still the reason to start early**, and that has not changed — CASA is
weeks of calendar time plus an assessor's queue. The recommendation is just narrower
than "start now regardless": **start it when a first client is in sight**, and let §1
carry the dogfood period for free. The prep in §4 and §5 is written and costs nothing
to hold.

## §4 · The blocker in our own repo

**`apps/site/src/app/privacy/page.tsx` does not mention Google or Gmail anywhere.**
It is also explicitly a placeholder — every section carries a `TODO(legal)` and the
page renders a "Draft — not yet in effect" banner. Google rejects verification on
this alone: the privacy policy must be live, in effect, and must disclose Google user
data handling by name.

This is counsel's, not mine (runbook 05 §4 already carries "website terms + privacy —
before launch"). What I can do is hand counsel the Google-specific language rather
than a blank page. **Draft for review, not legally reviewed:**

> **Google user data.** When you connect a Gmail mailbox to Nudgerow, you grant us
> access to that mailbox through Google OAuth. We request two permissions:
> *send email on your behalf* (`gmail.send`), used only to send the messages in
> sequences you have created and started; and *read your email* (`gmail.readonly`),
> used only to identify replies, bounces, out-of-office notices and unsubscribe
> requests relating to mail Nudgerow sent, so that we can stop sequences and honor
> opt-outs.
>
> We store the minimum needed to do that: the message identifiers, headers and
> classification of messages relevant to your campaigns. We do not read, index or
> store unrelated mail. Your Google OAuth refresh token is encrypted at rest with
> AES-256-GCM and is never displayed, logged or transmitted to any third party.
>
> **Limited Use.** Nudgerow's use and transfer of information received from Google
> APIs adheres to the
> [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
> including the Limited Use requirements. Specifically: we do not transfer Google
> user data to third parties except as necessary to provide or improve the product,
> comply with law, or as part of a merger or acquisition; we do not use Google user
> data for advertising; and we do not allow humans to read it except with your
> explicit consent, to resolve a support issue you have raised, for security
> purposes, or where required by law.
>
> **Disconnecting.** You may disconnect a mailbox at any time from Settings, or
> revoke access from your Google Account permissions page. On disconnection we delete
> the stored credential. You may request deletion of derived message records by
> emailing andrew@nudgerow.com.

The Limited Use paragraph is close to verbatim from Google's own required language
and is the part reviewers check most mechanically. The claims in the second paragraph
are true of the current build — token encryption is `packages/engine/src/gmail/
token-crypto.ts`, and `0012` plus the sync changes are what make "the minimum needed"
accurate — so counsel is reviewing a description of the system, not an aspiration.

## §5 · Scope justifications, drafted

Google asks, per scope, why a narrower one will not do. These go in the console form.

**`gmail.send`** — Nudgerow is an outreach tool; sending is the product. Messages are
composed by the user as sequence steps and sent on a schedule the user starts. The
narrower `gmail.compose` is insufficient: it creates drafts, and a drafted message is
not a sent one — the whole system is built on sending at a computed time without a
human present.

**`gmail.readonly`** — required to detect replies, bounces, out-of-office responses
and unsubscribe requests to mail we sent, which is how sequences stop. A prospect who
replies must never receive the next step, and a prospect who asks to be removed must
be suppressed immediately; both are legal and ethical requirements of cold email, not
conveniences. `gmail.metadata` is insufficient because bounce classification parses
`message/delivery-status` parts and opt-out detection reads message text, neither of
which a metadata-only scope carries. `gmail.modify` is broader than needed and is not
requested — we never alter the user's mailbox.

## §6 · The demo video

Google requires an unlisted YouTube video showing the consent screen and each scope
actually in use. Script, ~3 minutes, to record after the sitting:

1. Start on `app.nudgerow.com` signed out. Sign in, showing the OAuth client ID is
   the one under verification.
2. Settings → **Connect** → show Google's consent screen **with both permissions
   visible and readable**. Grant.
3. Show the mailbox reading Connected.
4. **`gmail.send` in use:** start a small sequence, show a touch being sent, and show
   the message in the Gmail Sent folder.
5. **`gmail.readonly` in use:** reply to that message from another account, then show
   Nudgerow detecting the reply, stopping the sequence, and marking the person
   Replied. This single shot justifies the restricted scope better than any prose.
6. Show **Disconnect** removing the credential.

## §7 · Checklist

| | Item | State |
|---|---|---|
| 1 | Mark both OAuth clients **Trusted** in Workspace admin (§1) | **Do this in the sitting — 5 min, free, ends the weekly reconnect** |
| 2 | OAuth consent screen: app name, logo, support email, authorized domains | Not started |
| 3 | Homepage explaining the app at nudgerow.com | Exists |
| 4 | Privacy policy, live and in effect, with §4's Google section | **Blocked on counsel** |
| 5 | Domain ownership verified in Search Console for nudgerow.com | Unknown — check |
| 6 | Scope justifications (§5) | **Drafted, ready to paste** |
| 7 | Demo video (§6) | **Scripted; record after the sitting** |
| 8 | CASA Tier 2 assessment for `gmail.readonly` | Get quotes when a first client is in sight (§3) |

Items 2, 6 and 7 are a single console sitting once the privacy policy is real. Item 8
is the only one that costs money, and §3 is the argument for when to spend it.
