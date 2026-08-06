# Feature Inventory — Meetings & Scheduling

**Tier: P** (+Tier-F verification later only for surfaces inside the core tier; this
draft is public-source only). Source fragment: `../sources/meetings.md`.

## Purpose

The meetings module is the platform's native scheduler: reusable meeting-type templates,
personal and team booking pages, and availability insertion directly into emails, so a
prospect books time without leaving the email/sequence flow and without a third-party
scheduling tool. Team meeting types add round-robin assignment (strict = fairness-first,
flexible = availability-first) and make live handoffs (SDR books the AE's meeting while
still on the call) a one-click action. Everything hangs off connected user calendars and
writes meetings back onto prospect records.

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Meeting types | Admin/user-defined templates: name, subject line and location with merge variables, agenda text, duration, tags, owner, visibility (private vs org-wide). Selecting one auto-fills the booking. | Admins define; reps and bookers consume | Activity > Meetings > Meeting types → add/configure → reuse everywhere | [S-MTG-001] [S-MTG-003] |
| Team distribution: manual / round-robin | Team meeting types assign via Manual (booker picks anyone), Round Robin - Strict (auto-assigns the member with the fewest counted meetings; booker cannot override), or Round Robin - Flexible (even spread but reassignable to any available member, list ordered by meeting count). | Revenue teams; admins configure | Create team meeting type → pick distribution model → bookings auto-assign | [S-MTG-001] |
| Round-robin counting rules | Counting configurable: count a meeting when booked-to-hold-this-month vs as soon as booked; optional inclusion of no-shows and cancellations; counts are per meeting type and reset monthly on the 1st at midnight in the org's default time zone; members must have availability set. | Admins/RevOps | Configure counting options on the meeting type | [S-MTG-001] |
| Public booking links | Per-user shareable URL (slug defaults to username, customizable; branded-URL option) where prospects self-select a slot: time zone auto-detected from the browser with a switcher and 24-hour display, reschedule supported, booking-page languages EN/DE/FR/ES. Prospects can't add guests on the page (they add via their own calendar invite). | Prospects book; reps share | Personal Settings > Meetings > Calendar setup → customize URL → share link → prospect books | [S-MTG-004] [S-MTG-008] |
| Team booking links | Public calendar links backed by a round-robin team type, so an inbound buyer books instantly instead of submitting a contact form; teams segmented by geography/time zone, vertical, or market segment via separate meeting types. | Inbound/ABM teams | Publish team-type link → buyer books → round robin assigns | [S-MTG-002] |
| Insert availability into emails | From the composer (Outreach or Gmail via the Everywhere extension; Outlook via the add-in): insert hand-picked proposed times as clickable links, or insert the public calendar link showing all open slots; Outlook also appends the reschedule-capable calendar link tied to the meeting type. Used inside manual sequence emails. | Reps in sequence/email flow | Compose → calendar icon / Insert Availability → pick times or link → send | [S-MTG-005] [S-MTG-006] |
| Book from records | Schedule from the Meetings calendar (+Meeting or slot click), from a prospect record's meetings icon (auto-associates the meeting to the prospect), or bulk-invite from a prospect list; guests addable/removable and ownership transferable before sending the invite. | Reps | Record/list/calendar → book → send invite | [S-MTG-003] |
| Availability windows & book-on-behalf | Users define open availability windows consumed both by prospect self-booking and by teammates booking on that user's behalf — the plumbing for handoffs. | All users | Personal Settings > Calendar Scheduling → set windows | [S-MTG-007] |
| Live handoff scheduling | Positioned for handoff chains (sales development → AE → customer success): the rep books the next owner's meeting in one click while still live with the prospect, instead of coordinating afterward. | SDRs, AEs, CS | On call → book follow-up via team type/on-behalf → invite lands before hang-up | [S-MTG-002] [S-MTG-007] |
| Calendar integration | Per-user calendar connection is a setup prerequisite; admin-enabled Google Meet auto-attaches a conferencing link to public-calendar bookings; migrations de-dupe events by title + attendees + duration (calendar and Salesforce); external-attendee reminders configurable per meeting type. | Admins, all users | Connect calendar → enable conferencing → reminders per type | [S-MTG-009] [S-MTG-008] [S-MTG-001] |

## Key workflows

1. **Inbound demo booking via team link.** Admin builds a "demo" team meeting type
   (duration, agenda, variables, reminders) with Round Robin - Strict and counting rules
   → publishes the public team link → buyer opens it, sees browser-localized times,
   books → the member with the fewest counted meetings this month is auto-assigned,
   a Google Meet link attaches (if enabled), and reminders go to the attendee.
   [S-MTG-001] [S-MTG-002] [S-MTG-008]
2. **Availability inside a sequence email.** Rep writes a manual sequence email → inserts
   three proposed slots plus their public calendar link → prospect clicks a slot or picks
   from the full calendar, rescheduling later if needed → meeting created and associated
   with the prospect record. [S-MTG-005] [S-MTG-006] [S-MTG-004] [S-MTG-003]
3. **SDR-to-AE handoff on a live call.** Prospect qualifies mid-call → SDR books against
   the AE's availability windows (on-behalf / flexible round-robin team type) in one
   click → AE's invite and the prospect confirmation exist before the call ends;
   the same pattern repeats AE → customer success. [S-MTG-002] [S-MTG-007] [S-MTG-001]

## Data touched (cross-ref doc 04)

- **Meeting type**: template fields, owner, visibility, team roster, distribution model,
  counting rules, reminder config.
- **Meeting/event**: time, attendees, assigned owner, associated prospect/account,
  conferencing link, booked-via (link vs rep) provenance.
- **User**: calendar connection, availability windows, public-calendar slug, per-type
  meeting counts (monthly reset).
- **Prospect**: meeting associations; sequence email containing proposed-time links.

## Unknowns

- Booking-page form fields (what prospect data is collected at booking) and whether
  qualification/routing forms exist before slot selection.
- Buffers, minimum notice, and rolling date-range limits per meeting type — settings UI
  referenced but option detail not evidenced in fetched articles.
- Microsoft Teams conferencing parity with the documented Google Meet auto-attach.
- No-show detection mechanics (manual flag vs automatic) feeding the counting option.
- Whether clicking a proposed-time link auto-books instantly or opens a confirmation
  page. ASSUMPTION for our build: treat as confirm-page flow until verified.
- How a booked meeting mutates sequence state (auto-pause/finish on booking).

## Completeness checklist

- [x] Every claim carries a source ref resolving to `sources/meetings.md`.
- [x] Unknowns recorded above (none silently guessed).
- [x] Function described, not visual design.
- [x] ≤4 pages.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
