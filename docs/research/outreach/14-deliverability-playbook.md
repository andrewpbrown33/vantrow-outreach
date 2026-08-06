# 14 — Deliverability Playbook (2024–2026 Bulk-Sender Regime)

**Tier:** P only. **Workstream:** H. **Sources:** `sources/deliverability.md` (S-DLV).
**Feeds:** Phase 5 deliverability-ops runbook; sequence-engine throttler requirements;
doc 02/email-deliverability cross-checks against this.

Primary rule: everything here cites the mailbox providers' own documents first
(Google/Yahoo/Microsoft); ESP/vendor guidance is used only where providers are silent
(warmup curves) and labeled as such. This doc is the *rules*; product behaviors that
implement them are engine requirements (noted inline as **ENGINE:**).

## 1. The three providers' bulk-sender rules

| Requirement | Google (Gmail) | Yahoo | Microsoft (outlook.com/hotmail/live) |
|---|---|---|---|
| In force | 2024-02-01 (TLS clause 2023-12) [S-DLV-001] | Feb 2024 [S-DLV-002] | 2025-05-05 [S-DLV-003][S-DLV-004] |
| Bulk threshold | ≥5,000 msgs/day to Gmail; **subdomains aggregate with the primary domain** toward it [S-DLV-001][S-DLV-013] | "bulk sender" (no numeric threshold published) [S-DLV-002] | >5,000 msgs/day to MS consumer domains [S-DLV-004] |
| All senders | SPF **or** DKIM; TLS; valid forward+reverse DNS [S-DLV-001] | SPF or DKIM minimum [S-DLV-002] | — (rules published for high-volume senders) |
| Bulk senders — auth | SPF **and** DKIM **and** DMARC (p=none acceptable); From domain aligned with SPF or DKIM [S-DLV-001] | SPF + DKIM (keys ≥1024-bit) + DMARC p=none that **passes**; relaxed alignment OK [S-DLV-002] | SPF pass + DKIM + DMARC ≥p=none aligned with SPF or DKIM [S-DLV-004] |
| One-click unsubscribe | Required for bulk: `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058) [S-DLV-001] | Required; Yahoo strongly steers to the RFC 8058 POST method; **honor within 2 days** [S-DLV-002] | Functional, visible unsubscribe required; RFC 8058 not explicitly mandated [S-DLV-004] |
| Complaint threshold | Spam rate <0.3%, target <0.10% [S-DLV-001] | <0.3% [S-DLV-002] | Keep complaints low; no numeric threshold in cited pages [S-DLV-004] |
| Non-compliance | 4.7.x temp / 5.7.x perm SMTP errors; spam-foldering or rejection; **>0.3% ⇒ ineligible for mitigation until 7 consecutive days <0.3%** [S-DLV-013] | (enforcement from Feb 2024) [S-DLV-002] | Junk-foldering since 2025-05-05, escalating to rejection with SMTP 550 5.7.515 (domain fails required authentication level) [S-DLV-004] |

**ENGINE:** SPF/DKIM/DMARC and RFC 8058 headers are not customer homework — the product
must verify DNS at domain onboarding, refuse to activate sending on unverified domains,
inject the one-click headers on every sequence email, and process RFC 8058 POSTs into
the suppression list within Yahoo's 2-day bound (we should target minutes; protocol §10
makes suppression unbypassable).

## 2. Per-provider sending ceilings (the throttler's constants)

| Channel | Limit | Source |
|---|---|---|
| Gmail / Workspace user | 2,000 msgs/rolling-24h (trial 500; mail-merge 1,500); 10,000 recipients/day, **3,000 external recipients/day**; ≤2,000 rcpt/msg (≤500 external); breach ⇒ up-to-24 h send lockout | [S-DLV-005] |
| Gmail API (per project/user) | 1.2M quota units/min/project; 6,000 units/min/user; `messages.send` = 100 units (≈60 sends/user/min ceiling); ≤500 recipients/message | [S-DLV-006] |
| Exchange Online mailbox | 10,000 recipients/rolling-24h; 30 msgs/min via SMTP submission (excess throttled); recipient-per-message cap admin-tunable 1–1,000 | [S-DLV-007] |
| Exchange Online tenant | TERRL: tenant-wide external-recipient/day cap scaled to license count (trial 5,000/day); default onmicrosoft.com domains capped at 100 external recipients/org/day (550 5.7.236) | [S-DLV-007] |

Microsoft's own limits page states outright that Exchange Online is not built for
bulk-mailing use cases [S-DLV-007] — the platform sends *through customers' mailboxes* to
look like human mail, so per-mailbox budgets must sit far **below** these hard caps.
**ENGINE:** per-mailbox daily budget + per-minute pacing with jitter; count recipients
not messages; treat provider caps as circuit-breakers, never as targets. INFERENCE:
practical cold-outreach volumes per mailbox live an order of magnitude under the caps
(vendor consensus 20–50/day/mailbox at steady state [S-DLV-010]).

## 3. Sending-domain architecture

- **Never the primary corporate domain.** Cold outreach runs on secondary/lookalike
  domains so the primary domain's reputation (and ordinary corporate mail) is insulated
  from complaint fallout. This is uniform deliverability-vendor practice [S-DLV-010];
  Google's rules sharpen it: subdomain volume aggregates with the primary domain toward
  bulk-sender status [S-DLV-013], so true separation requires a *separate registered
  domain*, not a subdomain. INFERENCE from [S-DLV-013]; cold-vendor practice concurs.
- Each secondary domain gets its own SPF/DKIM/DMARC, forwards to the primary site, and
  hosts a small pool of mailboxes; domains are cycled out if reputation is burned.
  (Vendor practice [S-DLV-010]; ASSUMPTION on pool sizes — tune in Phase 5 ops.)
- DMARC starts at p=none (all three providers accept it) with rua reporting; tightening
  to quarantine/reject is a customer-maturity decision, not a launch requirement
  [S-DLV-001][S-DLV-002][S-DLV-004].

## 4. Warmup curves (vendor guidance — providers publish no numbers)

Google's only primary statement: increase sending volumes gradually [S-DLV-013].
Deliverability-vendor consensus fills in the curve [S-DLV-010]:

- **Duration:** 2–6 weeks before full cold volume; 30 days typical; 2 weeks is the
  aggressive floor, 3–4 weeks safer.
- **Start:** 10–20 msgs/day/mailbox, to engaged recipients (colleagues, warm contacts,
  or warmup-network peers) so early sends earn opens/replies.
- **Ramp:** ≤~20% volume increase per day; a new domain that sends hundreds on day one
  is pattern-matched to spam operations.
- **Shape:** week 1 heartbeat (10–20/day) → weeks 2–3 climb (30–50/day) → full
  campaign volume end of week 3 / week 4.

**ENGINE:** warmup state lives on the Mailbox record; the throttler reads it (curve
position ⇒ daily budget); new mailboxes/domains are unsendable-by-sequence until the
curve admits them; auto-pause + restart-lower on early complaint/bounce signals.

## 5. Monitoring (the ops loop)

| Tool | What it gives | Notes |
|---|---|---|
| Google Postmaster Tools | Spam rate, IP/domain reputation, auth, encryption, delivery-error dashboards; the 0.3%/0.1% number is *measured here* | Register + DNS-verify every sending domain at onboarding; consumer @gmail.com data only; low volume ⇒ no data [S-DLV-008] |
| Microsoft SNDS + JMRP | IP-centric volume/complaint/trap-hit/filter data for MS consumer mailboxes; JMRP = per-complaint feedback loop | IP-level, so most useful for any shared sending infra we operate [S-DLV-009] |
| Seed tests | Send to controlled seed inboxes across providers, observe placement (inbox/spam/missing) | Standard vendor practice [S-DLV-010]; ASSUMPTION: we build or buy a seed network in Phase 5 |
| In-product signals | Bounce classification (hard/soft), complaint webhooks where available, reply rates per mailbox/domain | ENGINE: health score per mailbox+domain; auto-pause below thresholds |

Alert lines for the runbook: complaint rate ≥0.1% = investigate; ≥0.3% = auto-pause the
domain's cold traffic (mitigation-ineligibility cliff at Google, 7-day recovery clock)
[S-DLV-013]; hard-bounce spike = list-quality incident.

## 6. Threading & reply-detection hygiene

Gmail threads only when `References`/`In-Reply-To` are set per RFC 2822 **and** the
Subject matches; since 2019 the References chain must cite prior Message-IDs — subject
similarity alone no longer threads [S-DLV-011][S-DLV-012].

**ENGINE:** persist our sent `Message-ID` per step; every follow-up sets `In-Reply-To`
+ full `References` chain + unmodified subject (`Re:` prefix only). A
new-thread-per-step bug both tanks reply rates (each step looks like a fresh cold touch)
and breaks reply attribution, since reply detection keys on the same headers. Inbound
replies match on `In-Reply-To`/`References` against stored Message-IDs → pause the
sequence (the pause machine's primary trigger). INFERENCE: header matching is the
reliable signal; subject-line matching is the fallback for clients that strip headers.

## 7. Content & list hygiene (provider-stated, briefly)

Valid, reply-capable From/Reply-To; transparent subjects; remove invalid addresses and
manage bounces (Microsoft's stated expectations [S-DLV-004]); Gmail: don't mix message
types across the same sending domain streams, keep spam rate under the line
[S-DLV-001][S-DLV-013]. ENGINE: pre-send lint (broken variables, missing unsubscribe,
naked link/image ratios — vendor folklore flagged as such [S-DLV-010]) plus
verification-status gating on imported lists. ASSUMPTION: exact content-lint rules are
ours to define in Phase 5; providers don't publish spam-filter feature lists.

## 8. Runbook seeds (Phase 5 checklist skeleton)

1. Domain onboarding: register secondary domain → SPF+DKIM+DMARC(p=none, rua) → verify
   in-product → register in Postmaster Tools → create mailboxes → enter warmup state.
2. Warmup: curve per §4; engagement-first sends; auto-advance/auto-regress.
3. Steady state: budgets per §2; jittered pacing; RFC 8058 endpoint hot; suppression
   sync across tenant.
4. Weekly: Postmaster/SNDS review per domain; complaint + bounce trend; seed placement.
5. Incident: >0.3% complaint or auth failure → auto-pause domain → root-cause →
   7-day clean recovery before resume [S-DLV-013].

## Unknowns

1. Microsoft's numeric complaint threshold and Yahoo's numeric bulk-volume threshold —
   not published on cited pages [S-DLV-002][S-DLV-004].
2. Whether Microsoft has since escalated May-2025 junk-routing to universal rejection
   (escalation date still unannounced at time of vendor analysis) [S-DLV-004].
3. Gmail API 2026 quota-regime changes (post-Apr-2026 projects; paid usage beyond the
   free threshold planned for later in 2026) — recheck at build time [S-DLV-006].
4. Google Workspace *received-by-Workspace* enforcement nuances (cited rules target
   consumer Gmail; Workspace-destination behavior partially mirrors it) — verify before
   promising B2B-inbox outcomes; our audience is mostly corporate inboxes.
5. Seed-test vendor choice / build-vs-buy — Phase 5 decision.
6. Per-mailbox "safe" cold volume is folklore territory (20–50/day) — validate with our
   own telemetry once dogfooding.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
