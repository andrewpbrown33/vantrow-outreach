# Feature Inventory — Dialer / Voice (Outreach Voice)

**Tier: P only** (module outside the founder's license; public sources exclusively).
Source fragment: `../sources/dialer.md`.

## Purpose

Outreach Voice is the platform's telephony channel: a browser softphone (with an
optional bridge to the rep's own phone) that makes calling a first-class sequence and
task activity rather than a separate tool. It launches from any prospect record via
click-to-call, can present an area-code-matched rotating caller ID ("Local Presence"),
records calls on demand, forces every call through an outcome taxonomy (dispositions and
purposes) that feeds sequence branching and reporting, drops pre-recorded voicemails,
and auto-advances through a stack of call tasks (sequential dialing). Inbound calls ring
back into the same dialer window with routing that reconnects prospects to whoever
called them.

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Browser softphone window | A free-floating, draggable in-browser call window (docks into the Everywhere extension panel); shows the outbound caller number, live call duration, and the prospect's profile; surfaces network/hardware quality alerts; audio device and gain are configurable. | SDRs, AEs, any calling rep | Open via toolbar phone icon → place/receive call → drag window as needed | [S-DIA-001] |
| Click-to-call | Clicking a prospect's hyperlinked phone number anywhere in the app opens the dialer pre-loaded and starts the call; connect/no-connect outcomes are tracked. | Reps | Click number on record/task → dialer launches → call begins | [S-DIA-001] [S-DIA-008] |
| Dialing modes (computer vs phone) | Computer mode carries audio over the browser/internet (mic permission required; wired connection recommended; cheaper). Phone mode bridges the call through the platform to the rep's imported cell/landline (better audio, higher cost, slower connect); a toggle keeps the bridge line open between consecutive calls. | Reps; admins set defaults | Personal settings → choose mode → (phone mode) import own number → call | [S-DIA-003] |
| Local Presence caller-ID rotation | Outbound caller ID matches the prospect's area code: reuses an owned number with that code, otherwise auto-purchases one if the user's governance profile permits; purchased numbers join a shared pool for that area code; falls back to a nearby area code when no exact match exists. Toll-free/non-regional numbers excluded; international purchases need documentation. | Reps (per-user opt-in); admins govern purchase rights | Personal Settings > Phone Numbers > Voice → select "prospect's area code" option → caller ID rotates per call | [S-DIA-002] |
| Call recording | Recording can be started and stopped at any point during a live call from a record button in the dialer. | Reps; admins for policy | In call → toggle record icon → recording attached to the call log | [S-DIA-001] |
| Dispositions & call purposes | Dispositions classify the outcome; each is typed Answered / Not Answered, and that type drives whether the sequence advances or finishes. Purposes record why the call happened. Admin-managed lists with auto-selection from call states; an org toggle can require a purpose before logging; a call task only counts complete once dispositioned, and unlogged calls default to a no-answer disposition *(snippet)*. | Reps log; admins curate | Call ends → pick disposition + purpose + note → task completes → sequence branches | [S-DIA-004] [S-DIA-009] |
| Voicemail drop (beta) | Per-user library of named pre-recorded voicemail messages (one flagged default), enabled org-wide by an admin; during a call that hits voicemail, the rep picks a drop and a leave-and-hang-up action plays it while freeing the rep. Compliance note: some destinations require prospect opt-in to pre-recorded/AI voicemail. | Reps; admins enable | Record drops in personal settings → on voicemail tone: voicemail icon → choose drop → leave & hang up | [S-DIA-006] [S-DIA-007] |
| Sequential dialing | Select two or more call tasks and the dialer auto-cycles: dials, and on no answer hangs up, logs, and advances to the next number/task; pauses automatically on a live answer for conversation and manual logging, then resumes. Requires admin disposition mapping (no-voicemail-left, busy, failed) and a per-profile permission. | High-volume callers; admins configure | Select call tasks → start sequential dialing → play → converse/log on connects → run ends when tasks exhausted | [S-DIA-005] |
| In-call controls | Mute, hold (with hold music), DTMF keypad, add-call for conferencing, and merge-based transfer where the initiator can drop off (warm transfer). Number click-to-copy. | Reps | In call → toolbar controls | [S-DIA-001] |
| Inbound handling | Incoming calls present accept/decline; declining routes to voicemail. Call waiting shows the second caller, answering holds the first, and an arrow switches between calls. Calls into Local Presence numbers route by a five-step priority match to the users/prospects who previously used that number. | Reps | Inbound rings dialer → accept/decline → switch/hold as needed | [S-DIA-001] [S-DIA-002] |
| Number management | Per-user and shared phone numbers; number purchase rights controlled by governance profile; own-device numbers imported for phone-bridge mode. | Admins, reps | Admin grants purchase permission → numbers acquired/imported → available for calling | [S-DIA-002] [S-DIA-003] |

## Key workflows

1. **Sequence call task, end to end.** Rep opens a due call task → clicks the prospect's
   number (click-to-call) → Local Presence selects/purchases an area-code-matched caller
   ID → call connects in the softphone → rep toggles recording → call ends → rep logs
   disposition (typed answered/not-answered), purpose, and a note → task completes and
   the sequence advances or finishes based on the disposition type. [S-DIA-001]
   [S-DIA-002] [S-DIA-004]
2. **Sequential dial block.** Rep multi-selects call tasks → starts sequential dialing →
   the dialer works the stack unattended, auto-logging no-answers → a live answer pauses
   the run for the conversation and manual log → play resumes → run ends when the list is
   exhausted. [S-DIA-005]
3. **No-answer with voicemail drop.** Dial reaches voicemail → rep opens the voicemail
   menu, selects a pre-recorded drop → leave-and-hang-up plays the message while the rep
   moves on; call is logged with a no-voicemail/voicemail-appropriate disposition per
   admin mapping. [S-DIA-006] [S-DIA-007] [S-DIA-005]
4. **Inbound return call.** Prospect calls back the Local Presence number they saw →
   five-step routing matches them to the rep who called → dialer rings with accept/
   decline; declined calls fall to voicemail; a second inbound during a call surfaces
   call-waiting with hold-and-switch. [S-DIA-002] [S-DIA-001]

## Data touched (cross-ref doc 04)

- **Call** records: direction, from/to numbers, duration, recording reference,
  disposition, purpose, note, owning user, originating sequence/step and task.
- **Phone number** inventory: owned vs shared-pool numbers, area code, purchase
  provenance, imported personal-device numbers.
- **Prospect** phone fields (dialed numbers, per-number outcomes for sequential dialing).
- **Task** (call type) state — completion gated on disposition.
- **Org/profile settings**: voice enablement, purchase permissions, disposition/purpose
  lists, sequential-dialing permission, voicemail-drop enablement.

## Unknowns

- Underlying carrier/CPaaS provider and per-minute/number cost model. INFERENCE: a
  third-party CPaaS resold with markup — unverified from public sources.
- Recording consent controls (per-jurisdiction auto-pause, dual-consent handling) —
  referenced in the admin/governance doc's scope, not evidenced here.
- Voicemail-drop beta rollout breadth (which plans/regions) and current beta status date.
- Whether dialer audio feeds Kaia transcription for plain Voice calls (vs meetings), and
  at what entitlement.
- Phone-bridge mechanics detail (dial-in vs callback to the rep's device).
- SMS as a Voice-adjacent channel: present on mobile listings but web-dialer SMS scope
  unverified here (see mobile doc).

## Completeness checklist

- [x] Every claim carries a source ref resolving to `sources/dialer.md`.
- [x] Unknowns recorded above (none silently guessed).
- [x] Function described, not visual design (window/dock behavior noted only as function).
- [x] ≤4 pages.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
