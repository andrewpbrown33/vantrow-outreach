-- 0001_waitlist.sql
--
-- Waitlist signups table for the marketing site's /api/waitlist endpoint.
-- Ported from subsidiary #1's proven migration; its later UTM-attribution
-- columns are folded in here from day one.
--
-- How to apply (runbook 04):
--   1. Open the Supabase project dashboard -> SQL Editor.
--   2. Paste this entire file and click "Run".
--   (Or, with the Supabase CLI linked to the project: `supabase db push`.)
--
-- Access model: row level security is ENABLED and NO policies are created,
-- on purpose. The site's API route writes with the service-role key, which
-- bypasses RLS. The anon and authenticated roles therefore have no read or
-- write access to this table by design — there is no client-side path to it.

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  team_size text,
  current_software text,
  wants_demo boolean not null default false,
  source text not null default 'site',
  -- Truncated SHA-256 hash of the client IP (abuse correlation only) — the
  -- raw address is never stored.
  ip_hash text,
  -- Landing UTMs so a signup can be attributed to its campaign later.
  utm_source text,
  utm_medium text,
  utm_campaign text
);

alter table public.waitlist_signups enable row level security;

-- No RLS policies: service-role key bypasses RLS; anon/authenticated have
-- no access by design.

create index waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at);

create index waitlist_signups_utm_source_idx
  on public.waitlist_signups (utm_source)
  where utm_source is not null;
