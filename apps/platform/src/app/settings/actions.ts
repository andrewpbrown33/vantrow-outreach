"use server";

import { revalidatePath } from "next/cache";
import { inviteToWorkspace, revokeInvite } from "../../lib/queries";
import { requireOwner } from "../../lib/workspace";

/** Like every server action here: the workspace comes from the session, never
 *  from the form. A form field is an attacker-controlled string.
 *
 *  Who gets in is the owner's decision — a member cannot invite, and cannot
 *  invite an owner least of all. */

export async function inviteAction(formData: FormData): Promise<void> {
  const { workspaceId, user } = await requireOwner("/settings");
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "member") === "owner"
    ? "owner" as const : "member" as const;

  const out = await inviteToWorkspace(workspaceId, email, role, user.userId);
  revalidatePath("/settings");
  if (!out.ok) {
    const { redirect } = await import("next/navigation");
    redirect(`/settings?invite=${out.why}`);
  }
  const { redirect } = await import("next/navigation");
  redirect(`/settings?invite=sent&detail=${encodeURIComponent(email.trim())}`);
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const { workspaceId } = await requireOwner("/settings");
  const email = String(formData.get("email") ?? "");
  if (email) await revokeInvite(workspaceId, email);
  revalidatePath("/settings");
}
