import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@vantrow/brand";
import { routes } from "../../../lib/nav";

export const metadata: Metadata = {
  title: "You're on the list",
  description: `Early-access confirmation for ${brand.name}.`,
  // A post-submit page has no search value; keep it out of the index while
  // remaining a countable conversion URL for ad platforms.
  robots: { index: false, follow: true },
};

/** The dedicated conversion URL. Ad-platform tags (if ads ever go live)
 *  belong on THIS page only — the form redirects here on a successful signup,
 *  and the first-party beacon logs the pageview either way. */
export default function EarlyAccessThanksPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-accent">
        Early access
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-brand-dark">
        You&rsquo;re on the list.
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
        We&rsquo;ll reach out personally &mdash; founding teams get a
        conversation, not a drip campaign. Meanwhile, two things worth a look:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={routes.product}
          className="rounded-md bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          What we&rsquo;re building
        </Link>
        <Link
          href={routes.pricing}
          className="rounded-md border border-brand px-6 py-3 text-base font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
        >
          Our pricing commitment
        </Link>
      </div>
    </section>
  );
}
