/** Where this app lives, for the URLs it hands to other parties: the Gmail
 *  redirect_uri and the sign-in link's callback.
 *
 *  In production it is APP_ORIGIN, full stop. Deriving it from the request's
 *  Host / X-Forwarded-Host headers means a URL that reaches Google, or lands
 *  in someone's inbox, is built from a value the client sent — and the OAuth
 *  redirect_uri in particular must match one string registered with Google,
 *  so it should come from configuration, not from whoever is asking.
 *
 *  Outside production (local dev, the test suite) the header-derived origin
 *  stays, so nothing needs a variable to run on localhost. */

import { headers } from "next/headers";

export const APP_ORIGIN_ENV = "APP_ORIGIN";

export async function appOrigin(
  env: Record<string, string | undefined> = process.env,
): Promise<string> {
  const configured = env[APP_ORIGIN_ENV]?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (env.NODE_ENV === "production") {
    throw new Error(
      `${APP_ORIGIN_ENV} is not set — set it to this app's public origin, ` +
      `e.g. https://app.nudgerow.com (runbook 08 §2), and redeploy.`,
    );
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
