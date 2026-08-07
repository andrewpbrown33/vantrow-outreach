import Link from "next/link";
import { brand } from "@vantrow/brand";
import { routes } from "../lib/nav";

/** Home. Copy rules: pre-launch honesty (design commitments, never shipped-
 *  feature claims — "designed to / built to / we're building"), no hype
 *  vocabulary, no deliverability promises, and no competitor named anywhere
 *  (founder decision 2026-08-07). Enforced by src/lib/site-copy-lint.test.ts. */

const pillars = [
  {
    title: "One queue, not a cockpit",
    body: "Every rep's day is designed to start in a single prioritized task list. Engagement re-ranks it — a reply or a burst of opens moves a prospect up the queue — so attention goes where the interest is, without anyone tuning dashboards.",
  },
  {
    title: "The cracks view",
    body: "Sequences end. Prospects stall. In most stacks those pile up unseen in a report nobody opens. We're building a cracks view that surfaces finished-without-reply and stalled prospects in the daily queue itself, so a person decides — follow up, re-enroll, or let go — instead of nobody noticing.",
  },
  {
    title: "Pricing you can see",
    body: "Our full price list will be published on this site at launch — no quote wall, no discovery call required to learn a number. Early-access teams lock founding terms before that happens.",
  },
  {
    title: "Deliverability as a foundation",
    body: "Sending happens through your team's own mailboxes, with domain-authentication checks, warmup-aware limits, and paced sending designed in from the start. No inbox-rate promises — nobody can honestly make them — just the fundamentals, treated seriously.",
  },
];

const crackBullets = [
  "Finished, no reply: surfaced the day the sequence ends — not in a month-end report.",
  "Stalled enrollments: paused, errored, and waiting states stay visible, each with the reason attached.",
  "Out-of-office is not a dead end: an OOO auto-reply is designed to pause the enrollment and show the return date.",
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">
              {brand.tagline}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
              Follow-ups your whole team can run &mdash; built so no prospect
              slips through the cracks
            </h1>
            <p className="mt-6 text-lg text-muted">
              {brand.name} is a sales-engagement platform being built around
              three ideas: sequences simple enough to trust, one daily queue
              that tells each rep exactly what&rsquo;s next, and a cracks view
              designed to surface every prospect whose sequence ended without a
              reply. Priced transparently &mdash; the full price list goes on
              this site at launch.
            </p>
            <p className="mt-4 text-sm font-medium text-muted">
              We&rsquo;re pre-launch, onboarding a small group of founding
              teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={routes.earlyAccess}
                className="rounded-md bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Get early access
              </Link>
              <Link
                href={routes.product}
                className="rounded-md border border-brand px-6 py-3 text-base font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
              >
                See what we&rsquo;re building
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section aria-labelledby="value-props-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2
            id="value-props-heading"
            className="text-3xl font-bold tracking-tight text-brand-dark"
          >
            What we&rsquo;re building, and why
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            The complaints that push lean teams off heavyweight sales platforms
            are the problems we set out to solve first.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {pillars.map((prop) => (
              <article
                key={prop.title}
                className="rounded-lg border border-foreground/10 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-brand-dark">
                  {prop.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">{prop.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Cracks-view hook */}
      <section
        id="cracks-view"
        aria-labelledby="cracks-view-heading"
        className="scroll-mt-20 bg-brand-dark text-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
            The part we care most about
          </p>
          <h2
            id="cracks-view-heading"
            className="mt-3 max-w-3xl text-3xl font-bold tracking-tight"
          >
            Never let a prospect slip through the cracks
          </h2>
          <p className="mt-4 max-w-2xl text-white/80">
            A sequence that ends with no reply isn&rsquo;t a failure &mdash;
            it&rsquo;s a decision waiting to be made. {brand.name} is designed
            to put finished-no-reply and stalled prospects on the queue itself,
            ranked and visible, until a human decides what happens next. This
            came straight from our first customer&rsquo;s top requirement, and
            we&rsquo;re building the product around it.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {crackBullets.map((item) => (
              <li key={item} className="rounded-lg bg-white/10 p-4 text-sm leading-6">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link
              href={routes.earlyAccess}
              className="inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition-colors hover:bg-white/90"
            >
              Get early access
            </Link>
          </p>
        </div>
      </section>

      {/* Early access CTA */}
      <section aria-labelledby="cta-heading" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2
            id="cta-heading"
            className="text-3xl font-bold tracking-tight text-brand-dark"
          >
            Founding teams shape the product
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            {brand.name} is onboarding a small group of teams who want outbound
            that&rsquo;s simple to run and honestly priced. Founding teams get
            a direct line to the people building it and founding terms locked
            before public launch.
          </p>
          <p className="mt-8">
            <Link
              href={routes.earlyAccess}
              className="inline-block rounded-md bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Get early access
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
