# 02 — Feature Inventory: CRM Sync

**Tier:** P (+F only for import/export surfaces the founder's tier exposes — none used in
this draft; F-verification pass may add F-IDs later). **Workstream:** H (module owned
here; workstream D cross-checks). **Sources:** `sources/crmsync.md` (S-CRM).

## Purpose

Outreach treats the customer's CRM as the system of record and positions itself as the
engagement layer that stays consistent with it. Its sync is a first-class, admin-configured
product surface: bidirectional replication of people/company/deal objects between
Outreach and Salesforce or Microsoft Dynamics 365 Sales (the two first-class
connections), with activity written outbound so selling work done in Outreach shows up
on CRM timelines. HubSpot is served differently — through a HubSpot-built data-sync app
rather than an Outreach-built plugin [S-CRM-001][S-CRM-006]. The design center is: pull
CRM changes on a short poll, push Outreach changes in coalesced batches, resolve
double-edits field-by-field instead of declaring one platform the winner [S-CRM-001][S-CRM-003].

## Feature table

| Feature | Description (our words) | Who uses it (roles) | Workflow steps | Source refs |
|---|---|---|---|---|
| First-class CRM connections | Native plugins for Salesforce (Lightning, Classic, Console, SKUID) and Dynamics 365 Sales; OAuth + REST against a dedicated CRM system user; not installed as an Apex app | Admin | Authorize system user → configure plugin in Outreach | S-CRM-001 |
| Object sync | Lead, Contact, Account, Opportunity, Task (+ activity data). Lead/Contact/Account fully bidirectional; Opportunities inbound-only (edits in Outreach don't push up); CRM-created Tasks don't sync down | Admin (setup); reps consume | Per-object enable → map fields → set direction | S-CRM-001 |
| Inbound polling | New records/updates pulled every 10 min by default; interval configurable shorter | System; admin tunes | Plugin polls CRM → applies creates/updates | S-CRM-001 |
| Outbound batching | Outbound writes held ~60 s so multiple field changes collapse into one CRM API call — deliberate API-quota conservation | System | Change in Outreach → 60 s coalesce window → single update push | S-CRM-001 |
| Per-object configuration tabs | Each synced object has its own config surface: polling on/off, inbound/outbound toggles, field mappings, prerequisite object mappings (e.g. Opportunity needs Opportunity, Contact Roles, and Stages mapped first) | Admin | Open plugin → object tab → toggles + mappings | S-CRM-001, S-CRM-004 |
| Field mapping UX | Admin maps CRM fields to Outreach fields per object; some mappings required before an object syncs (product example: name, owner, classification — with a default value and remap option), others optional | Admin | Pick CRM field ↔ Outreach field → save; required set enforced | S-CRM-002 |
| Conflict-resolution layer | On sync, compares the two records; if both sides changed since last sync it applies both sides' changes (field-level merge) rather than a platform-wins hierarchy; writes only changed fields; direction and overwrite-blank-fields behavior configurable | System; admin configures | Detect double-edit → per-field compare → merge → write deltas both ways | S-CRM-003 |
| Sequence/engagement status to CRM | Engagement state from sequences can be pushed into CRM fields | Admin (setup); managers consume in CRM | Map status fields → sync | S-CRM-011 |
| Sync-error surfaces | Errors surfaced for admin audit; duplicate-key failures defined (existing prospect email, user email, account name, role name) | Admin | Review errors → fix data or mapping → re-sync | S-CRM-007, S-CRM-009 |
| User sync (Dynamics) | Optional auto-creation of CRM users as Outreach users; CRM users must exist in Outreach for records/activities to attribute correctly | Admin | Enable user sync → users created inbound | S-CRM-005 |
| Support-gated enablement (Dynamics) | Dynamics plugin ships disabled; Outreach Support must switch it on before configuration | Admin + vendor support | Ticket → enable → configure | S-CRM-005 |
| HubSpot path | No Outreach-built plugin: HubSpot's own "data sync" app provides one-way or two-way *contact* sync; third-party descriptions add Account↔Company and activity-to-timeline logging, with activities not synced as objects | Admin (in HubSpot) | Install app in HubSpot marketplace → configure sync there | S-CRM-006, S-CRM-010 |

## Key workflows

1. **Initial Salesforce connection (admin).** Decide Lead/Contact status mappings and
   import strategy up front → authorize a Salesforce system user with API + admin +
   object permissions → configure the plugin entirely inside Outreach → enable objects
   one at a time with field mappings → polling begins (10-min default) [S-CRM-001].
2. **Steady-state field change, both directions.** Rep edits a prospect in Outreach →
   change waits ≤60 s to coalesce with other edits → single outbound API write. Marketing
   updates the same Contact in CRM → next poll pulls it → conflict layer compares
   records; if both sides changed, each changed field is applied to the other side;
   unchanged fields never rewritten [S-CRM-001][S-CRM-003].
3. **Opportunity visibility (one-way).** Admin maps Opportunity + Contact Roles + Stages
   in the Salesforce plugin → enables Polling + Inbound on the Opportunity config tab →
   reps see CRM opportunities in Outreach, but edits there do not push back [S-CRM-004][S-CRM-001].
4. **Duplicate-error triage (admin).** Sync write fails because a prospect with that
   email (or user/account/role key) already exists → error queued on the admin audit
   surface → admin merges/fixes and re-syncs. Reviewers name this the top recurring
   pain: duplicated contacts, broken mappings, "lead already exists" hunts [S-CRM-007][S-CRM-009][S-CRM-008].

## Sync pain reported by users (voice of customer, for doc 08 cross-check)

G2 reviewers recur on: Salesforce sync errors and duplicate contacts; mapping breakage
(activity types not updating lead status); manual cleanup interrupting rep flow; wanting
duplicate detection built in [S-CRM-008]. Product implication for us: duplicate
*prevention* (match/merge on external ID + email at import and sync time) and a
first-class sync-health dashboard are table stakes, not polish.

## Data touched (cross-ref doc 04)

Prospect↔Lead/Contact, Account↔Account/Company, Opportunity (inbound mirror incl.
contact roles, stages), Task, activity events (emails/calls/meetings outbound), User
identity mapping, per-object field-mapping config, sync-error queue. Doc 04 should model:
external-ID keys per CRM object, per-field dirty tracking implied by the
changed-fields-only write behavior [S-CRM-003], and an error/dead-letter store implied by the
audit surface [S-CRM-009].

## Unknowns

1. Exact conflict semantics when the *same field* changed on both sides between syncs
   (docs describe field-level merge of changed fields; same-field tiebreak undocumented)
   [S-CRM-003].
2. Minimum polling interval actually grantable (docs say shorter intervals are
   configurable but state no floor) [S-CRM-001].
3. Whether HubSpot data sync covers Deals/Tasks for Outreach or contacts+companies only
   (Outreach's own page confirms contacts; the rest is third-party description)
   [S-CRM-006][S-CRM-010].
4. Whether sequence-state/engagement fields push to custom CRM fields only or to managed
   package fields (article not fetched in full) [S-CRM-011].
5. Admin UX for bulk re-sync / backfill after an outage — not found on public pages.

## Completeness checklist

- [x] Every claim sourced to an S-CRM row (F-verification pass may add F-IDs later)
- [x] Unknowns filled (5)
- [x] Function described, not visual design (protocol §6)
- [x] ≤4 pages / ≤200 lines
- [x] Family template followed (Purpose → table → workflows → data → unknowns → checklist)

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
