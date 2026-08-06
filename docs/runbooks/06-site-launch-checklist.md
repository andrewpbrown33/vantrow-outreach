# Runbook 06 — Site-Launch Checklist (Gate 3 acceptance, site half)

**Who:** Andrew (with the agent verifying the mechanical rows). Ordered — stop at the
first failing item.

## Pre-flight (mechanical; agent evidence attached to the Gate 3 record)

- [ ] Phase 2 PR merged; CI green on `main`.
- [ ] Sentinel grep clean: no unbranded placeholders in `apps` or `packages`.
- [ ] Claims test green (`legal-lint`: zero `block` findings on site copy; disclaimer
      + as-of dates present on `/vs-outreach`; ≥2 concession rows).
- [ ] Decision log carries the Gate 3 record (scope decision + this checklist's date).

## Infrastructure (runbooks 02–04 done)

- [ ] `nudgerow.com` attached to the Vercel project; site renders on it (03).
- [ ] `andrew@nudgerow.com` sends + receives (02).
- [ ] Supabase project live; migration applied; keys in Vercel (04).

## Legal / content — blocking

- [ ] `/privacy` and `/terms` de-drafted by counsel (05 §4).
- [ ] `/vs-outreach` claims table reviewed by counsel (05 §3).
- [ ] No competitor screenshots/logos anywhere; nominative plain text only.

## End-to-end verification (the launch test)

- [ ] Every nav page returns 200 on `https://nudgerow.com`, on your phone too.
- [ ] Submit a real test entry on `/early-access` → row appears in Supabase
      `waitlist_signups` → delete the row.
- [ ] Lighthouse (Chrome DevTools → Lighthouse, Mobile): performance and
      accessibility ≥ 90.
- [ ] The OG image renders when the URL is pasted into a Slack/iMessage preview.

## Announce & after

- [ ] LinkedIn/network announcement (your own account — agent drafts on request,
      draft → your approval, per protocol §10).
- [ ] Calendar reminder: **re-verify every dated `/vs-outreach` claim every 90 days**
      (comparative-advertising checklist "Current" rule).

## You're done when

The production form test row has been seen and deleted, and every blocking legal item
above is checked.
