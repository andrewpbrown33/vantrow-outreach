# Gate 4 — Mailbox Provider & Connection Path

> **DECIDED 2026-08-07 — Gmail/Google Workspace first (the conditional resolved to the B mirror):** Andrew's sending mailboxes are all Google (his brand accounts, not PEAK's tenant), and the standalone any-mailbox principle is now product requirement R10. Dogfood = OAuth test mode; the CASA clock starts now; Microsoft = Gate 12. Record: decision log.

**Type:** Decision gate.
**Question:** which mailbox provider does the MVP connect first, and by what path?
**Why it's first among the architecture gates:** there is no product without a sending
mailbox (Gate 3 named exception); the choice sets the OAuth app registrations,
verification clocks (long-lead register), and the sync mechanics the engine's
reply/bounce/OOO loop (build item 7) is written against.
**Founder input required:** which mailbox PEAK sends real outreach from day-to-day —
**Microsoft 365 or Gmail/Workspace?** The recommendation below is conditional on that
answer.

Standing rule regardless of option: the send/sync path is built behind a
**provider-abstraction seam** (the family's adapter pattern) — MailboxProvider
interface with one concrete implementation at MVP, the second arriving at Gate 12
without touching the engine.

## Options

| # | Option | One-line | Verification clock (long-lead register) | Verdict |
|---|---|---|---|---|
| A | Microsoft Graph direct, first | Send + sync via Graph; dogfood on tenant-admin consent | Publisher verification: days–weeks, needed for *other* tenants, not for PEAK's own | **Recommended if PEAK is M365-primary** |
| B | Gmail API direct, first | Send + sync via Gmail API; dogfood in test mode | Restricted-scope verification + annual CASA assessment: **weeks–months, paid**, needed for commercial | Recommended only if PEAK is Gmail-primary |
| C | Unified vendor (Nylas/Unipile) | Both providers day one through one API | Vendor's own compliance + per-connected-account fees | The "unless necessary" test fails at MVP |
| D | SMTP/IMAP + app passwords | Direct protocol access | None — because Google has effectively closed it | Present to reject |

### A — Microsoft Graph direct, first ★ (conditional)

Send via `sendMail`, sync via change notifications + delta query (gap recovery),
Message-ID/threading preserved for the reply loop. **The decisive property: PEAK's own
tenant can grant admin consent to our app registration immediately** — dogfood ships
with a near-zero verification calendar while Microsoft publisher verification (the
clock that matters for *other* customers' tenants) runs in parallel. Exchange sending
limits (10k recipients/day, 30 msgs/min — doc 14) are far above dogfood volume.
Calendar access for the v1.1 scheduling tail rides the same app registration.
- **Biggest weakness:** the commercial wedge segment (SMB sales teams) skews
  Google-side — Gmail becomes the *second* provider (Gate 12), and its CASA clock must
  be started well before commercial launch to Google-based customers (register row
  stays open either way).

### B — Gmail API direct, first (conditional mirror)

Correct choice **iff PEAK sends from Gmail/Workspace**: dogfood runs in OAuth test
mode (≤100 test users — plenty), while the restricted-scope verification + CASA
assessment (weeks–months, paid, annual) runs for commercial. Workspace caps
(~2k/day/mailbox) are fine.
- **Biggest weakness:** the commercial gate is the *long* one — if anything slips,
  Google-based prospects can't connect at launch; and test-mode tokens expire faster,
  adding re-auth friction to dogfood.

### C — Unified mailbox vendor (Nylas/Unipile)

Weeks of provider work compressed; both ecosystems day one. But: a **new platform**
(violates the default), per-connected-account pricing on our thinnest-margin surface,
and a third party inserted into the most sensitive data path (customer mail) before we
have a DPA story. Re-openable at Gate 12 if second-provider demand outruns
engineering.
- **Biggest weakness:** it trades our hardest-won trust surface for schedule, exactly
  where the program plan says depth beats breadth.

### D — SMTP/IMAP + app passwords

Google has disabled basic auth/app passwords for most Workspace configurations;
deliverability posture is poor; no webhooks (polling only).
- **Biggest weakness:** it is a dead end wearing a shortcut's clothes. Reject; keep
  IMAP knowledge only as a far-future legacy-provider tier.

## Ranked

1. **A or B — resolved by the founder's answer** (they are the same architecture
   behind the seam; the order of providers is the only real decision).
2. C — only if Gate 12 finds the second provider urgent and understaffed.
3. D — rejected.

### #1 pick: **A — Microsoft Graph first**, flipping to B if PEAK is Gmail-primary

Dogfood truth decides: the provider PEAK actually sends from is the one whose quirks
the engine must metabolize first, and both paths give dogfood a no-wait connection
(tenant consent / test mode) while the commercial clock runs. A is written as the pick
because the M&A-advisory profile (M365 + Affinity) suggests Microsoft-primary — **if
Andrew answers "Gmail," B becomes the pick with no other change to this memo's
architecture.**

> ## Next steps — do these in order
> 1. **Andrew:** answer the one question — M365 or Gmail for day-to-day outreach?
> 2. **Agent:** record Gate 4 (provider order) in the decision log.
> 3. **Andrew (runbook 07, written at Phase 4 open):** create the app registration
>    (Entra) or Google Cloud project; grant tenant consent / add test users.
> 4. **Agent:** start the *other* provider's verification clock row in the long-lead
>    register with a target date, so Gate 12 is a build task, not a wait.
