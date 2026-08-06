# 05 — Public API Teardown: Outreach REST API v2

**Tier:** P only. **Sources:** `sources/api.md` (S-API-001…014), fetched 2026-08-06.
**Method:** the developer portal publicly serves its full OpenAPI 3.0.3 definition
[S-API-002] and a json-schema variant [S-API-012]; both were downloaded and parsed
(not screen-scraped), so the field inventory is complete for the public surface.
Guide pages were fetched as the portal's own markdown mirrors [S-API-003…011].
Descriptions are our own words; resource/field names are factual identifiers.

## 1. Platform basics

- Base URL `https://api.outreach.io/api/v2`; single versioned namespace (`v2` in
  path, no per-request version header observed) [S-API-002].
- JSON:API 1.0: `Content-Type: application/vnd.api+json` required (else 415);
  payloads `{data: {type, id, attributes, relationships}}`; errors as an `errors`
  array with `id`, `title`, `detail`, JSON `source` pointer [S-API-006].
- Vendor-published machine schemas: portal OpenAPI YAML; public `/api/v2/schema.json`
  (org custom objects only with token); auth-only `/api/v2/types` for custom-field
  validations [S-API-002][S-API-010][S-API-012]. `GET /api/v2` (root) returns
  app/token identity + org attributes [S-API-003].
- Evolution by deprecation, not new versions: relationship-attribute filter/sort and
  include-on-write removed May 2023; `count=true` becoming opt-in; legacy Audit API →
  `auditLogs`; `contactHistogram` leaves the default payload 2026-10-01 [S-API-011].

## 2. Authentication & authorization

**OAuth 2.0 authorization-code flow** (user-context) [S-API-003][S-API-004]:
`GET https://api.outreach.io/oauth/authorize?client_id&redirect_uri&response_type=code&scope&state`
(scope space-separated; `state` echoed for CSRF defense), then
`POST https://api.outreach.io/oauth/token` with `client_id`, `client_secret`,
`redirect_uri`, `grant_type=authorization_code|refresh_token`, `code|refresh_token`.
Token response: `access_token`, `token_type: Bearer`, `expires_in: 7200`,
`refresh_token`, `scope`, `created_at`. Lifetimes: access 2 h; refresh 14 d; ≤100
live token pairs per user×app; each refresh issues a new refresh token; token
endpoint allows one grant per user per 60 s (else 429). Portal-registered apps get
**development credentials** (any org; weekly re-auth beyond 10 users of the owning
org) vs **production credentials** (app-publishing review); secrets shown once
[S-API-004].

**Scopes** [S-API-003]: `<pluralResource>.<read|write|delete|all>`; levels NOT
additive (`write` ⊅ `read`). Missing scope → 403 `unauthorizedOauthScope`. Scopes
gate the API door only; per-record **governance** can still deny (403
`unauthorizedRequest`); record-level rights are introspectable via the
`provideAuthorizationMeta` query param → `canWrite`/`canDelete` meta [S-API-002].

**Server-to-server (S2S)** [S-API-005]: app-identity tokens without a user — app
signs a RS256 JWT (`iss` = its `S2S_GUID`) and exchanges it at
`POST /api/app/installs/{INSTALL_ID}/actions/accessToken` for a 1 h org-scoped
bearer (no refresh; re-request). `INSTALL_ID` comes from a 15-minute
`installSetupToken` redirect or a lifecycle webhook at install time. S2S scope
subset: full access for accounts, calls, events, imports, opportunities, prospects,
sequenceStates, sequences, tasks, webhooks; read-only auditLogs, kaiaRecordings,
mailings, snippets, templates, users. Some writes demand an explicit acting-user id
since the token names none.

## 3. Request conventions

**Reads** [S-API-006]: `GET /{plural}` (collection; default page 50) and
`GET /{plural}/{id}`. Relationships appear as inline resource identifiers (to-one)
or `links.related` URLs (large to-many, e.g. account→prospects).

**Filtering**: `filter[attr]=v`; comma lists; ranges (`5..10`, open-ended
`neginf`/`inf`); `__null__`/`__notnull__` sentinels; relationship filters restricted
post-2023 to `filter[rel][id]=…` for most relations (documented two-step query
pattern); prefix search `filter[q]=` (accounts+prospects only; `_exact_`, `_NULL_`,
`_NOTNULL_` variants). `newFilterSyntax=true` switches to `filter[attr][]=v` arrays
and `filter[attr][gte|lte]=v` ranges so literal `,` and `..` are usable.
Filterable/sortable are per-attribute schema flags [S-API-002][S-API-006].
**Sorting**: `sort=attr`, `-attr` desc, comma-multi; relationship-attribute sort
removed (sort client-side) [S-API-006][S-API-011].

**Pagination**: cursor `page[size]=N` + `links.first/prev/next` (recommended, with
`count=false`); legacy offset `page[limit]` ≤1,000 + `page[offset]` ≤10,000 hard cap
(+`links.last`). **Counting**: `count=true` → `meta.count` + `count_truncated`,
capped at 2,000,000; under load the counter is shed (0 + truncated) [S-API-006].

**Compound documents**: `include=rel.subrel` side-loads into `included`;
`fields[type]=a,b` sparse fieldsets keyed by resource *type* (e.g. `fields[user]`
for `owner`) [S-API-006]. **Writes**: `POST /{plural}` (201, no client id);
`PATCH /{plural}/{id}` (200, partial — only provided fields change;
`{rel: {data: null}}` clears); `DELETE` (204); validation failures 422;
include-on-write removed [S-API-006]. **Actions**:
`POST /{plural}/{id}/actions/{verb}` + `actionParams[...]` query args; unacceptable
params → 400 [S-API-006]. **Maintenance**: API-wide 503 with ISO-8601 `Retry-After`;
status.outreach.io [S-API-003].

## 4. Rate limits

| Limit | Value | Scope | Source |
|---|---|---|---|
| Core API | 10,000 requests/hour | per user | [S-API-003] |
| Headers | `X-RateLimit-Limit/-Remaining/-Reset` (+`Retry-After`); 429 on breach | every response | [S-API-003] |
| Kaia recordings | 3 req/s and 6,000 req/day | per org | [S-API-003] |
| OAuth token grants | 1 per 60 s | per user×app | [S-API-003] |
| Bulk actions | 100,000 items/request; 5,000,000 batch items/day (shared with in-app bulk; allowance refills through the day) | per org | [S-API-009] |
| (vendor reserves the right to adjust limits at any time) | — | — | [S-API-003] |

## 5. Resource catalog (148 paths, ~50 exposed types) [S-API-002]

Ops: L=list G=get C=create U=update(PATCH) D=delete; "acts" = extra actions.

| Resource (path) | Ops | Purpose (our words) |
|---|---|---|
| accounts | LGCUD | Companies; 150 custom slots |
| accountNotes / prospectNotes | LGCUD | Notes attached to accounts / prospects |
| auditLogs | L | Admin/audit event log, ~90-day retention |
| batches, batchItems (+batches/actions/*, C×21) | LG + acts | Bulk-job tracking (confirm/cancel; per-item results); bulk verbs: prospects/accounts add/remove-tags, assign owner/account/opportunity, add/remove assignments, bulkModify, destroyAll, addToSequence, finishAll, pauseAll; customObject bulkModify/bulkDelete |
| calls (+callDispositions, callPurposes) | LGC,D / LGCUD | Call logs (no PATCH — logged records); org-defined outcome/reason taxonomies |
| complianceRequests | LGC | GDPR/CCPA deletion workflow rows |
| contentCategories (+Memberships, +Ownerships) | LGCUD / LGC,D / C,D | Content foldering for sequences/templates/snippets, team-shared |
| duties / favorites / mailAliases | L / LGC,D / LG | Job-duty catalog / per-user record bookmarks / send-as aliases of a mailbox |
| emailAddresses / phoneNumbers | LGCUD | Per-prospect email rows (status + unsubscribe timestamps) / phone rows (type, status) |
| events | LG | Append-only engagement/audit event stream (~160 named types) |
| imports + imports/actions/* | G + C×6 | CSV/S3 import machinery (generateUploadLink, validateUpload, prospectsImport, accountsImport, bulkUpsert, customObjectBulkUpsert) |
| kaiaRecordings / kaiaVoiceImports | LG / C | Meeting-AI recordings (read) and voice imports |
| mailboxes | LGCUD + acts | Connected email accounts: provider config, send/sync throttles; testSend, testSync, link/unlinkEwsMasterAccount |
| mailings | LGC | Emails (drafts→sends); no PATCH/DELETE |
| opportunities (+ProspectRoles, +Stages) | LGCUD | Deals (150 custom slots); contact-role join deal↔person (role, primary); deal-stage taxonomy (order, isClosed) |
| orgSettings/{id} | GU | Org-wide send/sync exclusion lists |
| personas / stages | LGCUD | Prospect persona taxonomy / lifecycle stages (name, order, color) |
| products / purchases | LGCUD | Product catalog & purchase lines (deal line items); 150 custom slots |
| profiles / roles | LGCUD | Governance profiles (permission bundles; isAdmin flag) / role-hierarchy nodes (parent/child) |
| prospects | LGCUD | People; 230 attrs incl. 150 custom slots |
| recipients | LGCUD | to/cc/bcc address rows on communications |
| rulesets | LGCUD | Sequence safety/automation policy objects |
| sequences | LGCUD + acts | Multi-step outreach flows; activate/deactivate/lock(archive)/unlock |
| sequenceStates | LGC,D + acts | Enrollment of prospect×sequence; **finish / pause / resume** |
| sequenceSteps | LGC,U | Ordered steps (no DELETE in spec) |
| sequenceTemplates | LGCUD + acts | Step↔template join w/ A-B stats; activate/deactivate |
| snippets | LGCUD | Reusable HTML fragments |
| taskDispositions / taskPurposes / taskPriorities | LGCUD / LG | Task outcome & reason taxonomies; fixed priority list (weight, color) |
| tasks | LGCUD + acts | Work items; advance, deliver, markComplete, snooze, reschedule, reassignOwner, updateNote, logMeetInPerson, updateOpportunityAssociation |
| teams / users | LGCUD / LGC,U | User groupings (name, color, SCIM ids) / seats (~70 attrs of preferences/telephony/SCIM; no DELETE) |
| templates | LGCUD | Email templates (subject+body, share, tracking, recipients) |
| webhooks | LGCUD | Outbound change notifications |

Custom objects add their own `/api/v2/customObjects/<internalName>` CRUD paths [S-API-010].

## 6. Key resources — fields that define the data model [S-API-002]

Spec flags per field: read-only (RO), write-only (WO), filterable, sortable,
`maxLength`. Highlights only; attribute counts per resource above.

**prospect** (230 attrs): identity (`firstName/middleName/lastName/name(RO)`,
`title`, `occupation`, `company`); contact arrays (`emails`, `home/mobile/work/
other/voipPhones`); address block; social URLs/ids (LinkedIn incl.
`linkedInId/Slug/Connections`, Twitter, GitHub, StackOverflow, AngelList, Facebook,
Quora); consent (`optedOut(+At)`, `emailOptedOut`, `callOptedOut`,
`emails/calls/smsOptStatus` + `*OptedAt`, `availableAt`); engagement
(`openCount/clickCount/replyCount` — since-last-touch [S-API-008], `engagedAt`,
`engagedScore`, `touchedAt`, `contactHistogram` 12-month, being demoted
[S-API-011]); routing (`timeZone` + inferred IANA variants, `region`, `source`,
`externalId/Owner/Source`, `sharingTeamId`); `custom1..custom150`; soft-delete
`trashedAt`. Rels: account, owner, creator/updater, stage, persona, emailAddresses,
phoneNumbers, activeSequenceStates vs sequenceStates, opportunities (+roles),
tasks/calls/mailings, favorites, assignedUsers/Teams, defaultPluginMapping.

**account** (176 attrs): `name`, `naturalName`, `domain`, `websiteUrl`, `industry`,
`companyType`, `numberOfEmployees`, `linkedInEmployees`, `foundedAt`, `locality`,
`annualRevenueRange`, `naicsCodes[]`, `sicCodes[]`, `tickerSymbol`,
`buyerIntentScore`, `named` (only named accounts listed), `customId`, `touchedAt`,
tags, custom1..150. Rels: owner, prospects (link-only), assignments, record teams.

**sequence** (41 attrs): `name`, `description`, `sequenceType` interval|date,
`scheduleIntervalType` calendar|schedule, `shareType` private|read_only|shared,
lifecycle `enabled(RO)`+`enabledAt`, `locked(RO)`+`lockedAt` (lock=archive); reply
policy `primary/secondaryReplyAction` ∈ finish|continue|pause +
`primary/secondaryReplyPauseDuration` secs before auto-finish (`finishOnReply`
deprecated); enrollment throttles `throttleCapacity` (active states/user),
`throttleMaxAddsPerDay` (adds/user/day), `throttlePaused(+At)`; `maxActivations`
(date-type only); `transactional` (bypasses opt-out prefs, non-marketing);
`automationPercentage(RO)`, `durationInDays(RO)`, `sequenceStepCount(RO)`, counter
block, `numContactedProspects`, `numRepliedProspects`, tags. Rels: owner,
creator/updater, ruleset, schedule, sequenceSteps, contentCategoryMemberships.

**sequenceStep** (20): `stepType` ∈ `auto_email|manual_email|call|task`; `order`;
`interval` for interval-type sequences (spec says seconds; the guide's example says
minutes and uses 2880 for "two days" — discrepancy, see Unknowns) XOR `date`
(date-type); `taskNote`, `taskAutoskipDelay` (secs until overdue tasks auto-skip);
`displayName(RO)`; counter block. Rels: sequence, callPurpose, taskPriority,
schedule, sequenceTemplates, creator/updater. LinkedIn/SMS "steps" surface as task
types created by task-steps (see task.taskType), not as stepType values.

**sequenceTemplate** (16): step↔template join carrying `isReply` (reply vs new
thread), `enabled(+At)` (RO; toggled via activate/deactivate — enables per-step A/B
variants), counter block; delete the join to detach [S-API-008].

**template** (27): `name`, `subject`, `bodyHtml` (16 MB cap) / `bodyText(RO)`,
`shareType`, `archived(+At)`, `trackLinks/trackOpens`, default
`to/cc/bccRecipients[]`, tags, `lastUsedAt`, counter block; unnamed templates hidden
from index but linkable — protects sequence copies from edits [S-API-008].
**snippet** (7): `name`, `bodyHtml/bodyText`, `shareType` private|shared, tags.

**sequenceState** (20): `state` (machine: doc 04 §4), `stateChangedAt`, `activeAt`,
`pauseReason(RO)`, `errorReason(RO)`, `repliedAt`, `callCompletedAt`, and the full
per-enrollment counter block (schedule/deliver/open/click/reply/failure/bounce/
optOut + sentiment reply counts). All attrs read-only — created with relationships
only (prospect+sequence+mailbox [+creator]); mutated via **actions** `finish`
(active→), `pause` (active→), `resume` (paused→) [S-API-002][S-API-008]. Rels:
prospect, sequence, sequenceStep (current), mailbox, user, creator, account,
opportunity, activeStepMailings, activeStepTasks, sequenceStateRecipients,
batchItemCreator.

**mailbox** (50): `email`, `username`, `emailProvider`, `providerType(RO)`;
plumbing: `sendMethod` ∈ ews|sendgrid|smtp, `syncMethod` ∈ ews|gmail_api|imap,
SMTP/IMAP/EWS host-port-ssl config, `sendgridApiKey(WO)` + `sendgridWebhookUrl(RO)`
(bounce/spam feedback), OAuth via `authId`; throttles: `maxEmailsPerDay`,
`maxMailingsPerDay` (rec. 500), `maxMailingsPerWeek` (rec. 5,000),
`sendPeriod`+`sendThreshold` (rec. 2/min), `sendMaxRetries`, `sendRequiresSync`;
health: `send/syncDisabled`, `send/syncErroredAt`, `send/syncSuccessAt`,
`syncFinishedAt`, `syncActive/PassiveFrequency`; content: `emailSignature`,
`optOutMessage`, `optOutSignature`; `prospectEmailExclusions`;
`validateSend/validateSync(WO)` save-time checks; actions testSend/testSync. Rels:
user, mailAliases.

**mailing** (34): `state` ∈ bounced, delivered, delivering, drafted, failed, opened,
placeholder, queued, replied, scheduled; `mailingType` sequence|single|campaign;
`subject`, `bodyHtml` (overrides template), `bodyText(RO)`; threading
`messageId(RO)` + `references[](RO)`; tracking `trackLinks/trackOpens`,
`openCount/clickCount`, `opened/clicked/replied/bounced/delivered/markedAsSpam/
unsubscribedAt`; `scheduledAt`, retries (`retryAt/Count/Interval`), errors
(`errorReason/Backtrace`); follow-up automation (`followUpTaskType`
follow_up|no_reply + `followUpTaskScheduledAt`, rel followUpSequence); inbox-bump
(`notifyThreadCondition` always|no_reply, `notifyThreadScheduledAt`, `-Status`
pending|sent|skipped); `overrideSafetySettings(RO)` (unresolved template-variable
guard); `mailboxAddress(RO)`. Rels: mailbox, prospect, sequence(+State/Step),
template, task(s), opportunity, recipients, attachments, calendar. Create-only via
API (drafts/one-offs); no PATCH.

**task** (14): `action` ∈ action_item|call|email|in_person; `state` ∈
pending|incomplete|complete (+`stateChangedAt`); `taskType` ∈ follow_up, manual,
no_reply, sequence_open, sequence_click, sequence_step_call, sequence_step_email,
sequence_step_linkedin_{interact_with_post, other, send_connection_request,
send_message, view_profile}, sequence_step_sms, sequence_step_task, touch
(API-created ⇒ manual); `dueAt`, `scheduledAt`, `autoskipAt`, `completed(+At)`,
`note`, `compiledSequenceTemplateHtml(RO)` (rendered SMS/LinkedIn step content),
`opportunityAssociation` ∈ recent_created|recent_updated|noop. Actions: advance
(sequence-step tasks — pushes the enrollment forward), deliver (sends the linked
draft mailing), markComplete(+completionNote), snooze (dueAt+1d rule), reschedule,
reassignOwner, updateNote, logMeetInPerson, updateOpportunityAssociation. Rich
denormalized rels for the task-flow UI: prospect(+account/stage/owner/contacts/
phones), sequence(+steps/templates/overrides), call, mailing,
taskPriority/Disposition/Purpose/Theme, subject (account|opportunity|prospect), team.

**call** (22): `direction` inbound|outbound; `outcome` ("Answered"/"Not Answered"
per schema; "completed"/"no_answer" in the guide example — both observed [S-API-002]
[S-API-008]); `state(RO)` + `stateChangedAt`; dialed/answered/completed/returnedAt;
`sequenceAction` ∈ "Advance", "Finish", "Finish - No Reply", "Finish - Replied"
(how a logged call moves the enrollment); `userCallType` bridge|voip; recording
(`shouldRecordCall`, `recordingUrl`, `voicemailRecordingUrl(RO)`); provider linkage
(`externalVendor`, `vendorCallId`, `uid(RO)`); `note`, tags. Rels: prospect, user,
task, sequence(+state/step), callDisposition/Purpose, phoneNumber, opportunity,
associatedId (account|opportunity), kaiaCrmRecording, outboundVoicemail.

**user** (70): `email` (immutable via API), `firstName/lastName/name(RO)`,
`username`, `title`, `locked`, `userGuid(RO)`, SCIM ids, `custom1..5`, per-screen
default smart-view ids, notification toggles, telephony prefs (`phoneType`
bridge|voip, bridge numbers, `preferredVoiceRegion`, `prefersLocalPresence`,
voicemail config), Outreach-Everywhere toggles, `jobRoleByName(WO)`,
`defaultRulesetId`. Invite: POST user; `meta.sendInvite:false` suppresses the email
[S-API-008]. Rels: mailboxes, teams (direct vs role-assigned), role, profile,
calendar, phones. **team** (6): `name`, `color`, SCIM ids; rels users,
teamMemberships, teamSettings. **role** (4): `name`, `externalId`; rels
parentRole/childRoles — the hierarchy. **profile** (5): `name`, `isAdmin(RO)`,
`specialId` (admin|default flag).

**opportunity** (176): `name`, `amount`/`amountPrecise`, `currencyType`,
`closeDate`, `probability`, `forecastCategory`, `opportunityType`, `leadSource`,
`lostReason`, `nextStep`, `recordType`, `customId`, `externalCreatedAt/UpdatedAt`,
MAP fields (`mapLink/mapNextSteps/mapStatus`), `touchedAt`, `trashedAt`, tags,
custom1..150; rels account, opportunityStage (aliased `stage`), owner,
primaryProspect, prospects via opportunityProspectRoles (`role`, `primary`),
opportunityLineItems, healthFactors, territory. Gated on the Opportunities SKU
[S-API-002].

**stage** (5, prospect lifecycle): `name`, `order`, `color` + creator/updater.
**persona** (4): `name`, `description`.
**emailAddress** (8): `email`, `emailType` work|personal, `order`, `status`
(+`statusChangedAt`, `unsubscribedAt`) — per-address deliverability/consent state.
**phoneNumber** (10): `number`, `rawNumber`, `phoneType` mobile|work|home|voip|
other, `order`, `status`, `countryCode`, `extension`.

**ruleset** (20): `permitDuplicateProspects` ∈ allow|disallow(default)|
only_if_inactive; `sequenceExclusivity` ∈ all_sequences|exclusive_sequences|
none(default) (semantics: doc 04 §4); per-channel opt-out gates
`email/call/smsOptOutAction`; `includeUnsubscribeLinks`; OOTO handling
(`autoResumeOotoProspects(+In, +ExpiresIn)`, `ootoAutoExtractionEnabled`);
`minimumProspectTouchedInterval`; engagement-triggered call tasks
(`opens/clicksNeededBeforeCallTaskCreated` + taskPriority rels); `stepOverridesEnabled`;
`meetingBookedAction`, `smsReceivedAction`; `applyCompletedStageIn`; stage-automation
rels (started/delivered/replied/bounced/optedOut/finished/completedStage).

**event** (11): `name` — the schema documents a ~160-value catalog: account_*;
bounced_message; calendar_* (attendee accept/decline/tentative/no-response,
canceled, no_show, created_inbound = booked via scheduling link vs
created_outbound); per-channel calls/emails/sms_opt_out(+_revert) plus legacy
global opt_out(_revert); inbound_/outbound_message; message_opened/clicked
(+_sender variants); inbound_/outbound_call_completed/no_answer/updated; mailbox_*;
meeting_held; note_*; opportunity_*; plugin_* (sync plumbing); prospect_* (incl.
merged, owner_changed, stage_changed, email_data_deleted); sequence_* lifecycle;
**sequence_state_created/advanced/paused/resumed/continued/finished/destroyed/
mailbox_changed**; sequence_step_*; sequence_template_*; task_*; team_*;
template_*; trigger_*; user_*; webhook_created [S-API-002]. `eventAt` vs
`createdAt`; `payload` immutable once written; request geo/device metadata;
external-event fields (`body`, `externalUrl`) — read-only stream plus POSTable
external events. Rels: account, call, mailing, opportunity, prospect, sequence,
sequenceStep, task, user, note, plugin.

**webhook** (11): `url` (HTTPS), `resource`, `action`, `active`, `secret`,
`payloadVersion` (1|2), `apiVersion`-free; ops metadata `disabledReason/Since/Until`,
creator-app tracking with viewer-dependent redaction of `secret`/`cleanupToken`
[S-API-007]. Delivery semantics in §7.

**complianceRequest** (10): `requestType` ('Delete' only today), `objectType`
('Prospect'|'Recipient'), `requestObjectId`, `pii` (JSON), `requesterId`,
`batchComplianceRequestUuid`, `uuid`, `state` ∈ pending|running|failed|done (guide
adds per-task queued/temporary_failure; retried until done) [S-API-002][S-API-008].

**auditLog** (10): `eventName`, `action`, `result` completed|pending|failed,
`agent`, `changes[]`, `requestId` (correlates dependent events), `orgId/globalId`,
`timestamp`; ~90-day retention; event-type table covers exports/downloads,
governance-profile CRUD, org settings, Kaia admin, job roles [S-API-002].
**orgSetting** (3): `sendExclusions`, `prospectEmailExclusions`, `contactExclusions`
— org-wide blocklists as delimited strings.

**Shared counter block** (RO stats recurring on sequence, sequenceStep,
sequenceTemplate, template, sequenceState, prospect): schedule/deliver/open/click/
reply/failure/bounce/optOutCount + positive/neutral/negativeReplyCount — reply
*sentiment* is a first-class rollup dimension [S-API-002].

## 7. Webhooks [S-API-007]

- Resource×action matrix: `*`; account, call, emailAddress, opportunity,
  opportunityProspectRole, prospect, sequence (created/updated/destroyed); import
  (created/finished); kaiaRecording (created); mailing (created/updated/destroyed/
  **bounced/delivered/opened/replied**); sequenceState (created/updated/destroyed/
  **advanced/finished**); task (…/**completed**); user (created/updated).
- Payload: JSON:API body with only created/changed attributes (deletes carry the
  last-known full set); `meta.eventName` (`task.completed`) + `deliveredAt`;
  `payloadVersion: 2` adds a `beforeUpdate` snapshot. Optional `secret` →
  `Outreach-Webhook-Signature` HMAC-SHA256 of body; no stable source IPs published.
- Delivery: 5 s timeout; redirects not followed; **no retry on any HTTP status**
  (429/5xx treated as acks); 4 attempts 1 s apart only for network-level failures.
  DNS-unresolvable/private-IP targets temp-disabled (1 min/1 h); permanent disable
  after ~a week of failure.
- Hygiene: `cleanupToken` issued at create, echoed in an
  `outreach-webhook-cleanup-token` header on every delivery; single-purpose `POST
  /webhooks/cleanup` removes the hook even after OAuth revocation.

## 8. Bulk API & imports [S-API-009]

- `POST /batches/actions/<verb>` with `actionParams[filter]…` (newFilterSyntax);
  **no filter targets ALL rows**; body = plain attributes map for modify verbs.
- Returns a `batch` (`state`: pending|confirming→finished|failed|canceled;
  `confirmCount`, `failures`, `summary`); confirm via `/batches/{id}/actions/confirm`
  (+`confirmedCount` when demanded) or pre-skip via
  `actionParams[skipConfirmation]=true`; cancel anytime; per-item outcomes on
  `batchItems` (filter `state=error`).
- CSV import: generateUploadLink → presigned-S3 PUT (`storageKey`) → validateUpload
  → prospectsImport/accountsImport (dupe keys: prospect `externalId`, account
  `customId`) or generic bulkUpsert/customObjectBulkUpsert with `dupeMethod`.

## 9. Custom fields & custom objects [S-API-002][S-API-010]

- Numbered slots: prospect/account/opportunity/product/purchase `custom1..custom150`;
  user `custom1..custom5`. Admin-defined types/labels/options exposed at
  `/api/v2/types` (auth); the base schema types them as strings.
- Admin-created **custom objects** mount CRUD at `/api/v2/customObjects/<name>`;
  relationships type-reference the internal name; per-org reference docs regenerate
  daily; unauthenticated `/api/v2/schema` shows standard resources only.

## 10. Build-relevant observations (analysis, our words)

- The public API is a faithful window onto the sequence engine (states, throttles,
  pause semantics, counters) but **meetings/calendar objects are absent** from v2
  paths — calendar data surfaces only via event names and the separate Data-Sharing
  warehouse tables (calendars, meetings, meeting_attendees…) [S-API-002][S-API-013].
- Read-only-ness encodes ownership of truth: enrollment `state`, counters, and
  mailing lifecycle timestamps are server-owned; clients steer via actions, not
  field writes. Webhooks are fire-and-forget (no status-code retry), so consumers
  must pair them with reconciliation sweeps.

## Unknowns

- `sequenceState.pauseReason` vocabulary (free string ≤255; no public enumeration).
- `mailing.state` "placeholder" semantics; scheduling internals behind `scheduledAt`
  (jitter, business-hours resolution) are not public.
- `call.state` values (enum undocumented); outcome casing conflict ("Answered"/"Not
  Answered" in schema vs "completed"/"no_answer" in the guide example).
- `sequence.salesMotion`, `emailAddress.status`, `phoneNumber.status` vocabularies;
  `sequenceStep.interval` unit (spec "seconds" vs guide "minutes"/2880≈2d — minutes
  fits the worked example) [S-API-002][S-API-008].
- Per-endpoint rate-limit specials beyond Kaia/bulk (explicitly left open by the
  vendor [S-API-003]); webhook ordering/throughput guarantees; `import.finished`
  payload shape.
- No sequenceStep DELETE in the spec — unclear whether step removal is UI-only.
- The authenticated per-org custom-object reference (out of scope under the
  clean-room protocol — no authenticated surface is fetched).

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
