# Gate 5 — Sequence-Engine Substrate

**Type:** Decision gate.
**Question:** what runs the enrollment engine — the durable-timer, exactly-once,
reply-race-cancelling heart of the product (hard problems #1/#4)?
**Grounding:** doc 04's enrollment state machine (10 states, evidenced transitions),
doc 14's provider limits, R2/R3 (days+hours intervals; time windows, holiday skips,
stop-on-reply), the Gate 3 Option E contract, and the family stack (Supabase Postgres
+ Vercel).

Design invariants ALL options share (they are the spec, not the substrate):
`next_touch_at` as queryable state · claim-and-execute (`FOR UPDATE SKIP LOCKED`) ·
idempotency touch-ledger insert before side effects · execute + advance in ONE
transaction · final in-transaction pause/suppression re-check immediately before the
send call · per-mailbox/org token-bucket throttles honoring warmup state · TZ/DST
resolved at fire time · every state change appended to the event stream. The
**dispatcher is a swappable seam**: whatever wins here, a later substrate port is a
dispatcher change, not an engine rewrite.

## Options

| # | Option | One-line | New platform? | Verdict |
|---|---|---|---|---|
| A | Postgres durable timers + Vercel-cron dispatcher | The schedule lives in our tables; a cron sweep claims due work | No | **Recommended** |
| B | Supabase-native (pg_cron + pgmq + Edge Functions) | Same idea, Supabase runs the clock | No (same vendor, more surfaces) | Solid runner-up |
| C | Inngest | Durable step functions over serverless | **Yes** | Fails "unless necessary" today |
| D | Temporal (Cloud) | The industrial workflow engine | **Yes, heaviest** | The documented port target, not the start |

### A — Postgres durable timers + Vercel-cron dispatcher ★

Enrollments carry `next_touch_at`; a Vercel cron (1-min cadence, `CRON_SECRET`-gated,
the family's exact pattern) invokes the dispatcher, which claims due rows with
`FOR UPDATE SKIP LOCKED` in per-tenant-fair batches sized to stay inside function
limits, executes through the provider seam, and advances state transactionally.
Cancellation (reply/unsubscribe/pause) is one indexed UPDATE — the schedule is just
rows. Observable with plain SQL ("why didn't this prospect get emailed?" = one query).
Zero new vendors; every piece already exists in the family stack.
- **Honest ceiling (stated, per the program plan):** minute granularity (irrelevant —
  sends land inside hours-wide windows with jitter, R3); throughput bounded by
  function invocation time (thousands of touches/day per tenant before it matters —
  PEAK's dogfood is hundreds); at real commercial scale the dispatcher seam ports to
  B/C/D without touching engine semantics.
- **Biggest weakness:** the cron is a single heartbeat — a missed invocation delays
  (never duplicates) touches; mitigated by an on-demand kick on app activity and a
  staleness alarm on the event stream.

### B — Supabase-native (pg_cron + pgmq + Edge Functions)

The clock moves into the database (pg_cron), queueing into pgmq, workers as Edge
Functions. Same invariants, no Vercel dependency for the heartbeat.
- **Biggest weakness:** three more Supabase-specific surfaces to operate and mock
  locally (the file-adapter dev story gets harder), for a resilience gain the alarm in
  A already covers. Adopt selectively later if the cron heartbeat proves flaky.

### C — Inngest

Purpose-built durable steps, retries, sleeps on serverless; genuinely good fit
technically.
- **Biggest weakness:** a new platform holding the product's core state machine —
  the exact dependency the stack decision says to avoid until *necessary*; and its
  sleep-based model makes "the schedule is queryable rows" (our cancellation and
  observability story) weaker, not stronger.

### D — Temporal

The end-state answer at Outreach-scale (the research brief's own pick for parity).
- **Biggest weakness:** the heaviest possible new platform for a dogfood-scale MVP;
  choosing it now optimizes for a scale problem we have contractually deferred. It
  stays in this memo as the **named port target** the dispatcher seam must keep
  reachable.

## Ranked

1. **A** — invariants on boring primitives, zero new vendors, best observability.
2. **B** — same family; adopt pieces if A's heartbeat disappoints.
3. **D** — right answer later; wrong answer first.
4. **C** — good tech, wrong dependency posture.

### #1 pick: **A**

The engine's correctness lives in the invariants and the CI suite, not the scheduler
brand. A puts the whole state machine where we can see it with SQL, costs nothing new,
and leaves the port path explicit. Phase 4's verification rows (exactly-once under
crash, reply-race cancel, DST fire-times, throttle ceilings, unbypassable suppression)
apply to A verbatim.

> ## Next steps — do these in order
> 1. **Andrew:** confirm or redirect (this one is safe to rubber-stamp — it introduces
>    nothing new and keeps every exit open).
> 2. **Agent:** record Gate 5; the engine spec in `phase-4-plan.md` encodes the
>    invariants + the dispatcher seam as its first section.
