# Feature Inventory — Conversation Intelligence (Kaia)

**Tier:** P only (unlicensed module — protocol §1; public sources exclusively, logged in
`../sources/ci.md`).

## Purpose

Kaia is Outreach's in-house conversation-intelligence stack: a meeting bot plus dialer
tap that records and transcribes sales conversations, assists the rep live (real-time
transcript, auto-captured action items, content cards at trigger moments), and then
turns the recording corpus into coaching and deal signal — summaries, topics, playlists,
methodology-scored coach cards, and CRM-synced artifacts. It feeds the deal layer
(topics/sentiment on the Deal Overview, Deal Agent evidence) and the agent layer (AI
Topics Explorer, Omni queries over recordings), which makes capture reliability and
permissioning the load-bearing parts of the design.

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Meeting capture (bot) | Kaia joins web conferences ~1 minute early when auto-join conditions hold (prospect attendee, conference link, synced calendar, host opt-in); records spoken + shared audio, shared screen content, attendee video; text chat is not captured | Reps, managers | Schedule meeting on synced calendar → bot auto-joins → records | S-CI-002, S-CI-003 |
| Platform coverage | Zoom, Microsoft Teams, Google Meet, WebEx for meetings; the end-user guide describes one conferencing platform selected per deployment; Outreach Voice phone calls also record/transcribe | Org-wide (admin choice) | Admin picks provider(s) → users connect | S-CI-002, S-CI-003 |
| Live transcription & languages | Real-time transcript in 28 supported languages; org enables 1 main + up to 9 secondary; in-meeting selector overrides auto-detection; recording itself works in any language | Reps | Speak → live transcript → switch language if misdetected | S-CI-003, S-CI-004 |
| English-only AI features | Content cards, Smart Meeting Assist, custom Topics, action items, recording topic search operate only on English transcripts | — | — | S-CI-003, S-CI-004 |
| Live content cards | During the call, AI detects trigger moments (competitor, product, integration, pricing mentions) and surfaces prepared reference cards to the rep | Reps; enablement authors the cards | Buyer raises topic → card appears → rep answers unaided | S-CI-001, S-CI-002 |
| Live action items, notes, bookmarks | Action items auto-captured as spoken and pinned to the transcript in real time; reps add manual notes/bookmarks that anchor to transcript position | Reps | During call: auto-capture + manual marks → all land in the recap | S-CI-002 |
| Post-meeting summary | Auto-generated summary + action items emailed to the rep; recording, transcript, and assets live on a recordings page (storage: no documented limit) | Reps, managers | Meeting ends → summary email → review/share recording | S-CI-001, S-CI-002, S-CI-003 |
| Topics & Reactions | Buyer topics tracked across interactions and sales stages with buyer-reaction context; Topics Report aggregates where reps succeed for replication; custom Topics trackable | Managers, enablement | Define/track topics → review report → coach | S-CI-001, S-CI-005 |
| AI Topics Explorer | Conversational search across the recorded-interaction corpus for patterns (GA per 2026 Unleash coverage) | Managers, RevOps | Ask a question → explorer mines recordings | S-CI-007 |
| Kaia Chat & sharing | Comments, colleague tagging, and praise on recordings; org-controlled download and public-link sharing | Teams | Open recording → comment/tag → share per permissions | S-CI-001, S-CI-010 |
| Playlists | Curated sets of exemplary recordings (objection handling, competitive threats, onboarding ramp) | Managers, enablement, new hires | Curate playlist → assign/review | S-CI-001, S-CI-005 |
| Smart Kaia Coach | AI scores call recordings against coach cards aligned to methodologies (MEDDPICC, Sandler, SPIN/SPICED variants appear across sources); AI Suggested Citations give structured answers with clickable transcript timestamps; admins weight questions and pre-filter by call type; manager retains override; auto-scoring of qualifying cards since April 2026 | Managers, admins | Pick card → AI drafts scored answers + citations → manager verifies at timestamps → feedback saved to rep inbox | S-CI-005, S-CI-006, S-CI-007, S-CI-009 |
| Coach Card report | Card-level reporting with an AI-generated meeting abstract so managers coach without full playback; saved-search alerts on daily/weekly cadence | Managers | Review report → drill to moments → alert subscriptions | S-CI-005 |
| One-sided recording | Option to capture only the seller side of calls for consent-constrained jurisdictions | Admins (policy), reps | Admin enables → only internal audio retained | S-CI-001, S-CI-010 |
| Recording consent page | Per-provider consent wrapper: join links become an Outreach-hosted consent page (custom text/logo/privacy link); enabling disables auto-join; Webex dynamic links unsupported | Admins (compliance) | Enable per provider → attendee passes consent page → bot records | S-CI-011 |
| Permissions & redaction | Per-profile recording visibility (own / +reports / +peers+reports / anyone-minus-private), delete + playlist rights, redaction of 4+ digit sequences from audio and transcript, card-edit levels | Admins | Configure per profile → enforced platform-wide | S-CI-010 |
| CRM sync of recordings | Recording URL + AI summary map to the CRM Event object (summary → Description field; Salesforce/Dynamics cap custom Activity fields at 255 chars); full transcripts do not sync | Admins, RevOps | Map fields once → every recording syncs URL + summary | S-CI-001, S-CI-008 |
| Ingestion & auth controls | User-level Zoom authentication; online/offline ingestion policies per conferencing provider and user group (April 2026) | Admins | Set policy → capture obeys per group | S-CI-009 |
| Translations & mobile | Kaia Translations renders summaries/transcripts in other languages for global teams; mobile app exposes summaries + action items | Global teams, reps | Open recording → translated view; mobile recap | S-CI-001 |

## Key workflows

1. **Live-assisted meeting (rep):** meeting booked on a synced calendar with a prospect
   and conference link → Kaia joins a minute early → rep sees live transcript; action
   items auto-pin as spoken; buyer mentions a competitor and a prepared card surfaces →
   after the call the rep gets the summary email, checks action items, and the
   recording lands on the recordings page and syncs URL + summary to the CRM event.
   [S-CI-001/002/003/008]
2. **Methodology coaching at scale (manager):** admin builds/weights a MEDDPICC coach
   card filtered to discovery calls → Smart Kaia Coach scores each qualifying recording
   and cites transcript timestamps per answer → manager audits the cited moments,
   overrides where needed, saves → feedback arrives in the rep's inbox; exemplary calls
   go into a playlist for ramp. [S-CI-005/006/007/009]
3. **Compliance-constrained rollout (admin):** admin picks conferencing provider(s) →
   enables the consent-page wrapper (auto-join off) or one-sided recording per policy →
   sets per-profile recording visibility + redaction → sets retention for meeting
   recordings (see admin-governance doc) → enables 1 main + up to 9 transcript
   languages. [S-CI-003/004/010/011]
4. **Topic mining (RevOps):** define custom topics (English) → Topics Report shows
   stage-by-stage presence and buyer reactions → AI Topics Explorer answers ad-hoc
   pattern questions across the corpus → findings feed coaching priorities and content
   cards. [S-CI-005/007]

## Data touched (cross-ref doc 04 — pending)

Meeting/CalendarEvent (join link, attendees, host prefs), Recording (media, ownership,
visibility flag, playlist refs, retention clock), Transcript (speaker turns, language,
redaction spans; non-editable), ActionItem / Note / Bookmark (transcript anchors),
Summary, Topic + reaction aggregates, ContentCard (trigger terms, body, edit level),
CoachCard (questions, weights, call-type filter, scores, citations), Playlist, CRM
Event mapping (URL + summary fields), per-profile permission and consent/ingestion
policy objects.

## Unknowns

- Underlying STT vendor/engine and accuracy benchmarks (public docs describe behavior,
  not implementation).
- Exact auto-join decision matrix for internal-only meetings and multi-provider orgs;
  reconciliation of "one platform per deployment" vs the four-platform FAQ list
  (INFERENCE: the overview article predates multi-provider support).
- Whether Smart Kaia Coach ships SPIN, SPICED, or both as prebuilt cards (sources
  disagree on the third methodology's label).
- The fixed buyer-topic taxonomy size (one analyst source describes fourteen sales
  topics; not confirmed on a primary page — treated as unverified).
- Live-transcription latency, diarization quality, and speaker-attribution limits.
- Recording lifecycle when a rep leaves the org (ownership transfer behavior).

## Completeness checklist

- [x] Every claim carries an S-CI source ref.
- [x] Unknowns recorded above.
- [x] Function described, not visual design (protocol §6).
- [x] ≤4 pages / ≤200 lines; family template followed.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
