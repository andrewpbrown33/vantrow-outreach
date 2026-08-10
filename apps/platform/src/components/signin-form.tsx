"use client";

import { useActionState } from "react";
import { requestLinkAction, type SignInState } from "../app/signin/actions";
import { Notice, inputClass } from "./ui";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    requestLinkAction, {});

  if (state.sent) {
    return (
      <p className="mt-5 text-[13.5px] text-sub">
        If that address can get in, a sign-in link is on its way. It expires in an hour.
      </p>
    );
  }

  return (
    <form action={action} className="mt-5 grid gap-3">
      {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
      <input
        type="email" name="email" required autoFocus autoComplete="email"
        placeholder="you@yourcompany.com" aria-label="Email address"
        className={inputClass}
      />
      <button
        type="submit" disabled={pending}
        className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background"
      >
        {pending ? "Sending…" : "Email me a link"}
      </button>
    </form>
  );
}
