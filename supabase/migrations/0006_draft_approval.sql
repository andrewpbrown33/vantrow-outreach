-- 0006_draft_approval.sql
--
-- Closes the draft-first dead end.
--
-- Protocol §10 lets a step be marked `draft_first`: the engine never auto-sends
-- it, a human approves it first, and Gate 3 explicitly retained that per-step
-- draft-vs-auto control. The sweep has honoured half of that since 0002 — it
-- parks the enrollment with pause_reason = 'awaiting draft approval' and clears
-- next_touch_at — and its comment promised the other half: "approval re-arms
-- the enrollment (workstream C surface)".
--
-- Workstream C shipped without that surface. Because next_touch_at IS the
-- schedule, clearing it removed the enrollment from the claim query's reach
-- permanently. So every draft_first step was a silent, unrecoverable dead end:
-- the prospect is parked, the timer is gone, nothing errors, no failure is
-- visible anywhere, and nobody is ever mailed. The sequence form offers the
-- mode as a radio button, so this was reachable in one click.
--
-- Re-arming alone would not fix it: the sweep would meet the same draft_first
-- step on the next tick and park it again. The approval has to be RECORDED, and
-- recorded PER STEP — approving step 2 must never silently pre-approve step 3,
-- which is the whole point of asking a human each time. Hence a step order
-- rather than a boolean or a timestamp: the sweep sends only when the recorded
-- value equals the step it is standing on, so a stale approval from an earlier
-- step cannot match a later one, and no clearing pass is needed on advance.
--
-- Additive + idempotent + re-runnable.

alter table public.enrollments
  add column if not exists draft_approved_step integer;

comment on column public.enrollments.draft_approved_step is
  'Step order a human approved for sending on a draft_first step (protocol §10). '
  'The sweep auto-sends a draft_first step only when this equals '
  'current_step_order, so approval never carries forward to a later step.';
