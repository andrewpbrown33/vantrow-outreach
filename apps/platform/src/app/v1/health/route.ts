/** `GET /v1/health` — the family console's liveness probe.
 *
 *  Nudgerow's seat in the Vantrow family console (getvantrow.com) is a card
 *  that pulls this endpoint and /v1/metrics. The hub's reader
 *  (vantrow-web lib/family/connect.ts) is deliberately tolerant: it requires
 *  only `status`, ignores everything else, and turns any failure into an
 *  honest "not connected" rather than a guess. So this stays small and always
 *  answers in the same shape.
 *
 *  Unauthenticated by the vantrow-connect spec, which is why it says nothing
 *  a stranger could use: no counts, no names, no version of anything private.
 *  Whether the database is reachable is the one useful bit, and that is
 *  already visible to anyone who can load the sign-in page. */

import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  let database = "ok";
  try {
    await getPool().query("select 1");
  } catch {
    // Degraded, not down: the card should show the brand as answering but
    // unwell, which is a different thing from unreachable.
    database = "unavailable";
  }
  return NextResponse.json(
    {
      status: database === "ok" ? "ok" : "degraded",
      service: "nudgerow",
      database,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
