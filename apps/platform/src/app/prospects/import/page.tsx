import { AppBar } from "../../../components/app-bar";
import { ImportForm } from "../../../components/import-form";
import { listSequenceSummaries } from "../../../lib/queries";
import { requireSession } from "../../../lib/workspace";

export const dynamic = "force-dynamic";

export default async function ImportPage({
  searchParams,
}: { searchParams: Promise<{ sequence?: string }> }) {
  const { sequence } = await searchParams;
  const { workspaceId } = await requireSession();
  const sequences = await listSequenceSummaries(workspaceId);
  const preselected = sequences.some((s) => s.id === sequence) ? sequence : undefined;

  return (
    <>
      <AppBar here="/prospects" />
      <div className="px-4 pt-3.5 pb-12">
        <h1 className="text-[21px] font-extrabold tracking-tight">Import prospects</h1>
        <ImportForm sequences={sequences} preselected={preselected} />
      </div>
    </>
  );
}
