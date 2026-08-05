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

## What the Phase 1 naming sprint must add per surviving candidate

Rationale · sample tagline · fresh dated `.com`/`.io` evidence · collision findings
(companies, products, apps, adjacent categories — checked against research doc 10's
competitor landscape) · trademark screen with method + limitations · similarity to
"Outreach" and to every doc-10 mark on three axes (sound / appearance / meaning) · risk
grade (**low / medium / elevated**) with its reason · how naturally it pairs with
"a Vantrow company."
