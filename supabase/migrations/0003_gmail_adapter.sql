-- 0003_gmail_adapter.sql
--
-- Workstream B3 (Gate 4: Gmail API first, provider seam mandatory).
-- Two tables: per-mailbox OAuth material (SECRETS — service-role only), and
-- the normalized inbound-message ledger the reply/bounce/OOO loop feeds from.
--
-- How to apply (runbook 04): Supabase SQL editor, or `supabase db push`.
-- Idempotent: every statement guards.

-- ---------------------------------------------------------------------------
-- 1 · Mailbox credentials — the only secrets table in the product.
--     RLS ENABLED with NO policies at all: not even member SELECT. The engine
--     reads/writes with the service-role key; tokens never reach a client.
-- ---------------------------------------------------------------------------

create table if not exists public.mailbox_credentials (
  mailbox_id uuid primary key references public.mailboxes(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  scopes text[] not null default '{}',
  -- Gmail history cursor for incremental inbound sync; null = full sync next.
  last_history_id text,
  connected_at timestamptz not null default now(),
  last_refresh_error text,
  updated_at timestamptz not null default now()
);

alter table public.mailbox_credentials enable row level security;
-- No policies, deliberately (the waitlist pattern): service role bypasses RLS,
-- every other role sees nothing.

-- ---------------------------------------------------------------------------
-- 2 · Inbound messages — normalized ledger of everything the sync ingests.
--     Member-readable (it feeds the feed); engine-writable only.
-- ---------------------------------------------------------------------------

create table if not exists public.inbound_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  mailbox_id uuid not null references public.mailboxes(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  prospect_id uuid references public.prospects(id) on delete set null,
  gmail_message_id text not null,
  classification text not null
    check (classification in ('reply', 'ooo', 'bounce_hard', 'bounce_soft', 'other')),
  from_email text,
  subject text,
  snippet text,
  headers jsonb not null default '{}'::jsonb,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

-- Sync is at-least-once; the unique key makes ingestion idempotent.
create unique index if not exists inbound_messages_gmail_id_key
  on public.inbound_messages (mailbox_id, gmail_message_id);
create index if not exists inbound_messages_workspace_idx
  on public.inbound_messages (workspace_id, created_at desc);

drop policy if exists inbound_messages_member_select on public.inbound_messages;
create policy inbound_messages_member_select on public.inbound_messages
  for select using (public.is_workspace_member(workspace_id));
