/** Real-Postgres test harness (phase-4 §1: the invariant suite runs against
 *  real Postgres, never mocks — the claims are about transactional behavior).
 *
 *  Resolution order:
 *   1. DATABASE_URL (CI's postgres service, or a dev's own database)
 *   2. The machine's Debian-style cluster (pg_ctlcluster 16 main) — present in
 *      the dev containers this repo builds in
 *  Anything else: the suite SKIPS locally but hard-fails under CI=true, so the
 *  invariants can never silently stop being checked where it matters. */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const TEST_DB = "nudgerow_engine_test";

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

let provisioned: string | null | undefined;

/** Returns a connection URL to a migrated test database, or null when no
 *  Postgres is reachable (suite skips — loudly, and never under CI). */
export async function provisionTestDb(): Promise<string | null> {
  if (provisioned !== undefined) return provisioned;

  if (process.env.DATABASE_URL) {
    await applyMigrations(process.env.DATABASE_URL);
    provisioned = process.env.DATABASE_URL;
    return provisioned;
  }

  try {
    // Debian cluster tooling: start the machine's cluster and mint a clean DB.
    const clusters = sh("pg_lsclusters", ["--no-header"]);
    if (!clusters.trim()) throw new Error("no postgres cluster");
    const started = clusters.includes(" online");
    if (!started) sh("pg_ctlcluster", ["16", "main", "start"]);
    const su = (sql: string) =>
      sh("su", ["postgres", "-c", `psql -v ON_ERROR_STOP=1 -c "${sql}"`]);
    su("alter user postgres password 'postgres'");
    su(`drop database if exists ${TEST_DB} with (force)`);
    su(`create database ${TEST_DB}`);
    const url = `postgres://postgres:postgres@127.0.0.1:5432/${TEST_DB}`;
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
