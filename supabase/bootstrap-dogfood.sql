-- bootstrap-dogfood.sql — one-time dogfood seed (runbook 07 §6 prep).
--
-- Run in the Supabase SQL editor AFTER migrations 0002 and 0003 have been
-- applied (paste each migration file first if they haven't been).
-- Idempotent: safe to run repeatedly.
--
-- Creates the dogfood workspace and Andrew's three sending mailboxes so the
-- connect script's credential upsert has rows to attach to. Workspace
-- membership (RLS access for the app UI) is wired when workstream C's
-- sign-in lands; engine and SQL-editor operations use the service role and
-- don't need it.

insert into public.workspaces (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Vantrow (dogfood)')
on conflict (id) do nothing;

insert into public.mailboxes (workspace_id, email, display_name)
select '00000000-0000-4000-8000-000000000001', m.email, m.display_name
from (values
  ('andrew@getvantrow.com', 'Andrew Brown - Vantrow'),
  ('andrew@eaverow.com',    'Andrew Brown - Eaverow'),
  ('andrew@parcelrow.com',  'Andrew Brown - Parcelrow')
) as m(email, display_name)
on conflict (workspace_id, lower(email)) do nothing;
