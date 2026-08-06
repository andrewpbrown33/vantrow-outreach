import { afterEach, describe, expect, it, vi } from "vitest";
import { getWaitlistStore, hashIp } from "./waitlist";
import { rateLimitAllow } from "./rate-limit";
import { POST } from "../app/api/waitlist/route";

/** Unit tests for the waitlist pipeline: adapter selection, IP hashing, rate
 *  limiting, and the /api/waitlist route handler (parse guard → honeypot →
 *  validate → store-or-503 → ok). Supabase writes are asserted against a
 *  mocked global fetch — no network, no filesystem. */

function post(body: unknown, ip: string): Promise<Response> {
  return POST(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const SUPA_ENV = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("hashIp", () => {
  it("returns a 16-char hex digest, stable per input, distinct across inputs", () => {
    const a = hashIp("203.0.113.5");
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(hashIp("203.0.113.5")).toBe(a);
    expect(hashIp("203.0.113.6")).not.toBe(a);
  });
});

describe("rateLimitAllow", () => {
  it("allows five hits per key per window, then refuses", () => {
    const key = `test-key-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimitAllow(key)).toBe(true);
    }
    expect(rateLimitAllow(key)).toBe(false);
  });
});

describe("getWaitlistStore", () => {
  it("selects the Supabase adapter when env vars are present", () => {
    vi.stubEnv("SUPABASE_URL", SUPA_ENV.SUPABASE_URL);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SUPA_ENV.SUPABASE_SERVICE_ROLE_KEY);
    const store = getWaitlistStore();
    expect(store?.constructor.name).toBe("SupabaseAdapter");
  });

  it("falls back to the file adapter outside production", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const store = getWaitlistStore();
    expect(store?.constructor.name).toBe("FileAdapter");
  });

  it("returns null in production without configuration (route then 503s)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(getWaitlistStore()).toBeNull();
  });
});

describe("POST /api/waitlist", () => {
  it("rejects malformed JSON with 400", async () => {
    const res = await post("not json {", "198.51.100.1");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_input" });
  });

  it("rejects a missing name or invalid email with 400", async () => {
    const res = await post({ name: "", email: "someone@example.com" }, "198.51.100.2");
    expect(res.status).toBe(400);
    const res2 = await post({ name: "Ada", email: "not-an-email" }, "198.51.100.3");
    expect(res2.status).toBe(400);
  });

  it("honeypot submissions pretend success and never write", async () => {
    vi.stubEnv("SUPABASE_URL", SUPA_ENV.SUPABASE_URL);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SUPA_ENV.SUPABASE_SERVICE_ROLE_KEY);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(
      { name: "Bot", email: "bot@example.com", website: "https://spam.example" },
      "198.51.100.4",
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("responds 503 waitlist_unconfigured in production without a store — never a silent success", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const res = await post(
      { name: "Ada Lovelace", email: "ada@example.com" },
      "198.51.100.5",
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "waitlist_unconfigured" });
  });

  it("saves a valid signup via the Supabase REST insert and returns ok", async () => {
    vi.stubEnv("SUPABASE_URL", SUPA_ENV.SUPABASE_URL);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SUPA_ENV.SUPABASE_SERVICE_ROLE_KEY);
    vi.spyOn(console, "log").mockImplementation(() => {}); // notify stub logs
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(
      {
        name: "Ada Lovelace",
        email: "ada@example.com",
        company: "Analytical Engines",
        teamSize: "1-5",
        currentSoftware: "Spreadsheets",
        wantsDemo: true,
        utmSource: "newsletter",
      },
      "198.51.100.6",
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe("https://example.supabase.co/rest/v1/waitlist_signups");
    const sent = JSON.parse(String(init.body));
    expect(sent).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      company: "Analytical Engines",
      team_size: "1-5",
      current_software: "Spreadsheets",
      wants_demo: true,
      source: "site",
      utm_source: "newsletter",
    });
    expect(sent.ip_hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("drops unknown team sizes rather than storing junk", async () => {
    vi.stubEnv("SUPABASE_URL", SUPA_ENV.SUPABASE_URL);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SUPA_ENV.SUPABASE_SERVICE_ROLE_KEY);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(
      { name: "Ada", email: "ada@example.com", teamSize: "a-zillion" },
      "198.51.100.7",
    );
    expect(res.status).toBe(200);
    const sent = JSON.parse(
      String((fetchMock.mock.calls[0]! as unknown as [string, RequestInit])[1].body),
    );
    expect(sent.team_size).toBeNull();
  });

  it("rate limits a single IP after five requests in the window", async () => {
    const ip = "198.51.100.99";
    let last: Response | null = null;
    for (let i = 0; i < 6; i++) {
      last = await post("{}", ip); // invalid submissions still consume the budget
    }
    expect(last!.status).toBe(429);
  });
});
