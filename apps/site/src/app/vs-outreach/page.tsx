import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@vantrow/brand";
import {
  COMPARE_AS_OF,
  compareIntro,
  compareNote,
  compareRows,
  compareSources,
  compareSourcesPreamble,
  compareTitle,
  concededLabel,
  disclaimer,
} from "../../lib/claims";
import { routes } from "../../lib/nav";

/** The comparison page. ALL comparative copy comes from src/lib/claims.ts —
 *  the single source of truth that claims.test.ts runs legalLint over. Do not
 *  add claim text here directly. Nominative use only: plain text, no logos,
 *  no screenshots (checklist page-level rules). */

export const metadata: Metadata = {
  title: compareTitle,
  description: `How ${brand.name} compares to Outreach, capability by capability — factual, dated, and sourced, including where Outreach leads today.`,
};

export default function VsOutreachPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
        {brand.name} {compareTitle}
      </h1>

      <p className="mt-4 max-w-3xl text-lg text-muted">{compareIntro}</p>

      <p
        role="note"
        className="mt-8 max-w-3xl rounded-md border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-brand-dark"
      >
        {compareNote}
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Capability comparison between {brand.name} and Outreach, as of{" "}
            {COMPARE_AS_OF}
          </caption>
          <thead>
            <tr className="border-b border-foreground/20 align-bottom">
              <th scope="col" className="w-1/5 py-3 pr-4 font-semibold">
                Capability
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold text-brand">
                {brand.name}{" "}
                <span className="font-normal text-muted">(pre-launch)</span>
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold">
                Outreach{" "}
                <span className="font-normal text-muted">
                  (as of {COMPARE_AS_OF})
                </span>
              </th>
              <th scope="col" className="py-3 font-semibold">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row) => (
              <tr
                key={row.capability}
                className="border-b border-foreground/10 align-top"
              >
                <th
                  scope="row"
                  className="py-4 pr-4 text-left align-top font-semibold text-brand-dark"
                >
                  {row.capability}
                  {row.conceded ? (
                    <span className="mt-1 block text-xs font-medium uppercase tracking-wider text-brand-accent">
                      {concededLabel}
                    </span>
                  ) : null}
                </th>
                <td className="py-4 pr-4 leading-6 text-foreground">
                  {row.us}
                </td>
                <td className="py-4 pr-4 leading-6 text-muted">{row.them}</td>
                <td className="py-4 align-top">
                  <a
                    href={`#source-${row.note}`}
                    className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
                  >
                    [{row.note}]
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 border-t border-foreground/10 pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-dark">
          Sources
        </h2>
        <p className="mt-2 max-w-3xl text-xs text-muted">
          {compareSourcesPreamble}
        </p>
        <ol className="mt-4 space-y-2">
          {compareSources.map((s) => (
            <li
              key={s.note}
              id={`source-${s.note}`}
              className="scroll-mt-20 text-xs leading-5 text-muted"
            >
              <span className="font-semibold text-brand-dark">[{s.note}]</span>{" "}
              {s.text}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 rounded-lg border border-foreground/10 bg-white p-6 text-center shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-brand-dark">
          Want the simple side of this table?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          {brand.name} is onboarding founding teams now &mdash; early access
          first, public price list at launch.
        </p>
        <p className="mt-5">
          <Link
            href={routes.earlyAccess}
            className="inline-block rounded-md bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Get early access
          </Link>
        </p>
      </div>

      <p className="mt-10 border-t border-foreground/10 pt-6 text-xs text-muted">
        {disclaimer}
      </p>
    </section>
  );
}
