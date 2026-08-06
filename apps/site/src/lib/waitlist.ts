import { createHash } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export interface WaitlistEntry {
  name: string;
  email: string;
  company?: string;
  teamSize?: string;
  currentSoftware?: string;
  wantsDemo: boolean;
  /** ISO 8601 timestamp. */
  createdAt: string;
  source: "site";
  /** Truncated SHA-256 hash of the client IP — never the raw address. */
  ip?: string;
  /** Landing UTMs for ads attribution (family pattern; columns exist from
   *  day one in supabase/migrations/0001_waitlist.sql). */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface WaitlistStore {
  save(entry: WaitlistEntry): Promise<void>;
}

/**
 * Returns a privacy-preserving form of a client IP: the first 16 hex chars
 * of its SHA-256 hash. Enough to correlate abuse, useless for identification.
 */
export function hashIp(rawIp: string): string {
  return createHash("sha256").update(rawIp).digest("hex").slice(0, 16);
}

/**
 * Persists signups to a Supabase Postgres table via PostgREST.
 * Dependency-free: plain fetch against the REST endpoint using the
 * service-role key (which bypasses RLS by design — see the migration).
 */
class SupabaseAdapter implements WaitlistStore {
  constructor(
    private readonly url: string,
    private readonly serviceRoleKey: string,
  ) {}

  async save(entry: WaitlistEntry): Promise<void> {
    const res = await fetch(
      `${this.url.replace(/\/$/, "")}/rest/v1/waitlist_signups`,
      {
        method: "POST",
        headers: {
          apikey: this.serviceRoleKey,
          Authorization: `Bearer ${this.serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          name: entry.name,
          email: entry.email,
          company: entry.company ?? null,
          team_size: entry.teamSize ?? null,
          current_software: entry.currentSoftware ?? null,
          wants_demo: entry.wantsDemo,
          source: entry.source,
          ip_hash: entry.ip ?? null,
          created_at: entry.createdAt,
          utm_source: entry.utmSource ?? null,
          utm_medium: entry.utmMedium ?? null,
          utm_campaign: entry.utmCampaign ?? null,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Supabase insert failed: ${res.status} ${res.statusText} ${body}`.trim(),
      );
    }
  }
}

/**
 * Development fallback: appends one JSON line per signup to
 * .data/waitlist.jsonl at the repository root.
 */
class FileAdapter implements WaitlistStore {
  async save(entry: WaitlistEntry): Promise<void> {
    const dataDir = path.join(findRepoRoot(), ".data");
    await mkdir(dataDir, { recursive: true });
    await appendFile(
      path.join(dataDir, "waitlist.jsonl"),
      JSON.stringify(entry) + "\n",
      "utf8",
    );
  }
}

/** Walks up from cwd to the pnpm workspace root; falls back to cwd. */
function findRepoRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

/**
 * Adapter selection:
 * - Supabase env vars present  → SupabaseAdapter (any environment)
 * - otherwise, non-production  → FileAdapter (local .data/waitlist.jsonl)
 * - otherwise                  → null (route responds 503 waitlist_unconfigured
 *                                — never a silent success)
 */
export function getWaitlistStore(): WaitlistStore | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return new SupabaseAdapter(url, key);
  if (process.env.NODE_ENV !== "production") return new FileAdapter();
  return null;
}
