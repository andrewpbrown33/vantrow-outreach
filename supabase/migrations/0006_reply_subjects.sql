-- 0006 · Reply-step subjects (field walkthrough, 2026-08-16).
--
-- A reply step's subject is derived at send time — "Re: " + the subject its
-- thread actually opened with — because Gmail only threads messages whose
-- subject matches the conversation. Template subjects hold {{variables}}, and
-- re-rendering them later can disagree with what went on the wire (prospect
-- data changes between touches), so the ledger records what each touch SENT.
alter table public.touch_ledger
  add column if not exists sent_subject text;
