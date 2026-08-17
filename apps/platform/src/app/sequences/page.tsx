import Link from "next/link";
import { AppBar } from "../../components/app-bar";
import { Chip, DotStrip, Empty, Legend, PillStat } from "../../components/ui";
import { listSequenceSummaries, workspaceStateCounts, type SequenceSummary } from "../../lib/queries";
import { DOT_STATES, STATE_LABEL } from "../../lib/states";
import { requireSession } from "../../lib/workspace";

export const dynamic = "force-dynamic";

/** Sequences divide by the outbox they send from (R10: one org, several
 *  sending identities — Eaverow mail must never look like Parcelrow mail).
 *  With a single outbox in play the grouping would just be noise, so cards
 *  carry the mailbox inline instead and no headings render. */
function groupByOutbox(sequences: SequenceSummary[]): {
  outbox: string | null; labelled: boolean; items: SequenceSummary[];
}[] {
  const byOutbox = new Map<string | null, SequenceSummary[]>();
  for (const s of sequences) {
    const key = s.mailboxEmail ?? null;
    byOutbox.set(key, [...(byOutbox.get(key) ?? []), s]);
  }
  const labelled = byOutbox.size > 1;
  // Named outboxes alphabetically; the mailbox-less bucket sinks to the end.
  return [...byOutbox.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)))
    .map(([outbox, items]) => ({ outbox, labelled, items }));
}

/** The all-sequences view (R-4D-5): per-state statistics across the top, then
 *  one card per sequence with its dot strip. A card opens its detail. */
export default async function SequencesPage() {
  const { workspaceId } = await requireSession();
  const [sequences, counts] = await Promise.all([
    listSequenceSummaries(workspaceId),
    workspaceStateCounts(workspaceId),
  ]);

  return (
    <>
      <AppBar here="/sequences" />
      <div className="px-4 pt-3.5 pb-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[21px] font-extrabold tracking-tight">Sequences</h1>
          <Link
            href="/sequences/new"
            className="ml-auto rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background no-underline"
          >
            New sequence
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-2.5">
          {DOT_STATES.map((s) => (
            <PillStat key={s} state={s} n={counts[s]} label={STATE_LABEL[s]} />
          ))}
        </div>

        {sequences.length === 0 ? (
          <div className="mt-4">
            <Empty title="No sequences yet.">
              <Link href="/sequences/new" className="border-b-2 border-camel font-semibold text-sub no-underline">
                Build the first one
              </Link>
            </Empty>
          </div>
        ) : null}

        {groupByOutbox(sequences).map((group) => (
          <section key={group.outbox ?? "none"}>
            {group.labelled ? (
              <p className="mt-4 flex items-baseline gap-2 text-[13px] font-extrabold">
                {group.outbox ?? "No sending mailbox yet"}
                <span className="font-mono text-[10.5px] font-normal text-muted">
                  {group.items.length === 1 ? "1 sequence" : `${group.items.length} sequences`}
                </span>
              </p>
            ) : null}
            {group.items.map((s) => (
              <Link
                key={s.id}
                href={`/sequences/${s.id}`}
                className="mt-2.5 block rounded-xl border border-line bg-panel px-4 py-3 text-sm no-underline"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="border-b-2 border-camel font-bold text-foreground">{s.name}</span>
                  <Chip state={s.state === "archived" ? "archived" : s.state} />
                </div>
                {group.labelled ? null : (
                  <span className="font-mono text-[10.5px] text-muted">
                    {s.mailboxEmail ?? "no sending mailbox yet"}
                  </span>
                )}
                <DotStrip counts={s.counts} />
                <div className="mt-1 flex flex-wrap gap-3 text-[11.5px] text-muted">
                  {s.inPlay === 0 && s.state === "draft" ? (
                    <span>starts when you say so</span>
                  ) : (
                    <>
                      <span><b className="tabular-nums text-foreground">{s.inPlay}</b> in play</span>
                      <span><b className="tabular-nums text-foreground">{s.counts.replied}</b> replied</span>
                      <span><b className="tabular-nums text-foreground">{s.counts.finished_no_reply}</b> in the cracks</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </section>
        ))}

        {sequences.length > 0 ? <Legend /> : null}
      </div>
    </>
  );
}
