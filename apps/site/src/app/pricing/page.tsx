import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@vantrow/brand";
import { routes } from "../../lib/nav";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${brand.name} pricing: the full price list will be published on this page at launch — no quote wall. Founding terms for early-access teams.`,
};

/** Pricing. There are deliberately NO numbers or tiers on this page: the
 *  product is pre-launch and inventing placeholder prices would be exactly
 *  the fabricated-claims failure the program forbids. The page sells the
 *  transparency commitment itself. The unnamed-incumbent line is sourced on
 *  the research log (S-PRC-001); no competitor is named on the site. */

const commitments = [
  "The full price list, published on this page at launch — visible before you ever talk to us",
  "No quote wall: the price you see is the price",
  "Founding terms for early-access teams, locked before public launch",
];

const designIntents = [
  "A monthly option alongside annual billing",
  "Self-serve start — no mandatory sales call",
  "No seat minimums",
  "AI features included in the price, not metered behind separate credits",
  "Cancellation that doesn't require a phone call or a notice window",
];

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
        Pricing you&rsquo;ll see before anyone calls you
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        We&rsquo;re pre-launch, so there are no numbers on this page yet &mdash;
        and we won&rsquo;t invent placeholder tiers to look finished. What we
        can publish now is the commitment itself.
      </p>

      <div className="mt-10 rounded-lg border border-brand/20 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-dark">
          What we&rsquo;re committing to
        </h2>
        <ul className="mt-4 grid gap-2">
          {commitments.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <span aria-hidden="true" className="mt-0.5 text-brand">
                &#10003;
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-lg border border-foreground/10 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-dark">
          What we&rsquo;re designing toward
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          These are design intentions we&rsquo;re validating with founding
          customers &mdash; published so you can hold us to the spirit of them,
          not fine print to hide behind.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {designIntents.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <span aria-hidden="true" className="mt-0.5 text-brand">
                &rarr;
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="text-xl font-bold text-brand-dark">
          Why lead with transparency?
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Because in this category, prices are famously hard to see &mdash;
          quote requests, sales calls, and per-seat math that only appears in
          the contract. We think the price of software should be readable
          before the first conversation, and ours will be: published on this
          page the day the platform launches.
        </p>
      </div>

      <div className="mt-12 rounded-lg border-2 border-brand-accent bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-brand-dark">
          Early access comes with founding terms
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Teams that join before launch get a direct line to the people
          building {brand.name}, hands-on onboarding, and founding terms locked
          in before the public price list goes live.
        </p>
        <p className="mt-6">
          <Link
            href={routes.earlyAccess}
            className="inline-block rounded-md bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Get early access
          </Link>
        </p>
      </div>

      <p className="mt-8 max-w-2xl text-sm text-muted">
        Questions about pricing plans or founding terms?{" "}
        <a
          href={`mailto:${brand.supportEmail}`}
          className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
        >
          {brand.supportEmail}
        </a>
      </p>
    </section>
  );
}
