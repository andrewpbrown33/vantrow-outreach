# Runbook 03 — Vercel: the Marketing-Site Project

**Who:** Andrew. **Prereqs:** repo access on GitHub; runbook 02 A done. **Time:** ~10 min.

1. vercel.com → **Add New → Project** → Import `andrewpbrown33/vantrow-outreach`
   (grant the Vercel GitHub app access to the repo if asked).
2. **Root Directory: `apps/site`** ← the one setting people miss in a monorepo. Click
   "Edit" next to Root Directory and pick `apps/site`. Framework preset: Next.js
   (auto-detected). Build command/output: leave defaults.
3. **Environment variables** — add now or later; the form degrades gracefully (503 +
   mailto fallback) until Supabase exists:

   | Name | Value | From |
   |---|---|---|
   | `SUPABASE_URL` | `https://<project>.supabase.co` | runbook 04 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service-role key (secret) | runbook 04 |

4. Deploy. First build should be green (CI mirrors the same commands).
5. **Domain:** Project → Settings → Domains → add `nudgerow.com` (and `www` redirect).
   Because the domain lives in this Vercel account, it attaches with zero DNS work.

## You're done when

- `https://nudgerow.com` renders the Nudgerow homepage (padlock icon, no cert
  warnings), and every nav page loads.
