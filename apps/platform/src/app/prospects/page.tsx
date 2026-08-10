import Link from "next/link";
import { AppBar } from "../../components/app-bar";
import { Chip, Empty, Monogram, PersonLink, inputClass } from "../../components/ui";
import { initialsOf } from "../../lib/feed";
import { countProspects, listProspects, type ProspectRow } from "../../lib/queries";
import { requireSession } from "../../lib/workspace";

export const dynamic = "force-dynamic";

/** People, as rows — the Pulse grammar generalised (no tables anywhere). */
export default async function ProspectsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { workspaceId } = await requireSession();
  const [rows, total] = await Promise.all([
    listProspects(workspaceId, 200, q ?? ""),
    countProspects(workspaceId),
  ]);

  return (
    <>
      <AppBar here="/prospects" trailing={<span>{total} in the workspace</span>} />
      <div className="px-4 pt-3.5 pb-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[21px] font-extrabold tracking-tight">Prospects</h1>
          <Link
            href="/prospects/import"
            className="ml-auto rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background no-underline"
          >
            Import
          </Link>
        </div>

        <form className="mt-3 max-w-md">
          <input
            name="q" defaultValue={q ?? ""} className={inputClass}
            placeholder="Search by name, address or company"
            aria-label="Search prospects"
          />
        </form>

        {rows.length === 0 ? (
          <div className="mt-4">
            <Empty title={q ? "Nobody matches that." : "No prospects yet."}>
              <Link href="/prospects/import" className="border-b-2 border-camel font-semibold text-sub no-underline">
                Import some
              </Link>
            </Empty>
          </div>
        ) : null}

        <div className="mt-2">
          {rows.map((p) => <ProspectLine key={p.id} row={p} />)}
        </div>

        {rows.length === 200 ? (
          <p className="mt-3 text-[12px] text-muted">
            Showing the 200 most recent. Search to narrow it.
          </p>
        ) : null}
      </div>
    </>
  );
}

function ProspectLine({ row }: { row: ProspectRow }) {
  const name = row.name ?? row.email;
  const blocked = row.suppressed || row.optedOut;
  return (
    <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-t border-line py-2.5 text-sm">
      <Monogram
        initials={initialsOf(name)}
        tone={blocked ? "bounced" : row.liveEnrollments > 0 ? "active" : "scheduled"}
        badge={blocked ? "!" : null}
      />
      <span>
        <PersonLink href={`/prospects?q=${encodeURIComponent(row.email)}`}>{name}</PersonLink>
        <span className="block text-xs text-muted">
          {[row.email, row.title, row.company, row.timezone].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="flex items-center gap-2">
        {row.suppressed ? <Chip state="bounced">Suppressed</Chip> : null}
        {row.optedOut && !row.suppressed ? <Chip state="bounced">Opted out</Chip> : null}
        {!blocked && row.liveEnrollments > 0 ? (
          <span className="text-[11.5px] text-muted">
            in {row.liveEnrollments} {row.liveEnrollments === 1 ? "sequence" : "sequences"}
          </span>
        ) : null}
      </span>
    </div>
  );
}
