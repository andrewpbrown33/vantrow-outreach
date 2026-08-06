"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** First-party, cookieless page-view beacon. Fires once per pathname change
 *  to /api/track (a stub sink this phase — see that route). Best-effort:
 *  sendBeacon never blocks navigation and failures are silent. No cookies,
 *  no third-party scripts. */
export function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    try {
      // window.location.search (not useSearchParams) — reading it inside the
      // effect avoids a Suspense boundary and captures the landing UTM, which
      // is exactly the attribution moment.
      const utmSource = new URLSearchParams(window.location.search).get("utm_source");
      const payload = JSON.stringify({
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        utm_source: utmSource ? utmSource.slice(0, 128) : null,
      });
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", blob);
      } else {
        fetch("/api/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
      }
    } catch {
      // never let analytics affect the page
    }
  }, [pathname]);

  return null;
}
