/** Real-Postgres test harness (phase-4 §1: the invariant suite runs against
 *  real Postgres, never mocks — the claims are about transactional behavior).
 *
 *  Vitest runs test files in separate worker processes, so provisioning must
 *  be concurrency-safe: each worker gets its OWN database (named by pid),
 *  created under an advisory lock on the admin connection; the cluster start
 *  tolerates "already running" races.
 *
 *  Resolution order for the admin connection:
 *   1. DATABASE_URL (CI's postgres service, or a dev's own database)
 *   2. The machine's Debian-style cluster (pg_ctlcluster 16 main)
 *  Anything else: the suite SKIPS locally but hard-fails under CI=true, so the
 *  invariants can never silently stop being checked where it matters. */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const WORKER_DB = `nudgerow_engine_test_${process.pid}`;
const PROVISION_LOCK = 424_242;

function sh(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function migrationsDir(): string {
  // packages/engine/src -> repo root/supabase/migrations
  return join(HERE, "..", "..", "..", "supabase", "migrations");
}

async function applyMigrations(url: string): Promise<void> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const files = readdirSync(migrationsDir())
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const f of files) {
      await client.query(readFileSync(join(migrationsDir(), f), "utf8"));
    }
    // Supabase provisions the client roles itself; local clusters need a
    // stand-in for RLS tests. Idempotent.
    await client.query(`
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated')
        then create role authenticated nologin; end if;
      end $$;
      grant usage on schema public to authenticated;
      grant select, insert, update, delete
        on all tables in schema public to authenticated;
    `);
  } finally {
    await client.end();
  }
}

/** Start the Debian cluster; a concurrent worker winning the race is success. */
function ensureClusterUp(): void {
  const online = (): boolean => {
    try { return sh("pg_lsclusters", ["--no-header"]).includes(" online"); }
    catch { return false; }
  };
  if (online()) return;
  try {
    sh("pg_ctlcluster", ["16", "main", "start"]);
  } catch (err) {
    // Another worker may be starting it right now; poll briefly before
    // declaring failure.
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      if (online()) return;
      execFileSync("sleep", ["0.5"]);
    }
    throw err;
  }
}

async function canConnect(url: string): Promise<boolean> {
  const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    try { await c.end(); } catch { /* already closed */ }
    return false;
  }
}

/** Mint this worker's database from the admin connection, serialized by an
 *  advisory lock so concurrent workers can't trip CREATE DATABASE races. */
async function mintWorkerDb(adminUrl: string): Promise<string> {
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await admin.query("select pg_advisory_lock($1)", [PROVISION_LOCK]);
    await admin.query(`drop database if exists ${WORKER_DB} with (force)`);
    await admin.query(`create database ${WORKER_DB}`);
    await admin.query("select pg_advisory_unlock($1)", [PROVISION_LOCK]);
  } finally {
    await admin.end();
  }
  const url = new URL(adminUrl);
  url.pathname = `/${WORKER_DB}`;
  return url.toString();
}

let provisioned: string | null | undefined;

/** Returns a connection URL to this worker's own migrated test database, or
 *  null when no Postgres is reachable (suite skips — loudly, never in CI). */
export async function provisionTestDb(): Promise<string | null> {
  if (provisioned !== undefined) return provisioned;
  try {
    let adminUrl = process.env.DATABASE_URL;
    if (!adminUrl) {
      adminUrl = "postgres://postgres:postgres@127.0.0.1:5432/postgres";
      // Vitest runs each test file in its own worker, so several processes hit
      // this bootstrap at once. Probe first and only shell out if we must —
      // concurrent `su postgres` calls fail transiently, and a silent skip
      // would quietly stop checking the invariants.
      for (let attempt = 0; !(await canConnect(adminUrl)); attempt++) {
        if (attempt >= 5) throw new Error("postgres unreachable after bootstrap attempts");
        try {
          ensureClusterUp();
          sh("su", ["postgres", "-c",
            `psql -v ON_ERROR_STOP=1 -c "alter user postgres password 'postgres'"`]);
        } catch {
          // Another worker is mid-bootstrap; wait and re-probe.
        }
        execFileSync("sleep", ["1"]);
      }
    }
    const url = await mintWorkerDb(adminUrl);
    await applyMigrations(url);
    provisioned = url;
    return provisioned;
  } catch (err) {
    if (process.env.CI) {
      throw new Error(
        "engine invariant suite requires Postgres in CI (set DATABASE_URL " +
        "or provide a service container): " + String(err),
      );
    }
    console.warn(
      "[engine tests] no Postgres reachable — invariant suite SKIPPED locally. " +
      "Set DATABASE_URL to run it. (" + String(err).split("\n")[0] + ")",
    );
    provisioned = null;
    return provisioned;
  }
}
