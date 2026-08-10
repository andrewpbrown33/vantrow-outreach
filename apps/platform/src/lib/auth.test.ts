/** The session cookie is the whole authentication boundary once the magic
 *  link has been proven, so its failure modes are the important ones: a
 *  tampered payload, a wrong key, and an expired claim must all read as "not
 *  signed in" rather than as a partial trust. */

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { challengeFor, mintSession, newVerifier, projectOrigin, readSession } from "./auth";

const SECRET = "test-secret-do-not-ship";
const USER = { userId: "11111111-1111-4111-8111-111111111111", email: "a@x.com" };

describe("session cookie", () => {
  it("round-trips the user it was minted for", () => {
    expect(readSession(mintSession(USER, SECRET), SECRET)).toEqual(USER);
  });

  it("rejects a token signed with a different secret", () => {
    expect(readSession(mintSession(USER, "other"), SECRET)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = mintSession(USER, SECRET);
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({
      sub: "22222222-2222-4222-8222-222222222222",
      email: "attacker@x.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString("base64url");
    expect(payload).not.toBe(forged);
    expect(readSession(`${forged}.${sig}`, SECRET)).toBeNull();
  });

  it("rejects an expired claim even though the signature is valid", () => {
    const payload = Buffer.from(JSON.stringify({
      sub: USER.userId, email: USER.email, exp: Math.floor(Date.now() / 1000) - 1,
    })).toString("base64url");
    // Sign it exactly as mintSession would, so only the expiry is at fault.
    const token = mintSession(USER, SECRET);
    const good = readSession(token, SECRET);
    expect(good).toEqual(USER);
    const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
    expect(readSession(`${payload}.${sig}`, SECRET)).toBeNull();
  });

  it("rejects junk, empty and undefined tokens", () => {
    expect(readSession(undefined, SECRET)).toBeNull();
    expect(readSession("", SECRET)).toBeNull();
    expect(readSession("no-dot", SECRET)).toBeNull();
    expect(readSession(".sig", SECRET)).toBeNull();
    expect(readSession("!!!.!!!", SECRET)).toBeNull();
  });

  it("rejects a signed payload that is missing its claims", () => {
    const payload = Buffer.from(JSON.stringify({ email: "a@x.com" })).toString("base64url");
    const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
    expect(readSession(`${payload}.${sig}`, SECRET)).toBeNull();
  });
});

describe("projectOrigin", () => {
  it("keeps a correct project URL as-is", () => {
    expect(projectOrigin("https://abc.supabase.co")).toBe("https://abc.supabase.co");
  });

  it("recovers the origin from the RESTful endpoint people actually paste", () => {
    // This exact value produced a PGRST125 "Invalid path specified in request
    // URL" in production, because /auth/v1/otp under /rest/v1 reaches
    // PostgREST instead of the auth server.
    expect(projectOrigin("https://abc.supabase.co/rest/v1"))
      .toBe("https://abc.supabase.co");
  });

  it("strips any other stray path, query or trailing slash", () => {
    for (const raw of [
      "https://abc.supabase.co/",
      "https://abc.supabase.co///",
      "https://abc.supabase.co/auth/v1",
      "https://abc.supabase.co/rest/v1/?apikey=x",
      "  https://abc.supabase.co/graphql/v1  ",
    ]) {
      expect(projectOrigin(raw)).toBe("https://abc.supabase.co");
    }
  });

  it("preserves a non-default port on a self-hosted instance", () => {
    expect(projectOrigin("http://localhost:54321/rest/v1"))
      .toBe("http://localhost:54321");
  });

  it("refuses anything that is not a usable absolute URL", () => {
    for (const raw of [undefined, "", "   ", "abc.supabase.co", "not a url",
                       "postgres://abc.supabase.co"]) {
      expect(projectOrigin(raw)).toBeNull();
    }
  });
});

describe("PKCE", () => {
  it("mints a fresh verifier every time", () => {
    expect(newVerifier()).not.toBe(newVerifier());
  });

  it("derives a stable, url-safe challenge", () => {
    const v = newVerifier();
    expect(challengeFor(v)).toBe(challengeFor(v));
    expect(challengeFor(v)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
