/** The platform's database handle.
 *
 *  Serverless functions come and go, so the pool is memoized on globalThis:
 *  without that, every invocation opens fresh connections and a busy minute
 *  exhausts Postgres' connection limit. Small max for the same reason — the
 *  work here is short transactions, not concurrency.
 *
 *  The engine runs as the SERVICE ROLE (it must bypass RLS to act for every
 *  workspace), so this connection string is a server-only secret and must
 *  never be imported into a client component. */

import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __nudgerowPool: Pool | undefined;
}

export function getPool(): Pool {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error(
      "SUPABASE_DB_URL is not set — the engine cannot run without a database " +
      "(service-role connection string; see runbook 04).",
    );
  }
  globalThis.__nudgerowPool ??= new Pool({
    connectionString: url,
    max: 4,
    idleTimeoutMillis: 10_000,
    // Supabase's pooler terminates idle sessions; fail fast instead of hanging
    // a cron invocation until the platform's own timeout.
    connectionTimeoutMillis: 8_000,
  });
  return globalThis.__nudgerowPool;
}
