import type { Metadata } from "next";
import { brand } from "@vantrow/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${brand.name}.`,
};

/* TODO(legal): structural draft; counsel must review before launch. Entire
   page is a placeholder — do not treat any section below as legally
   sufficient. */

const sections: { heading: string; body: string }[] = [
  {
    heading: "Information we collect",
    body: "Draft: information you submit through our early-access form (such as your name, email address, company, and team size) and limited technical information (such as a truncated, hashed form of your IP address used for abuse prevention, and first-party, cookieless page-view counts).",
  },
  {
    heading: "How we use your information",
    body: "Draft: to contact you about early access and demos, to operate and improve the product, and to prevent abuse of our forms. We do not sell your personal information.",
  },
  {
    heading: "How we share your information",
    body: "Draft: with service providers that host our infrastructure and store form submissions, under agreements that restrict their use of your data.",
  },
  {
    heading: "Data retention",
    body: "Draft: we keep early-access submissions for as long as needed to run the early-access program, and delete them on request.",
  },
  {
    heading: "Your rights and choices",
    body: "Draft: you may request access to, correction of, or deletion of your personal information by emailing us.",
  },
  {
    heading: "Security",
    body: "Draft: we use reasonable technical and organizational measures to protect the information we hold.",
  },
  {
    heading: "Children's privacy",
    body: "Draft: our services are for businesses and are not directed to children under 13 (or the applicable age in your jurisdiction).",
  },
  {
    heading: "Changes to this policy",
    body: "Draft: we will post any changes to this policy on this page with an updated effective date.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
        Privacy Policy
      </h1>
      <p className="mt-3 rounded-md border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand-dark">
        Draft &mdash; this policy is a placeholder pending review by counsel
        and is not yet in effect.
      </p>
      <p className="mt-6 text-sm text-muted">
        {/* TODO(legal): effective date */}
        Effective date: to be determined.
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-brand-dark">
              {section.heading}
            </h2>
            {/* TODO(legal): counsel-approved language for this section */}
            <p className="mt-2 leading-7 text-muted">{section.body}</p>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-semibold text-brand-dark">Contact us</h2>
          <p className="mt-2 leading-7 text-muted">
            Questions about this policy? Email{" "}
            <a
              href={`mailto:${brand.supportEmail}`}
              className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
            >
              {brand.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </section>
  );
}
