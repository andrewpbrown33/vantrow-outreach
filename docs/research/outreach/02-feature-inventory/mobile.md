# Feature Inventory — Mobile (iOS / Android companion)

**Tier: P** (public sources only). Source fragment: `../sources/mobile.md`.

## Purpose

The mobile app (GA on both stores 2025-01-22 [S-MOB-004]) is a deliberately scoped
companion for reps away from their desk, not a port of the web product: execute today's
call and email tasks, place and receive Outreach Voice calls, reply to email with
templates and variables, run the day's meeting agenda with Kaia recording playback,
look up records, message by SMS, and ask Omni questions. Admin/build surfaces stay on
the web — the vendor states outright it does not replace the web app [S-MOB-001].

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Task list | Assigned tasks filtered All / Calls / Emails, each showing prospect, due time, and priority; only call and email task types are executable in-app. | Field/traveling reps | Open Tasks → filter → tap task → execute | [S-MOB-001] |
| Voice calling | Calling runs exclusively through Outreach Voice: make and receive calls, record, review call history and edit call logs; includes a manual in-app dialer, Local Presence, and dialpad IVR input. Conference calls and adding participants are unsupported; imported personal numbers don't get app notifications. | Reps | Tap call task or dialer → call → record/log | [S-MOB-001] [S-MOB-004] [S-MOB-002] |
| Email | Compose new email, reply to received messages, and execute email tasks with templates, snippets, and auto-populated variables; inbox-style receipt of incoming mail. | Reps | Open email task/inbox → template + variables → send | [S-MOB-001] [S-MOB-004] |
| Meetings | Agenda view of the day's meetings; create and edit meetings; join video meetings where Kaia is attending; App Store also lists in-person meeting capture. | Reps | Meetings tab → join/edit → capture in person | [S-MOB-001] [S-MOB-002] |
| Kaia recording playback | Review recorded meetings/calls: speaker identification, topics discussed, transcript access, summaries, and playlist creation. | Reps, managers | Open recording → skim topics/transcript → playlist | [S-MOB-001] [S-MOB-002] |
| Search & Smart Views | Search prospects, accounts, and opportunities across properties; Smart Views plus saved views/filters for list slicing on prospects and accounts. | Reps | Search/saved view → open record | [S-MOB-001] [S-MOB-004] |
| SMS | Text messaging listed as an app capability on the store listing. | Reps | Message from record | [S-MOB-002] |
| Omni assistant | Conversational assistant in-app with speech-to-text: account context, prospect insights, and deal information via chat. | Reps | Ask Omni → act on answer | [S-MOB-002] |
| Calendar & forecast views | Store listing includes calendar management and forecast management among mobile capabilities. | Reps, managers | Open view → review | [S-MOB-002] |
| Auth & platform facts | Login via redirect to the web login page; SSO supported. iOS 14.0+, 118.6 MB, English, Productivity category, by Outreach Corporation; Android package `io.outreach.sales` *(snippet)*. | All users | Install → web-page login/SSO | [S-MOB-001] [S-MOB-002] [S-MOB-003] |
| Deliberate exclusions | Explicitly not intended to replace the web app or handle complex admin tasks; non-call/email task types cannot be actioned; no conference calling. INFERENCE: sequence/trigger authoring and org administration are therefore web-only — consistent with "complex admin" but not itemized publicly. | n/a (scope boundary) | n/a | [S-MOB-001] |

## Key workflows

1. **Field task run.** Rep opens Tasks between meetings → filters to Calls → taps the
   first task → Outreach Voice call with Local Presence → records, then edits the call
   log → next task; email tasks handled the same way with templates and variables.
   [S-MOB-001] [S-MOB-004]
2. **Reply from the road.** Incoming prospect email arrives in the app → rep opens it,
   inserts a template/snippet with variables auto-filled → sends; the thread stays in the
   platform's activity history. [S-MOB-001] [S-MOB-004]
3. **Meeting day.** Rep checks the agenda → joins a Kaia-attended video call from the
   app (or captures an in-person meeting) → afterward replays the recording, skims
   speakers/topics/transcript → asks Omni for account context before the next stop.
   [S-MOB-001] [S-MOB-002]

## Customer perception (store reviews)

Rating 3.6/5 from 25 ratings on the US App Store at access date — low volume, mixed.
Reviewer praise: "a game changer for field sellers"; reviewer criticism: "barebones
compared to full Outreach on computer" [S-MOB-002]. Read: valued by field sellers,
perceived as thin relative to web — a scoping signal for our own companion app.

## Data touched (cross-ref doc 04)

- **Task** (call/email types): read + completion from mobile.
- **Call**: creation, recording, history, log edits (Voice-only path).
- **Email/message**: compose/reply artifacts, template + variable usage; SMS messages.
- **Meeting**: agenda reads, create/edit, Kaia recording/transcript/playlist reads.
- **Prospect / account / opportunity**: search reads, saved-view filters.
- **User/session**: web-redirect auth, SSO identity.

## Unknowns

- Android minimum OS version, app size, and Play-store rating (listing bot-blocked;
  logged as snippet).
- Offline behavior (queueing tasks/calls without connectivity) — not documented publicly.
- Push-notification taxonomy (which events notify) beyond the imported-number exclusion.
- Whether sequences can be viewed (read-only) on mobile even though authoring is
  excluded.
- Tablet/iPad layout support and MDM/enterprise-distribution options.
- Feature-parity cadence: release notes show fast iteration post-launch (Jan 2025 adds);
  current 2026 scope may exceed the overview article — treat this doc as floor, not
  ceiling. [S-MOB-004]

## Completeness checklist

- [x] Every claim carries a source ref resolving to `sources/mobile.md`.
- [x] Unknowns recorded above (none silently guessed).
- [x] Function described, not visual design.
- [x] ≤4 pages.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
