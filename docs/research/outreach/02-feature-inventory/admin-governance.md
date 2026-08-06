# Feature Inventory — Admin, Governance & Compliance

**Tier:** per README this doc may draw on P+F; this pass is Tier-P only (public sources
exclusively, logged in `../sources/admin.md`; founder-corpus verification deferred to
the synthesis pass).

## Purpose

Outreach's governance is a dual-layer access-control system plus a compliance toolkit.
Layer one, User Roles, is a hierarchy of nodes (explicitly not the HR org chart) that
scopes *which records* a user can reach through ownership and manager relationships.
Layer two, Governance Profiles, bundles grant/deny permissions for *what actions* a user
may perform per resource. A third, orthogonal model — Teams tied to content Collections
— fences *which content* (sequences, templates, snippets) each group can see and use.
Around these sit the enterprise controls: field-level record governance synced from the
CRM, data residency, self-service retention, recording-consent machinery, and a newer
set of AI-autonomy limits governing what agents may do unattended.

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| User Roles (hierarchy) | Roles are nodes in a multi-level parent/child tree defining record-ownership scope; a parent role reaches records of child roles; documented as a governance construct, deliberately not the corporate reporting chart | Admins design; all users affected | Model tree → assign users → visibility follows | S-ADM-002 |
| Hierarchy access models | Two manager patterns: access to direct reports' records, or to peers' + all reports' records; profile settings pick among visibility scopes — all / owned + reports / owned / owned + peers | Admins | Choose scope per profile → enforced on queries | S-ADM-002, S-ADM-003 |
| Governance Profiles | Permission bundles (grant/deny action × resource) applied per user; two defaults — Admin (non-editable) and Default — plus custom profiles; 20+ categories incl. Administration, Prospects, Accounts, Opportunities, Sequences, Tasks, Templates, Snippets, Meetings, Calls, Mail, Reports, Kaia | Admins | Create profile → set permissions → assign users | S-ADM-002, S-ADM-003 |
| Notable profile switches | User/profile management, plugins, triggers, teams, rulesets, phone numbers, branded URLs, data export, HTML insertion; CSV / Salesforce-report imports; email deletion; opt-out reversal; bulk actions; mailbox access scopes; per-user or per-profile daily/weekly send limits | Admins | Toggle per profile | S-ADM-003 |
| Record-level + field-level control | Field-level view/edit on records with optional inheritance of CRM rules; Nov 2025 added per-field Opportunity view/edit/hide and automatic Salesforce field-level-security sync; multiple assignees supported on Prospect/Account/Opportunity for team selling | Admins, RevOps | Configure fields → UI + API obey | S-ADM-001, S-ADM-010 |
| Teams | Group construct, syncable from the CRM or managed natively; carries permissions and joins the content-governance model; team hierarchies scope reporting visibility (Nov 2025) | Admins | Sync/create teams → attach users | S-ADM-001, S-ADM-010 |
| Content governance (Collections) | Collections are containers for sequences/templates/snippets, associated many-to-many with Teams, forming access islands layered on top of RBAC; enabled per profile per content type; once on, users see owned content plus their teams' collection content | Admins, content managers | Create collection → attach teams → place content | S-ADM-004 |
| Ownership/share tiers | Per-item sharing intent: private to owner / others can view only / others can view and use — enforced even inside collections; the modify dimension is governed by profile edit permissions | Content owners | Set intent at save → platform enforces | S-ADM-004 |
| Reserved Public collection | A system-owned collection literally named Public (single word) for org-wide content; cannot be renamed or deleted | All users | Place content in Public → org-wide reach | S-ADM-004 |
| Data residency | EU customer instances store customer-owned data — prospects, accounts, organizations, workflow data (sequences, meetings) — in EU infrastructure; positioned for GDPR-plus residency requirements | Admins, security teams | Choose EU datacenter at purchase | S-ADM-001, S-ADM-008 |
| Data retention | Self-service policies for emails (+metrics), Voice call recordings, Kaia meeting recordings; preset or custom durations; deletion within 24h of expiry; first activation purges backlog over ≤30 days; deletions permanent; nothing auto-deletes until configured; settings under Administration > Data and privacy > Data retention | Admins, privacy officers | Set duration per data type → automatic deletion | S-ADM-005, S-ADM-008 |
| Recording consent | Per-provider consent page (Administration > Tools > Kaia > Compliance): join links wrapped in an Outreach-hosted consent page with custom text/logo/privacy link; enabling disables bot auto-join; Voice consent mechanisms configurable per local regulation; Kaia for Teams supports explicit GDPR-style consent; one-sided recording available | Admins (compliance) | Enable per provider → attendees consent → record | S-ADM-001, S-ADM-006, S-ADM-007 |
| Kaia access permissions | Per-profile recording visibility (owned / +reports / +peers+reports / anyone-minus-private), delete + playlist rights, 4+ digit redaction, org-wide download and public-link toggles, card-edit levels | Admins | Configure per profile | S-ADM-007 |
| Email compliance controls | Bulk-sender unsubscribe settings; header-based email sync option; Microsoft Graph OAuth scoped mailbox connection (vs broad legacy access) | Admins | Enable → applies to sends/sync | S-ADM-001, S-ADM-008 |
| AI autonomy limits | Agent independence configured by segment; agents individually admin-controlled (on/off, e.g., Call Agent, Research Agent); Deal Agent per-field criteria (auto / auto-if-vacant / confirm); admin-editable AI prompts (deal summaries, Meeting Prep briefs); AI Credit Metering Dashboard gated by profile; brand-voice safeguards via centralized content controls + Knowledge grounding; ISO 42001 certification claimed | Admins, RevOps | Set autonomy/prompts → meter usage → adjust | S-ADM-009, S-ADM-010, S-ADM-011, S-ADM-012 |
| Admin experience management | Standardized homepage layouts deployable per profile group; Zoom user-level auth + recording-ingestion policies by user group; legacy 360 homepage deprecated 2026-06-15 → 2026-09-30 | Admins | Configure layouts/policies per group | S-ADM-012 |

## Key workflows

1. **New-org access design (admin):** model the role tree for record scope (sales org,
   not HR chart) → create profiles per persona (SDR, AE, manager, ops) choosing record
   visibility (owned / +reports / +peers) and action permissions (imports, exports,
   deletes, send limits) → sync Teams from the CRM → enable content governance for the
   content types that need fencing → build Collections per business unit, attach Teams,
   seed the Public collection with company-wide assets. [S-ADM-002/003/004]
2. **Compliance hardening (privacy officer + admin):** select EU datacenter where
   required → set retention: e.g., call recordings and meeting recordings to a fixed
   window, emails per policy (noting deletion permanence and metric loss) → enable the
   consent page for each conferencing provider (accepting auto-join loss) or one-sided
   recording → restrict recording visibility, downloads, and public links per profile →
   turn on digit-sequence redaction. [S-ADM-001/005/006/007]
3. **Agent governance rollout (RevOps + admin):** enable individual agents → set
   autonomy per segment (review-first vs autopilot) → constrain Deal Agent per-field
   update criteria → edit brief/summary prompts to house style and upload approved
   Knowledge content → gate the credit dashboard to ops profiles and review consumption
   before widening autonomy. [S-ADM-009/010/011/012]

## Data touched (cross-ref doc 04 — pending)

Role (tree node, parent/child), Profile (permission matrix, send limits, feature
toggles incl. content-governance + Kaia settings), User↔Role/Profile/Team assignments,
Team (CRM-synced or native; hierarchy for reporting scope), Collection (+ Team
associations; reserved Public), content items (sequence/template/snippet with owner +
sharing intent), field-level permission sets (incl. CRM security import), retention
policy (data type, duration, deletion jobs), consent configuration (per provider, page
content), agent config (autonomy, prompts, per-field criteria), AI credit ledger,
audit surfaces (submission/update timestamps).

## Unknowns

- Whether an audit log of admin/permission changes is exposed to customers (not found
  in fetched public docs; expected for enterprise — unverified).
- SSO/SAML/SCIM specifics (protocols, IdPs, provisioning) — not covered by fetched
  pages; needs a dedicated pass on the security/trust portal.
- Full default-permission matrix of the built-in Admin and Default profiles.
- Maximum role-tree depth and any limits on profiles/teams/collections per org.
- Data-residency scope details: which subsystems (recordings, analytics, AI
  processing) are EU-contained vs global; the 2022 blog predates the agent layer.
- How AI autonomy limits interact with content governance (can an agent use content
  outside its operator's collections?).
- Which governance features gate on which plan tiers (doc 07 scope).

## Completeness checklist

- [x] Every claim carries an S-ADM source ref.
- [x] Unknowns recorded above.
- [x] Function described, not visual design (protocol §6).
- [x] ≤4 pages / ≤200 lines; family template followed.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
