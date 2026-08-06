> **Provenance:** commissioned secondary research ("Building an Outreach Competitor —
> Research & Build Scope", prepared 2026-08-05 via Claude research from public web
> sources), committed 2026-08-06 after the repo went private. It **predates the
> clean-room protocol**: treat it as an input brief, not as teardown evidence. Any claim
> from this document that enters a teardown doc must be re-verified against primary
> public sources and logged with its own S-ID. Its §9 (architecture) and §12 (phasing)
> are the sections the program plan draws on most.

# Building an Outreach Competitor — Research & Build Scope

**Working project name:** Vantrow
**Prepared:** August 5, 2026
**Purpose:** Understand what Outreach actually is, everything it does, and what it would take to replicate it — as a foundation for building with Claude Code.

---

## How to read this document

This is both a **research brief** (what Outreach is, how it works, what it costs, who competes) and a **build spec** (data model, architecture, tech stack, phased scope, effort). Sections 1–8 are the "understand it" half. Sections 9–14 are the "build it" half. If you only read three things, read the **TL;DR** below, the **Scope & Phasing** (§12), and the **Honest Assessment** (§14).

A note on sourcing: everything here is triangulated from Outreach's own product/support/developer docs, press releases, analyst write-ups, and third-party reviews. Two caveats carried throughout: **(1) Outreach publishes no list pricing**, so all prices are third-party estimates with confidence flags; **(2) several 2025–2026 developments** (new CEO, the "agentic AI" pivot, the Clari–Salesloft merger) postdate mid-2025 and are reported from primary press releases rather than firsthand — treated as current but flagged. Full source list at the end.

---

## 1. TL;DR — the honest scope

**What Outreach is.** Outreach is the company that *created the "sales engagement" category* in ~2014. At its core it is a **multi-channel, multi-step outreach automation engine** ("sequences" / "cadences") that tells salespeople exactly who to email, call, and message each day, automates the parts that can be automated, captures every interaction, and syncs it all bidirectionally with the CRM (Salesforce/HubSpot/Dynamics). Over a decade it expanded "up the funnel" into meeting scheduling, conversation intelligence (call recording + AI analysis, branded **Kaia**), deal/pipeline management, and forecasting (**Commit**). Since a 2024 CEO change it has repositioned hard as an **"agentic AI platform for revenue teams"** — AI agents that research accounts, draft outreach, update the CRM, and increasingly act autonomously.

**What it would take to replicate.** This is **not** a weekend clone or a CRM-with-a-send-button. The genuinely hard engineering concentrates in four places, and none of them is the UI:

1. **The sequence execution engine** — reliably firing millions of scheduled, stateful, multi-channel "touches" with exactly-once delivery, instant cancellation when a prospect replies, time-zone and business-hours correctness, and per-mailbox throttling.
2. **Email deliverability at scale** — OAuth mailbox sync with Gmail/Microsoft 365, SPF/DKIM/DMARC, domain warmup, reputation management. If your mail lands in spam, the product is worthless.
3. **CRM bidirectional sync** — mirroring and writing back to Salesforce/HubSpot without ever corrupting the customer's system of record. This is the single highest-risk part; a sync bug is account-ending.
4. **Multi-tenant reliability** — isolating tenants, per-tenant fairness/quotas, and an observable async pipeline.

**Scope verdict.** A credible **MVP** (one email provider, basic sequences, a simple dialer, one-way CRM import) is roughly **6–12 months for a small focused team**. **True parity** with today's Outreach (two mail providers done well, deep two-way Salesforce *and* HubSpot sync, compliant telephony, conversation intelligence, forecasting, enterprise SSO/RBAC/SOC 2, and the AI agent layer) is a **multi-year effort for tens of engineers**. The moat isn't any single feature — it's *accumulated correctness* in execution, deliverability, and sync. An AI coding agent like Claude Code compresses the **breadth** (the enormous surface of integration glue, CRUD, and UI) dramatically, but not the **depth** (distributed-systems correctness, deliverability reputation earned over time, CRM conflict resolution). Plan accordingly: let the agent sprint the breadth, and reserve your hardest thinking for the four problems above.

**The opportunity.** The category is mid-disruption. The seat-based pricing model ($100–$200/seat/mo) is under pressure from **outcome/consumption-priced AI SDR agents**, incumbents are consolidating (Clari + Salesloft merged in 2025), and Outreach's pricing is opaque and its UI widely called dense and dated. A new entrant that is **AI-native, transparently priced, and genuinely easy to use** has a real wedge — provided it clears the deliverability + sync correctness bar that makes the product trustworthy at all.

---

## 2. What Outreach is — category, evolution, scale

### 2.1 The category
"**Sales engagement**" (a.k.a. sales execution) software systematizes outbound selling. Before it, SDRs and AEs worked prospects out of spreadsheets, their inbox, and memory. Outreach's insight: turn the outreach process into a **programmable, measurable pipeline** — define a multi-step "sequence," enroll prospects, and let the system schedule and track every touch while syncing to the CRM. It sits *between* the rep's tools (email, phone, calendar, LinkedIn) and the system of record (CRM), orchestrating activity and capturing data.

The vocabulary you'll see:
- **Sales engagement** = automating/tracking the outbound touches that create pipeline.
- **Sales execution** = the superset covering the full seller workflow from first touch → closed-won → forecast.
- **Revenue intelligence** = AI analysis of all that captured activity/conversation/CRM data to score deals, predict outcomes, and coach reps.
- **Agentic AI** = "agents" that don't just surface insight but *take action* (research, draft, enroll, update CRM) on the rep's behalf — Outreach's current banner.

### 2.2 How Outreach's positioning evolved
- **2014–2020 — Sales engagement.** Sequences + activity capture for pipeline *generation*. This is the product's DNA.
- **2020–2024 — Sales execution platform.** Expanded across the cycle: added conversation intelligence (Kaia, 2020), deal management, and forecasting (Commit). Positioned as one platform for the whole seller workflow.
- **2024–2026 — Agentic AI platform for revenue teams.** After co-founder **Manny Medina stepped down as CEO (Sept 2024)** and **Abhijit Mitra** (ex-ServiceNow/Salesforce/Oracle) took over, Outreach rebranded (now leads with the domain **outreach.ai**) around AI agents. The homepage tagline became provocative: *"You didn't hire enough sellers. Now you don't have to."* AI is now positioned as foundational, not an add-on.

### 2.3 Company scale (context for "what am I up against")
- Founded **2014**, Seattle. Co-founders Manny Medina, Gordon Hempton, Andrew Kinzer, Wes Hather (pivoted from a recruiting startup).
- **~6,000 customers**; **~$300M revenue (2024)**, up from ~$207M (2023).
- **$4.4B valuation** (Series G, 2021); **~$476M raised**; ~1,400 employees; net revenue retention ~140%; average contract value ~$50K.
- Still **private and independent** (unlike Salesloft, now merged into Clari). Went through 2022–2023 layoffs pushing toward profitability.

The takeaway: Outreach is a deeply entrenched, enterprise-grade incumbent with a decade of accumulated correctness. You don't beat it head-on on breadth; you beat it on a wedge (see §8, §14).

---

## 3. The complete product suite

Outreach is a single platform built on a **data foundation** (it captures every email, call, and meeting, and bidirectionally syncs with the CRM). On top of that foundation sit the **feature modules** (the classic workspace) and, since 2025, an **agentic AI layer**. Modules are frequently sold as paid add-ons on top of a core engagement seat (see §6). Below is every module and what it actually does.

### 3.1 Sales Engagement — the core (sequences, email, dialer, tasks)
The founding product and still the rep's daily workspace.

**Sequences / cadences** — the heart of the product. A sequence is an ordered series of **steps** (auto email, manual email, phone call, LinkedIn task, SMS, generic task) separated by wait intervals. Key capabilities:
- Multi-stakeholder outreach inside one sequence (work a whole buying committee).
- Consolidate replies across multiple emails into a single thread.
- A library of proven sequence templates.
- **Smart email assist** auto-pauses a sequence on an out-of-office reply and re-engages when the prospect returns.
- **Buyer sentiment analysis** classifies reply sentiment.
- Two timing modes: **relative intervals** (Day 1, Day 3, Day 7…) or **exact date/time** (for events like a webinar).

**Email** — templates, reusable **snippets**, variable/merge-field personalization, and built-in **A/B testing** with statistical-significance analysis. Sends through the rep's connected mailbox (Gmail/Outlook). AI can draft/tailor messages and replies.

**Dialer / Voice (Outreach Voice)** — a browser-based softphone (a free-floating, draggable window). Click-to-call from any record; **Local Presence** (caller ID matches the prospect's area code and rotates); call recording; call logging/dispositions auto-surfaced after the call; **voicemail drop** (beta); **sequential dialing** through a task list; inbound handling (answer/decline, call waiting, hold, warm transfer, mute).

**Task / workflow engine + the rep "to-do" experience** — sequences and automation rules generate a **prioritized task list** ("today's work") for each rep. Tasks carry the prospect, due time, priority, account, and originating sequence. Reps get task prioritization, playbooks that guide the right action, and an integrated scheduler. **Triggers** are admin-built automation rules that fire actions on events/conditions (auto-enroll, field updates, notifications) — Outreach's rules engine for hands-off workflow.

**Content management** — templates, snippets, and sales playbooks live centrally, governed by who can view/edit/share. A newer **Seller Content Hub / Outreach Knowledge** (2025–26) lets ops index value props, case studies, and positioning so AI agents draw from approved, on-brand content.

### 3.2 Prospecting / lead gen / enrichment — the "Revenue Agent"
Launched Dec 2024 as the **AI Prospecting Agent**, now the **Revenue Agent**. Automates the top of funnel: synthesizes first-, second-, and third-party signals (your engagement history; hiring/intent signals; funding rounds, job changes, news, filings) into account summaries; targets by ICP/persona and sales motion (inbound / outbound / new logo / expansion); sources both existing and **net-new contacts** not yet in the CRM (data partnership with Explorium and others); drafts personalized email/LinkedIn/call scripts; and runs at configurable **autonomy levels** (human-in-the-loop "review and send," or fully autonomous 24/7 plays that research → enroll → engage, then hand off to a human).

### 3.3 Meetings & scheduling
Native scheduling so buyers self-book without leaving the flow. **Meeting types** grouped by geo/time zone/segment; **public booking links** (Calendly-style); **round-robin** distribution for teams (strict = even; flexible = maximize availability); one-click follow-up booking; automated **handoffs** (SDR → AE → CS). Calendar-integrated; meeting links insertable into sequence emails.

### 3.4 Conversation Intelligence — Kaia
Outreach's meeting recorder + real-time assistant + analytics engine (built in-house, GA late 2020; "Kaia" = Knowledge AI Assistant). Records and transcribes live calls/meetings (Zoom, Google Meet, Teams) with multi-language support; **live "assist"** surfaces battle cards / content cards mid-call (competitor, product, pricing, integration) so reps answer without a manager; auto meeting summaries, action-item capture, bookmarks, and **Topics** tracking; **playlists** of top-performer calls for coaching; syncs recordings/summaries to CRM.

### 3.5 Deal Management & Deal Health
Insight-driven deal inspection. **Editable Deal Grid** (edit all pipeline deals in one spreadsheet-like grid; changes sync to CRM and respect CRM validation rules); **Deal Health Score** with 7-day trend and recommended next actions; **Deal Overview / activity timeline** (visual chronology of every buyer/seller touch); **Topics** across a deal's emails/meetings; and a **Deal Agent** (AI) that auto-updates opportunity fields from call/meeting signals.

### 3.6 Mutual Action Plans (Success Plans)
Shared buyer–seller project plans that align both sides on evaluation criteria and next steps. Milestones that survive personnel changes; **methodology templates** (MEDDPICC / MEDDIC / SPIN) mapped to CRM fields; **engagement tracking** (which buying-committee members open the plan and view shared resources).

### 3.7 Account Management
Account-based execution: uses interaction + CRM data to prescribe team actions, run engagement workflows, and enforce timely follow-ups across an account. Ties to the **Expansion Agent** (finds new personas in existing accounts for upsell using purchase/usage history).

### 3.8 Pipeline Management
For leaders to judge pipeline quantity, quality, and maturity. Pipeline dashboard + **pipeline movement** analytics; **coverage modeling** (required coverage vs historical win rates); weighted pipeline + win/loss modeling; team & rep **performance scorecards**.

### 3.9 Forecasting (Outreach Commit)
AI-assisted revenue forecasting. ML projection of period finish (a data-driven "second opinion" on the rep's call); **Scenario Planner** (bull/bear/most-likely); automated roll-ups across the hierarchy; forecast history/snapshots; multi-currency; line-item (product/SKU) forecasting; and **Smart Forecast Assist** (AI flags forecast risk and builds scenarios).

### 3.10 Rep Coaching
Scales top-performer behavior. **Smart Kaia Coach** auto-scores calls against MEDDPICC/Sandler/SPIN with AI-suggested citations linked to transcript timestamps; topics & sentiment tracking on objection handling; coach cards and topic reports so managers coach without listening to full calls; best-practice playlists.

### 3.11 Reporting & Analytics
Prebuilt + customizable, exportable reports; ~16 months of history, refreshed daily. **Sales Execution Report** (funnel/stage metrics); **Team reports** (activity, calls with heatmaps, emails, tasks); **Sequence Performance** (open/click/reply, meetings booked, opps created, revenue attribution, drill-down to step level); **Outcomes / Win-Loss Insights** correlating behaviors and buyer engagement with win rates. Idiom is **table-first with drill-down**, not a heavy visual BI canvas.

### 3.12 AI Agents & Agent Studio (the 2025–2026 centerpiece)
A library of named agents that run as copilots or autonomously, governed by admin autonomy controls and brand-voice guardrails:

| Agent | What it does |
|---|---|
| **Revenue Agent** (AI Prospecting) | Finds high-intent accounts, sources contacts, drafts outreach, runs autonomous prospecting plays |
| **Research Agent** | Gathers signals from conversations/meetings/1st+3rd-party data to enrich records and surface buying signals |
| **Meeting Prep / Conversation Agent** | Pre-call briefs and talking points from prior meetings + emails, segmented by attendee |
| **Deal Agent** | Recommends opportunity-field updates from call/meeting signals; accept/reject/edit in Slack |
| **Personalization Agent** | Turns research + buyer context into channel-specific messaging |
| **Expansion Agent** | Finds new personas in existing accounts for upsell |
| **Smart Forecast / Analytics Assist** | Forecast-risk detection, scenario modeling, coaching-focus guidance |

**Agent Studio** is a **no-code, drag-and-drop builder** for RevOps to compose autonomous workflows from four block types: **Source & Event** (trigger), **Target & Frequency** (schedule), **Conditions** (qualification filters), **Actions** (AI behaviors). Ships with templates (inbound-lead engagement, lost-opp re-engagement, deal alerts).

### 3.13 Omni — the universal conversational agent
A natural-language "ask and act" front door across web, mobile, and Slack: conversational deal/account search, pipeline & deal-health Q&A, meeting summaries, and instant actions (e.g., draft/send an objection-handling email) in one thread — no dashboard-hopping. Consolidates the other agents under one conversational surface.

### 3.14 Admin, Governance, Security & Permissions
A distinct enterprise pillar. **User Roles + Governance Profiles** (dual-layer access control over create/edit/share/delete and record visibility); **role hierarchy** so managers act on reports' records; **content governance** (who can view/use/modify each template/sequence via "Collections" tied to teams, with a reserved company-wide "Public" collection); **compliance/data controls** (EU data residency, configurable retention for recordings/emails, recording-consent settings by jurisdiction); and, newly, **AI-agent autonomy limits** and brand-voice guardrails.

### 3.15 Mobile app (iOS & Android)
A phone-optimized companion: tasks (filter by call/email), Outreach Voice calling, email replies with templates/variables, meetings agenda + Kaia recording/playback, record search with Smart Views, and Omni. Deliberately excludes admin-heavy functions (trigger/sequence creation).

### 3.16 Developer platform, API & Marketplace
- **REST API (v2)** at api.outreach.io with OAuth; self-serve Developer Portal to register apps/integrations.
- **Outreach Marketplace** (2023) — 100+ partner integrations (Demandbase, ZoomInfo, Seismic…).
- Deep **CRM sync** (Salesforce first-class; also Dynamics, HubSpot).
- **MCP interoperability (2025–2026)** — an MCP Server exposes Outreach data into ChatGPT/Claude/Copilot/Codex; an MCP Client pulls external sources (Snowflake, ZoomInfo, Slack…) into Outreach agents. A native ChatGPT app shipped in 2026.

---

## 4. How the pieces fit together (end-to-end)

1. **Target & research** → Research/Revenue Agents monitor signals, build the account list against the ICP, and source contacts (including net-new).
2. **Engage** → Prospects enroll into **sequences**; the Personalization Agent drafts per-channel messaging; reps work a **prioritized task queue** across email, dialer, LinkedIn, SMS; every activity is captured.
3. **Meet** → Buyer self-books via Meetings/round-robin; **Kaia** records/transcribes and gives live battle cards; the Meeting Prep Agent briefs the rep beforehand.
4. **Advance the opportunity** → **Deal Management** grid + Deal Health track momentum; the **Deal Agent** keeps CRM fields current; **Mutual Action Plans** align the buying committee.
5. **Expand** → Account Management + Expansion Agent find upsell personas.
6. **Coach** → Rep Coaching / Smart Kaia Coach scores calls and scales best practices.
7. **Forecast** → Pipeline Management judges coverage/quality; **Commit** rolls up AI-assisted calls and scenarios; Win/Loss feeds learning back to targeting.
8. **Orchestrate over the top** → **Omni** is the natural-language layer to ask/act across all of it; **Agent Studio** wires agents into autonomous workflows.

The critical insight for a builder: **sequences + the task queue + activity capture + CRM sync is the irreducible core.** Everything else (CI, deals, forecasting, agents) is a layer on top of that data foundation. Build the foundation right and the rest is additive; get the foundation wrong and nothing above it is trustworthy.

---

## 5. UI / UX

### 5.1 Information architecture & navigation
Outreach is a **left-nav, collapsible-rail application** (icons+text ↔ icons-only). The nav groups the product into a handful of expandable categories: **Forecasting, Activity** (Email Outbox, Calls, Meetings, Tasks, SMS, Sequence States), **Agents & AI, Content** (Sequences, Templates, Snippets, Meeting Types, Success Plans), **Reports, Apps,** and **Opportunities/Deals**. Two persistent surfaces sit on top of every page: a **Global Sidebar** (slide-in panel: tasks due, live activity feed, calendar) and the **floating Dialer**. Navigation is heavily **conditional** — sections only render if the feature is licensed and the user's profile grants access, so two users can see very different nav trees.

Mental model: **Content** (reusable assets) → **Activity/Tasks** (execution) → **Records** (Prospects, Accounts, Opportunities) → **Reports/Forecasting** (measurement).

### 5.2 The key screens (what to build)
- **Rep Home — the "360° Dashboard" + Task Flow.** The signature UX. Top: weekly performance + tasks-due charts. Right: a live engagement feed (opens/clicks/replies). Bottom: the due-tasks list, sortable by priority, engagement score, or sequence. A blue **"play" button** launches a focused, **one-task-at-a-time** flow: a two-panel layout (prospect info left, global sidebar right) with a dark header showing task count/type; the rep completes each task and advances. **This "play through your queue" experience is Outreach's single most distinctive and praised pattern — replicate it.**
- **Engagement scoring.** Opens = 1, clicks = 2, replies = 3; hottest prospects float to the top of the queue.
- **Sequence list + Sequence Builder.** List is a sortable table with per-sequence performance stats. The builder stacks **steps** vertically; "Add Step → pick type → configure → save." Each step has its own schedule/ruleset and A/B variant capability. Note the documented constraint: **editing a live sequence with active prospects is discouraged** — design for versioning/duplication instead of live edits.
- **Prospect & Account views.** A center workspace with tabs (Overview, Activity, Emails, Sequences, Opportunities, Calls, Meetings) plus a **fixed right-side profile panel** (contact info, sequence stats, quick actions: Add to Sequence, Book Meeting). List views are dense tables with **Manage Columns, filters, Saved Views, infinite scroll**, row-hover "…" quick actions, a **slide-out record panel** (act without leaving the list), and bulk selection → mass actions.
- **Email composer / template editor.** Name/Subject/Body, rich-text toolbar (attachments, links, images, raw HTML), **Variables** (`{{first_name}}`, `{{account.name}}`, custom fields), **Snippets** (reusable blocks), template nesting, conditional logic (`{{#if}}…{{else}}…{{/if}}`), and governance controls (private / others-can-view / others-can-modify) right in the editor. A clever mechanic: **comment variables `{{! … }}` highlight in blue and hard-block sending until a human fills them** — "personalization at scale, enforced."
- **Dialer.** A free-floating, draggable window: outbound number (for Local Presence), connected parties, call timer, call-waiting bar, answer/decline, add-participant/transfer, merge, mute, record, hold, keypad, and a mid-call log/disposition notepad.
- **Meetings.** Calendar view (day/week/month) of booked meetings; **Meeting Types** as reusable templates (favorites float up, auto-populate content + reporting category); booking panel; public booking pages.
- **Kaia (Conversation Intelligence).** Live meeting panel: real-time transcription, auto-captured action items, notes/bookmarks, and **content cards** (competitor/product/integration/pricing) surfaced at inflection points. Post-meeting: recording playback with transcript alongside, shareable links.
- **Opportunity / Deal views.** Table-centric. Opportunities list with columns (name, prospects, stage, a **rolling 3-week activity bubble timeline**, status, next steps, owner), inline editing with real-time validation, and field-change indicators. The **Commit "Deal Grid"** is the forecasting-grade view: uniform org-wide columns, On-Track/Off-Track classification, deal signals, CRM write-back, a deal flyout, and a **"View Forecast"** roll-up by category. **Note: Outreach's deal management is grid/table-based, not a Kanban card board** — no drag-across-columns pipeline. (An easy differentiation opportunity if you prefer Kanban.)
- **Reporting.** Table-first with drill-down (click a sequence → step-level metrics), sentiment + revenue-attribution tabs, CSV export, rich filters. Funnels/heatmaps exist but the default idiom is filterable grids.
- **Admin/Settings.** RBAC (Roles + Profiles + Permissions; ownership- and hierarchy-based record access) and **Content Governance** (Collections tied to Teams; Personal / Shared / Public tiers; view-vs-use-vs-modify).

### 5.3 Design language
Classic **dense enterprise B2B SaaS** — function and information density over minimalism. Collapsible left rail; multi-panel layouts everywhere (center + fixed right panel + slide-in sidebar; records open in flyouts, not full navigations); table/grid-centric with inline editing and saved views; a dark header bar frames the focused task-flow mode; muted/neutral palette with **blue as the primary accent** and meaning-carrying accents (blue "play," purple "View Forecast," blue-highlighted comment variables, On/Off-Track status bubbles, engagement dots, a 3-week activity timeline). Dark/light theme at least on mobile.

### 5.4 What users praise vs complain about (design *away* from these)
**Praised:** all-in-one workflow consolidation; strong task prioritization; the guided "play-through" queue; approachable basic sequence-building; powerful automation.
**Complained about:** **steep learning curve / overwhelming density** ("extremely dense," onboarding "takes weeks," new hires "get lost," feels like a "maze"); **cluttered/inconsistent visuals** ("visual fuzz," "clunky and outdated"); **performance/friction** (the Chrome extension is "slow and clunky," forces frequent re-login, needs constant Salesforce-tab refreshes); **admin burden** (needs a dedicated admin; 4–6 week onboarding); and the **"don't edit a live sequence"** footgun. Net: enterprises value the depth; smaller teams find it heavy. **A cleaner, faster, more modern UI is the most obvious surface-level wedge.**

### 5.5 Interaction patterns worth replicating
The play-through task queue; engagement-scored prioritization; fixed right-panel + slide-out record flyouts; dense list views with manage-columns/filters/saved-views/inline-edit/bulk actions; the variables + snippets + conditional-logic + send-blocking personalization system; the Collections-based content governance model; Meeting Types as templates; drill-down reporting; the deal grid with inline edit + health scores + CRM write-back; and the "embedded everywhere" surface (actions injected into Gmail/Outlook/Salesforce/LinkedIn) — replicate the *pattern*, avoid the *instability*.

---

## 6. Pricing & packaging (Outreach)

Outreach **publishes no list prices** — annual contracts, custom quotes, no free trial, no monthly option. All figures below are third-party triangulated (Vendr transaction data, ITQlick, docket.io, woodpecker, MarketBetter) with confidence flags.

**Structure:** per-user licenses with a core engagement seat plus paid add-on modules. Outreach's site describes ~five modules: **Engage** (core: sequences, account plan, CRM sync), **Call** (dialer, monitoring, AI call summary), **Meet** (conversation intelligence / ex-Kaia), **Deal** (pipeline mgmt, deal health), **Forecast** (rollups, AI projection).

**The per-seat ladder (Medium confidence on the ~numbers, Low on the tier *names*):** third parties increasingly describe three bundled **"Amplify" tiers — roughly Core ~$100 / Plus ~$130 / Pro ~$160 per user/mo** (some sources still use legacy Standard/Professional/Enterprise labels). Realistic **all-in with the modules most buyers want is ~$160–$200/seat/mo.** Add-on ballparks: Call ~$10–$20; Meet (CI) ~$30–$50; Deal ~$30–$50; Forecast ~$20–$40 (often managers only). A 2026 change: tiers now bundle **consumption-based AI credits** (Core ~25K / Plus ~50K / Pro ~100K per year) with overages.

**Fees, minimums, contracts:** Outreach claims no platform fee (some third parties allege $2–5K/yr — contested). No published seat minimum, but volume discounting effectively kicks in ~20–25 seats; not built for <10 seats. **Annual required, multi-year common** for larger deals. Implementation: ~$5K (Essentials) / ~$15K (Professional) / ~$25K (Pro Plus).

**Real-world benchmarks (Vendr, 910 purchases):** **median ACV ~$45,540**, range ~$8,500–$214,000; average discount ~12%. Guides claim **15–35% negotiable** (levers: multi-year, competitive quotes, volume tiers, quarter/year-end, prepay, bundling, waived implementation).

**Typical all-in annual cost (illustrative):**

| Team | Config | Year 1 (incl. impl.) | Year 2+ |
|---|---|---|---|
| 25 seats | Engage + Meet + Deal + dialer | ~$65K–$75K | ~$48K–$56K |
| 25 seats | Core/Engage only | ~$35K–$45K | ~$30K–$36K |
| 100 seats | Mixed stack + modules, volume-discounted | ~$180K–$300K | ~$160K–$275K |

**Packaging strategy:** land a core seat (~$100), expand via modules (dialer → CI → Deal → Forecast) and now AI credits, protecting the headline number while lifting realized ACV to $150–$200+/seat. Sells to **mid-market and enterprise (25–500+ seats)**; cedes SMB/PLG (no monthly, no free tier, implementation cost) to Apollo/Reply/lemlist/HubSpot.

---

## 7. Competitive landscape

| Competitor | Segment | Pricing (2025–26, approx.) | Position vs Outreach |
|---|---|---|---|
| **Salesloft** | Mid/Enterprise | Essentials ~$75–100, Advanced ~$125–150, Premier ~$165–200+/seat; median ACV ~$30,720 | Closest rival. Vista-owned; acquired Drift (2024); **merged with Clari (2025)**. Cheaper realized ACV. Distracted by merger + a 2025 Drift security breach — a timing opening. |
| **Apollo.io** | SMB→Mid, PLG | Free tier; ~$49–$149/seat | Disruptor from below. Bundles a 270M+ contact database + enrichment + sequencing/dialer in one self-serve product at ~⅓ Outreach's price. ~$150M ARR, ~$1.6B valuation. Weaker on enterprise governance/forecasting. |
| **HubSpot Sales Hub** | SMB→Mid | Free→Starter $15→**Pro $100**→Enterprise $150/seat | CRM-bundled; sequences unlock at Pro. Wins on single-vendor simplicity; loses on outbound/dialer/CI depth. |
| **Salesforce Sales Engagement** (ex-High Velocity Sales) | Enterprise | ~$50/seat add-on to Sales Cloud | Thin natively, but Salesforce pushes **Agentforce** on consumption pricing. Bundle-and-undercut from inside the CRM. |
| **Clari (+Groove, +Salesloft)** | Enterprise RevOps | Custom, $100K+ | The category moving *up* into "revenue orchestration"/forecasting; engagement is one workflow. |
| **Reply.io** | SMB | Free; ~$49–$99/seat | Cheap PLG multichannel + Jason AI. Not enterprise. |
| **lemlist** | SMB | ~$63–$109/seat | Cold-email-first, European PLG; strong deliverability/warmup. |
| **Amplemarket** | SMB→Mid, AI | ~$600/mo start; median ACV ~$16,608 | AI-native all-in-one (data + engagement + intent + copilot). Bundles what Outreach charges extra for. |
| **11x / Artisan / AiSDR / Regie** | AI SDR agents | $5–15K/mo · $9–57K/yr · $900–2,500/mo · ~$35K/yr | Autonomous "AI SDR" agents priced on outcomes/consumption, attacking the seat model. **Caution:** 11x faced a 2025 exposé alleging inflated ARR and high churn — outcome pricing only works if the agent actually performs. |
| **Clay** | GTM data orchestration | ~$3B valuation (2025) | Powers the "GTM engineer" role beneath engagement; enrichment/orchestration layer, adjacent rather than head-on. |

**Segmentation:** *Cheap/PLG* — Apollo, Reply, lemlist, HubSpot Starter, AiSDR. *Enterprise* — Outreach, Salesloft, Clari, Salesforce. *AI-agent* — 11x, Artisan, Regie, AiSDR, Agentforce.

---

## 8. Market context & the opportunity for a new entrant

**Category size (directional):** the legacy sales-engagement category is ~$2–3B (2024) growing ~20%; the fast-growing successor — **AI SDR / AI agents** — is estimated ~$4B (2025) → ~$15B (2030) at ~30% CAGR. Analysts are re-labeling "sales engagement" as **"revenue orchestration"** (Forrester) / **"revenue action orchestration"** (Gartner, 2025).

**Where it's heading:** the **seat-based model is under structural pressure** — AI SDR agents price on *outcomes/consumption* (per conversation, per meeting booked, per active agent), attacking "one license per rep." Incumbents are responding by **grafting AI credits onto seats** (Outreach "Amplify," Salesforce "Flex Credits"), not abandoning seats. Consolidation is accelerating (Clari+Groove, Salesloft+Drift, Clari+Salesloft) — the standalone engagement layer is being absorbed into broader revenue platforms.

**The wedge for a challenger (Vantrow):**
1. **Lead with PLG / transparent, low-friction entry** (the Apollo playbook). Outreach's no-trial, annual-only, ~25-seat-minimum posture cedes SMB and bottoms-up adoption entirely. **Publish your price** — Outreach's opacity is itself a wedge.
2. **Decouple price from human seats — price on work done** (per meeting booked / qualified opp, per conversation, per 1,000 messages, per active agent), aligning cost with value as SDR headcount shrinks.
3. **Bundle what Outreach charges extra for** (data + engagement + AI + CI in one transparent price) — neutralizes the "hidden costs / 3× sticker" complaint.
4. **Be genuinely AI-native and easy to use.** Outreach's UI is widely called dense/dated and its AI is bolted onto a decade-old core. A clean, fast, modern, AI-first product is a real differentiator.
5. **Time the disruption.** Salesloft is mid-merger and reputationally bruised; its mid-market base is unusually winnable in 2026.
6. **Avoid the 11x trap:** aggressive/outcome pricing only works with *provable outcomes and honest retention*, not "replace your team" hype.
7. **Clear the trust bar first.** None of the above matters if deliverability and CRM sync aren't rock-solid. That's the price of entry (see §14).

---

## 9. Technical architecture — what it takes to build

> The rest of the document is the build spec. External facts are cited; architectural recommendations are labeled as analysis.

### 9.1 Core domain data model
The Outreach public API is the cleanest available spec of the domain. Principal entities:

- **Tenancy & identity:** **Org (Tenant)** is the top-level isolation boundary — every row carries `org_id`. **Team** = hierarchical grouping for rollups and content scoping. **User (Rep)** belongs to an Org and 0..n Teams. **Mailbox** is a *first-class entity* (not folded into User) because sending capacity, throttles, warmup state, and health are per-mailbox; it stores OAuth tokens, provider type, and limits.
- **People & companies:** **Account** (company) 1..n **Prospect** (contact). Prospect is the busiest table: multiple emails/phones, per-channel opt-out flags, timezone, engagement counters (openCount/clickCount/replyCount), CRM external IDs.
- **Content:** **Sequence** (interval- or date-based) → ordered **SequenceStep**s (auto-email / manual-email / call / task / linkedin, with A/B variants) → **SequenceTemplate** joins a step to a **Template**. **Snippet** = reusable fragment. **Ruleset** = business-hours/throttle rules.
- **The enrollment state (the crux):** **SequenceState** = one row per (Prospect, Sequence). Holds current step index, `next_touch_at`, state enum, pause reason, assigned mailbox, error state. Its state machine is where correctness lives:

```
draft → active ⇄ paused → finished
                    ↘ bounced / opted_out / replied / failed / removed
```

Non-obvious requirements: (1) **exactly-once step execution** under retries/crashes (idempotency key per touch); (2) a prospect can be in multiple sequences (cross-sequence exclusivity rules); (3) **a reply/bounce must race-cancel the next scheduled touch** — a distributed-cancellation problem, not a cron problem; (4) **editing a live sequence** must define behavior for in-flight enrollments (the ugliest product+data question in the app).

- **Activity & engagement:** **Mailing** (one send/receipt: message-id, thread-id, state, tracking token); **Call** (prospect/user/task, disposition, recording); **Task** (manual steps materialize here); **Meeting**; **Event** (an **append-only/immutable** engagement + audit stream — the substrate for analytics); **Opportunity/Deal** (mastered in the CRM, shadow-copied locally); **ComplianceRequest** (GDPR/CCPA as first-class rows). Every externally-mastered object needs an **external-ID mapping table** with per-system IDs and per-field sync metadata.

### 9.2 The sequence execution engine (the core hard problem)
Naïve approaches fail: a single cron scanning "all due states" every minute can't scale or honor per-mailbox throttling / sub-minute cancellation; putting fire-time on a broker delay (SQS 15-min cap, Celery `eta`) makes cancellation impossible.

**Recommended design — durable timers + claim-and-execute** (separate *when to fire* from *do the work*, keeping the schedule queryable/cancellable):
1. **Schedule store:** `next_touch_at` in Postgres, indexed `(org_id, next_touch_at) WHERE state='active'` — cancellable with one UPDATE. The clean modern option is **Temporal**: "one enrollment = one workflow" with durable sleeps, retries, and **signals** for reply-cancellation.
2. **Poller/dispatcher:** select due rows with `FOR UPDATE SKIP LOCKED` (or Temporal timers fire directly), **partitioned by `org_id` hash** so a noisy tenant can't starve others.
3. **Idempotency:** each touch carries `hash(sequence_state_id, step_id, attempt_epoch)`; executors INSERT-on-conflict into a `touch_ledger` before side effects → **exactly-once effect** on at-least-once queues.
4. **Execute + advance atomically:** write Mailing/Call/Task, append Event, compute next `next_touch_at`, move pointer — all in one transaction. Never "send then update state" as two steps.

**Time zones & business hours:** store prospect IANA timezone; resolve local windows to UTC **at fire time** (not months ahead, or DST drift misfires). **Throttling** — multi-level Redis token buckets enforced simultaneously (per-mailbox/day, per-mailbox/hour + randomized jitter, per-org) against provider limits (Google Workspace ~2,000 external recipients/day; Gmail API ~60 sends/min; consumer Gmail ~500/day). **Pause conditions:** reply → paused(replied) + null `next_touch_at`; bounce → bounced; **out-of-office** classified via headers (`Auto-Submitted: auto-replied`) + heuristics and *deferred*, never treated as a human reply; opt-out/STOP → org-wide suppression. **Final guard:** re-check pause state with `SELECT … FOR UPDATE` on the SequenceState *inside the execution transaction, immediately before the side effect* — there's always a race window. **Retries:** exponential backoff + jitter for transient 429/5xx; poison touches → DLQ + alert.

**Scale sizing:** 1M active prospects × ~6 steps ≈ low-hundreds-of-thousands of touches/day — a few dozen stateless workers. The bottleneck is never CPU; it's provider rate limits and deliverability.

### 9.3 Email subsystem
**Mailbox connection:** **Gmail/Workspace** — OAuth; send via `messages.send`; receive via `users.watch` → Pub/Sub push → `history.list` (watches expire ~7 days, must renew). **Microsoft 365** — Graph; send via `sendMail`; receive via change-notification subscriptions backed by **delta query** for gap recovery + lifecycle notifications; max 1,000 subscriptions/mailbox. **SMTP/IMAP fallback** for legacy providers (brittle; compatibility tier). Build a **provider-abstraction layer** so the engine is provider-agnostic; **Nylas/Unipile** can compress months of Gmail+Graph+IMAP work into weeks — a real build-vs-buy call.

**Deliverability (existential):** since Feb 2024, Google/Yahoo enforce bulk-sender rules at ≥5,000 msgs/day, Microsoft joined 2025: **SPF + DKIM + DMARC all required**; **one-click unsubscribe** (RFC 8058, honored ≤48h); **spam-complaint rate <0.3%** (target <0.1%). The platform must also: run cold outreach on **secondary sending domains** (never the primary corporate domain); **warm up** new mailboxes over 2–6 weeks (model warmup state on Mailbox; the throttler reads it); monitor reputation (Postmaster Tools, seed-list tests) and auto-pause unhealthy mailboxes; lint content and jitter sends.

**Tracking:** opens via pixel (weak signal — Apple MPP inflates them; don't gate logic on opens); clicks via a redirect service (reliable); replies via `In-Reply-To`/`References` header matching → drives the pause machine; bounces via provider signals + DSNs (classify hard vs soft). **Threading:** maintain `Message-ID`/`In-Reply-To`/`References` so follow-ups thread and replies attribute correctly — a new-thread-per-step bug tanks reply rates and breaks reply-detection.

### 9.4 Telephony / dialer
Twilio Programmable Voice is the default target. **Click-to-call** via the Voice JS SDK (WebRTC); TwiML bridges rep↔prospect and logs to **Call**. **Local presence** dials from an area-code-matched caller-ID drawn from a purchased number pool (needs inventory/rotation + STIR/SHAKEN attestation to avoid spam-labeling). **Recording** dual-channel to your storage, gated by jurisdiction. **Voicemail drop** via Answering Machine Detection. **Transcription** pipes recordings to STT (§9.7). **Compliance:** the US is a patchwork — ~11–12 **two-party consent** states vs one-party elsewhere; interstate defaults to the stricter rule. Model this as a **policy engine keyed on caller+callee jurisdiction**, defaulting to the stricter side (auto-disable recording or force a spoken consent preamble), storing consent as an auditable event; TCPA further constrains autodialing.

### 9.5 Calendar & meetings
Connect Google Calendar + Graph Calendar via the mailbox OAuth. Compute free/busy (incl. team round-robin), expose a Calendly-style booking page; on booking, create the event, write a **Meeting**, append `meeting_booked`, advance/exit the SequenceState, and subscribe to calendar changes for two-way reschedule sync. The fiddly parts are round-robin + timezone correctness + the **double-booking race** (solve with a short-lived slot hold/lock at booking time).

### 9.6 CRM bidirectional sync (the hardest *integration* problem)
**Why it's the highest-risk part:** the CRM is the customer's **system of record**; your app must pull people/accounts/opportunities *in* and push activity *back out* **without ever corrupting their CRM.** "You overwrote 40,000 Salesforce contacts" is account-ending. Enterprises buy or reject sales-engagement tools substantially on sync fidelity.

- **Objects & mapping:** Salesforce (Lead/Contact/Account/Opportunity/Task/Campaign + custom), HubSpot (Contact/Company/Deal/Engagement + custom). Provide a **per-tenant configurable field-mapping layer** (type coercion, picklist mapping) — hardcoding fails because every enterprise CRM is customized.
- **Inbound (CRM→us):** Salesforce — backfill via **Bulk API v2**; steady-state via **Change Data Capture** (events in seconds but **72h retention**, persist replay IDs; gaps need a REST/Bulk reconciliation sweep). HubSpot — **webhooks** + batch reads, respecting limits (the CRM Search API is capped ~4 req/s — a notorious bottleneck). **Design principle: webhook/CDC for freshness, a scheduled full-reconciliation diff sweep for correctness** — you *will* miss events, so a periodic sweep is mandatory.
- **Outbound (us→CRM):** batch/coalesce writes; backoff on 429s; partitioned per-tenant queue so one backfill can't exhaust another's quota.
- **Conflict resolution (core distributed-systems problem):** per-field last-writer-wins with timestamps *or* configured system-of-record per field; **field-level dirty tracking** (hash at last sync) to push only changed fields; **loop prevention** (origin markers so your write echoing back doesn't ping-pong); **idempotent upserts** on external ID; and a **dead-letter + manual-reconciliation UI** for unresolvable conflicts. Because API allowances are finite, **keep a local CRM mirror and sync it** rather than querying live — that mirror *is* most of the sync engine.

### 9.7 Conversation-intelligence pipeline
**capture → store → STT+diarize → LLM → index → surface.** **Capture:** dialer calls are already recorded; video meetings via **Recall.ai** (one API to send bots into Zoom/Meet/Teams with real-time transcript/media — building meeting bots in-house is a whole team's worth of constantly-breaking headless browsers; buy early). **STT:** **Deepgram** (best price/performance, ~$0.26/hr batch) or **AssemblyAI** (built-in sentiment/topic/entity); self-hosted **Whisper** only at very high volume. Validate WER on 50–100 *real* call samples (clean-data benchmarks lie). **Diarization:** free for dual-channel dialer recordings; use the STT provider's for single-channel meetings. **LLM analysis:** summaries, action items, objection/competitor detection, talk-ratio, sentiment, keyword trackers. **Storage:** audio in S3/GCS; transcripts in Postgres/JSONB; embeddings in a vector store for cross-call semantic search.

### 9.8 AI features
Least differentiated *technically* (anyone can call an LLM) but high on roadmaps. **Email drafting/personalization** with prospect+account context + guardrails + human-in-the-loop approval. **Reply classification** (interested / not-now / referral / unsubscribe / OOO / bounce) driving routing + the pause machine (a small/fine-tuned model beats a big one on latency/cost). **RAG** over CRM notes, past emails, transcripts (pgvector to start). **"AI SDR agent"** = an orchestrated loop that researches → drafts → waits → classifies → acts — essentially an *automated operator of the sequence engine*. It is a thin high-value layer **on top of** §9.1–9.7 and presupposes a correct core; it does not shortcut the build. **Infra:** an LLM behind a **model gateway** (routing/fallback/cost/PII-redaction), a vector store, an eval harness, strict per-tenant isolation.

### 9.9 Analytics & reporting
Two tiers off the immutable **Event** stream: **real-time/operational** (rep dashboards from OLTP or Redis rollups) and **batch/analytical** (stream Events → **ClickHouse**/BigQuery, pre-aggregate for A/B, leaderboards, funnels). **Attribution** stitches touches → replies → meetings → opportunities → closed-won across the mirrored CRM pipeline — the metric execs buy the product for, and dependent on §9.6 being correct. Keep raw events immutable; compute metrics downstream so historical reports stay reproducible.

### 9.10 Cross-cutting concerns
**Multi-tenancy:** `org_id` everywhere + Postgres **Row-Level Security** as a backstop; schema/DB-per-tenant for very large accounts. **AuthN/Z & RBAC:** SSO/SAML/OIDC + SCIM, plus the **content-governance layer** (personal vs shared vs team content, publish rights, hierarchy-scoped visibility) — more nuanced than CRUD RBAC and a frequent enterprise dealbreaker. **Scalability:** stateless API + workers, partitioned queues, per-tenant fairness, Redis buckets — the system is I/O/rate-limit-bound. **Security/compliance:** **SOC 2 Type II** (table-stakes), GDPR/CCPA (right-to-delete → ComplianceRequest, residency), CAN-SPAM, TCPA, call-recording consent; encrypt OAuth tokens (KMS) and PII. **Observability:** distributed tracing across poller → queue → worker → provider ("why didn't this prospect get emailed?" answerable in seconds), per-mailbox deliverability metrics, DLQ alerting. **Audit logs:** immutable trail for every send, state transition, CRM write, and admin action.

---

## 10. Recommended tech stack (2026)

Optimized for a small team building with an AI coding agent (Claude Code): favor **mainstream, boring, well-documented** tech for maximal agent fluency.

| Layer | Recommendation | Rationale |
|---|---|---|
| Backend language | **TypeScript (Node)**, or Python if AI-heavy | One language end-to-end; huge SDK coverage; agent fluency |
| Frontend | **React + Next.js + TS**, Tailwind + shadcn/ui, TanStack Query | Most-documented FE stack |
| API | REST + OpenAPI (or tRPC if TS end-to-end) | Typed contracts the agent can scaffold/test |
| Primary DB | **PostgreSQL** (RDS/Cloud SQL/Neon) | System of record; RLS tenancy; `SKIP LOCKED` scheduler; pgvector for RAG |
| Workflow/timers | **Temporal** | Durable timers, retries, signals (reply-cancel), exactly-once — purpose-built for the execution engine |
| Queue / fan-out | Temporal + **Redis/BullMQ** or **SQS** | Simple, ubiquitous |
| Cache / rate-limit | **Redis** | Token buckets, hot counters |
| Analytics | **ClickHouse** + Postgres FTS/OpenSearch | Columnar for billions of events, sub-second dashboards |
| Realtime UI | WebSockets/SSE (Ably/Pusher or self-hosted) | Live task/reply updates |
| LLM/AI | **Anthropic Claude** via a model gateway; pgvector → Pinecone at scale | Strong tool-use; gateway for routing/cost/PII |
| STT | **Deepgram** (AssemblyAI alt) | Best price/performance |
| Meeting capture | **Recall.ai** | One API vs a per-platform team |
| Email | **Gmail API + Graph** direct (core); SMTP/IMAP fallback; Nylas/Unipile accelerator; Postmark/SES for the product's *own* mail | Owning mailbox integration is core |
| Telephony | **Twilio** Voice + JS SDK | Richest voice primitives, AMD |
| Calendar | Google Calendar + Graph | Reuse mailbox OAuth |
| Infra | AWS/GCP, ECS-Fargate/GKE, Terraform, managed PG/Redis/ClickHouse | Boring, scalable (PaaS like Render/Fly if tiny team) |
| Auth | **WorkOS** / Auth0 / Clerk | Enterprise SSO/SAML/SCIM without building it |
| Observability | OpenTelemetry + Datadog/Grafana, Sentry | Trace the async pipeline |

**Architecture shape:** Postgres + Temporal + Redis + a worker fleet handles ~90% of the hard parts; add ClickHouse and a vector store when scale demands. **Resist microservice sprawl early — a modular monolith + a separate worker tier is faster to build and much easier for an AI agent to reason about than 15 services.**

---

## 11. Third-party services shopping list

Gmail API + Cloud Pub/Sub (send + inbound sync) · Microsoft Graph (mail + calendar) · Nylas/Unipile (optional unified accelerator) · Salesforce REST/Bulk v2/CDC · HubSpot API + webhooks · Twilio Voice + SDK (dialer/AMD/recording) · Deepgram/AssemblyAI (STT) · Recall.ai (meeting capture) · Anthropic Claude (drafting/classification/agents) · Pinecone/Weaviate or pgvector (RAG) · Google Postmaster Tools + an inbox-placement vendor (deliverability) · WorkOS/Auth0/Clerk (SSO/SCIM) · Postmark/SES (system email) · Datadog/Grafana + Sentry (observability) · Cloud KMS + secrets manager (token/PII encryption).

---

## 12. Scope & phasing — the roadmap

This is the "understand the scope" payoff. Four phases, each a usable product, each de-risking the next. Effort ranges assume a small, senior team **plus** heavy use of an AI coding agent for breadth; the ranges are calendar time, not person-months.

### Phase 0 — Foundations (the unglamorous core) · ~1–2 months
Multi-tenant Postgres schema (Org/Team/User/Mailbox/Account/Prospect + external-ID mapping); auth + RBAC (buy WorkOS/Clerk); the immutable **Event** stream; one Gmail OAuth mailbox connection with send + inbound sync; a basic React app shell with the left-nav IA. *Deliverable: you can connect a mailbox, import contacts, send/track one email, and see it logged.*

### Phase 1 — MVP: engagement that works · ~4–6 months (cumulative 6–8)
The irreducible product. **Sequences + Sequence Builder**; the **execution engine** (Temporal, throttling, business hours, exactly-once, reply/bounce/OOO pause); the **rep task queue + play-through flow**; templates/snippets/variables with send-blocking personalization; open/click/reply tracking + threading; deliverability foundations (SPF/DKIM/DMARC guidance, secondary-domain support, basic warmup, one-click unsubscribe); a **one-way CRM import** (Salesforce *or* HubSpot) to seed prospects; basic sequence-performance reporting. *Deliverable: a team can run real multi-step email cadences end-to-end and trust the timing/cancellation. This is the smallest thing that is genuinely "an Outreach."* This phase contains the hardest correctness work — budget accordingly.

### Phase 2 — Multi-channel + the trust bar · ~4–6 months (cumulative 10–14)
**Twilio dialer** (click-to-call, local presence, recording, dispositions, consent policy engine); **Microsoft 365** mailbox parity; **meetings/scheduling** (booking pages, round-robin, calendar sync); **two-way CRM sync** for one CRM (the reconciliation sweep, conflict resolution, write-back — this is the big one); deeper reporting + a real analytics tier (ClickHouse); **SOC 2 Type II** process started; mobile-responsive rep experience. *Deliverable: a multi-channel platform an enterprise could pilot without fear for their CRM.*

### Phase 3 — Intelligence + differentiation · ~6+ months (cumulative 16–24+)
**Conversation intelligence** (Recall.ai + Deepgram + LLM summaries/topics/coaching); **AI agent layer** (personalization, reply classification, an autonomous prospecting agent, RAG over your data); **deal/pipeline management** and **forecasting**; the **second CRM's** two-way sync; content governance at enterprise depth; native mobile apps; the **conversational/agentic front door** (your "Omni"). *Deliverable: feature-competitive with Outreach on the surfaces that matter to your target segment.*

**Faithful-parity note:** matching *all* of today's Outreach (both mail providers deep, both CRMs deep, compliant telephony, full CI, forecasting, enterprise governance, SOC 2, exec analytics, and a mature agent layer) is a **multi-year effort for tens of engineers**. The phasing above gets you a credible, sellable product much sooner by picking one CRM/one channel first and going deep before going wide.

**Sequencing principle:** build **depth-first on the core loop** (Phases 0–1) before **breadth** (Phases 2–3). A shallow clone of all 15 modules is worth less than a rock-solid sequence engine + deliverability + one CRM sync, because the latter is the part competitors can't fake and customers won't forgive if it's wrong.

---

## 13. Building this with Claude Code + fable — practical notes

You mentioned taking this to Claude Code to build (with fable). A few things that will make that go well:

- **Feed the agent this document as the spec, then work phase-by-phase.** Don't ask for "an Outreach clone" in one shot. Drive it from §12: one phase per milestone, one subsystem per work session. The data model in §9.1 and the stack in §10 are the two most useful things to hand it first.
- **Let the agent own the breadth; you own the depth.** Claude Code is excellent at the enormous surface area of CRUD, UI, API glue, provider SDK integration, and tests — that's most of the *volume* of this build and where an agent shines. Reserve your own scrutiny for the four hard problems (execution-engine correctness, deliverability, CRM sync conflict resolution, multi-tenant isolation). Have the agent write extensive tests for those specifically.
- **Prefer the boring, well-documented stack (§10).** Agents are far more reliable on mainstream tech (Postgres, Next.js, Temporal, Twilio) than on obscure libraries. This is why the stack recommendation leans conservative.
- **Buy, don't build, the commodity-but-hard pieces early:** auth/SSO (WorkOS/Clerk), meeting capture (Recall.ai), STT (Deepgram), and optionally unified mailbox sync (Nylas/Unipile). Each is a multi-week-to-multi-month build you can skip. Have the agent integrate them rather than reimplement them.
- **Modular monolith, not microservices.** Easier for an agent to reason about the whole system, refactor across boundaries, and keep types coherent. Split out only the worker tier.
- **Deliverability and CRM sync can't be "tested into existence" by the agent alone** — they need real mailboxes, real warmup time, and a real (sandbox) Salesforce/HubSpot org to iterate against. Plan for that infrastructure before Phase 2.
- **Start narrow on the ICP.** Pick one buyer (e.g., SMB/mid-market outbound teams), one email provider, one CRM. It halves the surface area and sharpens every product decision.

---

## 14. Honest assessment & biggest risks

**The hardest parts, ranked (where the real time goes):**
1. **CRM bidirectional sync** — highest risk *and* effort. Conflict resolution, field mapping, rate limits, loop prevention, reconciliation across CRMs. Getting it wrong corrupts customer data. Years of a dedicated team for true parity.
2. **Email deliverability & mailbox integration** — existential; spam = a worthless product. Warmup, domain strategy, reputation ops, per-provider quirks — a permanent discipline, and the rules tighten yearly.
3. **Sequence execution engine** — correctness under concurrency: exactly-once, instant reply-cancellation, time zones, throttling, idempotency. Subtle bugs send at 3 a.m., double-send, or email people who already replied.
4. **Multi-tenant reliability & fairness** — noisy-neighbor isolation, per-tenant quotas, an observable/debuggable async pipeline.
5. **Telephony + compliance** — the voice stack is moderate; the *compliance* (two-party consent, TCPA) is legal-engineering that must be right on day one.
6. **Conversation intelligence** — capture reliability is the risk; largely mitigated by buying Recall.ai.
7. **AI features** — the *lowest* technical risk despite top billing; orchestration atop a correct core.

**The strategic reality:** the moat isn't any single feature — it's **accumulated correctness** in the execution engine, the deliverability operation, and CRM sync, plus the trust and integrations built over a decade. An AI coding agent meaningfully compresses the *breadth* of the build (the integration glue, CRUD, and UI that make up most of the line count), but **not the depth** — distributed-systems correctness, deliverability reputation earned over months, and CRM conflict resolution — which is where the multi-year effort actually lives.

**The most realistic path to a real business** is not "clone all of Outreach" but **"win a wedge Outreach is weak at"**: an AI-native, transparently-priced, genuinely-easy-to-use product for a segment (SMB/mid-market) Outreach underserves, built on a rock-solid core loop, expanding module-by-module as you earn trust. The full feature list in this document is the *destination*; §12 is the *route*; the wedge in §8 is *why anyone switches*.

---

## Sources

**Product & features:** outreach.ai (homepage, /platform, feature pages for sales-engagement, conversation-intelligence, deal-management, mutual-action-plans, pipeline-management, forecasting, rep-coaching, ai-agents, governance) · support.outreach.io (dialer, reporting, mobile, user roles, governance, sequences, templates, variables, prospect/account/opportunity views, Kaia, Commit) · developers.outreach.io (API, common patterns) · press releases via BusinessWire/PRNewswire (Kaia launch, AI Prospecting Agents Dec 2024, AI Revenue Workflow Platform / Unleash 2025, Omni 2026, ChatGPT app + Codex MCP June 2026, Marketplace 2023, $4.4B round 2021) · GeekWire (CEO transition interview, 2024) · Sacra, GetLatka (company financials/scale) · GZ Consulting (Unleash analyst deep-dive).

**UI/UX:** support.outreach.io help docs (navigation, 360° dashboard, global sidebar task flow, sequence/prospect/account/opportunity/template/variable/dialer/meeting/Kaia/reporting/governance/mobile) · G2, Salesforge, MarketBetter (reviews & UX sentiment).

**Pricing & competitors:** vendr.com/marketplace (Outreach, Salesloft, Amplemarket) · docket.io, woodpecker.co, itqlick.com, marketbetter.ai, getfuzzy.ai (Outreach pricing) · outreach.io/pricing · apollo.io, warmly.ai, getlatka (Apollo) · salesforce.com, zenml.io (Agentforce) · clari.com & salesloft.com newsrooms (Clari–Salesloft merger) · socradar.io (Drift breach) · aisdr.com, inc.com, useanterion.com (AI SDR newcomers) · MarketsandMarkets, Forrester, Gartner (category sizing & "revenue orchestration").

**Architecture:** developers.outreach.io (API object model) · Google Gmail API docs (quota, push) · Microsoft Graph docs (change notifications, delta query) · Salesforce (REST/Bulk v2/CDC) · HubSpot API rate-limit guides · Twilio (Programmable Voice, AMD) · Deepgram/AssemblyAI/Whisper comparisons · Recall.ai (meeting bot API) · Gmail/Yahoo/Microsoft 2024–2026 bulk-sender requirements · call-recording consent references (Revenue.io, Otter.ai).

*Two companion research files are saved in the Vantrow project: the full competitive/pricing deep-dive and the full technical scoping report.*
