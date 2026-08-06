# 03 — UI Walkthrough (Functional)

**Tier:** P + F per the research README; this draft is **Tier P only** (agent-produced from
public help-center articles, product pages, and customer reviews). The Tier-F pass adds
founder verification later; F-screens would be internal-only prose. Zero `F-` refs here.
**Protocol §6 note:** this document describes **function only** — what each screen
accomplishes, what data it shows, where actions live. No visual styling, colors, or
iconography are recorded, and no screenshots are embedded; sources are article URLs + dates
in `docs/research/outreach/sources/ui.md` (S-UI-…), cited inline.
**Prepared:** 2026-08-06, workstream B.

---

## 1. Information architecture & navigation

**Left rail.** A collapsible global navigation (icons+labels or icons-only) organizes the
product into groups (S-UI-001):

- **Forecasting** — forecast rollup, scenario planner (only when forecasting is configured
  and the user is granted access).
- **Activity** — email outbox, calls, meetings, tasks, SMS, sequence states. These are the
  execution surfaces: things that happened or are due.
- **Agents & AI** — revenue agents, research agents, AI summaries. A Feb-2026 restructure
  made this the primary AI entry point and split out personalization/research agents;
  seller content moved into a "Knowledge" section (S-UI-026).
- **Content** — sequences, templates, snippets, meeting types, success plans: the reusable
  asset library.
- **Reports** — pipeline movement, team activity, pipeline generation, sales execution,
  team performance, sequence performance.
- **Apps** — connected integrations.
- **Opportunities** — the deal grid (own top-level entry) (S-UI-014).

Navigation is **conditional**: entries render only if licensed/configured and permitted, so
two users can see different trees (S-UI-001). Administration lives in its own compact menu
(S-UI-001). A keyboard-shortcut set exists for navigation and common actions (S-UI-021).
Prospects and Accounts are reachable as record list views with their own pages (S-UI-006,
S-UI-007). The mental model: Content (assets) → Activity (execution) → Records
(prospects/accounts/opportunities) → Reports (measurement) (INFERENCE from the grouping in
S-UI-001).

**Global sidebar.** A slide-in panel summonable from any page (top-right control) with three
toggles: due-task queue, live activity feed, calendar. It is the persistent "what's next"
surface and the launcher for task flow (S-UI-003).

**Floating dialer.** Call control lives in a free-floating, draggable window that persists
across navigation rather than a page: outbound number (click-to-copy; rotates under local
presence), connected parties, call timer, mute/audio-device settings, hold (with hold music),
keypad, record start/stop, an in-call log/disposition notepad that auto-surfaces after the
call, add-participant/transfer, merge, and leave-without-disconnecting. Inbound calls show
answer/decline; a second inbound call adds a bar with number + prospect name and
answer-and-hold / decline-to-voicemail / switch options (S-UI-015).

**Quick actions.** A toolbar exposes global compose (email w/o pre-filled recipient) and
new-task creation from anywhere (S-UI-010, S-TSK-002 in the tasks fragment).

---

## 2. Rep home — the 360° dashboard

The default rep landing page is a daily command center with three functional zones
(S-UI-002):

1. **Top — performance + workload charts:** where the rep stands for the week and what is
   due today.
2. **Right — live engagement feed:** a real-time stream of opens, clicks, and replies from
   prospects the rep owns, filterable by date range and event type. This is the "who is hot
   right now" surface.
3. **Bottom — due-task queue:** every due task, sortable three ways: **priority** (labeled
   with the originating sequence step), **engagement score** (opens=1 / clicks=2 / replies=3
   from the most recent mailing; highest first), or **sequence name** (S-UI-002).

A prominent **play control** starts focused execution: the rep first picks a slice (emails,
calls, or action items — matching how reps batch similar work), then enters task flow
(S-UI-002). Customer reviews single this pattern out: "The 360 view is... perfect for
starting your day off and seeing what you need to complete and where your focus should be"
(G2 reviewer, snippet, S-UI-023).

## 3. Task flow — one task at a time (the signature pattern)

Entering task flow replaces browsing with a paced, full-attention loop (S-UI-003):

- A **header band** shows progress: task count, current task type, prospect name.
- The **prospect's context sits beside the action**: a configurable tab (Overview, Activity,
  Emails, or Sequences page — per-user setting, plus an option to auto-show sequence details
  for sequence tasks) so the rep researches and acts in one place.
- **Hover cards** on the prospect name show last engagement and contact options; link icons
  jump to external profiles.
- Completing a task advances to the next; a **clock control reschedules** the current task
  without leaving the flow; urgent items can be snoozed (S-UI-003; S-TSK-005 in tasks
  fragment).
- Entry points: the 360 play control, or the global sidebar queue slices (All / One-Off /
  Sequence / Account / Opportunity tasks), each pre-sortable by priority or engagement
  (S-UI-003).

**Universal Task Flow** extends the same loop outside the app: the Chrome extension drives a
dedicated browser tab to the right page per task (Salesforce record, LinkedIn profile, any
site), with per-prospect link switching, a default landing-page setting, and a resizable
flow sidebar (S-UI-004).

Functional takeaway for our build: the pattern is (a) one queue, many entry slices;
(b) context-beside-action; (c) never dead-end — reschedule/skip inline; (d) portable to
third-party surfaces.

## 4. Sequences — list and builder

**List.** Sequences live under Content as a searchable table filterable by collection, with
customizable stat columns covering delivery/engagement outcomes per sequence (delivered,
opened, clicked, replied, no-reply counts) (S-UI-008; list mechanics per the shared
list-view idiom, S-UI-006 — INFERENCE that the same column/save patterns apply).

**Builder.** Creation is a dialog: name, optional description, **sequence type** — steps by
day interval (relative spacing; enroll anytime) vs. steps by exact date/time (event-driven)
— and a **sharing level**: private / others-can-view / others-can-use (S-UI-008). Start
from scratch, from a **blueprint** (pre-built cadence), or by **cloning** (S-UI-008). Steps
stack vertically via Add Step → choose type (auto email, manual email, phone call, generic
task, LinkedIn) → configure content/interval (S-UI-008). Sequence-level settings include an
attached **ruleset** governing enrollment/exit behavior (glossary-level, S-TSK-007).
A documented warning: editing an active sequence with live prospects yields inconsistent
behavior — the sanctioned pattern is clone-and-replace, i.e. de-facto versioning
(S-UI-008). Per-prospect **sequence states** (11 documented: pending, active, paused,
paused-OOTO, disabled, failed with hover reason, bounced, finished-replied,
finished-no-reply, opted-out) are visible on the sequence's prospects tab and on a dedicated
states surface with 15 filters, 3 sorts, and export (S-UI-017).

## 5. Prospect & account views

**Prospect profile.** A center workspace with seven tabs (S-UI-005):

- **Overview** (default): prospect info + org-configurable intelligence tiles.
- **Activity**: every touch (emails, calls, tasks), sortable/filterable,
  viewer-timezone timestamps.
- **Emails**: the exchange history — whether each mail was sequenced, engagement status,
  bounce detail on hover; reply/forward inline.
- **Sequences**: current + historic memberships with active/inactive indicators.
- **Opportunities / Calls / Meetings**: mirrors of the corresponding list surfaces scoped to
  the prospect; meetings editable in place.

A **fixed right panel** persists across tabs: contact info, sequence stats, and quick
actions (add to sequence, book meeting) — the "act from anywhere on the record" surface
(S-UI-005). Editing opens grouped field categories (personal, contact, job, account,
education, location, links, notes, custom fields) (S-UI-005).

**Prospect list view.** The workhorse grid (S-UI-006): manage-columns control; sort +
refresh; quick filters + keyword search; **saved views** for recall; **infinite scroll**;
row-hover menu with per-row quick actions (edit, log call, email, add to sequence, create
task); and a **slide-out record panel** (click row whitespace) with Profile / Email / Calls /
Meetings / Sequences / Notes tabs so a rep can act without losing list position. Bulk
selection powers mass actions — e.g. multi-select → invite to meeting; bulk add-to-sequence
exists likewise from list surfaces (S-UI-013; INFERENCE generalizing documented multi-select
actions across list views).

**Account list + profile.** Account rows carry: name (+prospect count), clickable tags
(click = filter), sequence participation (active/inactive counts, hover + click-through),
12 months of email-activity summary on hover, status click-throughs for tasks /
opportunities / CRM link, and owner (S-UI-007). The account **slide-out** has Overview
(details, public-filing summaries and key takeaways, engagement timeline, opportunities,
next meeting, recordings, upcoming tasks), Account Plan, Activity, and Prospects tabs, plus
a grounded account Q&A chat drawing on recent context (bounded at ~80 emails, 10
calls/meetings) (S-UI-007).

## 6. Email composer & template editor

**Composer.** Reachable from a prospect's profile, from list-row hover, or the global
toolbar (the last without a pre-filled recipient). To/CC/BCC; multiple To-prospects branch
into **separate threads** unless CC/BCC'd; recipients must be prospects and opt-outs are
unmailable (a hard product guarantee, not rep discretion) (S-UI-010). Attachments cap at
5 MB (S-UI-010). Open/click tracking is org-gated; when on, opens default per-message with
a per-email opt-out toggle at compose time (S-UI-012). Saved-for-later drafts land in the
email outbox's drafts area (S-UI-018). **Bulk compose** sends one dynamic message
personalized per prospect at delivery; sequences are recommended past ~50 recipients
(S-UI-010).

**Templates & snippets.** Templates are full reusable emails (used by sequences, one-off,
bulk); snippets are reusable fragments dropped into any compose. The template editor
supports preview + send-test (tests omit unsubscribe links and attachments) and enforces a
5 MB image budget (S-UI-011). Sharing/governance is set at the asset level, and collections
group assets for team-scoped access (S-TSK-007 glossary; S-UI-008 sharing levels on
sequences).

**Personalization system** (S-UI-009):

- **Variables** `{{…}}` across prospect / account (`{{account.*}}`) / opportunity
  (`{{opportunity.*}}`) / sender (`{{sender.*}}`) / custom (`{{custom#}}`) namespaces;
  usable in subject, body, and URLs.
- **Conditional blocks** `{{#if}}` / `{{#unless}}` test field population and day-of-week;
  unless-blocks nest, if-blocks do not; value comparison is unsupported.
- **Format helpers** `{{format_number}}`, `{{format_date}}`.
- **Comment variables** `{{! …personalize here… }}`: visibly flagged placeholders that
  **block sending of manual emails until a human replaces them** — enforced
  personalization-at-scale. Not applicable to auto emails (S-UI-009).

## 7. Meetings UI

A calendar surface (day / week / work-week / month) filterable to booked prospect meetings,
with shared-calendar viewing (S-UI-013). Booking: click a slot or +Meeting → panel with
**meeting type** (auto-populates invite content and the reporting category; favorited types
list first; attached reminders auto-add and are disclosed at selection), title, guests +
owner reassignment, date/time details → send invite (S-UI-013). Booking from a prospect
profile auto-associates the record; bulk prospect invite exists from list views; booked
meetings are click-to-edit/reassign (S-UI-013). Meeting types are created/managed under
Content (S-UI-001, S-UI-013).

## 8. Opportunity views — grid, not kanban

Opportunities are a **table/grid** — there is **no drag-across-columns kanban board**;
stage navigation is via clickable stage chips above the grid showing per-stage counts
(S-UI-014). Columns: name (with close date, amount, prospect count, account), prospects,
stage, an **activity timeline cell** — three trailing weeks, one marker per day,
distinguishing seller-side vs. buyer-side activity with hover day detail — status sub-icons
(meetings, tasks, sequences, CRM sync), next-steps text, owner, and optionally close date +
amount (S-UI-014). Depending on org configuration: **inline editing** of stage, close date,
next steps, owner; and **field-change indicators** flagging edits within the last 7 days
with hover direction-of-change (S-UI-014). A **slide-out deal panel** carries Health,
Prospects, Activity, Sales Methodology (MEDDPICC fields + AI insights when enabled), and a
deal Q&A tab, with header actions Edit / Add Prospect / View in CRM (S-UI-014). Records are
expected to be created in the CRM and synced down, not authored here (S-UI-014). Saved
views and custom columns follow the list idiom (S-UI-014).

## 9. Reporting idiom

Reporting is **table-first with drill-down**, not dashboard-first: pick a report from the
Reports group, filter (date/team/user + report-specific dimensions), read a metric grid,
and **click a metric or row to descend** — e.g. sequence → step-level metrics per step
type → underlying prospects/opportunities (S-RPT-002 in the reporting fragment). Sentiment
lives as tabs inside reports; CSV export is the universal escape hatch; a tile-based custom
layout builder exists for the overview surface (S-RPT-008). Full catalog, windows, cadence,
and attribution: `02-feature-inventory/reporting-analytics.md`.

## 10. Activity surfaces

- **Email outbox**: all Outreach-scheduled mail (one-off + sequenced) in one mailbox-like
  page, classified by delivery state into header tabs, filter/search incl. "sender is you";
  outbox states are distinct from sequence states (S-UI-018).
- **Sequence states page**: fleet view of per-prospect states for bulk fixing (failed,
  bounced, paused) with filters/sorts/export (S-UI-017).
- **Calls / Meetings / Tasks / SMS**: per-channel activity lists mirrored into record tabs
  (S-UI-005).

## 11. Admin & settings

- **Access control:** RBAC with **roles** in a multi-level hierarchy (explicitly not the org
  chart) — one role per user; **profiles** as permission bundles (action × resource across
  prospects, accounts, opportunities, sequences, tasks, …); record visibility scopes: all
  vs. owned-only, plus hierarchy scopes (direct reports' records, peers' records)
  (S-UI-019). Three stock profiles: Admin, Leadership, Default; admins mint arbitrary
  profiles and assign user sets (S-UI-020).
- **Workflow automations:** triggers configured under Administration (see
  `02-feature-inventory/tasks-workflow.md`).
- **Content governance:** collections group templates/sequences/snippets for role/team
  scoped access; per-asset sharing levels (private / view / use) (S-TSK-007, S-UI-008).
- **Reporting governance:** team-scoped report visibility; profile-level controls over
  custom layout creation/sharing; org default layout under Users & Permissions (S-RPT-008,
  S-RPT-009).
- Nav renders admin surfaces compactly and conditionally (S-UI-001).

## 12. Mobile app scope

Companion app (iOS/Android), not a parity client (S-UI-016). Can: view/sort/execute call
and email tasks (templates auto-fill for sequenced manual emails); make/receive Outreach
Voice calls (hold/mute/record per org policy — playback web-only); read/reply email;
send/receive SMS (no SMS tasks/notifications, no MMS); search/view prospects + accounts
(edits limited to adding phone numbers); agenda view + create meetings; play recordings;
chat with the AI assistant; view/edit/submit forecasts; smart views. Cannot: admin/triggers,
create sequences or content, execute non-call/email task types, add prospects to sequences,
edit records. SSO login via web flow; light/dark setting (S-UI-016).

## 13. Design-language summary (functional level only)

Per §6 we record structure, not aesthetics: a dense, multi-panel working idiom — persistent
left rail + center workspace + fixed right record panel + summonable global sidebar;
records open in **slide-out panels over lists** rather than full navigations; tables/grids
with manage-columns, saved views, inline edit, infinite scroll are the default surface;
a distinct focused mode (task flow) strips navigation for queue execution; one floating
utility window (dialer) persists across pages (S-UI-002, S-UI-003, S-UI-006, S-UI-014,
S-UI-015).

**What users praise** (customer reviews): consolidation and organization — "Outreach is the
do it all tool for outbound sales teams" (Capterra, Account Development Manager, May 2026,
S-UI-022); "streamlines sales engagement through automation while remaining easy to use"
(Capterra, Senior SDR, Aug 2025, S-UI-022); engagement tracking called "hugely helpful" and
"Email outbox is awesome—seeing everything in one place" (Capterra, Sales Ops Manager, May
2026, S-UI-022); the 360 view as the day-starter (G2 snippet, S-UI-023); sequences/
automation the most-commended capability (TrustRadius snippet, 15/18 reviewers, S-UI-024).

**What users complain about**: learning curve and density — new users find it overwhelming,
with onboarding taking weeks and multi-layer menus described as a "maze" (G2 snippets,
S-UI-023); "UI/UX is not the easiest to navigate" (Capterra, Head of Enterprise Sales, Dec
2025, S-UI-022); performance friction — "crashes, slow loading", clunky/slow when switching
tasks or loading large lists (Capterra analysis + G2 snippets, S-UI-022, S-UI-023); extension
instability during calls (TrustRadius snippet, S-UI-024); reporting hard to extract for
exec dashboards (TrustRadius snippet, S-UI-024); automation gaps — "hard to update field
values" (Capterra, Sales Ops Manager, May 2026, S-UI-022); cost (G2 snippet, S-UI-023).
Capterra aggregate: overall 4.4/5, ease-of-use 4.2/5 (S-UI-022). Build implication: keep the
queue/flow pattern, design away the density and admin burden.

## Unknowns

- Exact current left-rail item inventory post the 2026 "Knowledge"/agents restructure
  (S-UI-026 is release-note level; a licensed tenant may differ by SKU/profile).
- Whether sequence-list stat columns are fixed or fully manage-columns-driven (INFERENCE
  flagged in §4).
- Home-dashboard chart inventory beyond "weekly performance + tasks due" (article names the
  zones, not each widget).
- Composer scheduling (send-later) mechanics and rich-text toolbar specifics — drafts/outbox
  behavior is documented, per-mail scheduling UI is not (snippet-level only).
- Bulk-action catalog per list view (documented: task reassign, invite-to-meeting,
  sequence-add; full menu unverified).
- Empty/loading/error patterns, onboarding tours, in-app notification center.
- Web dark/light theming (documented on mobile only).
- Success plans and Knowledge/seller-content screens (named in nav; workstreams C/D cover
  the modules).
- Kaia meeting/live-assist screens (unlicensed module; workstream D).

## Completeness checklist

- [x] Every claim sourced to an S-UI/S-TSK/S-RPT row or labeled INFERENCE.
- [x] Function only — no visual styling, colors, or iconography recorded.
- [x] No screenshots embedded; URL+date+prose only.
- [x] Verbatim quotes only from customer reviews, cited.
- [x] Unknowns section present (9 items).
- [x] ≤8 pages / ≤400 lines; zero `F-` references in this draft.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
