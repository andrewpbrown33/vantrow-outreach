import type { Metadata } from "next";
import { brand } from "@vantrow/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${brand.name}.`,
};

/* TODO(legal): structural draft; counsel must review before launch. Entire
   page is a placeholder — do not treat any section below as legally
   sufficient. */

const sections: { heading: string; body: string }[] = [
  {
    heading: "Acceptance of terms",
    body: "Draft: by accessing this website or joining the early-access program, you agree to these terms.",
  },
  {
    heading: "Description of service",
    body: "Draft: we provide sales-engagement software for business teams, currently offered through a pre-launch early-access program. Features may change, break, or be removed during early access.",
  },
  {
    heading: "Early-access program",
    body: "Draft: early access is provided as-is for evaluation and collaboration. We may modify or end the program, and either party may end participation, at any time.",
  },
  {
    heading: "Accounts and acceptable use",
    body: "Draft: you are responsible for the accuracy of information you submit and for keeping your credentials secure. You may not misuse the service, use it to send unlawful communications, or attempt to access it by automated or unauthorized means.",
  },
  {
    heading: "Your compliance with messaging laws",
    body: "Draft: you are responsible for your own compliance with applicable email and marketing laws (such as consent, identification, and opt-out requirements) in the jurisdictions where you send.",
  },
  {
    heading: "Intellectual property",
    body: "Draft: the service, site, and all related content are owned by us or our licensors. You retain ownership of the data you submit.",
  },
  {
    heading: "Disclaimers",
    body: "Draft: the service is provided “as is” without warranties of any kind, express or implied.",
  },
  {
    heading: "Limitation of liability",
    body: "Draft: to the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    heading: "Termination",
    body: "Draft: we may suspend or terminate access for violation of these terms.",
  },
  {
    heading: "Governing law",
    body: "Draft: governing law and venue to be specified by counsel.",
  },
  {
    heading: "Changes to these terms",
    body: "Draft: we will post updated terms on this page with a new effective date.",
  },
];

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
        Terms of Service
      </h1>
      <p className="mt-3 rounded-md border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand-dark">
        Draft &mdash; these terms are a placeholder pending review by counsel
        and are not yet in effect.
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
            Questions about these terms? Email{" "}
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
