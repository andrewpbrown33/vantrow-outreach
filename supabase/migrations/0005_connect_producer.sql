-- 0005_connect_producer.sql
--
-- Workstream D: the Vantrow Connect producer (Gate 6 — `project` = sequence).
--
-- Delivery is a TRANSACTIONAL OUTBOX, not a direct HTTP call: the engine
-- enqueues an event in the same transaction that changes state, so an event
-- can never describe a state the database rolled back, and a crash between
-- "state changed" and "event sent" leaves a durable row instead of a lost
-- notification. A worker drains it on the spec's retry schedule
-- (1m, 5m, 30m, 2h, 12h) and then dead-letters, retained for replay.
--
-- Idempotent.

create table if not exists public.connect_endpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  -- The consumer dashboard. HTTPS only (spec); enforced at delivery.
  url text not null,
  -- whsec_... — secret material, so this table gets the credentials
  -- treatment: RLS on, no policies, service-role only.
  secret text not null,
  -- Connect tenant id this workspace presents as (ten_...).
  tenant_id text not null,
  event_types text[] not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists connect_endpoints_workspace_idx
  on public.connect_endpoints (workspace_id) where enabled;

create table if not exists public.connect_outbox (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  -- evt_... — the consumer's idempotency key; stable across every retry.
  event_id text not null unique,
  event_type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  state text not null default 'pending'
    check (state in ('pending', 'delivered', 'dead_lettered')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists connect_outbox_due_idx
  on public.connect_outbox (next_attempt_at)
  where state = 'pending';

alter table public.connect_endpoints enable row level security;
alter table public.connect_outbox enable row level security;

-- connect_endpoints: NO policies — holds webhook secrets (waitlist pattern).
-- connect_outbox: member-readable (it is the delivery audit trail), never
-- member-writable; the engine writes with the service role.
drop policy if exists connect_outbox_member_select on public.connect_outbox;
create policy connect_outbox_member_select on public.connect_outbox
  for select using (public.is_workspace_member(workspace_id));
