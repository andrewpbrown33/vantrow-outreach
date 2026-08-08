/** Pure Gmail-adapter tests: the RFC822 layer (the Message-ID-as-touch-identity
 *  trick), the inbound classifier on realistic fixtures, and GmailProvider's
 *  wire protocol against a scripted fetch — no Google anywhere. */

import { describe, expect, it } from "vitest";
import type { SendRequest } from "../dispatcher";
import { classifyInbound, type NormalizedInbound } from "./inbound";
import type { FetchLike, TokenSource } from "./oauth";
import { GmailProvider } from "./provider";
import {
  composeRaw, decodeBody, fromB64url, headerRecord,
  parseTouchMessageId, touchMessageId,
} from "./rfc822";

const UUID = "1c9a2b3d-4e5f-6789-abcd-ef0123456789";

describe("rfc822 layer", () => {
  it("round-trips the touch identity through the Message-ID", () => {
    const mid = touchMessageId(`${UUID}:3`, "getvantrow.com");
    expect(mid).toBe(`<touch-${UUID}-3@getvantrow.com>`);
    expect(parseTouchMessageId(mid)).toEqual({ enrollmentId: UUID, stepOrder: 3 });
    expect(parseTouchMessageId("<random@x.com>")).toBeNull();
  });

  it("composes a raw message carrying identity, key, and threading", () => {
    const raw = composeRaw({
      from: "andrew@getvantrow.com",
      to: "derek@meridian.com",
      subject: "A quiet question",
      bodyHtml: "<p>Hello Derek</p>",
      messageId: `<touch-${UUID}-2@getvantrow.com>`,
      idempotencyKey: `${UUID}:2:0`,
      inReplyTo: `<touch-${UUID}-1@getvantrow.com>`,
    });
    const text = fromB64url(raw);
    expect(text).toContain(`Message-ID: <touch-${UUID}-2@getvantrow.com>`);
    expect(text).toContain(`X-Nudgerow-Key: ${UUID}:2:0`);
    expect(text).toContain(`In-Reply-To: <touch-${UUID}-1@getvantrow.com>`);
    const body = text.split("\r\n\r\n")[1]!.replace(/\r\n/g, "");
    expect(Buffer.from(body, "base64").toString("utf8")).toBe("<p>Hello Derek</p>");
  });

  it("reads headers case-insensitively and walks nested payload parts", () => {
    const payload = {
      headers: [{ name: "From", value: "A <a@b.c>" }],
      parts: [
        { mimeType: "text/plain", body: { data: Buffer.from("outer").toString("base64url") } },
        { parts: [{ body: { data: Buffer.from("inner").toString("base64url") } }] },
      ],
    };
    expect(headerRecord(payload)["from"]).toBe("A <a@b.c>");
    const body = decodeBody(payload);
    expect(body).toContain("outer");
    expect(body).toContain("inner");
  });
});

function inbound(over: Partial<NormalizedInbound>): NormalizedInbound {
  return {
    gmailMessageId: "g1",
    headers: {},
    fromEmail: "derek@meridian.com",
    subject: "Re: a quiet question",
    snippet: "",
    bodyText: "Happy to take a look.",
    receivedAt: new Date(),
    ...over,
  };
}

describe("inbound classifier", () => {
  it("classifies a hard DSN bounce with status and failed address", () => {
    const c = classifyInbound(inbound({
      fromEmail: "mailer-daemon@googlemail.com",
      headers: { "content-type": "multipart/report; report-type=delivery-status" },
      bodyText:
        "Final-Recipient: rfc822; D.Okafor@Meridian.com\n" +
        "Action: failed\nStatus: 5.1.1\n",
    }));
    expect(c.classification).toBe("bounce_hard");
    expect(c.bouncedAddress).toBe("d.okafor@meridian.com");
    expect(c.dsnStatus).toBe("5.1.1");
  });

  it("classifies a transient DSN as soft", () => {
    const c = classifyInbound(inbound({
      fromEmail: "postmaster@corp.example",
      bodyText: "Status: 4.2.2\nFinal-Recipient: rfc822; x@y.z",
    }));
    expect(c.classification).toBe("bounce_soft");
  });

  it("classifies OOO — never a reply — and parses the return date", () => {
    const c = classifyInbound(inbound({
      headers: { "auto-submitted": "auto-replied" },
      subject: "Automatic reply: a quiet question",
      bodyText: "I am out of the office and will return on March 9, 2026.",
    }));
    expect(c.classification).toBe("ooo");
    expect(c.oooReturnDate?.toISOString().slice(0, 10)).toBe("2026-03-09");
  });

  it("classifies a touch-referenced human message as a reply", () => {
    const c = classifyInbound(inbound({
      headers: { "in-reply-to": `<touch-${UUID}-2@getvantrow.com>` },
    }));
    expect(c.classification).toBe("reply");
    expect(c.touch).toEqual({ enrollmentId: UUID, stepOrder: 2 });
  });

  it("leaves unlinked human mail as other (caller may match by sender)", () => {
    expect(classifyInbound(inbound({})).classification).toBe("other");
  });
});

// ---------------------------------------------------------------------------

type Route = (url: string, init?: RequestInit) => Response | undefined;

function scripted(routes: Route[]): { fetchImpl: FetchLike; calls: string[] } {
  const calls: string[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push(`${init?.method ?? "GET"} ${url}`);
    for (const r of routes) {
      const res = r(url, init);
      if (res) return res;
    }
    throw new Error(`unrouted: ${url}`);
  };
  return { fetchImpl, calls };
}

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status, headers: { "content-type": "application/json" },
  });

function stubTokens(): TokenSource & { refreshes: number } {
  return {
    refreshes: 0,
    async accessToken() { return `tok-${this.refreshes}`; },
    invalidate() { this.refreshes += 1; },
  };
}

const req: SendRequest = {
  idempotencyKey: "abc:1:0",
  touchRef: "abc:1",
  workspaceId: "ws",
  fromEmail: "andrew@getvantrow.com",
  toEmail: "derek@meridian.com",
  subject: "A quiet question",
  bodyHtml: "<p>Hi</p>",
  threadAsReply: false,
};

describe("GmailProvider wire protocol", () => {
  it("checkSent searches rfc822msgid and reports the wire message", async () => {
    const { fetchImpl, calls } = scripted([
      (url) => url.includes("/messages?q=")
        ? json(200, { messages: [{ id: "m1" }] }) : undefined,
    ]);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    expect(await p.checkSent("abc:1"))
      .toEqual({ sent: true, providerMessageId: "m1" });
    expect(decodeURIComponent(calls[0]!))
      .toContain("rfc822msgid:touch-abc-1@getvantrow.com");
  });

  it("send is idempotent by touch: a prior wire message short-circuits", async () => {
    const { fetchImpl, calls } = scripted([
      (url) => url.includes("/messages?q=")
        ? json(200, { messages: [{ id: "m1" }] }) : undefined,
    ]);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    const res = await p.send(req);
    expect(res).toEqual({ ok: true, providerMessageId: "m1" });
    expect(calls.some((c) => c.startsWith("POST"))).toBe(false);
  });

  it("send composes raw with the touch Message-ID and the idempotency key", async () => {
    let sentRaw = "";
    const { fetchImpl } = scripted([
      (url) => url.includes("/messages?q=") ? json(200, {}) : undefined,
      (url, init) => {
        if (!url.endsWith("/messages/send")) return undefined;
        sentRaw = (JSON.parse(String(init?.body)) as { raw: string }).raw;
        return json(200, { id: "m2" });
      },
    ]);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    expect(await p.send(req)).toEqual({ ok: true, providerMessageId: "m2" });
    const text = fromB64url(sentRaw);
    expect(text).toContain("Message-ID: <touch-abc-1@getvantrow.com>");
    expect(text).toContain("X-Nudgerow-Key: abc:1:0");
  });

  it("threads a reply-step under the previous touch and reuses its threadId", async () => {
    let body: { raw: string; threadId?: string } | undefined;
    const { fetchImpl } = scripted([
      (url) => {
        if (!url.includes("/messages?q=")) return undefined;
        return decodeURIComponent(url).includes("touch-abc-1@")
          ? json(200, { messages: [{ id: "p1", threadId: "th9" }] })
          : json(200, {});
      },
      (url, init) => {
        if (!url.endsWith("/messages/send")) return undefined;
        body = JSON.parse(String(init?.body));
        return json(200, { id: "m3" });
      },
    ]);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    const res = await p.send({ ...req, touchRef: "abc:2",
      idempotencyKey: "abc:2:0", threadAsReply: true });
    expect(res.ok).toBe(true);
    expect(body?.threadId).toBe("th9");
    expect(fromB64url(body!.raw)).toContain("In-Reply-To: <touch-abc-1@getvantrow.com>");
  });

  it("refreshes the token once on 401 and retries", async () => {
    const tokens = stubTokens();
    let attempts = 0;
    const { fetchImpl } = scripted([
      (url) => {
        if (!url.includes("/messages?q=")) return undefined;
        attempts += 1;
        return attempts === 1
          ? new Response("unauthorized", { status: 401 })
          : json(200, { messages: [] });
      },
    ]);
    const p = new GmailProvider({
      tokenSource: tokens, senderDomain: "getvantrow.com", fetchImpl,
    });
    expect(await p.checkSent("abc:1")).toEqual({ sent: false });
    expect(tokens.refreshes).toBe(1);
    expect(attempts).toBe(2);
  });

  it("maps provider outages to a retryable failure, not an exception", async () => {
    const { fetchImpl } = scripted([
      (url) => url.includes("/messages?q=") ? json(200, {}) : undefined,
      (url) => url.endsWith("/messages/send")
        ? new Response("backend error", { status: 500 }) : undefined,
    ]);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    const res = await p.send(req);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("retryable_500");
  });
});
