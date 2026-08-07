# Runbook 02 — Domain & Branded Email

**Who:** Andrew. **Prereqs:** Vercel account (domain already purchased there),
2026-08-06. **Time:** ~30 min active + DNS propagation.

Mental model: the domain (nudgerow.com, ✅ purchased via Vercel) is one thing; its DNS
(managed in Vercel, auto-wired for the site) is a second; email on the domain is a
third. This runbook finishes the second and third.

## A. Confirm the domain (2 min)

1. Vercel dashboard → your team → **Domains**. `nudgerow.com` should be listed.
2. Nothing else to do — when the site project exists (runbook 03), assign the domain
   to it there; Vercel wires the DNS records itself.

## B. Branded email — Google Workspace (recommended, family precedent)

> **Known trap (hit 2026-08-07):** Google rate-limits how many new accounts one phone
> number can verify in a rolling window. If you recently verified another Workspace
> (Eaverow's was 3 days before Nudgerow's), sign-in demands a phone and rejects yours
> as "used too many times," and "Try another way" loops — a new account has no other
> methods yet. Fixes, in order: try from your phone's browser on cellular (different
> device+IP often passes with the same number) → wait ~24h for the cooldown → any
> other real non-VoIP number (removable afterward under Security → Phone). The
> half-created account is not lost; the wizard resumes. For subsidiary #4: space
> Workspace signups days apart, or expect this.

1. workspace.google.com → Get started → business name **Nudgerow** → domain
   `nudgerow.com` → create the user **andrew@nudgerow.com** (this is the address
   `packages/brand` already publishes as support).
2. Workspace setup asks you to verify the domain and add **MX records**: do both in
   Vercel → Domains → nudgerow.com → **DNS Records** (Workspace shows the exact
   values; add them one by one).
3. **SPF rule that prevents a future outage:** Workspace's SPF (`v=spf1
   include:_spf.google.com ~all`) must be the ONLY SPF record on the root domain.
   When Resend (product transactional email) arrives later, it goes on a
   **subdomain** (e.g. `send.nudgerow.com`) — never a second root SPF.
4. Optional alias: add `hello@nudgerow.com` as an alias of andrew@.

## C. Secondary sending domains (starts the longest clock we have)

Cold/dogfood outbound must never run on nudgerow.com itself (deliverability blast
radius — clean-room doc 14). Buy **2–3** of, in Vercel Domains (or your registrar):

- `getnudgerow.com` · `trynudgerow.com` · `nudgerowhq.com`

Just buy and park them today — mailboxes + SPF/DKIM/DMARC + warmup are configured in
Phase 3/4 (runbook 07); the point now is owning them so the **2–6 week warmup clock**
can start the moment the engine needs them.

## D. Optional defensive registration

`nudgerow.io` was available at the Gate 2 screen — cheap insurance, your call.

## You're done when

- `nudgerow.com` appears under Vercel → Domains, and
- an email sent from your phone to **andrew@nudgerow.com** arrives, and a reply from
  it lands back in your inbox, and
- 2–3 secondary domains appear in your domain list.
