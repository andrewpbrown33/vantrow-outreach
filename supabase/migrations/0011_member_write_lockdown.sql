-- 0011_member_write_lockdown.sql
--
-- Members can no longer alter the compliance tables from a client.
--
-- 0002 gave every workspace member FOR ALL on the CRUD tables, which was the
-- right default for prospects and templates and the wrong one for four tables
-- whose rows are the engine's promises rather than the user's data:
--
--   suppression_entries  the list I3 checks last, inside the send transaction;
--                        a member holding the public anon key and their own
--                        JWT could DELETE an unsubscribe from PostgREST.
--   sequence_steps       mode = 'draft_first' is the human gate of protocol
--                        §10; a member could flip a step to 'auto'.
--   enrollments          draft_approved_step, next_touch_at, state — the
--                        schedule itself, and the record of who approved what.
--   mailboxes            daily_cap and warmup fields, the deliverability brake.
--
-- The app never needed those grants: it writes through the engine's
-- service-role connection, which bypasses RLS, and every one of those writes
-- is behind the owner gate in the app. Supabase's REST surface is the only
-- thing these policies govern, and there a member should be able to READ the
-- compliance tables and WRITE one thing only — a suppression row. Suppressing
-- an address is always safe; un-suppressing one never is.
--
-- Members keep FOR ALL on prospects, email_templates and sequences (the
-- drafts they write). The engine writes as the service role as before.
--
-- Idempotent + re-runnable: drop-then-create, the 0002 pattern.

drop policy if exists enrollments_member_write on public.enrollments;
drop policy if exists sequence_steps_member_write on public.sequence_steps;
drop policy if exists mailboxes_member_write on public.mailboxes;

drop policy if exists suppression_entries_member_write on public.suppression_entries;
drop policy if exists suppression_entries_member_insert on public.suppression_entries;
create policy suppression_entries_member_insert on public.suppression_entries
  for insert with check (public.is_workspace_member(workspace_id));

comment on policy suppression_entries_member_insert on public.suppression_entries is
  'Members may add a suppression, never remove or change one (I3). '
  'The engine and the app write as the service role.';
