# Long-Lead Register

Verification, compliance, and reputation clocks that run in **calendar time**, not
engineering time. Rule (from Eaverow's gated-BD lesson): **engineering waits; the clock
does not** — each item starts the moment its trigger phase is *plannable*, not when the
code needs it. Reviewed at every gate alongside `hard-problems.md`.

| Item | What it gates | Typical lead time | Trigger | Owner | Status |
|---|---|---|---|---|---|
| Repo → Private | All research content; Gate 1 | Minutes | Now (runbook 01) | Andrew | **OPEN — blocks Gate 1** |
| Secondary sending domains + branded email | All real outbound (dogfood and beyond); DNS auth (SPF/DKIM/DMARC) | Same-day purchase; DNS hours | Gate 2 (buy alongside the brand `.com`) | Andrew | Pending Gate 2 |
| Mailbox warmup | Trustworthy sends from new domains/mailboxes | **2–6 weeks per mailbox** | Immediately after domains exist | Andrew (infra) + platform (throttle honors warmup state) | Pending |
| Microsoft publisher verification (Entra app) | Public/commercial M365 mailbox OAuth (dogfood can run on tenant-admin consent without it) | Days–weeks | Phase 3 (Gate 4 memo drafts the app registration) | Andrew | Pending |
| Google OAuth verification + restricted-scope security assessment (Gmail scopes) | *Commercial* Gmail connection (test-mode covers dogfood ≤100 users) | **Weeks–months; paid third-party assessment** | Phase 3 if Gmail is in scope at Gate 4 | Andrew | Pending |
| A2P 10DLC brand + campaign registration | Any SMS step type; also relevant to dialer caller-ID reputation (STIR/SHAKEN) | Weeks | Only if/when SMS enters scope (Gate 11 family) | Andrew | Not started (post-MVP) |
| Salesforce AppExchange security review | Listed Salesforce integration | **Months** | Only if Gate 8 picks Salesforce | Andrew | Not started |
| Trademark clearance (counsel) | Safe use of the Gate 2 name; comparative-ad sign-off | Weeks | Gate 2 same-day open | Andrew | Pending Gate 2 |
| Outreach ToS competitive-use review (counsel) | Confidence in the Gate 1 posture | Days | With the Phase 2 legal-counsel runbook | Andrew | Flagged (Gate 1 memo) |
| Product ToS + privacy policy (counsel) | Commercial launch (Gate 10); dogfood acceptable on drafts | Weeks | Phase 5 | Andrew | Not started |
| SOC 2 posture (Type I → II) | Enterprise deals; not a dogfood/SMB blocker | **Months (Type II needs an observation window)** | Decide posture at Gate 9/10; start evidence collection when platform exists | Andrew | Not started |
| Stripe live-mode + webhook config | Charging anyone (build-now-charge-at-GA keeps this off the critical path) | Days | Phase 5 | Andrew | Not started |

## Standing rules

- Every Gate 4/8/11+ option memo must quote this register's current state for the
  options it evaluates — a provider choice is also a calendar choice.
- Items marked **Owner: Andrew** get a runbook with a "You're done when" check before
  they're asked of him (cloud-first, per the runbook policy).
- When an item completes, log it in the decision log (dated) and update Status here in
  the same commit.
