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
 *  already visible to anyone who can load the sign-in page.
 *
 *  The probe is memoised for ten seconds. The endpoint is open, the pool
 *  has four connections, and a stranger reloading it in a loop must not be
 *  able to hold every one of them while the heartbeat waits. Ten seconds is
 *  well inside the console's own refresh. */

import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const dynamic = "force-dynamic";

type DatabaseStatus = "ok" | "unavailable";

const PROBE_TTL_MS = 10_000;
let probe: { at: number; database: DatabaseStatus } | null = null;
let inflight: Promise<DatabaseStatus> | null = null;

async function databaseStatus(): Promise<DatabaseStatus> {
  const now = Date.now();
  if (probe && now - probe.at < PROBE_TTL_MS) return probe.database;
  // A burst inside the same instant shares one probe rather than each
  // taking a connection.
  inflight ??= (async () => {
    let database: DatabaseStatus = "ok";
    try {
      await getPool().query("select 1");
    } catch {
      // Degraded, not down: the card should show the brand as answering but
      // unwell, which is a different thing from unreachable.
      database = "unavailable";
    }
    probe = { at: now, database };
    return database;
  })().finally(() => { inflight = null; });
  return inflight;
}

export async function GET(): Promise<NextResponse> {
  const database = await databaseStatus();
  return NextResponse.json(
    {
      status: database === "ok" ? "ok" : "degraded",
      service: "nudgerow",
      database,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
