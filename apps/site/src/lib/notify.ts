import { brand } from "@vantrow/brand";

/** Founder notification via Resend's REST API — no SDK, matching the site's
 *  raw-fetch convention. Fire-and-forget: failures are swallowed (a missed
 *  notification must never affect a signup), and without RESEND_API_KEY it
 *  logs so local dev shows the flow. This is the notify STUB for Phase 2 —
 *  wiring the key is a deploy-time step (runbook 03/04 env table). */
export async function notifyFounder(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? brand.supportEmail;
  if (!key) {
    console.log(`[notify] (no RESEND_API_KEY) to=${to} subject="${subject}"\n${text}`);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? `${brand.name} <${brand.supportEmail}>`,
        to,
        subject,
        text,
      }),
      cache: "no-store",
    });
  } catch {
    // never let a notification failure surface
  }
}
