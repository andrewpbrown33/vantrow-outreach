#!/usr/bin/env node
/** Build a sequence in the platform from a campaign markdown file.
 *
 *  Why a script and not the form: the sequence form creates, it does not edit.
 *  A campaign whose words are still being worked on would otherwise mean
 *  delete-and-retype every round. Here the markdown IS the source — edit the
 *  prose in docs/campaigns/*.md, run this again, and the steps are rewritten
 *  in place. The sequence keeps its id, its enrollments and its release
 *  policy, so re-seeding never disturbs a campaign that is already running.
 *
 *  Usage:
 *    SUPABASE_DB_URL=... node scripts/seed-campaign.mjs \
 *      docs/campaigns/vantrow-services-roofing.md \
 *      --workspace 00000000-0000-4000-8000-000000000001 \
 *      --mailbox andrew@getvantrow.com \
 *      [--address "123 Main St, Denver CO 80202"] \
 *      [--apply]
 *
 *  Without --apply it prints what it would do and changes nothing.
 */

import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const apply = args.includes("--apply");

if (!file) {
  console.error("usage: seed-campaign.mjs <campaign.md> --workspace <uuid> --mailbox <email> [--address ...] [--apply]");
  process.exit(2);
}
const workspaceId = flag("workspace");
const mailboxEmail = flag("mailbox");
const address = flag("address");
if (!workspaceId || !mailboxEmail) {
  console.error("--workspace and --mailbox are required");
  process.exit(2);
}

// --- Parse -----------------------------------------------------------------
// The doc's own shape is the schema: "### Step N — day D — [same thread —] title"
// followed by the body as a blockquote. Anything outside that is commentary.

const md = readFileSync(file, "utf8");
const HEAD = /^###\s+Step\s+(\d+)\s+—\s+day\s+(\d+)\s+—\s+(.*)$/gim;

const heads = [...md.matchAll(HEAD)];
if (heads.length === 0) {
  console.error(`no "### Step N — day D — …" headings found in ${file}`);
  process.exit(1);
}

const steps = heads.map((h, i) => {
  const start = h.index + h[0].length;
  const end = i + 1 < heads.length ? heads[i + 1].index : md.length;
  const block = md.slice(start, end);

  // The blockquote is the email. Strip the "> " and drop everything after the
  // first non-quoted line (the doc's trailing notes).
  const lines = [];
  for (const raw of block.split(/\r?\n/)) {
    const m = /^>\s?(.*)$/.exec(raw);
    if (m) lines.push(m[1]);
    else if (lines.length > 0 && raw.trim() === "") lines.push("");
    else if (lines.length > 0 && raw.trim() !== "") break;
  }
  const body = lines.join("\n").trim();

  const title = h[3].trim();
  const sameThread = /same thread/i.test(title);
  // A thread-opening step needs a subject of its own; the doc states it in
  // italics on the heading, e.g. *AccuLynx, at a fraction of the cost*.
  const subjectMatch = /\*([^*]+)\*/.exec(title);
  const headingSubject = subjectMatch ? subjectMatch[1].trim() : null;
  // "new subject" headings also open a thread.
  const opensThread = !sameThread;

  return {
    order: Number(h[1]),
    day: Number(h[2]),
    threadAsReply: !opensThread,
    subject: opensThread ? headingSubject : "",
    body,
  };
});

steps.sort((a, b) => a.order - b.order);

// --- Validate --------------------------------------------------------------
const problems = [];
if (steps[0]?.threadAsReply) problems.push("step 1 cannot be a reply");
for (const s of steps) {
  if (!s.body) problems.push(`step ${s.order} has no body`);
  if (!s.threadAsReply && !s.subject) {
    problems.push(`step ${s.order} opens a thread but the heading names no *subject*`);
  }
  const unresolved = [...s.body.matchAll(/\[([A-Z][^\]]*)\]/g)].map((m) => m[1]);
  for (const u of unresolved) {
    if (/ADDRESS/i.test(u) && address) continue;   // supplied on the command line
    problems.push(`step ${s.order} still has a placeholder: [${u}]`);
  }
}
if (problems.length > 0) {
  console.error("This campaign is not ready to seed:");
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}

const withAddress = (body) =>
  address ? body.replace(/\[[^\]]*ADDRESS[^\]]*\]/gi, address) : body;

// Intervals are gaps between steps; the doc states cumulative days.
const intervals = steps.map((s, i) => (i === 0 ? 0 : s.day - steps[i - 1].day));

// Plain-text paragraphs become the HTML the engine sends.
const html = (body) =>
  body.split(/\n{2,}/).map((p) =>
    `<p>${p.trim().split(/\n/).join("<br>")}</p>`).join("\n");

const name = (/^#\s+(.*)$/m.exec(md)?.[1] ?? "Campaign")
  .replace(/^Campaign\s*·\s*/i, "").trim();

console.log(`Campaign: ${name}`);
console.log(`From:     ${mailboxEmail}`);
console.log(`Steps:    ${steps.length}`);
for (const [i, s] of steps.entries()) {
  const when = i === 0 ? "on enroll" : `+${intervals[i]}d (day ${s.day})`;
  console.log(`  ${s.order}. ${when} · ${s.threadAsReply ? "same thread" : `new thread · "${s.subject}"`} · ${s.body.length} chars`);
}
if (!address) {
  console.log("\nNote: no --address given. Cold commercial email should carry a postal address.");
}
if (!apply) {
  console.log("\nDry run. Re-run with --apply to write it.");
  process.exit(0);
}

// --- Apply -----------------------------------------------------------------
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set");
  process.exit(2);
}
// Imported only on the write path, so a dry run parses and reports with no
// dependencies at all — the same posture as scripts/gmail-connect.mjs.
const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString: url, max: 2 });
const client = await pool.connect();
try {
  await client.query("begin");

  const mb = await client.query(
    "select id from public.mailboxes where workspace_id = $1 and lower(email) = lower($2)",
    [workspaceId, mailboxEmail]);
  if (mb.rowCount === 0) throw new Error(`no mailbox ${mailboxEmail} in that workspace`);
  const mailboxId = mb.rows[0].id;

  // Re-seedable by name: the same campaign run twice updates in place rather
  // than growing a second copy beside the first.
  const existing = await client.query(
    "select id, state from public.sequences where workspace_id = $1 and name = $2",
    [workspaceId, name]);

  let seqId;
  if (existing.rowCount > 0) {
    seqId = existing.rows[0].id;
    if (existing.rows[0].state === "active") {
      throw new Error(
        `"${name}" is ACTIVE. Pause it before re-seeding — rewriting steps under a ` +
        "running campaign would change what half-finished enrollments send next.");
    }
    await client.query(
      "update public.sequences set mailbox_id = $2, updated_at = now() where id = $1",
      [seqId, mailboxId]);
    // Steps are rewritten wholesale; templates go with them.
    await client.query(
      `delete from public.email_templates where id in (
         select template_id from public.sequence_steps where sequence_id = $1
           and template_id is not null)`, [seqId]);
    await client.query("delete from public.sequence_steps where sequence_id = $1", [seqId]);
    console.log(`\nUpdating existing sequence ${seqId} (state: ${existing.rows[0].state}).`);
  } else {
    const ins = await client.query(
      `insert into public.sequences
         (workspace_id, name, state, mailbox_id, timezone_source, fallback_timezone)
       values ($1, $2, 'draft', $3, 'prospect', 'America/New_York')
       returning id`,
      [workspaceId, name, mailboxId]);
    seqId = ins.rows[0].id;
    console.log(`\nCreated sequence ${seqId} in draft.`);
  }

  for (const [i, s] of steps.entries()) {
    const tpl = await client.query(
      `insert into public.email_templates (workspace_id, name, subject, body_html)
       values ($1, $2, $3, $4) returning id`,
      [workspaceId, `${name} · step ${s.order}`, s.subject,
       html(withAddress(s.body))]);
    await client.query(
      `insert into public.sequence_steps
         (workspace_id, sequence_id, step_order, template_id, mode,
          interval_days, interval_hours, thread_as_reply)
       values ($1, $2, $3, $4, 'auto', $5, 0, $6)`,
      [workspaceId, seqId, s.order, tpl.rows[0].id, intervals[i], s.threadAsReply]);
  }

  // The drip. Andrew's numbers: start at 5 a day, grow 25% weekly, and a
  // ceiling above the campaign's own peak so the policy is never the thing
  // that stalls it — the mailbox warmup cap is the real governor.
  await client.query(
    `insert into public.release_policies
       (sequence_id, workspace_id, start_per_day, growth_pct, max_per_day,
        current_per_day, state)
     values ($1, $2, 5, 25, 40, 5, 'ramping')
     on conflict (sequence_id) do nothing`,
    [seqId, workspaceId]);

  await client.query("commit");
  console.log(`Seeded ${steps.length} steps and a release policy (5/day, +25%/week).`);
  console.log("The sequence is in DRAFT — nothing sends until you press Start.");
} catch (err) {
  await client.query("rollback").catch(() => {});
  console.error(`\nFailed, nothing changed: ${err.message}`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
