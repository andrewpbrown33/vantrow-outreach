-- 0004_provider_message_ids.sql
--
-- Live-Gmail correction (2026-08-09). B3 assumed the engine could own the
-- RFC822 Message-ID and use it as a touch's identity. Gmail REWRITES that
-- header on send, so:
--   * `rfc822msgid:` lookups always missed -> retries duplicated sends
--     (the exact failure I1/I8 exist to prevent), and
--   * a prospect's reply quotes GMAIL's id in In-Reply-To, which nothing
--     in our schema could resolve back to a touch.
--
-- Fix: identity travels in the surviving custom header (X-Nudgerow-Key), and
-- the PROVIDER's own ids are persisted here at send time — the ledger becomes
-- the authority that later threading and inbound reply-matching key off.
--
-- Idempotent.

alter table public.touch_ledger
  add column if not exists provider_thread_id text,
  add column if not exists provider_rfc822_message_id text;

-- Inbound matching looks up a reply's In-Reply-To / References against this.
create index if not exists touch_ledger_rfc822_idx
  on public.touch_ledger (provider_rfc822_message_id)
  where provider_rfc822_message_id is not null;
