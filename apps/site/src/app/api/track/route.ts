import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** First-party, cookieless page-view sink — a STUB this phase.
 *
 *  The PageViewBeacon posts {path, referrer, utm_source} here. Phase 2 ships
 *  no analytics storage (the only migration is the waitlist), so this route
 *  validates the shape and discards it; persistence lands with the analytics
 *  migration in a later phase without touching the client. Always 200 —
 *  analytics must never surface an error to a visitor. No cookies, no
 *  third-party scripts (family rule). */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json().catch(() => null)) as
      | { path?: unknown }
      | null;
    if (
      process.env.NODE_ENV !== "production" &&
      body &&
      typeof body.path === "string"
    ) {
      console.debug("[track:stub]", body.path);
    }
  } catch {
    // swallow — tracking must never affect the visitor
  }
  return NextResponse.json({ ok: true });
}
