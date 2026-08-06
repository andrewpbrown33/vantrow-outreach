import type { Metadata } from "next";
import { brand } from "@vantrow/brand";
import { EarlyAccessForm } from "../../components/early-access-form";

export const metadata: Metadata = {
  title: "Early Access",
  description: `Join the ${brand.name} early-access list for founding teams — or request a live demo walk-through.`,
};

export default function EarlyAccessPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
        Get early access
      </h1>
      <p className="mt-4 text-lg text-muted">
        {brand.name} is pre-launch. We&rsquo;re onboarding a small group of
        founding teams to build against real pipelines &mdash; with founding
        terms locked before public launch and a direct line to the people
        building it. Tell us a little about your team and we&rsquo;ll reach out
        personally. Want a walk-through? Tick the demo box.
      </p>

      <div className="mt-10">
        <EarlyAccessForm />
      </div>
    </section>
  );
}
