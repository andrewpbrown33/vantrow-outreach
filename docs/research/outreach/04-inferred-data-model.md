# 04 — Inferred Data Model (Clean Re-derivation)

**Tier:** P only. **Sources:** `sources/datamodel.md` (S-DM-001…004) +
`sources/api.md` (S-API-001…014), fetched 2026-08-06. This document is a
re-derivation for our schema, not a copy: we observed the public API surface (doc
05) and public help-center behavior descriptions, and re-expressed the domain in our
own entity language. **Convention: entity and field names below are our clean
names; where Outreach's observed name differs it appears as *(theirs: x)*.**
Unmarked claims trace to the cited source; design opinions are tagged
ASSUMPTION/INFERENCE. Req column: Y = evidenced required at create; blank = optional
or server-set; ? = unverified.

## 0. Entity map (one screen)

- **Tenancy:** Workspace *(theirs: org)* → User, Team, TeamMembership, Role,
  PermissionProfile *(theirs: profile)*, Mailbox (+SendAlias *(theirs: mailAlias)*)
- **People:** Company *(theirs: account)* 1—n Contact *(theirs: prospect)*;
  Contact 1—n ContactEmail *(theirs: emailAddress)* / ContactPhone *(theirs:
  phoneNumber)*; taxonomies Persona, LifecycleStage *(theirs: stage)*, Tag
- **Content:** Sequence → SequenceStep → StepVariant *(theirs: sequenceTemplate)* →
  EmailTemplate *(theirs: template)*; Snippet; SequencePolicy *(theirs: ruleset)*;
  ContentCategory (+memberships/ownerships)
- **Engine:** Enrollment *(theirs: sequenceState)* = Contact×Sequence×Mailbox with
  a state machine; touches materialize as EmailMessage *(theirs: mailing)* /
  CallLog *(theirs: call)* / Task
- **Ledger:** EngagementEvent *(theirs: event)* append-only; AuditLogEntry
  *(theirs: auditLog)*; denormalized counter blocks on content + enrollment rows
- **Deals:** Opportunity, DealStage *(theirs: opportunityStage)*,
  OpportunityContactRole, Product, Purchase
- **Compliance:** ErasureRequest *(theirs: complianceRequest)*, org blocklists
  *(theirs: orgSetting exclusions)*, per-channel opt-out on Contact, per-address
  unsubscribe on ContactEmail

## 1. Tenancy & identity

**Workspace** *(theirs: org)*. The tenant boundary. Not a first-class CRUD resource
in their public API — it appears as the token's org context, an `orgId` on audit
rows, and an `org` relationship in the S2S install handshake [S-API-002][S-API-005].
Org-wide config we did observe: send/sync blocklists (§8). INFERENCE: every row
carries the tenant key; we model `workspace_id` on all tables.

**User** [S-API-002]

| Field | Type | Req | Notes | Evidence |
|---|---|---|---|---|
| email | str | Y | immutable via API after create | S-API-002/008 |
| first_name / last_name | str |  | + server-computed full name | S-API-002 |
| username | str |  | unique friendly id | S-API-002 |
| locked | bool |  | lockout flag | S-API-002 |
| title, phone prefs, notification prefs | various |  | large preference bag (~70 attrs); telephony bridge/voip config | S-API-002 |
| scim_external_id, scim_source | str |  | SCIM provisioning provenance (also on Team) | S-API-002 |
| custom1..5 | str |  | small custom-slot block | S-API-002 |
| role_id, profile_id, mailbox ids | FK |  | relationships | S-API-002 |

**Team**: name, color, SCIM ids; users linked both directly and via role assignment
*(theirs: directAssignedTeams vs roleAssignedTeams)*; a TeamMembership join exists
[S-API-002]. **Role**: named node with parent/child self-references — a tree used
for record-access scoping, explicitly not the corporate org chart [S-API-002]
[S-DM-003]. **PermissionProfile** *(theirs: profile)*: named permission bundle;
`is_admin`, `special_id` (admin|default) [S-API-002]; semantics in §9.

**Mailbox** — first-class sending/syncing identity, separate from User [S-API-002]:

| Field | Type | Req | Notes | Evidence |
|---|---|---|---|---|
| email, username | str | Y? | address + account login | S-API-002 |
| provider / send_method / sync_method | enum |  | send: ews\|sendgrid\|smtp; sync: ews\|gmail_api\|imap; OAuth via auth ref | S-API-002 |
| smtp/imap/ews config | str/int |  | host, port, ssl; passwords write-only | S-API-002 |
| max_emails_per_day | int |  | in+out cap | S-API-002 |
| max_sends_per_day / per_week | int |  | theirs: maxMailingsPerDay (rec. 500) / maxMailingsPerWeek (rec. 5,000) | S-API-002 |
| send_period_secs + send_threshold | int |  | token-bucket pair (rec. 2/min) | S-API-002 |
| send_max_retries, send_requires_sync | int/bool |  | retry + freshness guard | S-API-002 |
| send_disabled / sync_disabled | bool |  | kill switches | S-API-002 |
| send/sync health timestamps | ts |  | errored/success/finished at | S-API-002 |
| signature_html, optout_message, optout_signature | str |  | per-mailbox content | S-API-002 |
| exclusion_patterns | text |  | per-mailbox sync excludes | S-API-002 |

Verification actions (test send/sync) and save-time validation flags exist; a
mailbox has n **SendAlias** rows (`email`, `can_send`) [S-API-002]. INFERENCE:
warmup state is not public — we add it (doc 14 dependency).

## 2. People & companies

**Company** *(theirs: account)*: name, natural_name, domain, website_url, industry,
company_type, employees (+linkedin_employees), founded_at, locality, revenue_range,
naics/sic code arrays, ticker, buyer_intent_score, `named` flag (list views show
only named companies), external `custom_id`, tags, custom1..150, touched_at, owner
[S-API-002]. Company 1—n Contact; contact list exposed as a filtered link, not an
embedded array [S-API-006].

**Contact** *(theirs: prospect)* — the busiest table [S-API-002]:

| Field | Type | Req | Notes | Evidence |
|---|---|---|---|---|
| first/middle/last_name | str |  | full name server-computed | S-API-002 |
| emails[] | str[] |  | plus normalized ContactEmail rows | S-API-002 |
| phones (home/mobile/work/other/voip)[] | str[] |  | plus normalized ContactPhone rows | S-API-002 |
| title, occupation, company_name | str |  | company_name mirrors linked Company | S-API-002 |
| address block | str |  | street/street2/city/state/zip/country | S-API-002 |
| social ids/urls | str |  | linkedin (id/slug/connections), twitter, github, stackoverflow, … | S-API-002 |
| time_zone (+inferred variants) | str |  | IANA preferred | S-API-002 |
| opted_out (+at) | bool/ts |  | global legacy opt-out | S-API-002 |
| email/call/sms_opt_status (+at) | enum/ts |  | granular per-channel: opted_in\|opted_out\|null | S-API-002 |
| available_at | ts |  | do-not-contact-until | S-API-002 |
| open/click/reply_count | int |  | RO; reset semantics: since last touch | S-API-002/008 |
| engaged_at, engaged_score | ts/float |  | server-computed lead quality | S-API-002 |
| touched_at | ts |  | last touch | S-API-002 |
| stage_id, persona_id, owner_id, company_id | FK |  | | S-API-002 |
| external_id / external_owner / external_source | str |  | CRM mapping hooks; import dupe key | S-API-002/009 |
| sharing_team_id | str |  | record-sharing scope (beta) | S-API-002 |
| custom1..150 | str |  | admin-typed via /types | S-API-002/010 |
| trashed_at | ts |  | soft delete | S-API-002 |

**ContactEmail** *(theirs: emailAddress)*: email, type work|personal, order,
status (+status_changed_at), unsubscribed_at — deliverability/consent lives
per-address, not only per-contact [S-API-002]. **ContactPhone**: number,
raw_number, type mobile|work|home|voip|other, order, status, country_code,
extension [S-API-002]. **Persona** and **LifecycleStage** *(theirs: stage)* are
small admin taxonomies (name, order, color) [S-API-002]. Tags are string arrays on
contact/company/sequence/template/call — no public tag entity CRUD, though
tag_created/destroyed events exist; the warehouse has a tags table [S-API-002]
[S-API-013]. INFERENCE: model Tag as an entity + join tables.

## 3. Content

**Sequence**: name (Y — blank name 422s in their docs example [S-API-006]),
description, kind interval|date *(theirs: sequenceType)*, schedule_interval_type
calendar|schedule, share_type private|read_only|shared, enabled(+at), archived
*(theirs: locked)* (+at), reply policy (§4.4), throttles (§4.5), max_activations
(date kind), transactional flag (§8), owner, policy *(ruleset)*, schedule ref,
computed automation_percentage / duration_days / step_count, counter block, tags
[S-API-002].

**SequenceStep**: sequence_id, order, step_type auto_email|manual_email|call|task,
interval-from-previous (unit discrepancy: spec says seconds, worked example implies
minutes — doc 05 Unknowns) XOR fixed date (date-kind sequences), task_note,
task_autoskip_delay_secs, display_name (computed), counter block [S-API-002]
[S-API-008]. LinkedIn/SMS touches are represented as `task`-type steps whose
generated Task carries the channel-specific task_type [S-API-002]. Steps link 0..n
**StepVariant** rows.

**StepVariant** *(theirs: sequenceTemplate)* — the step↔template join: template_id,
step_id, is_reply (thread as reply vs new thread), enabled(+at) via
activate/deactivate, own counter block → per-variant A/B stats; deleting the join
detaches the template [S-API-002][S-API-008].

**EmailTemplate** *(theirs: template)*: name, subject, body_html (16 MB cap),
share_type, archived(+at), track_opens/track_links defaults, default
to/cc/bcc_recipients[], tags, last_used_at, counter block; unnamed templates =
hidden per-sequence copies protected from edits [S-API-002][S-API-008].
**Snippet**: name, body_html, share_type private|shared, tags [S-API-002].
**ContentCategory**: name, color, allow_{sequences,templates,snippets}, team
sharing; membership + ownership joins [S-API-002].

**SequencePolicy** *(theirs: ruleset)* — reusable behavior policy attached to a
sequence [S-API-002][S-DM-002]:

| Field | Type | Req | Notes | Evidence |
|---|---|---|---|---|
| name, owner | str/FK | Y | required per help center | S-DM-002 |
| re_add_policy | enum |  | theirs: permitDuplicateProspects = allow \| disallow (default) \| only_if_inactive | S-API-002 |
| exclusivity | enum |  | all_sequences \| exclusive_sequences \| none (default); see §4.6 | S-API-002 |
| min_touch_gap_secs | int |  | theirs: minimumProspectTouchedInterval — contact latency gate at add time | S-API-002/S-DM-002 |
| include_unsubscribe_links | bool |  | forces list-unsub content | S-API-002 |
| email/call/sms_optout_action | enum |  | block-add + finish-active vs allow + skip channel steps | S-API-002/S-DM-002 |
| ooto_auto_resume (+in, +expires_in) | bool/int |  | wait time + max age needing manual resume | S-API-002/S-DM-002 |
| ooto_return_date_extraction | bool |  | parse return date from OOO body | S-API-002/S-DM-002 |
| stage transitions | FK×7 | | started/delivered/replied/bounced/opted_out/finished/completed → LifecycleStage (+completed delay) | S-API-002/S-DM-002 |
| open/click_call_task_threshold (+priority) | int/FK |  | engagement-triggered call tasks for the sequencing user | S-API-002/S-DM-002 |
| finish_on_meeting_booked / on_sms_received | enum |  | outside-sequence finish triggers | S-API-002/S-DM-002 |
| allow_step_overrides | bool |  | per-add template customization | S-API-002/S-DM-002 |

## 4. Enrollment — the SequenceState machine

**Enrollment** *(theirs: sequenceState)*: one row per Contact×Sequence engagement
attempt (re-adds allowed by policy create new rows — INFERENCE from re_add_policy
"only_if_inactive" wording [S-API-002]).

| Field | Type | Req | Notes | Evidence |
|---|---|---|---|---|
| contact_id, sequence_id, mailbox_id | FK | Y | create takes only these rels (+creator); mailbox chosen at add time | S-API-008 |
| state | enum | RO | server-owned; §4.1 | S-API-002/008 |
| state_changed_at, active_at | ts | RO | | S-API-002 |
| current_step_id | FK | RO | theirs: sequenceStep rel; set to step 1 on create | S-API-008 |
| pause_reason | str | RO | free text ≤255; vocabulary unknown | S-API-002 |
| error_reason | str | RO | last failure summary | S-API-002 |
| replied_at, call_completed_at | ts | RO | reply/answered markers | S-API-002 |
| counter block | int×11 | RO | schedule/deliver/open/click/reply/failure/bounce/opt_out + pos/neu/neg reply | S-API-002 |
| user_id (owner), account_id, opportunity_id | FK | RO | denormalized context | S-API-002 |
| cc/bcc recipients | join | | theirs: sequenceStateRecipients | S-API-002 |

### 4.1 States

API enum [S-API-008]: `active`, `pending`, `finished`, `paused`, `disabled`,
`failed`, `bounced`, `opted_out`. Help-center UI adds refinements [S-DM-001]:
Pending = sequence not enabled / daily throttle reached / no schedule window;
Paused OOTO = paused-with-OOO-reason (auto-resumes by default); Disabled = sequence
or step disabled or step lacks a template; Finished splits into **Finished
(Replied)** vs **Finished (No Reply)**. INFERENCE: UI states map onto the API enum
plus reason fields — finished + replied_at≠null renders "Finished (Replied)";
paused + OOO pause_reason renders "Paused OOTO". We model `state` + `state_reason`
+ `replied_at` rather than widening the enum.

### 4.2 Transition graph (derived from the two sources above)

```
create ─► active ──────────────────────────► finished (all steps done, no reply)
   │        │ ▲                          ▲
   ▼        │ │resume (manual or         │ finish (manual/API; call logged with
pending ◄───┘ │  OOTO auto-resume)       │  sequenceAction Finish*; reply w/
(throttle/    ▼                          │  policy=finish; meeting booked;
 no window/ paused (manual, OOO,         │  SMS received — per policy)
 disabled     missing template,
 sequence)    reply w/ policy=pause ──auto-finish after pause duration──►
   │
   ├─► bounced   (hard email bounce)          [terminal unless retried]
   ├─► opted_out (unsubscribe/opt-out)        [terminal]
   ├─► failed    (send failure; error_reason) [retry path exists in UI]
   └─► disabled  (sequence/step disabled)     [re-enables when cause clears]
```

Triggers evidenced: reply → per-sequence `primary/secondary_reply_action`
(finish|continue|pause, pause carrying an auto-finish duration) [S-API-002]; bounce
→ bounced [S-DM-001]; unsubscribe → opted_out [S-DM-001]; OOO → paused(+auto-resume
policy) [S-DM-001][S-DM-002]; manual pause/resume/finish via API actions
[S-API-002]; sequence disable/enable and step/template gaps → disabled/paused
[S-DM-001]; logged call `sequence_action` ∈ Advance | Finish | Finish-No-Reply |
Finish-Replied [S-API-002]; meeting-booked / SMS-received finish per policy
[S-DM-002]. Enrollment lifecycle events emitted: created, advanced, paused,
resumed, continued, finished, destroyed, mailbox_changed [S-API-002] — INFERENCE:
`continued` corresponds to the continue-after-reply/hold path; mailbox_changed
implies reassignment of the sending mailbox mid-flight is supported.

### 4.3 Pause/resume semantics

The `pause` action is defined only for active enrollments and `resume` only for
paused ones [S-API-002]. Manual pauses persist until manually resumed; OOTO pauses
auto-resume after the policy delay unless older than the policy's max age
[S-DM-001][S-DM-002]. A help-center article titled "Cannot transition to requested
state" exists for this error, confirming server-side transition guards [S-DM-005
*(snippet)*]. ASSUMPTION: resume recomputes the next touch time rather than firing
immediately — not publicly specified; flagged for our design.

### 4.4 Reply handling

Per-sequence, split by who replied: primary contact vs someone else
(`secondary_reply_action`) — each finish|continue|pause with independent pause
durations that auto-finish on expiry [S-API-002]. Reply detection marks
`replied_at` and bumps sentiment-classified reply counters
(positive/neutral/negative) [S-API-002].

### 4.5 Throttles (three layers observed)

1. Sequence: `throttle_capacity` (max active enrollments per user),
   `throttle_max_adds_per_day` (per user/day), `throttle_paused` [S-API-002].
2. Mailbox: daily/weekly send caps + send_period/send_threshold micro-rate
   [S-API-002].
3. Schedule windows *(theirs: schedule)* — a referenced entity (sequence.schedule,
   step.schedule) whose internals are not in the public API; "no available delivery
   time in the assigned schedule" keeps enrollments pending [S-DM-001]. UNKNOWN:
   schedule fields (business hours, timezone source).

### 4.6 Exclusivity & duplicates (policy-enforced at add time)

`exclusivity=all_sequences`: contact may be added only if active in no other
sequence, and while active blocks all other adds. `exclusive_sequences`: mutual
exclusion only among sequences with the same setting. `none`: no restriction
[S-API-002]. Re-add policy per §3; plus min-touch-gap and per-channel opt-out gates
[S-API-002][S-DM-002].

## 5. Touch execution artifacts

**EmailMessage** *(theirs: mailing)*: state machine `drafted → queued → delivering
→ delivered → opened → replied` with exits `bounced | failed` and pre-states
`placeholder | scheduled` [S-API-002]. Fields: subject, body_html (template
override), message_id + references[] (threading), track_opens/links + open/click
counts and timestamps, scheduled_at, retry (at/count/interval), error
(reason/backtrace), unsubscribed_at, marked_as_spam_at, mailing_type
sequence|single|campaign, follow-up automation (type + due time, follow-up
sequence), inbox-bump (condition/scheduled/status), sender guard
override_safety_settings; rels to mailbox, contact, enrollment, step, variant
template, task(s), opportunity [S-API-002]. INFERENCE: one row per send attempt per
recipient-set, created as draft/placeholder by the engine ahead of send.

**CallLog** *(theirs: call)*: direction, outcome, dialed/answered/completed
timestamps, disposition_id + purpose_id (org taxonomies), sequence_action
(Advance/Finish variants — the call's effect on the enrollment), recording URLs +
consent flag, provider ids (vendor_call_id, uid), user_call_type bridge|voip, note,
tags [S-API-002][S-API-008].

**Task**: action (action_item|call|email|in_person), state
pending→incomplete→complete, task_type (manual/follow_up/no_reply/touch +
sequence_step_* incl. five linkedin_* variants and sms), due_at, autoskip_at,
compiled step content for manual channels, completion metadata + disposition/
purpose/priority taxonomies, polymorphic subject (contact|company|opportunity)
[S-API-002]. Sequence task-steps materialize Tasks; completing/advancing them moves
the Enrollment (task action `advance`) [S-API-002].

**EngagementEvent** *(theirs: event)*: append-only; name (~160-value catalog: doc
05 §6), event_at vs created_at, immutable payload, request geo/device metadata,
external-event support (body, external_url) [S-API-002]. This stream + the counter
blocks are the analytics substrate; counters on Contact reset per touch cycle
[S-API-008]. **AuditLogEntry**: admin actions, ~90-day retention, request-id
correlation [S-API-002].

## 6. Deals

**Opportunity**: amount (+precise), currency, close_date, probability,
forecast_category, type, lead_source, lost_reason, next_step, record_type,
custom_id + external timestamps (CRM-mastered pattern), MAP fields, tags,
custom1..150; DealStage via both `stage` and `opportunityStage` aliases; primary
contact + role join (role, primary flag); line items/health factors referenced but
not CRUD-exposed [S-API-002]. Feature-gated by SKU [S-API-002]. **Product** /
**Purchase**: catalog + purchase lines, each with custom1..150 [S-API-002].

## 7. Sync & extensibility surfaces (model hooks)

External-system mapping fields everywhere (`external_id/owner/source` on Contact,
`custom_id` on Company/Opportunity; plugin-mapping relationship types; plugin_*
event family) [S-API-002]. Import subsystem tracks source, dupe method, mapping
JSON, per-run stats [S-API-002][S-API-009]. Webhook subscriptions are per resource
× action with signed deliveries (doc 05 §7). Custom fields: 150 typed slots on the
five big entities + admin-defined custom objects with own endpoints [S-API-010].

## 8. Suppression & compliance

- Org-wide blocklists: send_exclusions, prospect_email_exclusions,
  contact_exclusions *(theirs: orgSetting)* [S-API-002].
- Per-contact channel opt-outs (tri-state + timestamps) and legacy global opt-out;
  per-address unsubscribed_at on ContactEmail [S-API-002].
- Sequence `transactional=true` bypasses opt-out preferences (non-marketing use)
  [S-API-002]; policy decides whether opted-out contacts may be added at all
  [S-DM-002].
- **ErasureRequest** *(theirs: complianceRequest)*: type Delete (only), object
  Prospect|Recipient, pii JSON, batch UUID, states pending|running|failed|done with
  retried task fan-out — GDPR/CCPA deletion is a first-class async workflow, not a
  row DELETE [S-API-002][S-API-008].

## 9. Permission model

Permission = action × resource grant; PermissionProfile bundles permissions; Role
supplies the hierarchy that scoping rules traverse [S-DM-003]. Access scopes
observed: all records / owned records / direct reports' records / peers'+reports'
records [S-DM-003]. Defaults: Admin, Default, Leadership profiles [S-DM-004
*(snippet)*]. API enforcement: OAuth scopes at the door, then per-record governance
403s; per-record can_write/can_delete introspection via request meta [S-API-002]
[S-API-003]. Content share_type (private|read_only|shared) is a parallel,
content-local sharing axis on sequences/templates/snippets [S-API-002]. INFERENCE:
model as profile→permission rows (resource, action, scope-selector) + role tree
closure for "reports" resolution.

## 10. Cross-checks: API vs help center

| Topic | API says | Help center says | Resolution |
|---|---|---|---|
| Finished granularity | one `finished` state [S-API-008] | Finished (Replied) vs (No Reply) [S-DM-001] | state + replied_at derivation (§4.1) |
| OOTO pause | `paused` + pauseReason field [S-API-002] | distinct "Paused OOTO" chip, auto-resume default [S-DM-001] | reason-qualified pause |
| Pending | enum value only [S-API-008] | throttle/enabled/schedule-window causes [S-DM-001] | pre-active gate state |
| Step interval unit | "seconds" in field text [S-API-002] | guide example: minutes (2880 ≈ 2 days) [S-API-008] | UNKNOWN; verify empirically at build |
| Opt-out gating | ruleset enums exist [S-API-002] | per-channel block-vs-skip semantics [S-DM-002] | combined in §3 policy table |

## Unknowns

- `pause_reason` and `state_reason` vocabularies; whether OOTO is distinguishable
  from manual pause via API fields alone.
- Schedule entity internals (send windows, timezone resolution, jitter) — engine
  scheduling is entirely non-public.
- Exactly-once/idempotency machinery, cancellation race handling, and edit-behavior
  for in-flight enrollments when a live sequence is modified — invisible publicly;
  our doc 06 must design these from scratch.
- Whether re-adding a contact reuses or creates Enrollment rows (INFERENCE above).
- Meeting/booking entities (no public API resource; only calendar events + warehouse
  tables); Tag entity shape; internal triggers/smart-views (event names + schema
  relationship stubs only).
- Reply-sentiment classification source (positive/neutral/negative counters exist;
  the classifier and its labels are not public).
- Precise required-field sets per create endpoint (spec marks few `required`s).

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
