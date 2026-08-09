/** Pure Gmail-adapter tests: the RFC822 composition layer, the inbound
 *  classifier on realistic fixtures, and GmailProvider's wire protocol against
 *  a scripted fetch — no Google anywhere.
 *
 *  Note on the rfc822 block below: the synthetic `touch-…@domain` Message-ID
 *  is NO LONGER how identity travels (Gmail rewrites that header — see
 *  provider.ts). It remains the fallback for providers that honor a supplied
 *  Message-ID, so it stays tested; the load-bearing identity is
 *  `X-Nudgerow-Key`, exercised in the provider block. */

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

/** Provider wire protocol, rewritten against LIVE-GMAIL REALITY (2026-08-09):
 *  Gmail replaces the Message-ID we supply, so identity rides the surviving
 *  X-Nudgerow-Key header and recovery scans the SENT label index (immediately
 *  consistent) rather than the lagging search index. These tests encode the
 *  behavior the old suite got wrong — it passed while production duplicated. */
describe("GmailProvider wire protocol (post-rewrite reality)", () => {
  /** A Gmail that rewrites Message-ID, exactly as the live API does. */
  function fakeGmail() {
    const sent: {
      id: string; threadId: string; key: string; rfcId: string;
    }[] = [];
    let n = 0;
    const routes: Route[] = [
      (url) => {
        if (!url.includes("labelIds=SENT")) return undefined;
        return json(200, { messages: [...sent].reverse().map((m) => ({ id: m.id })) });
      },
      (url, init) => {
        if (!url.endsWith("/messages/send")) return undefined;
        const raw = fromB64url((JSON.parse(String(init?.body)) as { raw: string }).raw);
        n += 1;
        const rec = {
          id: `m${n}`,
          threadId: `t${n}`,
          key: /X-Nudgerow-Key: (.+)/.exec(raw)![1]!.trim(),
          // Gmail's rewrite: our supplied Message-ID is discarded.
          rfcId: `<CAK${n}@mail.gmail.com>`,
        };
        sent.push(rec);
        return json(200, { id: rec.id, threadId: rec.threadId });
      },
      (url) => {
        const m = /\/messages\/(m\d+)\?format=metadata/.exec(url);
        if (!m) return undefined;
        const rec = sent.find((s) => s.id === m[1]);
        if (!rec) return json(404, {});
        return json(200, {
          id: rec.id, threadId: rec.threadId,
          payload: { headers: [
            { name: "X-Nudgerow-Key", value: rec.key },
            { name: "Message-ID", value: rec.rfcId },
          ] },
        });
      },
    ];
    return { routes, sent };
  }

  it("returns the provider's OWN ids for persistence (not the one we supplied)", async () => {
    const g = fakeGmail();
    const { fetchImpl } = scripted(g.routes);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    const res = await p.send(req);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.providerMessageId).toBe("m1");
      expect(res.threadId).toBe("t1");
      // The id a prospect's reply will quote — Gmail's, never ours.
      expect(res.rfc822MessageId).toBe("<CAK1@mail.gmail.com>");
    }
  });

  it("checkSent finds a sent touch by X-Nudgerow-Key via the SENT label index", async () => {
    const g = fakeGmail();
    const { fetchImpl, calls } = scripted(g.routes);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    expect(await p.checkSent("abc:1")).toEqual({ sent: false });
    await p.send(req);
    expect(await p.checkSent("abc:1"))
      .toEqual({ sent: true, providerMessageId: "m1" });
    // Never consults the lagging search index.
    expect(calls.some((c) => c.includes("rfc822msgid") || c.includes("q="))).toBe(false);
  });

  it("REGRESSION: a retry after a crash does not duplicate (the live-Gmail bug)", async () => {
    const g = fakeGmail();
    const { fetchImpl } = scripted(g.routes);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    await p.send(req);                                    // epoch 0 reaches the wire
    const retry = await p.send({ ...req, idempotencyKey: "abc:1:1" }); // crash retry
    expect(retry.ok).toBe(true);
    if (retry.ok) expect(retry.providerMessageId).toBe("m1"); // recovered, not resent
    expect(g.sent).toHaveLength(1);
  });

  it("a first attempt (epoch 0) skips the scan — steady state stays cheap", async () => {
    const g = fakeGmail();
    const { fetchImpl, calls } = scripted(g.routes);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    await p.send(req);
    expect(calls.filter((c) => c.includes("labelIds=SENT"))).toHaveLength(0);
  });

  it("threads using the provider ids the caller persisted", async () => {
    const g = fakeGmail();
    let body: { raw: string; threadId?: string } | undefined;
    const { fetchImpl } = scripted([
      (url, init) => {
        if (!url.endsWith("/messages/send")) return undefined;
        body = JSON.parse(String(init?.body));
        return json(200, { id: "m9", threadId: "t9" });
      },
      ...g.routes,
    ]);
    const p = new GmailProvider({
      tokenSource: stubTokens(), senderDomain: "getvantrow.com", fetchImpl,
    });
    await p.send({
      ...req, touchRef: "abc:2", idempotencyKey: "abc:2:0", threadAsReply: true,
      inReplyToMessageId: "<CAK1@mail.gmail.com>", threadId: "t1",
    });
    expect(body?.threadId).toBe("t1");
    expect(fromB64url(body!.raw)).toContain("In-Reply-To: <CAK1@mail.gmail.com>");
  });

  it("refreshes the token once on 401 and retries", async () => {
    const tokens = stubTokens();
    let attempts = 0;
    const { fetchImpl } = scripted([
      (url) => {
        if (!url.includes("labelIds=SENT")) return undefined;
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
