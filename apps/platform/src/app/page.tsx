import Link from "next/link";
import { AppBar } from "../components/app-bar";
import { PulseFeed } from "../components/pulse-feed";
import { DotStrip, Empty, SequenceLink, StateStats } from "../components/ui";
import { buildFeed } from "../lib/feed";
import {
  countQueuedToday, listFeed, listMailboxes, listSequenceSummaries,
  workspaceStateCounts,
} from "../lib/queries";
import { requireSession } from "../lib/workspace";

export const dynamic = "force-dynamic";

/** Home: the feed is the primary view, the sequences overview rides beside it
 *  (R-4D-14). Both are the same workspace's live rows — the side panel is the
 *  Sequences page's summary, not a second source of truth. */
export default async function Home() {
  const { workspaceId } = await requireSession();
  const [rows, sequences, counts, queuedToday, mailboxes] = await Promise.all([
    listFeed(workspaceId),
    listSequenceSummaries(workspaceId),
    workspaceStateCounts(workspaceId),
    countQueuedToday(workspaceId),
    listMailboxes(workspaceId),
  ]);
  const items = buildFeed(rows);
  const connected = mailboxes.filter((m) => m.connected).length;

  return (
    <>
      <AppBar here="/" trailing={<MailboxCue connected={connected} total={mailboxes.length} />} />
      <div className="px-4 pt-3.5 pb-8">
        <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_280px]">
          {items.length === 0 && sequences.length === 0 ? (
            <FirstRun />
          ) : (
            <PulseFeed items={items} queuedToday={queuedToday} />
          )}

          <aside className="rounded-xl border border-line bg-panel px-3.5 py-3">
            <div className="flex items-baseline justify-between text-[13.5px] font-extrabold">
              Sequences
              <Link href="/sequences" className="border-b-2 border-camel text-[11.5px] font-semibold text-sub no-underline">
                All →
              </Link>
            </div>

            {sequences.length === 0 ? (
              <p className="mt-2 text-[12.5px] text-muted">
                <Link href="/sequences/new" className="border-b-2 border-camel font-semibold text-sub no-underline">
                  Build the first one
                </Link>
              </p>
            ) : null}

            {sequences.slice(0, 6).map((s) => (
              <div key={s.id} className="mt-2 border-t border-line pt-2.5 first:mt-0.5 first:border-t-0 first:pt-0">
                <SequenceLink href={`/sequences/${s.id}`}>{s.name}</SequenceLink>
                <DotStrip counts={s.counts} />
                <div className="mt-0.5 text-[11px] text-muted">
                  <b className="tabular-nums text-sub">{s.inPlay}</b> in play ·{" "}
                  <b className="tabular-nums text-sub">{s.counts.replied}</b> replied ·{" "}
                  <b className="tabular-nums text-sub">{s.counts.finished_no_reply}</b> in the cracks
                </div>
              </div>
            ))}

            <StateStats counts={counts} />
          </aside>
        </div>
      </div>
    </>
  );
}

function MailboxCue({ connected, total }: { connected: number; total: number }) {
  return (
    <Link href="/settings" className="text-muted no-underline">
      {connected} of {total} mailboxes connected
    </Link>
  );
}

function FirstRun() {
  return (
    <Empty title="Nothing has happened yet.">
      <p>
        The heartbeat runs every minute. It will have something to show here once a
        sequence has people in it.
      </p>
      <p className="mt-3 flex flex-wrap justify-center gap-4">
        <Link href="/prospects/import" className="border-b-2 border-camel font-semibold text-sub no-underline">
          Import prospects
        </Link>
        <Link href="/sequences/new" className="border-b-2 border-camel font-semibold text-sub no-underline">
          Build a sequence
        </Link>
      </p>
    </Empty>
  );
}
