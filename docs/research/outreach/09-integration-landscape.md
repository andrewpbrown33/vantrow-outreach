# 09 — Integration Landscape (Access Models for a Sales-Engagement Competitor)

**Tier:** P only. **Workstream:** H. **Feeds:** doc 11 priority matrix (gate axis) and
`docs/plan/long-lead-register.md`.

Every integration surface a sales-engagement platform needs, scored on ONE question:
*what stands between us and production credentials?* Four levels:

- **OPEN-API** — self-serve credentials; nothing but signup and code.
- **VERIFICATION-REQUIRED** — self-serve to start, but production access at real scope
  requires a review: app verification, security assessment, publisher verification,
  carrier registration. Schedulable, mostly predictable; belongs on the long-lead register.
- **PARTNER-REQUIRED** — a negotiated agreement, paid license, or invite-only program.
- **PROHIBITED** — no sanctioned path for the capability; ToS forbids it and the owner
  enforces.

Judgments below are based on each third party's own developer-program pages (S-INT rows).
Protocol §8 applies to all marketing language: "designed to integrate with" until the
agreement/verification exists.

## Master table

| # | Surface | What it gives the product | ACCESS-MODEL | Gate mechanics (cost / time) | Sources |
|---|---|---|---|---|---|
| 1 | Gmail API (send/read/watch), Google Workspace | Mailbox send+sync for the core engine | **VERIFICATION-REQUIRED** | Gmail scopes are *restricted*: brand verification (2–3 days) → restricted-scope app review (weeks) → CASA security assessment by Google-empanelled assessor, re-done ≤ every 12 months (third-party figures ≈$500–1k+/yr Tier 2) | [S-INT-001] |
| 2 | Google Calendar API | Booking pages, free/busy, meeting sync | **VERIFICATION-REQUIRED** (lighter) | Calendar scopes are *sensitive*, not restricted: app verification ≈ up to 10 days; **no CASA** | [S-INT-002] |
| 3 | Microsoft Graph — mail (O365/Outlook) | Mailbox send+sync, subscriptions/delta | **VERIFICATION-REQUIRED** | App registration itself is self-serve, but a multi-tenant app requesting mail scopes is effectively unusable unverified: since Nov 2020 users can't consent to unverified multi-tenant apps beyond basic sign-in. Publisher verification = verified CPP (ex-MPN) account + PartnerID binding; free; fast once CPP exists | [S-INT-003] |
| 4 | Microsoft Graph — calendar | Booking, free/busy, event sync | **VERIFICATION-REQUIRED** | Same publisher-verification gate as #3 (same app registration) | [S-INT-003] |
| 5 | Salesforce core APIs (REST, Bulk v2, CDC) | CRM mirror: backfill + change feed + writeback | **OPEN-API** | Runs as a connected app against the *customer's* org credentials; API available on Enterprise/Unlimited/Performance/Developer editions (Professional needs paid add-on); no Salesforce approval needed to integrate | [S-INT-005] |
| 6 | Salesforce AppExchange listing | Distribution + Professional/Group-edition API access | **VERIFICATION-REQUIRED** | ISV program + security review: $999 per submission attempt (paid apps; $0 free), re-charged on failed-review resubmission and periodic re-review; $150/yr listing; rev-share reported 15% | [S-INT-004][S-INT-005] |
| 7 | HubSpot public app (OAuth) | CRM sync for HubSpot-based customers | **OPEN-API** | Free developer account; public OAuth app self-serve; no review to exist | [S-INT-006] |
| 8 | HubSpot App Marketplace listing / certification | Distribution + trust badge | **VERIFICATION-REQUIRED** | Listing: OAuth-only + ≥3 active unaffiliated installs + partner agreement; certification: ≥60 sustained installs + ≥6 months listed + security assessment; OAuth v3 endpoints mandatory for new listings (May 2026) | [S-INT-006] |
| 9 | Microsoft Dynamics 365 / Dataverse Web API | CRM sync for Dynamics customers | **OPEN-API** | Self-serve Entra app registration (multitenant), OAuth; customer admin creates the application user / grants roles; publisher verification (#3) still smooths consent | [S-INT-017][S-INT-003] |
| 10 | Dynamics AppSource listing | Distribution, license management | **PARTNER-REQUIRED** (program) | CPP account + commercial-marketplace enrollment + ISV Connect program | [S-INT-018] |
| 11 | Affinity API | Dogfood: PEAK's own CRM (Tier R workflow) | **OPEN-API** | API key self-serve from Settings (HTTP Basic); gated only by the *customer's* Affinity plan (900 req/min/user; 100k/mo on Scale/Advanced, unlimited Enterprise); v2 current, v1 legacy still live | [S-INT-015][S-INT-016] |
| 12 | Twilio platform (voice/SMS credentials) | Dialer + SMS transport | **OPEN-API** | Self-serve account + keys; the gates live one layer down (#13–14) | [S-INT-007][S-INT-008] |
| 13 | A2P 10DLC registration (US SMS) | Lawful/deliverable SMS steps | **VERIFICATION-REQUIRED** | Brand + Campaign registration with carrier vetting via Twilio; monthly per-brand/campaign fees; throughput tiered by brand class (low-volume ≈6k msgs/day class); unregistered traffic surcharged/blocked | [S-INT-007] |
| 14 | STIR/SHAKEN attestation (US voice) | "Spam likely" avoidance, answer rates | **VERIFICATION-REQUIRED** | KYC business profile via Twilio onboarding/Trust Hub to earn A-attestation (carrier vouches caller owns the number); B/C attestation degrades answer rates | [S-INT-008] |
| 15 | ZoomInfo (enrichment/intent) | B2B contact + company data | **PARTNER-REQUIRED** | API credentials only with an active (enterprise-tier) subscription; multi-customer "partner applications" need ZoomInfo approval + review; third-party pricing reports ≈$50k+/yr | [S-INT-009] |
| 16 | Self-serve enrichment vendors (Apollo, PDL, etc.) | Same category, lower floor | **OPEN-API** | Self-serve keys; viable substitute while ZoomInfo partnership is unjustified. ASSUMPTION: individual vendor terms differ on resale/caching — re-check per vendor at build time | — |
| 17 | Zoom cloud recordings (marketplace app) | Conversation-intelligence ingest | **VERIFICATION-REQUIRED** | `cloud_recording` scopes are tied to marketplace-publishable app types (not Server-to-Server); publication = functional review + security audit; every scope individually justified | [S-INT-013] |
| 18 | Google Meet REST API (artifacts) | Recordings/transcripts ingest | **VERIFICATION-REQUIRED** | API exposes conference records, recordings, transcripts; rides Google app verification like #1–2. Unknown: exact scope classification (sensitive vs restricted) — see Unknowns | [S-INT-014][S-INT-002] |
| 19 | Teams meeting recordings/transcripts (Graph protected APIs) | Recordings/transcripts ingest | **VERIFICATION-REQUIRED** (heaviest) | `getAllRecordings`/`getAllTranscripts` are *protected APIs*: Microsoft access-request form + justification, AND per-tenant application-access policy granted by each customer's admin, AND tenant transcript settings; request reviews batched ~weekly | [S-INT-012] |
| 20 | LinkedIn — automated outreach, scraping, inbox automation | The "LinkedIn step" competitors sell | **PROHIBITED** | No public API for it; UA §8.2 bans bots, scraping, automated messaging, and browser plugins that access the Services (see below) | [S-INT-010][S-INT-011] |
| 21 | LinkedIn official programs (SNAP, Marketing/Sales APIs) | Embedded Sales Navigator widgets, CRM sync | **PARTNER-REQUIRED** | Invite/application-gated partner programs; they enable *embedded views and manual workflows*, not sending automation | [S-INT-011] INFERENCE from program structure; verify terms if pursued |
| 22 | Outreach's own API (api.outreach.io) | Our migration tooling's extraction surface | **OPEN-API** | OAuth 2.0 against the *customer's* Outreach account, JSON:API, bulk endpoints; 10k req/hr/user (doc 13) | [S-INT-020] |
| 23 | SMTP/IMAP (legacy mailbox fallback) | Compatibility tier for non-Google/MS mailboxes | **OPEN-API** | Open protocols; no program. ASSUMPTION: app-password/security-posture friction varies by host | — |

## Cluster notes (what the table can't say in one line)

### Email — the two verifications that gate the whole product
Gmail restricted-scope review + CASA is the single longest *recurring* gate we own:
annual reassessment attaches a permanent compliance cost to the core feature
[S-INT-001]. Microsoft's equivalent is one-time and free (publisher verification), but
blocks multi-tenant user consent entirely until done [S-INT-003]. Both belong on the
long-lead register with start-before-code dates. Neither gates *development* (test
users/tenants work unverified) — they gate *GA*.

### CRM — open to build, reviewed to distribute
All three CRM syncs are buildable today with self-serve credentials against our own dev
orgs [S-INT-005][S-INT-006][S-INT-017]. The reviews (AppExchange $999/attempt,
HubSpot listing/certification, AppSource ISV Connect) are *distribution* gates, not
integration gates — with one exception: Salesforce Professional/Group edition customers
can only be served through a security-reviewed AppExchange package [S-INT-005]. That
makes AppExchange review a revenue gate for down-market Salesforce, not just marketing.

### Affinity — dogfood advantage
Genuinely open: self-serve key from customer settings, documented rate limits
[S-INT-015][S-INT-016]. Nothing prevents a first-class Affinity sync in the MVP, and
customer #1 (PEAK) runs on it (Tier R). No other sales-engagement incumbent treats
Affinity as a first-class CRM — differentiation lead for doc 12.

### Telephony — sequenced registrations
Twilio credentials are instant [S-INT-007], but *usable* US SMS needs A2P brand+campaign
vetting (fees, carrier review) and *answerable* US voice needs SHAKEN A-attestation via
KYC [S-INT-008]. Both are days-to-weeks, per-customer-instance work — the product needs
an onboarding flow that walks each tenant through registration, which is product scope,
not just our own paperwork.

### Meeting recording — three providers, three gates
Zoom: marketplace review with per-scope justification [S-INT-013]. Meet: normal Google
verification [S-INT-014]. Teams: the heaviest — Microsoft's protected-API approval *plus*
a per-customer admin policy grant [S-INT-012], meaning every enterprise deal with Teams
recording has an IT-admin step we must productize. Conversation intelligence is
unlicensed territory for the founder (Tier P only) and late-phase anyway; note the gates,
defer the work.

### LinkedIn — document the wall, don't climb it
The User Agreement is explicit. In our words, per §8.2 [S-INT-010]: clause 8.2.2 bans
developing, supporting, or using any software, device, script, or robot — crawlers and
browser plugins/add-ons are called out by name — to scrape or copy the Services; clause
8.2.13 bans bots and unauthorized automated methods to access the Services, add or
download contacts, send or redirect messages, or otherwise generate inauthentic
engagement; clause 8.2.4 bans copying or using information obtained from the Services,
directly or through third parties, without the content owner's consent.

Enforcement is real, current, and multi-layered [S-INT-011] *(T-tier leads; corroborate
against primary court records before any external claim)*: hiQ ended in a consent
judgment (permanent injunction; company defunct) after the contract claims survived even
though public scraping wasn't a CFAA violation; LinkedIn/Microsoft sued Proxycurl
(Jan 2025) and it shut down mid-2025 with mandated data deletion; LinkedIn's 2026
transparency reporting describes tens of millions of fake accounts blocked and automated
sessions flagged per quarter, with detection now suspension-first. Competitors that ship
LinkedIn automation do it via the user's own session/cookies and eat the account bans.
**Position for our product:** manual LinkedIn *tasks* (rep does the action in their own
browser; we track completion) — the pattern the incumbent itself uses — plus
PARTNER-REQUIRED exploration of official programs later. No session puppeteering, ever.

### The incumbent's own surface
Outreach's API is OPEN-API to its customers [S-INT-020] — which is what makes doc 13's
migration tooling feasible — and its marketplace advertises 100+ integrations
[S-INT-019]: the ecosystem bar a competitor eventually faces, not an MVP requirement.

## Tallies (for the doc-11 gate axis)

| Access model | Count | Rows |
|---|---|---|
| OPEN-API | 8 | #5, 7, 9, 11, 12, 16, 22, 23 |
| VERIFICATION-REQUIRED | 11 | #1, 2, 3, 4, 6, 8, 13, 14, 17, 18, 19 |
| PARTNER-REQUIRED | 3 | #10, 15, 21 |
| PROHIBITED | 1 | #20 |

(Rows are listed explicitly so doc 11 can re-bucket — e.g. if it treats distribution
gates (#6, #8, #10) separately from access gates.)

**Long-lead register candidates (start earliest):** Gmail restricted-scope + CASA (#1);
Microsoft CPP account + publisher verification (#3); A2P 10DLC + SHAKEN tenant-onboarding
design (#13–14); AppExchange security review (#6, revenue-gating for Professional
edition); Teams protected-API request (#19, only when conversation intelligence
is scheduled).

## Unknowns

1. Google Meet REST API scope classification (sensitive vs restricted → CASA or not)
   and Workspace-edition gates on recording artifacts — overview page doesn't say
   [S-INT-014].
2. Exact current CASA tier/cost for a Gmail-restricted app of our shape — third-party
   figures only; confirm with an empanelled assessor at Phase 2.
3. LinkedIn SNAP / official-program admission criteria and terms — program pages are
   applications-only; unverified beyond structure [S-INT-011].
4. ZoomInfo partner-application terms (data caching/display rules inside a
   sales-engagement UI) — behind the partner wall [S-INT-009].
5. Whether HubSpot app *review* (beyond listing requirements) imposes scope-level
   security requirements pre-listing — listing requirements page fetched via snippet
   only [S-INT-006].
6. Per-vendor resale/caching terms for self-serve enrichment vendors (#16) — deferred
   to build-time per-vendor screens.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
