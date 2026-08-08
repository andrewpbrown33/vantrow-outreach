import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@vantrow/brand";
import { routes } from "../../lib/nav";

export const metadata: Metadata = {
  title: "About",
  description: `The story behind ${brand.name}, ${brand.endorsement}.`,
};

/** The family story. Sibling names (Eaverow, Parcelrow) are plain-text facts
 *  about the parent's portfolio, not brand tokens of this site — our own
 *  brand strings all come from @vantrow/brand. */
export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
        About {brand.name}
      </h1>
      <p className="mt-2 text-sm font-medium text-muted">
        {brand.name} is {brand.endorsement}
      </p>

      <div className="mt-8 space-y-6 leading-7 text-foreground">
        <p>
          Our parent company, {brand.parentName}, builds focused software
          companies for underserved operators &mdash; one trade, one tool,
          done properly. Eaverow came first: business software for roofing
          contractors. Parcelrow followed. {brand.name} is the third, built
          for the small, serious outbound teams that big-company sales
          platforms aren&rsquo;t shaped for.
        </p>
        <p>
          {brand.name} started as a real need, not a market thesis. Our first
          customer runs lean, personal outbound every day: a few seats, no
          revenue-operations department, and no patience for software that
          needs its own administrator. What they asked for was specific &mdash;
          sequences they could trust, one queue that says what&rsquo;s next,
          and the certainty that no prospect quietly slips through the cracks
          when a sequence ends without a reply. We&rsquo;re building exactly
          that, and we run our own outreach on it as we go.
        </p>
        <p>
          The {brand.parentName} thread runs through everything: pick an
          operator the incumbents overlook, build the focused version of the
          tool they actually use, price it transparently, and keep the
          marketing honest &mdash; including a public comparison that says
          plainly where the incumbent is ahead of us today. If that&rsquo;s the
          kind of software company you want to buy from, we&rsquo;d love to
          meet you.
        </p>
      </div>

      <p className="mt-6 text-sm text-muted">
        Curious about the family?{" "}
        <a
          href={brand.parentUrl}
          className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
        >
          Learn more about {brand.parentName}
        </a>
        .
      </p>

      <p className="mt-10">
        <Link
          href={routes.earlyAccess}
          className="inline-block rounded-md bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Get early access
        </Link>
      </p>
    </section>
  );
}
