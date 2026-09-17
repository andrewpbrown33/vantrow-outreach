-- 0012_unverified_inbound.sql
--
-- The inbound classification vocabulary learns 'unverified'.
--
-- An unsubscribe or a bounce is acted on org-wide: the suppression row it
-- writes is what I3 reads last, inside every send transaction, and nothing
-- the prospect does afterwards removes it. The From header is whatever the
-- sender wrote. So a forged From plus the word "unsubscribe" — or a fake
-- delivery-status report naming a prospect — could silence someone who
-- never asked.
--
-- The engine now acts on such mail only when the receiving MTA's
-- Authentication-Results vouches for the sender's domain (DKIM, SPF or DMARC
-- passing, aligned with the From domain); a real DSN from mailer-daemon or
-- postmaster is exempt. Anything else is recorded as 'unverified' with an
-- inbound.unverified event naming the sender and the claim, and nothing is
-- suppressed or halted. Best effort: it raises the cost of a forgery from
-- "type an address" to "control that domain's mail".
--
-- Idempotent + re-runnable, the 0008 pattern.

alter table public.inbound_messages
  drop constraint if exists inbound_messages_classification_check;
alter table public.inbound_messages
  add constraint inbound_messages_classification_check
  check (classification in
    ('reply', 'ooo', 'bounce_hard', 'bounce_soft', 'unsubscribe', 'unverified', 'other'));
