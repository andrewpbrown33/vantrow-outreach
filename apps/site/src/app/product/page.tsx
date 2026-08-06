import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@vantrow/brand";
import { routes } from "../../lib/nav";

export const metadata: Metadata = {
  title: "Product",
  description: `What ${brand.name} is building: email sequences, the daily queue and cracks view, templates with enforced personalization, deliverability foundations, three focused reports, and clean imports.`,
};

/** Product walk. The whole page is framed as design commitments — the product
 *  is pre-launch, so nothing here may read as a shipped-feature claim
 *  (protocol §8 / comparative-advertising checklist). Integration language is
 *  strictly "designed to integrate with", never a promise. */

interface ModuleSection {
  id: string;
  title: string;
  body: string;
  features: string[];
}

const moduleSections: ModuleSection[] = [
  {
    id: "sequences",
    title: "Sequences",
    body: "Email sequences with the scheduling controls real outbound needs — designed so the person who writes the emails can also run the tool.",
    features: [
      "Steps timed in days and hours — the units people actually think in",
      "Send windows and per-sequence schedules, so nothing goes out at 2am on a Sunday",
      "Holiday skips and quiet periods on a calendar you control",
      "Stop-on-reply designed to halt an enrollment the moment a prospect answers",
      "Out-of-office replies are designed to pause the enrollment and surface the return date",
      "Safe editing: live sequences are cloned before changes, so in-flight prospects never get a half-edited experience",
    ],
  },
  {
    id: "task-queue",
    title: "Daily queue & the cracks view",
    body: "One list per rep, re-ranked by engagement — with the prospects who would otherwise be forgotten surfaced right next to today's tasks.",
    features: [
      "A single prioritized daily task list per rep",
      "Engagement re-ranking: replies and opens move a prospect up the queue",
      "The cracks view: finished-without-reply and stalled prospects, surfaced until someone decides",
      "Every task explains why it exists — sequence step, manual add, or follow-up",
      "Log interactions that happen outside the platform — a call, a coffee, a conference hallway — so the queue and the sequence know about them",
      "A focused mode designed to hand you one task at a time until the list is done",
    ],
  },
  {
    id: "templates",
    title: "Templates & variables",
    body: "Reusable templates with merge variables — and personalization treated as a requirement, not a suggestion.",
    features: [
      "Team-shared templates and merge variables",
      "Missing-variable protection: a send with an unfilled variable is blocked and flagged — never sent broken, never skipped silently",
      "Send-block personalization: mark a section that must be hand-written per prospect, and the email waits until it is",
    ],
  },
  {
    id: "deliverability",
    title: "Deliverability foundations",
    body: "Email that comes from your team's own mailboxes and respects the limits that protect your domain. We won't promise inbox placement — no honest vendor can — so we sweat the fundamentals instead.",
    features: [
      "Sends go through your team's own connected mailboxes — designed to integrate with Google Workspace and Microsoft 365, pending each platform's verification process",
      "Domain-authentication checks (SPF, DKIM, DMARC) before sending starts; unverified domains are refused for your own protection",
      "Warmup-aware daily limits and paced sending, with provider caps treated as ceilings rather than targets",
      "One-click unsubscribe headers and suppression lists the send path cannot bypass",
    ],
  },
  {
    id: "reporting",
    title: "Reporting: three reports, on purpose",
    body: "The reports a lean team actually reads — not sixteen dashboards that need an analyst.",
    features: [
      "Bounces: which addresses bounced, and why",
      "Finished sequences: who reached the end without a reply — the feed for the cracks view",
      "Replies: what came back, by sequence and step",
      "CSV export on everything",
      "Data export covers sequence states, sequence metrics, and prospect lists — and deliberately excludes email bodies",
    ],
  },
  {
    id: "imports",
    title: "Imports",
    body: "Day one is a clean CSV import that tells you exactly what it did. Native CRM connections stay on the roadmap until they're real.",
    features: [
      "CSV import with field mapping and duplicate detection by email",
      "An import-run report: created, updated, skipped — with reasons",
      "Designed to integrate with the CRMs and tools you already use; we don't claim an integration before it's verified",
    ],
  },
];

const notInV1 = [
  "No phone system and no SMS. Our first customers asked us to skip telephony entirely — outside conversations get logged as interactions instead. If built-in calling matters to you today, we're honestly not your tool yet.",
  "No AI that acts without review. The platform is designed AI-native, but anything AI produces routes to a human before it reaches a prospect.",
  "No dashboard sprawl. Three reports. A fourth will have to earn its place.",
];

export default function ProductPage() {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
            What we&rsquo;re building &mdash; and what we&rsquo;re not
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            {brand.name} is pre-launch. Everything on this page is a design
            commitment for our first release, stated plainly &mdash; not a
            shipped-feature claim. When something ships, we&rsquo;ll say
            shipped.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {moduleSections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="scroll-mt-20 border-b border-foreground/10 py-10 last:border-b-0"
          >
            <h2
              id={`${section.id}-heading`}
              className="text-2xl font-bold tracking-tight text-brand-dark"
            >
              {section.title}
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              {section.body}
            </p>
            <ul className="mt-4 grid max-w-3xl gap-2 sm:grid-cols-2">
              {section.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span aria-hidden="true" className="mt-0.5 text-brand">
                    &#10003;
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section
          id="not-in-v1"
          aria-labelledby="not-in-v1-heading"
          className="scroll-mt-20 py-10"
        >
          <h2
            id="not-in-v1-heading"
            className="text-2xl font-bold tracking-tight text-brand-dark"
          >
            Deliberately not in v1
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            Scope is the product. Saying no is how the rest stays simple.
          </p>
          <ul className="mt-4 grid max-w-3xl gap-3">
            {notInV1.map((item) => (
              <li
                key={item}
                className="rounded-md border border-foreground/10 bg-white p-4 text-sm leading-6 text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark">
            Want to shape what ships first?
          </h2>
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
