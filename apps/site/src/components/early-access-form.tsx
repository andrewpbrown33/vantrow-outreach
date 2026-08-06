"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@vantrow/brand";

type FormStatus = "idle" | "submitting" | "success" | "unconfigured" | "error";

const TEAM_SIZES = ["1-5", "6-15", "16-50", "50+"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The merged waitlist + demo-request form. Posts to /api/waitlist; a
 *  successful signup redirects to the dedicated conversion URL. */
export function EarlyAccessForm() {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    const errors: { name?: string; email?: string } = {};
    if (!name) errors.name = "Please enter your name.";
    if (!email) {
      errors.email = "Please enter your email address.";
    } else if (!EMAIL_RE.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    setFieldErrors(errors);
    if (errors.name || errors.email) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: String(data.get("company") ?? "").trim(),
          teamSize: String(data.get("teamSize") ?? ""),
          currentSoftware: String(data.get("currentSoftware") ?? "").trim(),
          wantsDemo: data.get("wantsDemo") === "on",
          website: String(data.get("website") ?? ""),
          // Attribution: landing UTMs ride along so a conversion can be tied
          // back to its campaign later (columns exist in the migration now).
          utmSource: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
          utmMedium: new URLSearchParams(window.location.search).get("utm_medium") ?? undefined,
          utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
        }),
      });

      if (res.ok) {
        form.reset();
        // A distinct URL is what ad platforms can count as a conversion —
        // the in-place success state stays as a fallback render.
        router.push("/early-access/thanks");
        setStatus("success");
      } else if (res.status === 503) {
        setStatus("unconfigured");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-lg border border-brand/30 bg-brand/5 p-8 text-center"
      >
        <h2 className="text-2xl font-bold text-brand-dark">
          You&rsquo;re on the list
        </h2>
        <p className="mt-2 text-muted">
          Thanks &mdash; we&rsquo;ll be in touch soon about early access.
        </p>
      </div>
    );
  }

  const mailtoFallback = (
    <p className="mt-2 text-sm">
      Email us at{" "}
      <a
        href={`mailto:${brand.supportEmail}`}
        className="font-medium text-brand underline underline-offset-2 hover:text-brand-dark"
      >
        {brand.supportEmail}
      </a>{" "}
      and we&rsquo;ll add you to the list ourselves.
    </p>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          className="mt-1 w-full rounded-md border border-foreground/20 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {fieldErrors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-700">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Work email <span aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className="mt-1 w-full rounded-md border border-foreground/20 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {fieldErrors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-700">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium">
          Company
        </label>
        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          className="mt-1 w-full rounded-md border border-foreground/20 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div>
        <label htmlFor="teamSize" className="block text-sm font-medium">
          Team size
        </label>
        <select
          id="teamSize"
          name="teamSize"
          defaultValue=""
          className="mt-1 w-full rounded-md border border-foreground/20 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="">Select&hellip;</option>
          {TEAM_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="currentSoftware" className="block text-sm font-medium">
          What do you run outbound with today?
        </label>
        <input
          id="currentSoftware"
          name="currentSoftware"
          type="text"
          placeholder="Spreadsheets, another platform, plain inboxes…"
          className="mt-1 w-full rounded-md border border-foreground/20 bg-white px-3 py-2 text-sm placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="wantsDemo"
          name="wantsDemo"
          type="checkbox"
          className="h-4 w-4 rounded border-foreground/30 accent-[var(--brand-primary)]"
        />
        <label htmlFor="wantsDemo" className="text-sm">
          I&rsquo;d like a live demo walk-through
        </label>
      </div>

      {/* Honeypot — hidden from humans, present for naive bots. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {status === "unconfigured" && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-medium">
            Signups are temporarily unavailable &mdash; but we still want to
            hear from you.
          </p>
          {mailtoFallback}
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-medium">
            Something went wrong and your signup was not saved. Please try
            again.
          </p>
          {mailtoFallback}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-md bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Request early access"}
      </button>
    </form>
  );
}
