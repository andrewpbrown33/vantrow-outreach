# Runbook 04 — Supabase: the Waitlist Backend

**Who:** Andrew. **Prereqs:** none (independent of 02/03; the form 503s politely until
this is done). **Time:** ~10 min. You do NOT have to touch any code.

1. supabase.com → **New project** → name `nudgerow-prod`, pick the region closest to
   you, generate a database password and store it in your password manager (you rarely
   need it again).
2. Left sidebar → **SQL Editor** → New query → paste the ENTIRE contents of
   `supabase/migrations/0001_waitlist.sql` from the repo → **Run**. Expect "Success".
   (The table deliberately has RLS enabled with NO policies — only the service-role
   key can write. That is the intended posture, not a mistake.)
   - Seeing `42P07: relation "waitlist_signups" already exists`? The script already
     ran once — that error is harmless (current versions of the file are re-run-safe).
     Verify with:
     ```sql
     select
       (select count(*) from pg_indexes where tablename = 'waitlist_signups')  as index_count,
       (select relrowsecurity from pg_class where relname = 'waitlist_signups') as rls_enabled,
       (select count(*) from pg_policies where tablename = 'waitlist_signups')  as policy_count;
     ```
     Expected: `3 · true · 0`. If it matches, continue to step 3.
3. **Project Settings → API**: copy **Project URL** and the **service_role** key
   (secret — never the anon key for this) into the Vercel project's environment
   variables (runbook 03 step 3), then **Redeploy** the site from Vercel.
4. Viewing signups later: **Table Editor → waitlist_signups**. Export: the CSV button.

## You're done when

- You submit the early-access form on the production site and the row appears in
  **Table Editor → waitlist_signups** — then delete that test row.
