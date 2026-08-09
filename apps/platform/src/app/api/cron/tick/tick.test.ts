/** The heartbeat's contract: it is locked by default, it reports what it did,
 *  and one broken job never silences the others. These run without a database
 *  by exercising the auth gate and the report/isolation shape. */

import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
});

async function callTick(headers: Record<string, string> = {}) {
  const { GET } = await import("./route");
  return GET(new Request("https://app.nudgerow.com/api/cron/tick", { headers }));
}

describe("cron tick auth", () => {
  it("is LOCKED when CRON_SECRET is unset — never open by default", async () => {
    delete process.env.CRON_SECRET;
    const res = await callTick({ authorization: "Bearer anything" });
    expect(res.status).toBe(401);
  });

  it("rejects a missing or wrong bearer token", async () => {
    process.env.CRON_SECRET = "s3cret";
    expect((await callTick()).status).toBe(401);
    expect((await callTick({ authorization: "Bearer wrong" })).status).toBe(401);
    expect((await callTick({ authorization: "s3cret" })).status).toBe(401);
  });

  it("refuses to run without a database rather than pretending to work", async () => {
    process.env.CRON_SECRET = "s3cret";
    delete process.env.SUPABASE_DB_URL;
    await expect(callTick({ authorization: "Bearer s3cret" }))
      .rejects.toThrow(/SUPABASE_DB_URL/);
  });
});

describe("cron tick reporting", () => {
  it("reports each job, and a failing job yields 207 with the error named", async () => {
    process.env.CRON_SECRET = "s3cret";
    process.env.SUPABASE_DB_URL = "postgres://unused";
    delete process.env.GOOGLE_OAUTH_CLIENT_ID; // Gmail jobs skip, explicitly
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    vi.doMock("../../../../lib/db", () => ({
      getPool: () => ({ query: async () => ({ rows: [], rowCount: 0 }) }),
    }));
    // Connect drain blows up; the tick must still answer, and say why.
    vi.doMock("@vantrow/connect", () => ({
      drainOutbox: async () => { throw new Error("endpoint table missing"); },
    }));

    const res = await callTick({ authorization: "Bearer s3cret" });
    expect(res.status).toBe(207);
    const body = await res.json();
    expect(body.inbound).toContain("skipped");
    expect(body.sweep).toContain("skipped");
    expect(body.errors.join(" ")).toContain("endpoint table missing");
    expect(body.at).toBeTruthy();
  });

  it("returns 200 with a full report when every job succeeds", async () => {
    process.env.CRON_SECRET = "s3cret";
    process.env.SUPABASE_DB_URL = "postgres://unused";
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    vi.doMock("../../../../lib/db", () => ({
      getPool: () => ({ query: async () => ({ rows: [], rowCount: 0 }) }),
    }));
    vi.doMock("@vantrow/connect", () => ({
      drainOutbox: async () => ({
        attempted: 0, delivered: 0, retrying: 0, deadLettered: 0, skipped: 0,
      }),
    }));

    const res = await callTick({ authorization: "Bearer s3cret" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connect).toMatchObject({ attempted: 0, delivered: 0 });
    expect(body.errors).toBeUndefined();
  });
});
