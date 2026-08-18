import { AppBar } from "../../../components/app-bar";
import { SequenceForm } from "../../../components/sequence-form";
import { listCustomVariableKeys, listMailboxes } from "../../../lib/queries";
import { requireSession } from "../../../lib/workspace";

export const dynamic = "force-dynamic";

export default async function NewSequencePage() {
  const { workspaceId } = await requireSession();
  const [mailboxes, customVariables] = await Promise.all([
    listMailboxes(workspaceId),
    listCustomVariableKeys(workspaceId),
  ]);
  return (
    <>
      <AppBar here="/sequences" />
      <div className="px-4 pt-3.5 pb-12">
        <h1 className="text-[21px] font-extrabold tracking-tight">New sequence</h1>
        <SequenceForm mailboxes={mailboxes} customVariables={customVariables} />
      </div>
    </>
  );
}
