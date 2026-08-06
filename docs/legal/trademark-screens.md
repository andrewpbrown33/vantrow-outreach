# Trademark & Domain Screens — Raw Evidence Record

## ⚠️ These are first-pass automated screens, NOT legal clearance

Domain-availability checks below are registry RDAP lookups (authoritative for
registration status at the lookup date, which decays hourly). Trademark exposure has
**not** yet been screened for any candidate — USPTO screens, collision searches, and
per-candidate risk grades land with the Phase 1 naming sprint, following the Eaverow
method (domain-first: generate 40–50 → auto-filter available `.com` → deep-screen the
survivors → memo with low/medium/elevated grades). A professional clearance search via
counsel is required before adopting any name.

## Method

```
curl -s -o /dev/null -w "%{http_code}" https://rdap.verisign.com/com/v1/domain/<name>.com
# 200 = REGISTERED · 404 = AVAILABLE (Verisign is the authoritative .com registry)
```

Cross-check on later rounds: `https://dns.google/resolve?name=<name>.com&type=NS` (live
NS delegation = registered regardless of any RDAP gap). Known gotcha from the Eaverow
screens: rdap.org returns 404 for some *registered* `.io` domains — always cross-check
`.io` verdicts against DNS.

## Pre-screen — 2026-08-05 (Verisign RDAP, all `.com`)

Seed pool for the Phase 1 naming sprint. Family pattern: `-row` suffix (Vantrow →
Eaverow → Parcelrow), vertical-native root, `.com` required, registered same day as the
naming gate.

### AVAILABLE (RDAP 404) as of 2026-08-05

| Candidate | Root | Note |
|---|---|---|
| pitchrow.com | pitch | |
| touchrow.com | touch(point) | |
| cadencerow.com | cadence | category's own word for sequences |
| sequrow.com | sequence | spelling drift — screen pronounceability |
| closerow.com | close | |
| campaignrow.com | campaign | |
| warmrow.com | warm (outreach) | |
| engagerow.com | engage(ment) | category name is "sales engagement" |
| funnelrow.com | funnel | leans marketing more than sales |
| quotarow.com | quota | negative-connotation check needed |
| outreachrow.com | outreach | ⚠️ **pre-flagged elevated-risk / likely-reject**: embeds the incumbent's mark verbatim — the same trap as Eaverow's rejected "Accu-" candidates. Kept in the pool for completeness; expect the memo to grade it out. |

### TAKEN (RDAP 200) as of 2026-08-05

sendrow.com · reachrow.com · mailrow.com · dialrow.com · cadrow.com · prospectrow.com ·
pipelinerow.com · replyrow.com · threadrow.com · inboxrow.com · leadrow.com ·
meetrow.com · bookrow.com · callrow.com · pingrow.com · relayrow.com · temporow.com ·
echorow.com · winrow.com · coldrow.com

## Generation round 2 — 2026-08-06 (Verisign RDAP, all `.com`)

25 further candidates screened during the Phase 1 sprint (total generated: 56).

**AVAILABLE (RDAP 404):** introrow · followrow · nudgerow · scriptrow · greetrow ·
chaserow · torchrow

**TAKEN (RDAP 200):** demorow · openrow · draftrow · playrow · talkrow · chatrow ·
voicerow · hellorow · greetrow~~*~~ · huntrow · dealrow · sellrow · salesrow ·
sparkrow · signalrow · beaconrow · northrow · forgerow · emberrow
*(correction: greetrow returned 404 — listed available above)*

Running available pool for the deep screen (18): pitchrow, touchrow, cadencerow,
sequrow, closerow, campaignrow, warmrow, engagerow, funnelrow, quotarow, outreachrow
(pre-flagged), introrow, followrow, nudgerow, scriptrow, greetrow, chaserow, torchrow.
All lookups re-verify same-day at Gate 2 before registration.

## What the Phase 1 naming sprint must add per surviving candidate

Rationale · sample tagline · fresh dated `.com`/`.io` evidence · collision findings
(companies, products, apps, adjacent categories — checked against research doc 10's
competitor landscape) · trademark screen with method + limitations · similarity to
"Outreach" and to every doc-10 mark on three axes (sound / appearance / meaning) · risk
grade (**low / medium / elevated**) with its reason · how naturally it pairs with
"a Vantrow company."

## Deep screen — 2026-08-06 (Gate 2 evidence)

Raw evidence for `docs/brand/naming-decision-memo.md`. All lookups and searches run
**2026-08-06**. Grades use the rubric above (low / medium / elevated).

### Domain re-verify — all 18 candidates, 2026-08-06

`.com` via `curl -s -o /dev/null -w "%{http_code}" https://rdap.verisign.com/com/v1/domain/<name>.com`
(Verisign, authoritative). `.io` via `https://rdap.org/domain/<name>.io` **cross-checked**
against `https://dns.google/resolve?name=<name>.io&type=NS` per the known rdap.org
false-available gap (live NS delegation = registered regardless of RDAP).

| Candidate | `.com` RDAP | `.io` RDAP | `.io` DNS NS | Verdict |
|---|---|---|---|---|
| pitchrow | 404 | 404 | Status=3 (NXDOMAIN), no NS | both AVAILABLE |
| touchrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| cadencerow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| sequrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| closerow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| campaignrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| warmrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| engagerow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| funnelrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| quotarow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| outreachrow | 404 | 404 | Status=3, no NS | both AVAILABLE (name still graded out below) |
| introrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| followrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| nudgerow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| scriptrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| greetrow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| chaserow | 404 | 404 | Status=3, no NS | both AVAILABLE |
| torchrow | 404 | 404 | Status=3, no NS | both AVAILABLE |

**No candidate LOST since the 2026-08-05/06 pre-screens.** DNS cross-check corroborates
every `.io` 404 (NXDOMAIN, zero NS records) — the rdap.org gap is covered this pass.
Availability decays hourly; re-verify at the moment of registration.

### Trademark-screen method + limitation (applies to every block below)

Web searches of USPTO-indexing aggregators (trademarks.justia.com, uspto.report) via
general web search, 2026-08-06. **These are web-indexed, non-authoritative snapshots:
they miss recent and pending applications, state registrations, common-law/unregistered
marks, and non-US filings (EUIPO/WIPO). "No web-indexed filing found" means exactly that
and nothing more. This is NOT legal clearance** (protocol §5); professional clearance via
counsel is required before adoption. No exact-compound filing was found for ANY of the 18
candidates; per-candidate root findings below. Generic `-row` compounds do register
cleanly in unrelated classes — e.g. MUSICROW (SN 85443344, music-industry publication),
NITROROW (SN 88153667, rowing studio), FRONTROW (SN 85482762), SASSYROW (SN 79235969) —
supporting suffix registrability when the root clears.

### Groove / `-row` family check (doc-10 §6 warning) — consolidated

Doc-10 requires `-row` candidates to clear Arrow-, Grow-, Groove-family marks (Groove,
Clari's sales-engagement product, is live in this exact space). Structural finding: the
suffix `-row` /roʊ/ differs from "Groove" /ɡruːv/ in vowel and final consonant, and from
"grow"/"arrow" patterns unless the candidate supplies a g-/gr- onset. **Seventeen of 18
candidates have no g/gr onset and clear the family check on sound and appearance.** The
single exception is **greetrow** (gr- onset — flagged in its block below). Adjacent note:
deliverability vendor **Allegrow** (allegrow.co) ends in "-grow" — nearest live "-grow"
neighbor, relevant mainly to warmrow's warmup-adjacent positioning.

### Per-candidate evidence blocks

#### pitchrow — grade: LOW
- **Domains (2026-08-06):** pitchrow.com RDAP 404 (AVAILABLE); pitchrow.io rdap.org 404 +
  DNS Status=3 no NS (AVAILABLE).
- **Collisions:** No exact entity anywhere — a bare `"pitchrow"` search returns only
  baseball coincidences (Pitchout, surnames Withrow/Myrow/Tedrow, PitchCom hardware).
  Nearest neighbors, none confusable: **Pitchroom** — 2-person pitch-sharing tool
  (capterra.com/p/183930/Pitchroom/, tracxn.com profile); **Pitch** (pitch.com) —
  presentation software, Berlin (Pitch Software GmbH), sales-deck adjacent but a
  different product category; PitchBook (finance data). Doc-10 roster: no house mark or
  sub-brand shares the root.
- **Trademark:** No web-indexed PITCHROW filing found (method limits apply). Root
  neighbors: PITCHAGO (SN 90356868, Pitchago AB), PITCH COMEDY (Reg. 5602387, unrelated).
  No in-class PITCH-formative registration for sequence/engagement software surfaced;
  no US PITCH registration for Pitch Software GmbH surfaced (may hold EU/WIPO marks —
  method gap, counsel item).
- **Similarity:** vs Outreach — sound/appearance/meaning all distinct (no shared
  morpheme; meaning overlaps only at category level). vs doc-10 roster — no mark within
  one edit or shared root on any axis. Groove/-row: no g-onset; clears.
- **Grade reason:** LOW — clean domains, no exact or near-identical entity in or
  adjacent to sales-tech, no live in-class mark found, no confusing similarity to
  Outreach or any roster mark. Residual: crowded generic "pitch" root in adjacent
  deck/pitch tooling → counsel checklist, not blocking.

#### touchrow — grade: LOW
- **Domains (2026-08-06):** touchrow.com RDAP 404; touchrow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. Nearest: **Touch & Sell** — small French sales-
  enablement/presentation platform (capterra.com/p/183674/Touch-Sell/, getapp.com
  listing); TouchBistro — restaurant POS, unrelated (en.wikipedia.org/wiki/TouchBistro_Inc.).
  Doc-10 roster: none share the root.
- **Trademark:** No web-indexed TOUCHROW filing found (method limits apply). No in-class
  TOUCH-formative block surfaced for engagement software.
- **Similarity:** vs Outreach — distinct on all three axes; "touch(point)" is category
  vocabulary (a sequence step), descriptive not confusing. vs roster — none. Groove/-row:
  clears (no g-onset). **Internal hazard:** torchrow, also in this pool, is a one-letter
  typo/mishearing twin (touch/torch) — if touchrow is chosen, register torchrow.com
  defensively or accept the typo leak.
- **Grade reason:** LOW — clean domains, no in-industry entity, no live in-class mark
  found, no roster similarity. Residual: abstract root; typo-twin.

#### cadencerow — grade: MEDIUM
- **Domains (2026-08-06):** cadencerow.com RDAP 404; cadencerow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. **But the root is the closest rival's product
  vocabulary:** Salesloft's sequence product is literally named **Cadence**
  (salesloft.com/platform/cadence-automation; Salesloft support article "Salesloft
  Cadence"), in continuous prominent use since ~2014; "sales cadence software" is also a
  genericized category phrase used vendor-neutrally (Salesmate, Kaspr, ZoomInfo,
  Revenue.io listicles, all 2025–26). Doc-10 roster: Salesloft (house mark, Cadence =
  flagship term) + Salesloft sub-brand **Rhythm** (meaning-adjacent synonym).
- **Trademark:** Salesloft filed **CADENCE, SN 86524047** (2015-02-04) for "downloadable
  software for sales development, namely, software for prospective customer outreach
  management…" — **DEAD: abandoned 2016-01-04 (status 602, failure to respond)**
  (trademarks.justia.com/865/24/cadence-86524047.html). Cadence Design Systems holds
  famous live CADENCE registrations in software (e.g. Reg. 3474136, EDA class —
  different goods, but famous-mark breadth). No CADENCEROW filing found (method limits
  apply).
- **Similarity:** vs Outreach — distinct on all axes. vs Salesloft Cadence — appearance
  and sound: contains the entire word; meaning: identical concept (a sequence). Groove/
  -row: clears.
- **Grade reason:** MEDIUM — no live in-class registration blocks it (federal
  application dead, term heavily genericized), but it embeds the #2 incumbent's flagship
  product term with continuous common-law use, plus a famous CADENCE mark in another
  software class. Usable only after counsel weighs Salesloft common-law scope; graded
  medium not elevated solely because of the dead application + genericization.

#### sequrow — grade: MEDIUM (and quality-rejected)
- **Domains (2026-08-06):** sequrow.com RDAP 404; sequrow.io rdap.org 404 + DNS Status=3
  no NS. Both AVAILABLE.
- **Collisions:** No exact entity. Near-identical appearance/sound in an unrelated
  field: **Sequor Industrial Software** — Brazilian MES/logistics software, Groupe SNEF,
  ~84 employees (sequor.com.br/en/home; crunchbase.com/organization/sequor-industrial-software;
  PitchBook profile 507436-75). Also SeQure (cybersecurity, cbinsights.com/company/sequre).
  Doc-10 roster: none share the string; meaning axis points at Outreach's generic
  "sequence" vocabulary (descriptive, not a mark).
- **Trademark:** No web-indexed SEQUROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct as a mark; meaning = their core feature noun
  (sequences), descriptive. vs roster — none. SEQUROW vs SEQUOR: one-letter-class apart
  visually, near-homophone. Groove/-row: clears.
- **Grade reason:** MEDIUM — minor collision with an unrelated-field software company of
  near-identical name (rubric: minor unrelated-field collision). Independent of grade,
  it fails the pre-screen's pronounceability flag: "SEE-krow"? "seh-KYOO-row"?
  "SEK-roh"? — not recoverable after one hearing, not spellable from sound. Rejected on
  quality in the memo.

#### closerow — grade: MEDIUM
- **Domains (2026-08-06):** closerow.com RDAP 404; closerow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. **Close (close.com)** — active sales CRM with
  calling/email/pipeline and an AI agent, squarely in sales software (close.com;
  G2 listing) — owns the root in-space and is enforcement-minded: its partner agreement
  bars "Close.com", "Close", "Close.io" "or variations or misspellings thereof in domain
  names" (close.com/partners/partner-program-agreement) and it publishes brand-usage
  guidelines (close.com/brand). Unrelated: CLOSER'S COFFEE marks (SN 88380055).
  Doc-10 roster: no house mark shares the root; Outreach sub-brands Deal/Commit are
  meaning-adjacent (closing).
- **Trademark:** No web-indexed CLOSEROW filing found (method limits apply); no in-class
  CLOSE-formative block surfaced beyond Close's own marks.
- **Similarity:** vs Outreach — distinct on all axes. vs Close — appearance/sound:
  contains "close(r)" wholly; meaning: same industry, different funnel stage. Parse
  ambiguity: "close-row" vs "closer-ow". Groove/-row: clears.
- **Grade reason:** MEDIUM — crowded near-namespace: an active, enforcement-minded
  in-industry company owns the root; plus parse ambiguity and a meaning mismatch (we
  open conversations; "close" overpromises the end of the funnel).

#### campaignrow — grade: MEDIUM
- **Domains (2026-08-06):** campaignrow.com RDAP 404; campaignrow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. Root heavily used in adjacent marketing software:
  **Campaignware** — interactive-campaign SaaS, Sydney (capterra.com/p/248884/Campaignware/,
  crunchbase.com/organization/campaignware); ActiveCampaign / Campaign Monitor family
  (adjacent marketing automation, common knowledge — not individually screened this
  pass); CAMPAIGNTRACKLY mark (SN 88832697). Doc-10 roster: none share the root
  (HubSpot "campaigns" is a generic feature noun).
- **Trademark:** No web-indexed CAMPAIGNROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all axes. vs roster — none. Groove/-row:
  clears.
- **Grade reason:** MEDIUM — crowded near-namespace in adjacent marketing tooling; root
  reads marketing-campaign more than sales-sequence (pre-screen note confirmed). Also
  the longest candidate (4 syllables run-on).

#### warmrow — grade: MEDIUM
- **Domains (2026-08-06):** warmrow.com RDAP 404; warmrow.io rdap.org 404 + DNS Status=3
  no NS. Both AVAILABLE.
- **Collisions:** No exact entity. The root is actively owned by two neighboring
  niches: (a) **Warmly (warmly.ai)** — funded AI sales platform (visitor de-anon, warm
  intros, automated outreach; plans $700–$1,500/mo per 2026 reviews —
  salesforge.ai/directory/sales-tools/warmly-ai, revops.tools/warmly-ai/); (b) the
  email-warmup/deliverability niche: Warmy, Allegrow (allegrow.co/knowledge-base/warmy-reviews),
  lemwarm (lemlist's warmup product — lemlist is a doc-10 house mark with a
  deliverability reputation).
- **Trademark:** No web-indexed WARMROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all axes. vs roster — lemlist (via lemwarm)
  on the meaning axis only. vs Warmly — shared root, same industry, different function.
  Groove/-row: clears; note Allegrow "-grow" neighbor in the same warmup niche.
- **Grade reason:** MEDIUM — crowded near-namespace (Warmly in-industry + an entire
  warmup vendor niche); category-descriptive misdirection risk: buyers would read
  warmrow as a warmup tool, which we are not.

#### engagerow — grade: MEDIUM
- **Domains (2026-08-06):** engagerow.com RDAP 404; engagerow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. **The root is the incumbent's own sub-brand:**
  Outreach's engagement tier/product is **Engage** (doc-10 §6; the founder's own license
  is "Engage core"). Also the category label itself ("sales engagement") and EngageBay
  (adjacent sales/marketing suite, engagebay.com — surfaced by name in search).
- **Trademark:** No web-indexed ENGAGEROW filing found (method limits apply). ENGAGE-
  formative marks were not exhaustively enumerable by this method (crowded generic root
  — counsel item if ever pursued).
- **Similarity:** vs Outreach — house mark distinct, **but sub-brand Engage: contains
  the whole word; meaning identical** (their product tier ↔ our product). A buyer could
  read "Engagerow" as an Outreach line extension. vs roster — EngageBay adjacent.
  Groove/-row: clears.
- **Grade reason:** MEDIUM — the same embed-the-incumbent's-vocabulary pattern as
  outreachrow one level down: not their house mark, but their live sub-brand + the
  category label. "Engage" is too generic for anyone to own outright (which keeps this
  out of elevated), but confusing-similarity risk points at the one company we must
  never be confusable with. Graded out in the memo.

#### funnelrow — grade: MEDIUM
- **Domains (2026-08-06):** funnelrow.com RDAP 404; funnelrow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. Root owned in adjacent categories: **Funnel**
  (funnel.io) — sizable Swedish marketing-data platform (en.wikipedia.org/wiki/Funnel_(software));
  **FunnelFlare, Inc.** — sales-software trademarks on file
  (trademarks.justia.com/owners/funnelflare-inc-6042593); ClickFunnels family (marketing).
  Doc-10 roster: none.
- **Trademark:** No web-indexed FUNNELROW filing found (method limits apply); FunnelFlare
  shows live FUNNEL-formative activity near our class.
- **Similarity:** vs Outreach — distinct on all axes. vs roster — none. vs Funnel/
  FunnelFlare — shared root, adjacent industries. Groove/-row: clears.
- **Grade reason:** MEDIUM — crowded near-namespace (a substantial company IS the bare
  root next door, plus an in-class-adjacent FUNNEL-formative filer); root leans
  marketing-analytics, diluting sales-outreach fit.

#### quotarow — grade: MEDIUM
- **Domains (2026-08-06):** quotarow.com RDAP 404; quotarow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. **QuotaPath** (quotapath.com) — active sales-
  commission software; same broad sales-tech industry, different subcategory. Doc-10
  roster: none share the root; Outreach sub-brands Forecast/Commit are meaning-adjacent
  (revenue targets).
- **Trademark:** No web-indexed QUOTAROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all axes. vs roster — none direct.
  Groove/-row: clears.
- **Grade reason:** MEDIUM — QUOTA-formative crowding inside sales-tech (QuotaPath);
  plus the pre-screen's negative-connotation flag confirmed in review: "quota" reads
  pressure/grind (and "quota exceeded" errors), and the root names the rep's target, not
  the outreach act. Quality-rejected in the memo regardless of clearable risk.

#### outreachrow — grade: ELEVATED (pre-flag confirmed — REJECT)
- **Domains (2026-08-06):** outreachrow.com RDAP 404; outreachrow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE — availability is irrelevant to the grade.
- **Collisions:** No third-party entity uses the compound (search returns only generic
  outreach-program phrases — Skid Row outreach, Roosevelt Row clinic). The collision is
  the incumbent itself.
- **Trademark:** **OUTREACH — Reg. 5313809, SN 86616418, OUTREACH CORPORATION** (the
  incumbent's corporate name), filed 2015-04-30, covering "providing a website for
  management of marketing and sales promotion activities" — **live, in-class**
  (trademarks.justia.com/866/16/outreach-86616418.html). Additional OUTREACH-formative
  filings by unrelated owners exist (e.g. SN 78454183, 86616413). No OUTREACHROW filing
  found (method limits apply — moot).
- **Similarity:** vs Outreach — **contains the entire house mark on all three axes**;
  the suffix does not dissolve confusion for a directly competing product. Protocol §5
  names this exact pattern as prohibited ("embedding their mark in our product name or
  domain").
- **Grade reason:** ELEVATED — embeds the live registered in-class mark of the specific
  incumbent we compete with; the one fact pattern counsel cannot clear. Kept in the
  table for record completeness only. REJECT.

#### introrow — grade: MEDIUM
- **Domains (2026-08-06):** introrow.com RDAP 404; introrow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. **Introhive** (introhive.com) — active relationship-
  intelligence/CRM-automation platform (founded 2012, 350+ employees, professional-
  services focus; Salesforce AppExchange presence) shares the "Intro-" prefix in the
  broader sales-intelligence industry. Intro.co (expert-call marketplace) unrelated.
  Doc-10 roster: none.
- **Trademark:** No web-indexed INTROROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all axes. vs Introhive — first two
  syllables identical in sound and appearance; suffixes (-row/-hive) fully distinct;
  meaning both point at relationship-building. Groove/-row: clears.
- **Grade reason:** MEDIUM — crowded near-namespace: an established in-industry company
  owns the same distinctive prefix. Strong semantic fit (the intro = the first touch;
  warm-intro vocabulary; Affinity synergy for customer #1) keeps it on the shortlist,
  below the low-grade candidates.

#### followrow — grade: LOW
- **Domains (2026-08-06):** followrow.com RDAP 404; followrow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact or near-identical entity surfaced. Known follow-named tools
  sit in unrelated niches and different compounds (FollowUp.cc email reminders; Follow
  Up Boss, real-estate CRM) — neither confusable. Doc-10 roster: none share the root.
- **Trademark:** No web-indexed FOLLOWROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all three axes. vs roster — none.
  Groove/-row: clears (no g-onset).
- **Grade reason:** LOW — clean domains, no in-industry entity, no live in-class mark
  found, no roster similarity. Root = the product's literal job (follow-ups on rails).

#### nudgerow — grade: LOW
- **Domains (2026-08-06):** nudgerow.com RDAP 404; nudgerow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. Root history in-industry is **dead**: Nudge.ai
  (Toronto sales relationship-intelligence, founded 2014) shut down and its IP/team were
  acquired by **Affinity** in March 2020 (crunchbase.com/acquisition/affinity-inc-acquires-nudge-2--e1579eb7;
  demandgenreport.com coverage) — no live product carries the mark in sales engagement.
  Live NUDGE-named companies sit elsewhere: Nudge (nudgenow.com, AI commerce
  discovery), Nudge Security (SaaS security). Doc-10 roster: none.
- **Trademark:** NUDGE-formative marks exist in other classes (e.g. NUDGE SN 85784321).
  No web-indexed NUDGEROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all axes. vs roster — none. vs defunct
  Nudge.ai — shared root, mark absorbed by Affinity (customer #1's own CRM vendor — an
  association, not a conflict; flag to counsel). Groove/-row: clears.
- **Grade reason:** LOW — clean domains, no live in-industry entity, no live in-class
  mark found, no roster similarity. Residual: NUDGE-formative noise across unrelated
  classes; Affinity's ownership of the dead Nudge.ai mark is a counsel-checklist item.

#### scriptrow — grade: LOW (risk) / weak on quality
- **Domains (2026-08-06):** scriptrow.com RDAP 404; scriptrow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. Script-named companies are unrelated: ScriptString.AI
  (data platform, crunchbase.com/organization/scriptstring), Script-Ware
  (script-ware.com), ScriptSwitch (pharma, Wikipedia). Doc-10 roster: none.
- **Trademark:** No web-indexed SCRIPTROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all axes. vs roster — none. Groove/-row:
  clears.
- **Grade reason:** LOW on risk. Quality caveat recorded for the memo: "scripted" is the
  category's insult for robotic outreach — adversarial root for a personalization-first
  product; "-ptr-" cluster slightly clotted.

#### greetrow — grade: MEDIUM
- **Domains (2026-08-06):** greetrow.com RDAP 404 (round-2 correction re-confirmed);
  greetrow.io rdap.org 404 + DNS Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact or near entity surfaced this pass. Nearest surfaced string:
  Newrow Suite (virtual-classroom software, capterra.com/p/172539/newrow-smart/ —
  unrelated field, `-row`-suffixed neighbor). Doc-10 roster: **Groove family check
  FAILS the easy pass** — see below.
- **Trademark:** No web-indexed GREETROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all axes. **vs Groove (Clari; live in this
  exact space): greetrow is the only candidate with a gr- onset** — GREETROW /ɡriːt.roʊ/
  vs GROOVE /ɡruːv/ share the gr- attack and r-liquid; vowels, syllable count, and
  endings differ. Probably clearable, but it is the one candidate that trips doc-10's
  explicit Arrow-/Grow-/Groove-family warning.
- **Grade reason:** MEDIUM — phonetic-family caution against a live in-space mark
  (Groove), per doc-10's explicit screen rule; plus weak semantic fit ("greeting" reads
  reception/welcome-desk, not sales outreach).

#### chaserow — grade: MEDIUM
- **Domains (2026-08-06):** chaserow.com RDAP 404; chaserow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. **Chaser** (chaserhq.com; capterra.com/p/157101/CHASER/)
  — active accounts-receivable automation, 10K+ users, whose product IS automated
  chasing/follow-up emails (mechanically near-identical function, adjacent B2B finance
  category; Xero's leading AR partner). Also Chaser — Slack task/follow-up app
  (trychaser.com). And **CHASE** — JPMorgan's famous mark (dilution-protective breadth;
  chaserow wholly contains "chase(r)"). Doc-10 roster: none.
- **Trademark:** No web-indexed CHASEROW filing found (method limits apply); CHASE/
  CHASER-formative space not exhaustively enumerable by this method.
- **Similarity:** vs Outreach — distinct on all axes. vs Chaser — contains the whole
  mark; meaning near-identical mechanics (automated chasing emails) in an adjacent
  category. Groove/-row: clears.
- **Grade reason:** MEDIUM — near-identical software brand adjacent (Chaser) contained
  wholly in the name, famous-mark adjacency (CHASE), and a negative connotation
  ("chasing" = desperate; debt-collection vibe) that fights trust-first positioning.

#### torchrow — grade: LOW (risk) / fails semantic fit
- **Domains (2026-08-06):** torchrow.com RDAP 404; torchrow.io rdap.org 404 + DNS
  Status=3 no NS. Both AVAILABLE.
- **Collisions:** No exact entity. Torch-named companies unrelated: Torch.AI (defense
  data-AI, torch.ai), Torch Software (UK garage software, torchsoftware.co.uk), Torch
  leadership coaching, PyTorch (ML framework). Doc-10 roster: none.
- **Trademark:** No web-indexed TORCHROW filing found (method limits apply).
- **Similarity:** vs Outreach — distinct on all axes. vs roster — none. Groove/-row:
  clears. **Internal hazard:** touchrow typo-twin (one letter).
- **Grade reason:** LOW on risk. Fails the family's vertical-native-root test (eave =
  roofing, parcel = CRE; "torch" names nothing in sales outreach — evocative only), so
  it exits on quality in the memo.

### Screen date + decay note

All evidence above is a 2026-08-06 snapshot. Domain availability decays hourly
(registration must re-verify same-day); web-indexed trademark results decay as new
applications publish. None of this section is legal clearance (protocol §5).
