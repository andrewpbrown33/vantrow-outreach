-- 0002_engine_substrate.sql
--
-- Workstream B1: the engine's tables, in the Gate-3 Auto-Email-Core cut
-- (matrix items 1-7 + 9), on the Gate-5 substrate (Postgres durable timers:
-- the schedule IS rows — enrollments.next_touch_at is the timer, the sweep
-- claims due rows with FOR UPDATE SKIP LOCKED, and the touch ledger's unique
-- idempotency key is the at-most-once backstop).
--
-- How to apply (runbook 04): Supabase SQL editor, or `supabase db push`.
-- Idempotent: every statement guards with IF NOT EXISTS / OR REPLACE.
--
-- Access model: RLS is ENABLED everywhere. Members of a workspace read (and
-- for the CRUD tables, write) their workspace's rows via is_workspace_member();
-- the engine writes with the service-role key, which bypasses RLS. The ledger,
-- event stream, and COGS counters are member-READABLE but only engine-writable.
-- Engine laws the schema itself carries:
--   I3  suppression_entries + the final recheck in the dispatch transaction
--   I10 events is append-only (no member insert/update/delete policies)
--   I1  touch_ledger.idempotency_key UNIQUE — concurrency backstop
-- Stop-on-reply is engine LAW (I2), so it is not a column anywhere.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1 · Tenancy
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Local test harnesses run without Supabase's auth schema; give auth.uid()
-- a stand-in there BEFORE any function references it (sql-language function
-- bodies validate at creation). On Supabase this block is a no-op.
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid
    language sql stable
    as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
  end if;
end $$;

-- Security-definer membership check: policies call this instead of joining
-- workspace_members directly (which would recurse through its own policy).
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 2 · Mailboxes (R10: standalone, brand-level, multi-mailbox)
-- ---------------------------------------------------------------------------

create table if not exists public.mailboxes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  display_name text,
  provider text not null default 'gmail' check (provider in ('gmail')),
  -- I5: caps defer, never drop. The sweep enforces these; the columns are law.
  daily_cap integer not null default 30 check (daily_cap > 0),
  min_send_gap_secs integer not null default 30 check (min_send_gap_secs >= 0),
  jitter_secs integer not null default 120 check (jitter_secs >= 0),
  warmup_state text not null default 'none'
    check (warmup_state in ('none', 'warming', 'warmed')),
  send_disabled boolean not null default false,
  oauth_ref text,
  last_send_ok_at timestamptz,
  last_send_error text,
  created_at timestamptz not null default now()
);

create unique index if not exists mailboxes_workspace_email_key
  on public.mailboxes (workspace_id, lower(email));

-- ---------------------------------------------------------------------------
-- 3 · Prospects + suppression (items 1-2; bodies never required)
-- ---------------------------------------------------------------------------

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  company text,
  title text,
  -- IANA zone; null falls back to the sequence's fallback_timezone (I4).
  timezone text,
  external_id text,
  custom jsonb not null default '{}'::jsonb,
  opted_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists prospects_workspace_email_key
  on public.prospects (workspace_id, lower(email));
create index if not exists prospects_external_id_idx
  on public.prospects (workspace_id, external_id) where external_id is not null;

-- I3's substrate: one row per suppressed address. The dispatch transaction's
-- FINAL condition checks this table — no code path may skip it.
create table if not exists public.suppression_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  reason text not null
    check (reason in ('hard_bounce', 'unsubscribe', 'complaint', 'manual')),
  created_at timestamptz not null default now()
);

create unique index if not exists suppression_workspace_email_key
  on public.suppression_entries (workspace_id, lower(email));

-- ---------------------------------------------------------------------------
-- 4 · Templates (item 3: subject + body, {{variables}} resolve at send)
-- ---------------------------------------------------------------------------

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  subject text not null,
  body_html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5 · Sequences + steps (item 4: auto-email primary, per-step draft control)
-- ---------------------------------------------------------------------------

create table if not exists public.sequences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  state text not null default 'draft'
    check (state in ('draft', 'active', 'paused', 'archived')),
  -- Default sending identity; each enrollment pins its own mailbox_id at add
  -- time (doc-04 pattern) so mid-flight sequence edits never re-route sends.
  mailbox_id uuid references public.mailboxes(id),
  timezone_source text not null default 'prospect'
    check (timezone_source in ('prospect', 'sequence')),
  fallback_timezone text not null default 'America/New_York',
  -- Send window (R3): ISO weekday numbers 1=Mon..7=Sun, minutes from midnight.
  window_days integer[] not null default '{2,3,4,5}',
  window_start_minute integer not null default 510
    check (window_start_minute between 0 and 1439),
  window_end_minute integer not null default 690
    check (window_end_minute between 1 and 1440),
  skip_us_holidays boolean not null default true,
  -- I6: OOO pauses with a return date; auto-resume is policy, the pause is law.
  ooo_auto_resume boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (window_end_minute > window_start_minute)
);

create index if not exists sequences_workspace_idx
  on public.sequences (workspace_id, state);

create table if not exists public.sequence_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  step_order integer not null check (step_order >= 1),
  template_id uuid references public.email_templates(id),
  -- Protocol §10: auto is primary; draft-first is a per-step choice.
  mode text not null default 'auto' check (mode in ('auto', 'draft_first')),
  -- R2: intervals in days + hours, verbatim. Step 1 fires on enroll (0/0).
  interval_days integer not null default 0 check (interval_days >= 0),
  interval_hours integer not null default 0 check (interval_hours >= 0),
  thread_as_reply boolean not null default false,
  created_at timestamptz not null default now(),
  unique (sequence_id, step_order)
);

-- ---------------------------------------------------------------------------
-- 6 · Enrollments — the state machine; next_touch_at IS the timer (Gate 5)
-- ---------------------------------------------------------------------------

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  mailbox_id uuid not null references public.mailboxes(id),
  state text not null default 'scheduled' check (state in
    ('scheduled', 'active', 'paused', 'replied',
     'finished_no_reply', 'bounced', 'canceled')),
  current_step_order integer not null default 1,
  -- The durable timer. Null when paused-manual or terminal.
  next_touch_at timestamptz,
  pause_reason text,
  resume_at timestamptz,
  replied_at timestamptz,
  finished_at timestamptz,
  error_reason text,
  -- Bumps when an expired claim is re-swept; part of the idempotency key (I1/I8).
  attempt_epoch integer not null default 0,
  claimed_at timestamptz,
  claim_token uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The sweep's index: due, unclaimed-or-stale work only.
create index if not exists enrollments_due_idx
  on public.enrollments (next_touch_at)
  where state in ('scheduled', 'active') and next_touch_at is not null;
create index if not exists enrollments_workspace_state_idx
  on public.enrollments (workspace_id, state);
-- One live engagement per prospect x sequence; re-adds allowed after terminal.
create unique index if not exists enrollments_live_key
  on public.enrollments (sequence_id, prospect_id)
  where state in ('scheduled', 'active', 'paused');

-- ---------------------------------------------------------------------------
-- 7 · Touch ledger — idempotency before side effects (Gate 5, I1/I8)
-- ---------------------------------------------------------------------------

create table if not exists public.touch_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  mailbox_id uuid not null references public.mailboxes(id),
  step_order integer not null,
  attempt_epoch integer not null,
  -- enrollment:step:epoch — UNIQUE is the concurrency backstop (I1); the same
  -- key travels to the provider seam so crash-window retries can't double-send.
  idempotency_key text not null,
  state text not null default 'claimed'
    check (state in ('claimed', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists touch_ledger_enrollment_idx
  on public.touch_ledger (enrollment_id, created_at desc);
-- The I5 cap check: sends per mailbox per day.
create index if not exists touch_ledger_mailbox_sent_idx
  on public.touch_ledger (mailbox_id, created_at)
  where state = 'sent';

-- ---------------------------------------------------------------------------
-- 8 · Event stream (I10: everything leaves a ledger) + COGS counters
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null,
  enrollment_id uuid,
  prospect_id uuid,
  sequence_id uuid,
  mailbox_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_workspace_created_idx
  on public.events (workspace_id, created_at desc);
create index if not exists events_type_idx on public.events (type);

create table if not exists public.cogs_counters (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  day date not null,
  metric text not null,
  value bigint not null default 0,
  primary key (workspace_id, day, metric)
);

create or replace function public.increment_cogs(
  ws uuid, metric_name text, delta bigint default 1)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.cogs_counters (workspace_id, day, metric, value)
  values (ws, current_date, metric_name, delta)
  on conflict (workspace_id, day, metric)
  do update set value = public.cogs_counters.value + excluded.value;
$$;

-- ---------------------------------------------------------------------------
-- 9 · The claim (Gate 5: FOR UPDATE SKIP LOCKED, TTL'd, per-batch)
-- ---------------------------------------------------------------------------
-- Two concurrent ticks can never both claim one row (I1); a claim older than
-- the TTL is re-sweepable with a bumped attempt_epoch (I8) — the new epoch
-- makes a NEW idempotency key, and the provider seam answers whether the OLD
-- key's send actually happened before anything fires again.

create or replace function public.claim_due_enrollments(
  batch_size integer default 50,
  claim_ttl interval default interval '5 minutes')
returns setof public.enrollments
language sql
security definer
set search_path = public
as $$
  update public.enrollments e
  set claimed_at = now(),
      claim_token = gen_random_uuid(),
      attempt_epoch = case
        when e.claimed_at is not null and e.claimed_at < now() - claim_ttl
        then e.attempt_epoch + 1
        else e.attempt_epoch
      end,
      updated_at = now()
  where e.id in (
    select id from public.enrollments
    where state in ('scheduled', 'active')
      and next_touch_at is not null
      and next_touch_at <= now()
      and (claimed_at is null or claimed_at < now() - claim_ttl)
    order by next_touch_at
    limit batch_size
    for update skip locked
  )
  returning e.*;
$$;

-- ---------------------------------------------------------------------------
-- 10 · Row level security
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.mailboxes enable row level security;
alter table public.prospects enable row level security;
alter table public.suppression_entries enable row level security;
alter table public.email_templates enable row level security;
alter table public.sequences enable row level security;
alter table public.sequence_steps enable row level security;
alter table public.enrollments enable row level security;
alter table public.touch_ledger enable row level security;
alter table public.events enable row level security;
alter table public.cogs_counters enable row level security;

-- Members see their workspaces and their own membership rows.
drop policy if exists workspaces_member_select on public.workspaces;
create policy workspaces_member_select on public.workspaces
  for select using (public.is_workspace_member(id));

drop policy if exists members_own_select on public.workspace_members;
create policy members_own_select on public.workspace_members
  for select using (user_id = auth.uid());

-- CRUD tables: members read and write inside their workspace.
do $$
declare t text;
begin
  foreach t in array array[
    'mailboxes', 'prospects', 'suppression_entries', 'email_templates',
    'sequences', 'sequence_steps', 'enrollments'
  ] loop
    execute format(
      'drop policy if exists %I_member_select on public.%I', t, t);
    execute format(
      'create policy %I_member_select on public.%I for select
         using (public.is_workspace_member(workspace_id))', t, t);
    execute format(
      'drop policy if exists %I_member_write on public.%I', t, t);
    execute format(
      'create policy %I_member_write on public.%I for all
         using (public.is_workspace_member(workspace_id))
         with check (public.is_workspace_member(workspace_id))', t, t);
  end loop;
end $$;

-- Engine tables: member-readable, engine-writable only (service role bypasses
-- RLS; no member insert/update/delete policies exist — I10's append-only story
-- for events, and the ledger/counters stay tamper-proof from clients).
do $$
declare t text;
begin
  foreach t in array array['touch_ledger', 'events', 'cogs_counters'] loop
    execute format(
      'drop policy if exists %I_member_select on public.%I', t, t);
    execute format(
      'create policy %I_member_select on public.%I for select
         using (public.is_workspace_member(workspace_id))', t, t);
  end loop;
end $$;
