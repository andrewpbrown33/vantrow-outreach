-- 0009_drip_release.sql
--
-- The drip: prospects enter a sequence as a throttled, ramping daily trickle
-- instead of all at once.
--
-- Until now enrollProspects() gave every prospect a next_touch_at immediately,
-- so a 151-person import fired 151 first touches into one morning window and
-- then went quiet for three days. That is both the worst possible shape for a
-- young sending domain and the wrong shape for a business: mail should go out
-- every day, at a volume the domain has earned.
--
-- Three pieces:
--
--   1 · A holding state. An enrollment can now be 'queued' — it exists, it is
--       attached to its sequence, and it has NO timer. The claim query already
--       filters on state in ('scheduled','active'), so a queued row is
--       structurally unclaimable; nothing can send to it by accident.
--
--   2 · A release policy per sequence. How many new prospects start per day,
--       how fast that grows, the ceiling, and whether growth is currently
--       allowed. Growth is deliberately one-directional: deliverability
--       trouble stops the ramp and holds, and only a human resumes it.
--
--   3 · A release log. One row per (sequence, day), uniquely constrained —
--       which is what makes "today's release" exactly-once under a cron that
--       fires every minute. The insert IS the lock.
--
-- Mailbox warmup stops being dead schema here too. With six steps in flight
-- per released prospect, total daily sends climb well past the entrant rate:
-- 5/day entrants growing 25%/week against 151 prospects peaks near 53 sends a
-- day. A fixed daily_cap of 30 would silently become the brake in week three,
-- so the cap itself now ramps from a warmup start date.
--
-- Additive, idempotent, re-runnable.

-- ---------------------------------------------------------------------------
-- 1 · The holding state
-- ---------------------------------------------------------------------------

alter table public.enrollments
  drop constraint if exists enrollments_state_check;
alter table public.enrollments
  add constraint enrollments_state_check check (state in
    ('queued', 'scheduled', 'active', 'paused', 'replied',
     'finished_no_reply', 'bounced', 'canceled'));

-- A queued enrollment still occupies its prospect's slot in the sequence, so
-- re-importing the same list cannot double-enroll anyone.
drop index if exists enrollments_live_key;
create unique index if not exists enrollments_live_key
  on public.enrollments (sequence_id, prospect_id)
  where state in ('queued', 'scheduled', 'active', 'paused');

-- Release order: oldest queued first, so an import's own order is honored.
create index if not exists enrollments_queued_idx
  on public.enrollments (sequence_id, created_at)
  where state = 'queued';

-- ---------------------------------------------------------------------------
-- 2 · The release policy
-- ---------------------------------------------------------------------------

create table if not exists public.release_policies (
  sequence_id uuid primary key
    references public.sequences(id) on delete cascade,
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  -- Off means the sequence enrolls the old way: everything starts at once.
  enabled boolean not null default true,
  start_per_day integer not null default 5 check (start_per_day > 0),
  growth_pct integer not null default 25 check (growth_pct between 0 and 200),
  max_per_day integer not null default 50 check (max_per_day > 0),
  -- Today's allowance. Ramps on its own; never silently shrinks.
  current_per_day integer not null check (current_per_day > 0),
  state text not null default 'ramping'
    check (state in ('ramping', 'holding', 'paused')),
  -- Why the ramp stopped, in words a human reads on the sequence screen.
  hold_reason text,
  held_at timestamptz,
  last_released_on date,
  last_grown_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.release_policies.state is
  'ramping = growth allowed · holding = deliverability trouble, rate frozen, '
  'resumed only by a human · paused = no releases at all.';
comment on column public.release_policies.current_per_day is
  'New prospects released today. Grows by growth_pct once per week while '
  'ramping, capped at max_per_day. Holding freezes it where it stands — the '
  'campaign keeps running at the rate the domain already proved it can carry.';

alter table public.release_policies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'release_policies'
      and policyname = 'release_policies_member_read'
  ) then
    create policy release_policies_member_read on public.release_policies
      for select using (public.is_workspace_member(workspace_id));
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'release_policies'
      and policyname = 'release_policies_member_write'
  ) then
    create policy release_policies_member_write on public.release_policies
      for all using (public.is_workspace_member(workspace_id))
      with check (public.is_workspace_member(workspace_id));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3 · The release log — one row per sequence per day, and the day's lock
-- ---------------------------------------------------------------------------

create table if not exists public.release_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  sequence_id uuid not null
    references public.sequences(id) on delete cascade,
  released_on date not null,
  -- How many actually entered the sequence (may be short of rate_used when
  -- the queue runs dry — that is the campaign finishing, not a failure).
  released_count integer not null default 0,
  rate_used integer not null,
  policy_state text not null,
  created_at timestamptz not null default now()
);

-- The exactly-once guard. A minute-cron tries this insert all day; the first
-- one wins the day and every later attempt conflicts and stands down. No
-- advisory lock, no scheduler, no clock skew to reason about.
create unique index if not exists release_log_day_key
  on public.release_log (sequence_id, released_on);

alter table public.release_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'release_log'
      and policyname = 'release_log_member_read'
  ) then
    create policy release_log_member_read on public.release_log
      for select using (public.is_workspace_member(workspace_id));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4 · Mailbox warmup comes alive
-- ---------------------------------------------------------------------------

alter table public.mailboxes
  add column if not exists warmup_started_on date,
  add column if not exists warmup_start_cap integer not null default 30,
  add column if not exists warmup_growth_pct integer not null default 30;

comment on column public.mailboxes.warmup_state is
  'none = daily_cap applies flat · warming = the effective cap ramps weekly '
  'from warmup_start_cap toward daily_cap · warmed = at full daily_cap.';

-- The effective cap for a given day. Kept in SQL so the sweep, the release
-- job and any report agree on one answer by construction.
create or replace function public.mailbox_daily_cap(mb public.mailboxes, on_day date)
returns integer
language sql
immutable
as $$
  select case
    when mb.warmup_state <> 'warming' or mb.warmup_started_on is null
      then mb.daily_cap
    else least(
      mb.daily_cap,
      greatest(
        mb.warmup_start_cap,
        floor(mb.warmup_start_cap *
          power(1 + (mb.warmup_growth_pct::numeric / 100),
                floor(greatest(on_day - mb.warmup_started_on, 0) / 7.0)))::integer
      )
    )
  end;
$$;

revoke execute on function public.mailbox_daily_cap(public.mailboxes, date) from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format(
        'revoke execute on function public.mailbox_daily_cap(public.mailboxes, date) from %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.mailbox_daily_cap(public.mailboxes, date) to service_role;
  end if;
end $$;
