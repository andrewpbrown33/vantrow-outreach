-- 0008_unsubscribe_and_rpc_lockdown.sql
--
-- Two closures before round-1 live sending.
--
-- A · RPC lockdown. claim_due_enrollments() and increment_cogs() are
-- SECURITY DEFINER, and Postgres grants EXECUTE to PUBLIC by default —
-- PostgREST therefore exposes both at /rest/v1/rpc/* to anyone holding the
-- (public-by-design) anon key. The first returns and UPDATEs enrollments
-- across every workspace; the second writes any workspace's COGS counters.
-- Only the engine's service-role connection has any business calling either.
-- is_workspace_member() is deliberately untouched: RLS policies evaluate it
-- as the querying role, so authenticated must keep EXECUTE on it.
--
-- B · The inbound classification vocabulary learns 'unsubscribe', so the
-- List-Unsubscribe mailto path and standalone unsubscribe emails are recorded
-- as what they are instead of inflating reply counts.
--
-- Idempotent + re-runnable, like every migration in this repo (applied by
-- hand in the SQL editor; see runbook 08 §5).

revoke execute on function public.claim_due_enrollments(integer, interval) from public;
revoke execute on function public.increment_cogs(uuid, text, bigint) from public;

-- Supabase also grants its API roles EXECUTE via default privileges; local
-- test databases may not have those roles at all. Same guarded-block pattern
-- as the auth.uid() shim in 0002.
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format(
        'revoke execute on function public.claim_due_enrollments(integer, interval) from %I', r);
      execute format(
        'revoke execute on function public.increment_cogs(uuid, text, bigint) from %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.claim_due_enrollments(integer, interval) to service_role;
    grant execute on function public.increment_cogs(uuid, text, bigint) to service_role;
  end if;
end $$;

alter table public.inbound_messages
  drop constraint if exists inbound_messages_classification_check;
alter table public.inbound_messages
  add constraint inbound_messages_classification_check
  check (classification in
    ('reply', 'ooo', 'bounce_hard', 'bounce_soft', 'unsubscribe', 'other'));
