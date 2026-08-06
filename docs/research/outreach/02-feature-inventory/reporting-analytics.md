# Feature Inventory — Reporting & Analytics

**Tier:** P + F per the research README. This draft is **Tier P only** (agent-produced,
public sources); the Tier-F verification pass happens at Phase 1 synthesis. Zero `F-` refs.
**Sources:** `docs/research/outreach/sources/reporting.md` (S-RPT-…), cited inline.
**Prepared:** 2026-08-06, workstream B.

## Purpose

Outreach's reporting layer answers "is the motion working" at three altitudes: execution
funnels for leadership (activities → interactions → meetings → revenue), team/rep activity
for frontline coaching, and per-sequence content performance with step-level drill-down for
ops. The idiom is filterable metric tables refreshed daily, descended by clicking metrics,
exported as CSV, with sequence-based attribution tying meetings and CRM revenue back to the
touches that produced them (S-RPT-001, S-RPT-002, S-RPT-003).

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Report catalog | Left-nav Reports group lists: pipeline movement, team activity, pipeline generation, sales execution, team performance, sequence performance. The reporting help hub groups the core set as Sales Execution; Team Performance (Overview, Calls, Emails, Tasks sub-reports); Sequence Performance. Forecast-linked reports (pipeline movement/summary) appear only when forecasting is configured. | Leaders, managers, ops | Reports icon → pick report → filter | S-RPT-001; nav per S-UI-001 (ui fragment) |
| Sales Execution report | Leadership funnel: activity metrics (prospects contacted, emails delivered, calls, LinkedIn/SMS/in-person tasks), response metrics (prospects responded, reply/answer rates, positive-vs-objection sentiment), meeting metrics (invited, booked, scheduled, held — excluding canceled/no-show/declined), revenue metrics (opportunities created, open revenue, closed-won + revenue, % sequence-attributable). Comparison modes: timeframe vs previous period (incl. matched-weekday), team-vs-team, user-vs-user, or none. Filter picks persist locally per browser. | VP/leadership | Pick timeframe + comparison → read funnel → drill | S-RPT-003 |
| Team Performance suite | Overview: meetings booked + AI end-of-month booking forecast (daily update), prospects added/active/contacted, meetings conversion rate, contacts-per-prospect, emails delivered, calls, LinkedIn/other tasks, current overdue tasks, median response time, per-rep email sentiment. Sub-reports for Calls, Emails, Tasks (tasks pivot on due dates). Pivots by user, team, or account; drill-downs by meeting type and prospect seniority; column selection with save-as-default. | Frontline managers | Filter team/persona → pivot → drill by seniority | S-RPT-004, S-RPT-001, S-RPT-010 |
| Team Activity report | Daily-coaching activity counts in browser-local day boundaries (today / yesterday / this week): tabs for Summary, Tasks & Activity, Calls (outbound, connected, talk time, avg duration), Emails (delivered + open/click/reply/unsubscribe rates, in-sequence vs one-off vs bulk). Activity credits the acting user. | Managers (standups) | Open report → Today → scan team rows | S-RPT-005 |
| Sequence Performance report | Per-sequence adoption + outcomes: prospects added/contacted/replied, open/click/reply rates, meeting set rate, meetings booked, revenue block (opps created, open revenue, closed-won, amounts, % attributable). Wide filter set (date, team, user, currency, sequence, collection, persona, seniority, department, meeting type, tags, profiles, accounts, task non-adherence, agent usage). A job-title-classification model buckets prospects by seniority/department. Email Sentiments tab classifies reply types per sequence. | Ops, managers | Filter → rank sequences → drill into laggards | S-RPT-002 |
| Step-level drill-down | Clicking a sequence name opens step-level data per step type; metrics are email-centric (call/task steps listed without email-style metrics). Clicking a metric or revenue cell descends to underlying records (e.g. the opportunities behind a revenue figure). | Ops | Sequence → step → record list | S-RPT-002 |
| Pipeline Generation report | Manager pacing view + suggested-targets calculator: inputs (pipeline quota, average SQL value, SQL→opportunity conversion rate) yield weekly per-rep targets for meetings booked, outbound calls, prospects sequenced; tracks cumulative meetings, meetings/day, conversion rate, meetings held + held rate, cumulative calls, correct-connect rate (answered dispositions). | Managers | Enter quota assumptions → track weekly pacing | S-RPT-006 |
| Custom layouts | A tile-canvas overview dashboard: add/rearrange/resize/duplicate/rename ~15+ prebuilt tiles (call outcomes, email delivery/engagement/sentiment, leaderboard, meetings booked/held, cumulative meetings/calls, correct connects, prospects contacted, best-time-to-call, user/team/account tables with sortable exportable columns). Outreach-delivered templates (Performance, Team Activity); personal vs company-shared layouts; per-user and org defaults; profile-level create/share permissions. Engage content only — no conversation-intelligence/forecast/deal tiles. | Managers, ops | Clone template → edit tiles → share/set default | S-RPT-008 |
| History window | Reporting hub states 16 months of history for the core reports; exceptions: Sales Execution caps at 180 days; Team Performance date filter spans 7 days–15 months; point-in-time metrics ("active prospects/accounts owned") have no history at all. | All | Pick date range within the window | S-RPT-001, S-RPT-003, S-RPT-004, S-RPT-005 |
| Refresh cadence | Reports refresh daily (every 24 h); the booking forecast recomputes daily and needs ≥1 day of history. No intraday/real-time reporting is documented (real-time exists only in the engagement feed on the rep home, not in reports). | All | — | S-RPT-001, S-RPT-004; feed per S-UI-002 (ui fragment) |
| Exportability | On-demand CSV via an export control on the report page (documented for team/overview content, pipeline generation, sequence performance; team-performance CSV reflects the current filtered view). No scheduled exports, email delivery, or BI connectors documented. | Ops, analysts | Set date interval → Export → download | S-RPT-007, S-RPT-004 |
| Meeting attribution | A booked meeting credits a sequence by descending specificity: booked via an emailed link → that email step; booked during a call → the in-progress call step; else the most recent completed sequence task within 30 days. Only the first meeting per prospect per 30-day window is attributed. | Engine (reports consume) | — | S-RPT-002 |
| Revenue attribution | Opportunities attribute to sequences when created within 90 days of sequence involvement, resolved in precedence order: primary contact-role prospect → other associated prospects → account-level prospects. Eligibility requires CRM opportunity sync, opportunity contact roles, and 1:1 stage mapping; ≤$0 opportunities excluded (sales execution). | Leadership (reads), admins (configure) | Configure CRM sync → attribution activates | S-RPT-002, S-RPT-003 |
| Outcomes / win-loss view | Won-business visibility = closed/won counts + revenue inside sequence performance and sales execution, plus per-sequence attribution percentages; reply-sentiment tabs give qualitative outcome texture. No dedicated standalone "win/loss analysis" report is publicly documented in this catalog — deal outcome analytics beyond these blocks appears to live in the deal/forecast modules (see workstream D docs). INFERENCE from catalog absence. | Leadership | Sales execution → revenue block → drill | S-RPT-002, S-RPT-003, S-RPT-001 |
| Team-history semantics | Newer reports (sequence performance, team performance) respect team membership at activity time; the reporting hub and pipeline generation warn that activity follows current team association — i.e. historical team attribution is inconsistent across report generations. | Admins/analysts | — | S-RPT-001, S-RPT-002, S-RPT-004, S-RPT-006 |
| Reporting governance | Team-based visibility scoping for reports; profile-level permissions govern custom-layout viewing/creation/sharing; org default layout set under user administration. | Admins | Configure profile + team scopes | S-RPT-009, S-RPT-008 |

## Key workflows

1. **Weekly leadership review.** VP opens Sales Execution, sets this-quarter vs previous
   period (matched weekday), compares two teams, reads the funnel from activity through
   closed-won revenue and the % attributable to sequences, clicks a revenue cell to list the
   underlying opportunities (S-RPT-003, S-RPT-002).
2. **Content tuning.** Ops opens Sequence Performance filtered to the SDR team + last 30
   days, sorts by reply rate, drills a weak sequence to step level, finds the step where
   engagement dies, checks the Email Sentiments tab for objection patterns, then clones and
   revises the sequence (S-RPT-002).
3. **Daily coaching.** A manager opens Team Activity at 4pm ("Today"), scans calls/emails/
   overdue tasks per rep, then uses Pipeline Generation's calculator to reset weekly
   per-rep targets from the quarter's remaining quota (S-RPT-005, S-RPT-006).
4. **Exec extract.** An analyst filters Team Performance to a persona + 6 months, pivots by
   team, exports CSV, and rebuilds the view in the exec BI tool — the documented (and
   review-criticized) path to dashboards outside the product (S-RPT-004, S-RPT-007).

## Data touched (cross-ref doc 04)

- **Activity aggregates**: emails delivered + open/click/reply/unsubscribe events (14-day
  measurement window), calls + dispositions/talk time, tasks by category/due date, meetings
  by lifecycle state (S-RPT-002, S-RPT-005).
- **Prospect classification**: persona, seniority, department (ML job-title model)
  (S-RPT-002).
- **Sequence + step** dimensions; collections; tags (S-RPT-002).
- **Opportunities from CRM sync**: stage mapping, contact roles, amounts, currencies
  (S-RPT-002, S-RPT-003).
- **Org structure**: teams (+membership history), users, profiles, locked status
  (S-RPT-004).
- **Attribution edges**: meeting→step, opportunity→sequence (S-RPT-002).

## Unknowns

- Pipeline Movement report contents (nav-listed; forecasting-gated; no accessible article
  captured — workstream D's forecasting doc should cover it).
- Whether any report offers intraday refresh or a "last updated" indicator.
- Retention beyond 16 months (archival, deletion, or export-only).
- Whether report data is reachable via the public API vs UI-export only (doc 05 question).
- Scheduled/emailed report delivery — not documented; presumed absent (INFERENCE).
- Exact export coverage for sales-execution and team-activity views.
- Dedicated win/loss analytics in deal/forecast SKUs (out of this doc's licensed scope).
- Whether custom layouts can be built over non-Engage data now (docs say not yet).

## Completeness checklist

- [x] Every claim sourced to an S-RPT row (Tier P), or labeled INFERENCE.
- [x] Unknowns filled (8 items).
- [x] Function described, not visual design.
- [x] ≤4 pages / ≤200 lines.
- [x] Zero `F-` references in this draft.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
