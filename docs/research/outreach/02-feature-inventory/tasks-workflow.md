# Feature Inventory — Task & Workflow Engine

**Tier:** P + F per the research README. This draft is **Tier P only** (agent-produced,
public sources); the Tier-F verification pass happens at Phase 1 synthesis. Zero `F-` refs.
**Sources:** `docs/research/outreach/sources/tasks.md` (S-TSK-…), cited inline.
**Prepared:** 2026-08-06, workstream B.

## Purpose

The task engine is the layer that turns Outreach's automation (sequences, admin triggers,
reminders, one-off entries) into a single prioritized to-do queue per rep, then walks the rep
through that queue one item at a time. Sequences emit tasks for every step a human must
perform (manual email, call, LinkedIn touch, generic action); triggers and users add more;
the platform ranks what is due — including an engagement score derived from email
opens/clicks/replies — and offers a focused "play" mode that presents each task with the
prospect's full context so the rep executes without navigating (S-TSK-001, S-TSK-002,
S-TSK-003, S-TSK-009).

## Feature table

| Feature | Description (our words) | Who uses it | Workflow steps | Source refs |
|---|---|---|---|---|
| Task object & types | A task is a dated action reminder tied to a prospect. Types: email, call, meet-in-person, and generic "action item"; LinkedIn subtypes are view profile, send message, send connection request, interact with post. SMS tasks also exist. | SDR/AE (execute); managers (assign) | Pick type at creation or inherit from sequence step | S-TSK-002, S-TSK-007 |
| Task attributes | Prospect(s), priority (No Priority / Urgent / High / Normal / Low), type, assignee, due date + due time, free-text note. List columns can also surface account, tags, sequence, opportunity, and custom prospect fields. Creating a task against N prospects makes N tasks. | All reps | Fill fields in the new-task form | S-TSK-002 |
| Task origins | Four documented origins, filterable as such: sequence steps, one-off (user-created), reminders, and triggers. Sequence manual-email/call/generic/LinkedIn steps each generate a task when the step comes due; auto emails send without one. | Reps; admins (trigger-origin) | Origin recorded automatically; filter list by origin | S-TSK-002, S-TSK-009 |
| Prioritized task list | Central Tasks page (under Activity in the left nav): filters (category, type, origin, prospect, note text, several date dimensions, owner/team presets), multi-key sorting (due date, priority, scheduled date, prospect/account/opportunity name, engagement date, created/updated), column management, and keyword search across names, notes, IDs, tags, and custom fields. | Reps daily; managers for triage | Open Tasks → filter/sort → work or bulk-edit | S-TSK-002 |
| Engagement-scored prioritization | The queue can be ordered by an engagement score computed from the prospect's most recent mailing: opens = 1 point, clicks = 2, replies = 3; highest total floats to the top, so the warmest prospects are worked first. | Reps | On the 360 dashboard or sidebar queue, choose sort-by-engagement | S-TSK-001, S-TSK-004 |
| 360-dashboard due queue | The rep home shows the due-task list with three sort modes: priority (labeled by the originating sequence step), engagement score, or sequence name; a play control starts execution on the chosen slice (emails, calls, or action items). | Reps | Land on home → pick sort + slice → play | S-TSK-001 |
| Task flow (focused mode) | One-task-at-a-time execution launched from the play control or the global sidebar. Queue slices: All, One-Off, Sequence, Account, and Opportunity tasks, each pre-sortable by priority or engagement. The flow window keeps prospect context beside the action, advances on completion, and a clock control reschedules an item mid-flow. | Reps | Sidebar → slice → sort → play → complete/skip each | S-TSK-004 |
| Universal task flow | The Chrome extension can run the same queue on top of Salesforce, LinkedIn, or any site: it drives one browser tab to the right page per task, with per-prospect link switching and a configurable default landing page. | Reps living in CRM/LinkedIn | Enable in personal settings → start flow from extension | S-TSK-006 |
| Urgent-task alerts | Urgent-priority tasks fire Chrome browser notifications when due (needs browser + OS permission). Dismissing an urgent task demotes it to High; snoozing re-alerts on the new time. The global queue groups urgent items into their own category. | Reps | Mark task Urgent → get notified → act or snooze | S-TSK-005 |
| Completion semantics | Email tasks complete via Send & Complete; call tasks require a call disposition to count as complete; generic/LinkedIn tasks are marked complete manually. Deleting a sequence-origin task pauses that prospect in the sequence rather than silently skipping the step. | Reps; admins (can delete others' tasks) | Complete → engine advances the prospect's sequence step | S-TSK-002 |
| Bulk operations | Checkbox multi-select on the task list supports reassignment to another user; edit/delete/reschedule live behind a per-row menu. | Managers, ops | Select rows → Assign | S-TSK-002 |
| Triggers (admin rules engine) | If-this-then-that automation defined by admins under Administration > Workflow automations. Sources: prospect, account, meeting, call, mailing, opportunity, plus events from integrated third parties (e.g. gifting, chat, video tools). Timing: on create, update, either, or scheduled relative to a date field (minimum 20-minute offset). Conditions test field changes (changed at all / from a value / to a value) with type-appropriate operators. | Admins build; reps receive output | Admin defines event + conditions + actions → engine fires on match | S-TSK-003, S-TSK-007 |
| Trigger actions | Create tasks (optionally pre-filled with a template, snippet, or AI personalization block), add prospects to sequences, update field values, and route work to a team with balanced round-robin-style distribution. | Admins | Choose action(s) in the trigger form | S-TSK-003 |
| Trigger ownership resolution | For trigger-driven sequence adds, the sender/owner resolves through a documented hierarchy: prospect-level job-role assignments first, then account-team job roles, then owner fields; if nothing matches, the add-to-sequence action is skipped rather than mis-assigned. | Admins (design), engine (runtime) | Configure roles → engine resolves at fire time | S-TSK-003 |
| Playbooks | Marketing-level concept: product pages sell "task prioritization and sales playbooks" that guide reps to the next high-impact action. The support glossary defines no "playbook" object. INFERENCE: in-product, "playbooks" is realized through sequence blueprints, shared collections/templates, and the prioritized queue rather than a distinct playbook entity. | Sales leadership (concept) | — | S-TSK-008, S-TSK-007, S-TSK-009 |
| Out-of-office handling | Sequence intelligence detects OOTO replies, pauses the prospect (a dedicated "paused OOTO" sequence state exists), and typically auto-resumes on return — removing the manual cleanup task a rep would otherwise get. | Reps (beneficiary) | Automatic | S-TSK-008, S-TSK-010 |

## Key workflows

1. **Sequence step → rep execution.** Admin/rep builds a sequence whose step 3 is a manual
   email (S-TSK-009). When a prospect reaches step 3, the engine creates an email task with
   the step's priority and due time (S-TSK-001, S-TSK-002). The rep sorts the morning queue
   by engagement so repliers/clickers surface first (S-TSK-001), hits play, gets the
   pre-filled email in the flow window with prospect context alongside, personalizes, and
   uses Send & Complete; the engine schedules the prospect's next step (S-TSK-004, S-TSK-002).
2. **Trigger → team queue.** Admin creates a trigger: when a mailing event marks a hot reply
   or a prospect field changes to a target value, create a call task pre-filled from a
   template and distribute it round-robin across the SDR team (S-TSK-003). Each firing
   resolves the assignee via the ownership hierarchy; tasks land in each rep's due queue with
   origin = trigger, filterable as such (S-TSK-003, S-TSK-002).
3. **Manager triage.** A manager filters the Tasks page to a departing rep's open items,
   multi-selects, and reassigns them to a teammate; overdue urgent items re-alert the new
   owner when due (S-TSK-002, S-TSK-005).
4. **Working outside the app.** A rep starts Universal Task Flow; for a LinkedIn task the
   extension drives the tab to the prospect's LinkedIn page, then to Salesforce for the next
   task, keeping the queue controls persistent (S-TSK-006).

## Data touched (cross-ref doc 04)

- **Task**: type, priority, assignee, due date/time, note, completion state, origin
  (sequence step / one-off / reminder / trigger), links to prospect, account, opportunity,
  sequence + step (S-TSK-002).
- **Engagement events**: per-mailing opens/clicks/replies feeding the queue score
  (S-TSK-001).
- **Trigger**: source object, event timing, field-change conditions, actions, team
  distribution config (S-TSK-003).
- **Sequence state** per prospect (active/paused/paused-OOTO/finished/…), mutated by task
  completion and deletion (S-TSK-010, S-TSK-002).
- **Users/teams/roles** for assignment and round-robin (S-TSK-003).

## Unknowns

- Exact engagement-score mechanics beyond the 1/2/3 weights: decay, tie-breaking, whether
  only the single most recent mailing counts events cumulatively, and whether weights are
  configurable per org.
- Whether a "next best action" ML ranking exists beyond the documented score sort (marketing
  implies guidance; help docs show deterministic sorts only).
- Trigger execution guarantees: rate caps, retry/failure behavior, loop protection when a
  trigger's field update matches another trigger.
- Full trigger action catalog (e.g., webhooks/notifications) — only the actions listed above
  are publicly documented.
- Whether "playbooks" is a purchasable/visible artifact anywhere in-product, or purely
  positioning (our INFERENCE above).
- Task aging/SLA behavior: what happens to overdue non-urgent tasks beyond sorting.
- How priority sort and engagement sort compose (single-key vs multi-key at runtime).

## Completeness checklist

- [x] Every claim sourced to an S-TSK row (Tier P), or labeled INFERENCE.
- [x] Unknowns filled (7 items).
- [x] Function described, not visual design.
- [x] ≤4 pages / ≤200 lines.
- [x] Zero `F-` references in this draft.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
