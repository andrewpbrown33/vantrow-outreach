-- 0010_workspace_invites.sql
--
-- How a second person gets into a workspace — and, more to the point, how
-- everyone else stays out.
--
-- Today `resolveWorkspace` opens a workspace to a signed-in stranger two ways:
-- (a) their address appears as a mailbox in that workspace, or (b) they are
-- allow-listed and exactly one workspace exists. Both mint an OWNER row. Both
-- exist for one honest reason, stated in that file's own header: a workspace
-- with no members yet cannot be joined by anyone, which would be a locked door
-- on day one.
--
-- The bug is that neither key ever stops working. Key (a) searches mailboxes
-- across EVERY workspace, so with more than one tenant, adding a sending
-- mailbox quietly becomes the same act as handing that address ownership of
-- the account — two very different things that no operator would expect to be
-- the same. With a single workspace it is invisible. It stops being invisible
-- on the day it matters.
--
-- So the bootstrap keys get scoped to the bootstrap: they open a workspace
-- that has NO members at all, and nothing else. Once a workspace has an owner,
-- the only way in is an invitation somebody deliberately wrote — which is what
-- this table is.
--
-- Additive, idempotent, re-runnable.

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  -- Stored as typed; matched case-insensitively. People capitalise their own
  -- addresses in ways their mail server does not care about.
  email text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  invited_by uuid,
  created_at timestamptz not null default now(),
  -- An invitation is a standing offer, not a permanent one.
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_user_id uuid
);

-- One live invitation per address per workspace; accepting frees the slot, so
-- re-inviting someone who left is not blocked by their old row.
create unique index if not exists workspace_invites_live_key
  on public.workspace_invites (workspace_id, lower(email))
  where accepted_at is null;

-- The sign-in path asks "may this address request a link?" on every attempt.
create index if not exists workspace_invites_email_idx
  on public.workspace_invites (lower(email))
  where accepted_at is null;

alter table public.workspace_invites enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'workspace_invites'
      and policyname = 'workspace_invites_member_read'
  ) then
    create policy workspace_invites_member_read on public.workspace_invites
      for select using (public.is_workspace_member(workspace_id));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'workspace_invites'
      and policyname = 'workspace_invites_member_write'
  ) then
    create policy workspace_invites_member_write on public.workspace_invites
      for all using (public.is_workspace_member(workspace_id))
      with check (public.is_workspace_member(workspace_id));
  end if;
end $$;

comment on table public.workspace_invites is
  'The only way into a workspace that already has members. The bootstrap keys '
  'in resolveWorkspace apply solely to a workspace with no members at all.';
