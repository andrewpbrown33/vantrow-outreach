import { redirect } from "next/navigation";
import { Mark } from "../../components/mark";
import { SignInForm } from "../../components/signin-form";
import { Notice } from "../../components/ui";
import { currentUser } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: { searchParams: Promise<{ denied?: string; error?: string }> }) {
  const { denied, error } = await searchParams;
  // A valid session that was denied a workspace must not bounce back here in a
  // loop — only a signed-in user with somewhere to go gets redirected.
  if (!denied && !error && (await currentUser())) redirect("/");

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        <Mark className="text-sub" size={26} />
        <span className="text-sub">nudgerow</span>
      </span>

      {denied ? (
        <div className="mt-5">
          <Notice tone="bad">
            That address is signed in but is not a member of any workspace.
          </Notice>
        </div>
      ) : null}
      {error ? <div className="mt-5"><Notice tone="bad">{error}</Notice></div> : null}

      <SignInForm />

      {denied ? (
        <form action="/auth/signout" method="post" className="mt-4">
          <button type="submit" className="text-[12.5px] font-semibold text-muted">
            Sign out
          </button>
        </form>
      ) : null}
    </main>
  );
}
