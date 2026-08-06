# 02 — Feature Inventory: Email & Deliverability

**Prepared:** 2026-08-06 · Phase-1 workstream A · Tier P only in this pass (doc tiered
P+F; F-verification at synthesis). Source IDs resolve in `../sources/email.md`.

## Purpose

Outreach sends every email through the rep's own connected mailbox (Gmail via the Gmail
API, Microsoft 365 via Graph OAuth) rather than a shared ESP, layering on reusable
content (templates, snippets), a merge-field/variable system with conditional logic and
a deliberate send-blocking personalization mechanic, per-step A/B testing, open/click/
reply tracking, and thread-control for follow-ups. Around the send path sits a
deliverability program: authentication requirements, warmup and volume guidance,
layered admin-set send limits with a hard platform cap, and hygiene thresholds aligned
to the 2024 Google/Yahoo bulk-sender rules. [S-EML-008] [S-EML-009] [S-EML-001]
[S-EML-010] [S-EML-011]

## Feature table

| Feature | Description (our words) | Who uses it (roles) | Workflow steps | Source refs |
|---|---|---|---|---|
| Templates | Reusable email content (subject, body, variables) powering sequence steps, one-off and single-compose sends; configured with name, owner, visibility (sharing control), tags, and collection membership; archivable; linked templates mirror a master and pool its stats | Content creator authors; Reps consume | New template → content+variables → owner/visibility/tags/collection → attach to step | [S-EML-003] [S-EML-016] |
| Snippets | Smaller reusable text/image fragments inserted into one-off emails, inside templates, or into sequence email steps — composition building blocks rather than full messages | Content creator, Rep | Compose → insert snippet → adjust | [S-EML-004] |
| Variables / merge fields | Placeholder tokens filled at send time from prospect (first name, company, numbered custom fields), account (account.*), opportunity (opportunity.*), sender (sender.*), and org-name objects; usable in body, subject, and URLs | Content creator embeds; system resolves | Composer bracket picker → select variable | [S-EML-001] |
| Conditional logic | If/else/end and unless blocks plus day-of-week helpers give fallback and situational text (e.g. use first name else a generic greeting); comparing a field against a literal value is not supported | Content creator | Wrap variable in conditional → set fallback | [S-EML-001] |
| Comment variables (send-block) | A comment token written as {{! note }} highlights blue in the composer and hard-blocks sending while present — forcing a human to replace it with real personalization; an explicit send-anyway override exists; enforced personalization at scale | Content creator plants; Rep resolves | Template ships with comment token → rep fills at task time → send unblocks | [S-EML-001] [S-EML-002] |
| Missing-variable failure | A sequence step whose template references a variable missing on the prospect fails with a missing-template-variable error; fix the data or template, then retry — no automatic resolution | Rep, Content creator | Failure surfaces → fix field/template → retry | [S-EML-001] |
| A/B testing | Email-step A/B activates when a second template is added; automatic or manual variant assignment; vendor method: single change, even volumes, ≥150 sends/variant; subject-only → open-rate test, body-only → reply-rate test; statistically significant winner flagged | Content creator | Add variant → run → read winner → consolidate | [S-EML-014] |
| Open tracking | Invisible pixel per message; each pixel fetch logs an open; works only on mail sent via the app, Chrome extension, or Outlook add-in; security scanners can fake opens and servers can block the pixel — a weak signal by the vendor's own caveats | Rep reads signals; Admin governs | Enable → send → opens accrue on mailing/prospect | [S-EML-005] |
| Click tracking | Records that a tracked link was clicked (not which link); only toolbar-inserted hyperlinks are tracked, not bare pasted URLs; defaults off per message/template even when org-enabled — switched on per step or per template; same scanner false-positive caveat | Rep, Content creator | Insert link via toolbar → enable clicks on step/template | [S-EML-005] [S-EML-006] |
| Reply tracking & threading | Replies log against the mailing/prospect and drive sequence exit; sequence email steps deliver as a new thread or as a reply attached to the previous step's thread (reply prefix + prior subject); consecutive reply steps extend one chain; a new-thread step restarts chaining; a reply-type first step fails (no parent) except in follow-up sequences | System; Content creator chooses per step | Per step: new thread vs reply → chain maintained on delivery | [S-EML-007] |
| Mailbox connection — Gmail | Connect the rep's Google mailbox with the Gmail API method (vendor-recommended) so sends, replies, and sync run through the user's own account | Rep (one-time), Admin assists | Settings > You > Mailboxes → connect Google | [S-EML-009] |
| Mailbox connection — O365 | OAuth via Microsoft Graph (recommended); consented scopes: profile read, calendar read-write, mailbox-settings read, mail read-write, offline access; initial sync covers trailing 12 months of prospect-relevant mail, retroactively applied when new prospects appear | Rep (one-time), Admin assists | Settings > You > Mailboxes → O365 OAuth → consent | [S-EML-008] |
| Send limits & safeguards | Admin-set per-user caps: bulk/day, bulk/week, total deliveries/day (in+out across platforms), custom-window ceilings, auto-retry count; hard platform cap 5,000 emails/week per mailbox across app+extension+add-in; user limits above org limits are throttled down; optional gate requiring a recently synced mailbox (sync freq 2 min–24 h) before sending | Admin configures; system enforces | Governance settings → per-user limits → enforcement at send | [S-EML-010] |
| Delivery scheduling & delay states | Every due email passes throttle evaluation (sequence schedule windows, user/org caps, per-domain and per-prospect thresholds); blocked mail waits in a visible delayed state with the reason; provider-limit hits auto-retry after 24 h | System; Rep monitors outbox | Due → checks → send, or delay+reason → retry | [S-EML-015] [S-EML-017] |
| Authentication guidance | Vendor requires SPF and DKIM, recommends DMARC, configured in the customer's DNS/mail servers (not inside the app); aligned to Google/Yahoo bulk-sender rules effective 2024-02-01 (auth + working unsubscribe + complaints <0.3%) | Customer IT/Admin | Configure DNS → verify → send | [S-EML-011] [S-EML-013] |
| Warmup & volume guidance | New domains ramp ~30 days, roughly doubling volume every 3–4 days while watching engagement; domains younger than ~6 months treated as suspect; consistent cadence favored over spikes | Admin/deliverability owner | Ramp plan → monitor → full volume | [S-EML-011] [S-EML-012] |
| Hygiene & content guidance | Bounce targets <1% hard / <5% soft (>10% risks ISP blocks; >5% → run list validation; <3% overall goal); never purchase lists (spam traps); avoid attachments (esp. executable/archive), too-good-to-be-true copy; real names in the To: field; unsubscribe links functional ≥30 days | Admin, Content creator | List vetting → content lint → monitor rates | [S-EML-011] [S-EML-012] |
| Branded URLs / custom tracking domain | Click-tracking and links run over a customer-branded domain instead of a shared pool domain, isolating sender reputation and improving spam scoring | Admin (setup), all senders benefit | Configure branded domain → links rewrite to it | [S-EML-012] [S-EML-016] |
| Opt-out handling | Unsubscribe links insertable via ruleset policy; granular (per-channel) opt-outs respected across email/call/SMS; unsubscribe-classed replies detected by the sentiment model | System; Admin policy | Opt-out captured → suppression respected at send | [S-EML-016] [S-EML-011] |

## Key workflows

1. **Connect a mailbox and author governed content.** A rep connects Gmail (Gmail API)
   or O365 (Graph OAuth, scoped consent); the platform syncs 12 months of
   prospect-relevant history. A content creator builds a template with variables, an
   if/else fallback greeting, a snippet for the value-prop block, and a {{! personalize
   this }} comment token; sets owner/visibility/collection; links it to a sequence
   step. [S-EML-008] [S-EML-009] [S-EML-001] [S-EML-003] [S-EML-004]
2. **Send path of one sequenced auto email.** The step comes due → variables resolve
   (failure → visible error, manual fix, retry) → throttle evaluation across schedule
   window, user caps, org caps, domain and per-prospect thresholds → threading applied
   (new thread or reply chained to the prior step) → send through the rep's own mailbox
   → pixel and rewritten links track opens/clicks → a reply logs, classifies by
   sentiment, and exits the prospect. Blocked sends wait with a reason; provider-limit
   hits retry after 24 h. [S-EML-001] [S-EML-015] [S-EML-007] [S-EML-005] [S-EML-017]
3. **Stand up deliverability for a new sending domain.** IT publishes SPF + DKIM
   (DMARC recommended); admin configures a branded tracking domain, sets per-user
   daily/weekly caps under the 5,000/week platform ceiling, and enforces
   recently-synced-mailbox sending; volume ramps ~30 days (doubling every 3–4 days)
   against verified, never-purchased lists; ongoing monitoring holds hard bounces <1%
   and complaints <0.3% per the 2024 bulk-sender rules. [S-EML-011] [S-EML-012]
   [S-EML-010]
4. **Force personalization at scale.** A template ships with comment tokens at the
   personalization points; the manual-email task cannot send while any token remains
   (blue highlight), so each rep replaces them with prospect-specific lines — or
   consciously uses the send-anyway override. [S-EML-001] [S-EML-002]

## Data touched (cross-ref doc 04, forthcoming)

Mailbox (provider type, OAuth grant, sync freshness, per-mailbox limits) · Template /
Snippet (owner, visibility, tags, collection) · Variable definitions incl. numbered
custom fields on prospect/account/opportunity/sender · Mailing (state machine:
scheduled → delivered → opened/clicked/replied/bounced/unsubscribed; thread linkage) ·
per-user and org send-limit settings · branded-URL/tracking-domain config ·
opt-out/suppression flags per channel · engagement events feeding scores and A/B
stats. [S-EML-016] [S-EML-010] [S-EML-005]

## Unknowns

1. **Reply/bounce detection mechanics** (message-header matching vs mailbox-sync
   inference; how bounces are classified hard vs soft) — not publicly documented.
2. **Engagement-rate formulas:** glossary entries reference a 14-day post-delivery
   window, but the published open/click/reply-rate definitions appear internally
   inconsistent (click/reply definitions read as swapped) — exact numerator/denominator
   need re-verification.
3. **5,000/week cap unit:** stated per *mailbox* in the limits article but per *user*
   in the glossary — which governs a user with multiple mailboxes is unclear.
4. **In-app automated warmup:** whether any managed warmup automation exists in-product
   (vs guidance-only ramp schedules) is not shown in public docs.
5. **Custom tracking-domain setup specifics** (DNS records, per-org vs per-mailbox
   scope) — only the concept and rationale are public.
6. **SMTP/IMAP fallback support** for non-Google/Microsoft providers — current public
   docs foreground Gmail API and Graph; legacy-protocol support status unconfirmed.
7. **One-click unsubscribe (RFC 8058) header support** — vendor guidance cites the
   bulk-sender rules, but explicit product support for list-unsubscribe headers isn't
   publicly confirmed.

## Completeness checklist

- [x] Every claim carries an S-EML ref; snippet-limited rows marked in the fragment
- [x] Templates, snippets, variables (conditional + comment send-block) covered
- [x] A/B, open/click/reply tracking, threading, Gmail/O365 sending covered
- [x] Vendor-published deliverability guidance captured with numbers
- [x] Function described, not visual design
- [x] Unknowns filled (7) — no silent guesses
- [x] Zero F- references (Tier-P pass)
- [x] ≤200 lines / ≤4 pages

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
