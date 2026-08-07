# Customer #1 Requirements — Tier R (First-Party, Unconstrained)

**Recorded 2026-08-06** from Andrew's replies to the Phase 1 founder-verification
questions. These arrived as **requirements for our product** (Tier R — PEAK/Vantrow's
own process and needs; no clean-room constraint), not as descriptions of the
incumbent's behavior, so they live here rather than in the Tier-F log. They are
binding *input* to the Gate 3 MVP-cutline decision and the Phase 3 architecture memos —
each gets a dogfood-vs-market check there (customer #1 informs, never silently defines;
program-plan rule).

| # | Area | Requirement (Andrew, paraphrased faithfully) | Where it lands |
|---|---|---|---|
| R1 | Sending limits & cost model | Sending-limit design should follow the cost structure (fixed vs variable costs of sending). *Answered in chat: marginal send cost ≈ $0 — sends go through the customer's own connected mailbox (Gmail/Microsoft APIs, free at their provider); our real costs are fixed-ish infra (Supabase/Vercel), tracking storage, and per-use LLM calls. Limits are therefore **deliverability-driven** (provider caps: Workspace ~2k/day, Exchange 10k rcpt/day + 30 msg/min; warmup ramps; complaint thresholds), not cost-driven.* | Gate 3 cutline; doc 14 → engine throttle design |
| R2 | Sequence intervals | Step waits are set in **days and hours** (not minutes/seconds). | Sequence-builder spec (Phase 3/4) |
| R3 | Schedules | Sequences need **time windows**, **holiday skips**, and stop/halt behavior driven by events — **stop on reply** etc. | Engine spec: schedules + pause conditions |
| R4 | Task queue + cracks view | The daily task list must **visibly re-rank prospects on engagement** (opens/replies jump the queue) AND **surface prospects that have slipped through the cracks — finished sequences with no reply, stalled enrollments** *(corrected by Andrew 2026-08-06; the earlier "iPhone" reading was a speech-to-text artifact and is withdrawn)*. | Gate 3 cutline: task queue + a first-class "cracks" surface |
| R5 | Play-through flow | Confirmed 2026-08-06: evaluate at the Phase 4 prototype (the one-task-at-a-time guided execution mode) rather than in prose. | Phase 4 dogfood review |
| R6 | Out-of-office | A prospect's OOO auto-reply shows the enrollment as **paused with a return date**. | Engine spec: OOO classification + timed resume |
| R7 | Reporting | Reports actually wanted: **bounced emails · finished sequences · replies**. Three reports, not sixteen. | Gate 3 cutline: reporting scope |
| R8 | Data export | Export must offer **sequence states, sequence-level metrics, prospect lists + their states** — and must **NOT offer email bodies**. | Platform spec: export surface; privacy stance |
| R9 | Channels | **No phone calls, no SMS/messaging — at all** for customer #1. Instead: let users **log interactions that happened outside the platform** (a manual note/interaction type). | MAJOR scope: dialer/A2P clocks deprioritized (long-lead register); "external interaction" logging added to the data model; Gate 11 remains only as a future *market* question |
| R10 | Standalone, brand-level sending | The product is standalone like the incumbent: Andrew connects ANY mailbox he wants — concretely his brand Gmail accounts (andrew@getvantrow.com, andrew@eaverow.com, andrew@parcelrow.com), not PEAK's tenant. An org connects N mailboxes / sender identities from day one; nothing assumes a single corporate tenant. *(Recorded at Gate 4, 2026-08-07.)* | Data model: Mailbox entity N-per-org; Gate 4 record |
| R11 | Design bar & first experience | The product must be **more robust and more thoughtful on design, branding, UI, and the overall first experience** than the current draft — Andrew judged the Phase 2/3 output "too simple and similar to Eaverow" and set **Parcelrow's work as the reference bar** (review its repo drafting process; reference its design work more). *(Recorded 2026-08-07.)* | Site redesign + app-shell design pass (Phase 4 plan); logo/brandmark work opened same day |

## Standing implications adopted now

- The MVP channel set is **email + manual tasks + external-interaction logging**.
- Telephony verification clocks (A2P 10DLC, STIR/SHAKEN) move to "not started /
  deprioritized — customer #1 requires none" in the long-lead register.
- R4's "cracks" surface (finished-no-reply + stalled prospects) is a first-class queue
  view, not a report afterthought — it pairs with R7's finished-sequence report and is
  a differentiator candidate (doc 12: simplicity pillar).
- R1's answer becomes pricing-relevant at Gate 9: send volume is not a marginal-cost
  driver, so per-send pricing would be margin theater; limits exist to protect
  deliverability and tenant reputation.
- R11 sets the design bar for every user-facing surface from Phase 4 on:
  Parcelrow-level thoughtfulness on branding, UI, and first-run experience.
  "Ship the narrow scope" (Gate 3) never means "ship it plain."
