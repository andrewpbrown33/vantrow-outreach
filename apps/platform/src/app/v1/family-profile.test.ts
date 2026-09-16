/** The family console's view of Nudgerow.
 *
 *  getvantrow.com pulls these two endpoints to render this brand's card. The
 *  hub's reader is tolerant by design — any failure becomes an honest "not
 *  connected" — so the interesting cases here are the ones a tolerant reader
 *  would happily accept and shouldn't: an open metrics endpoint, or a card of
 *  zeros standing in for an unreachable database. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("../../lib/db", () => ({ getPool: () => ({ query }) }));

const { GET: health } = await import("./health/route");
const { GET: metrics } = await import("./metrics/route");

const ask = (key?: string) =>
  new Request("https://app.nudgerow.com/v1/metrics", {
    headers: key ? { authorization: `Bearer ${key}` } : {},
  });

const COUNTS = {
  workspaces: "3", mailboxes: "4", mailboxes_connected: "2",
  sequences_active: "1", in_play: "40", waiting: "111",
  sent_7d: "200", replies_7d: "9", bounces_7d: "3",
  unsubscribes_7d: "1", holds: "0",
};

afterEach(() => {
  query.mockReset();
  delete process.env.CONNECT_METRICS_KEY;
});

describe("GET /v1/health", () => {
  // The probe is memoised for ten seconds (module state), so each case
  // steps the clock past the window first and sees a fresh probe.
  const PROBE_TTL_MS = 10_000;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.advanceTimersByTime(PROBE_TTL_MS + 1);
  });
  afterEach(() => { vi.useRealTimers(); });

  it("answers ok when the database answers", async () => {
    query.mockResolvedValue({ rows: [{}] });
    const body = await (await health()).json();
    expect(body).toMatchObject({ status: "ok", service: "nudgerow", database: "ok" });
  });

  it("says degraded rather than throwing when the database is unreachable", async () => {
    query.mockRejectedValue(new Error("no route to host"));
    const res = await health();
    const body = await res.json();
    // Still 200 with a readable status: the card should show "answering but
    // unwell", which is not the same as unreachable.
    expect(res.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.database).toBe("unavailable");
  });

  it("tells a stranger nothing beyond liveness", async () => {
    query.mockResolvedValue({ rows: [{}] });
    const body = await (await health()).json();
    expect(Object.keys(body).sort()).toEqual(["database", "service", "status"]);
  });

  it("probes the database at most once every ten seconds — the pool is not a stranger's to drain", async () => {
    query.mockResolvedValue({ rows: [{}] });
    // A burst, and then a loop inside the window: one probe.
    await Promise.all([health(), health(), health()]);
    await health();
    expect(query).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(PROBE_TTL_MS - 1);
    await health();
    expect(query).toHaveBeenCalledTimes(1);
    // Past the window, it looks again — and reports what it now sees.
    vi.advanceTimersByTime(2);
    query.mockRejectedValue(new Error("connection refused"));
    const body = await (await health()).json();
    expect(query).toHaveBeenCalledTimes(2);
    expect(body.database).toBe("unavailable");
  });
});

describe("GET /v1/metrics", () => {
  it("is LOCKED when no key is configured — never open by default", async () => {
    query.mockResolvedValue({ rows: [COUNTS] });
    expect((await metrics(ask())).status).toBe(401);
    expect((await metrics(ask("anything"))).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it("refuses a wrong key, and one that is merely a prefix of the right one", async () => {
    process.env.CONNECT_METRICS_KEY = "vc_secret_value";
    query.mockResolvedValue({ rows: [COUNTS] });
    expect((await metrics(ask("vc_wrong_value"))).status).toBe(401);
    expect((await metrics(ask("vc_secret"))).status).toBe(401);
    expect((await metrics(ask("vc_secret_value_extra"))).status).toBe(401);
  });

  it("returns the shape the hub's reader requires", async () => {
    process.env.CONNECT_METRICS_KEY = "vc_secret_value";
    query.mockResolvedValue({ rows: [COUNTS] });
    const body = await (await metrics(ask("vc_secret_value"))).json();

    expect(Array.isArray(body.metrics)).toBe(true);
    for (const m of body.metrics) {
      // Exactly what vantrow-web keeps: anything missing these is dropped.
      expect(typeof m.key).toBe("string");
      expect(typeof m.label).toBe("string");
      expect(typeof m.value).toBe("number");
      expect(typeof m.unit).toBe("string");
    }
    const by = Object.fromEntries(body.metrics.map((m: { key: string; value: number }) => [m.key, m.value]));
    expect(by.accounts).toBe(3);
    expect(by.waiting).toBe(111);
    expect(by.sent_7d).toBe(200);
    // 9 of 200, to one decimal.
    expect(by.reply_rate_7d).toBe(4.5);
  });

  it("reports no reply rate rather than dividing by zero on a quiet week", async () => {
    process.env.CONNECT_METRICS_KEY = "k";
    query.mockResolvedValue({ rows: [{ ...COUNTS, sent_7d: "0", replies_7d: "0" }] });
    const body = await (await metrics(ask("k"))).json();
    const rate = body.metrics.find((m: { key: string }) => m.key === "reply_rate_7d");
    expect(rate.value).toBe(0);
    expect(Number.isFinite(rate.value)).toBe(true);
  });

  it("fails loudly when the database is unreachable, rather than sending zeros", async () => {
    process.env.CONNECT_METRICS_KEY = "k";
    query.mockRejectedValue(new Error("connection refused"));
    const res = await metrics(ask("k"));
    // A card of zeros reads as "nothing is happening", which is a lie. The
    // hub turns a non-200 into "not connected", which is true.
    expect(res.status).toBe(503);
  });

  it("carries no tenant data — only counts", async () => {
    process.env.CONNECT_METRICS_KEY = "k";
    query.mockResolvedValue({ rows: [COUNTS] });
    const raw = JSON.stringify(await (await metrics(ask("k"))).json());
    expect(raw).not.toMatch(/@/);              // no address of any kind
    expect(raw).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);  // no row ids
  });
});
