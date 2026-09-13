/** The connect flow's state parameter is the only thing binding a Google
 *  callback to the request that started it, so its failure modes are the
 *  interesting part: forged, tampered, stale, or issued for someone else. */

import { describe, expect, it } from "vitest";
import {
  mintConnectState, readConnectState, connectRedirectUri,
} from "./oauth-state";

const SECRET = "test-secret-value-long-enough";
const MAILBOX = "5f8b7c1e-0000-4000-8000-000000000001";
const USER = "9a1b2c3d-0000-4000-8000-000000000002";

describe("connect state", () => {
  it("round-trips the mailbox and the user who asked", () => {
    const token = mintConnectState({ mailboxId: MAILBOX, userId: USER }, SECRET);
    const read = readConnectState(token, SECRET);
    expect(read).toMatchObject({ mailboxId: MAILBOX, userId: USER });
    expect(read?.nonce).toBeTruthy();
  });

  it("refuses a token signed with another secret", () => {
    const token = mintConnectState({ mailboxId: MAILBOX, userId: USER }, SECRET);
    expect(readConnectState(token, "a-different-secret")).toBeNull();
  });

  it("refuses a tampered payload — swapping the mailbox invalidates it", () => {
    const token = mintConnectState({ mailboxId: MAILBOX, userId: USER }, SECRET);
    const [payload, sig] = token.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    claims.m = "00000000-0000-4000-8000-00000000dead";
    const forged =
      Buffer.from(JSON.stringify(claims)).toString("base64url") + "." + sig;
    expect(readConnectState(forged, SECRET)).toBeNull();
  });

  it("refuses an expired token", () => {
    const payload = Buffer.from(JSON.stringify({
      m: MAILBOX, u: USER, n: "abc",
      exp: Math.floor(Date.now() / 1000) - 1,
    })).toString("base64url");
    // Sign it properly — expiry must be rejected on its own merits, not
    // because the signature happens to be wrong.
    const token = mintConnectState({ mailboxId: MAILBOX, userId: USER }, SECRET);
    const realSig = token.slice(token.lastIndexOf(".") + 1);
    expect(readConnectState(`${payload}.${realSig}`, SECRET)).toBeNull();
  });

  it("refuses junk, empties and shapes that are not tokens", () => {
    for (const bad of [undefined, "", ".", "no-dot", "a.b", "....."]) {
      expect(readConnectState(bad, SECRET)).toBeNull();
    }
  });

  it("gives each request a fresh nonce", () => {
    const a = readConnectState(
      mintConnectState({ mailboxId: MAILBOX, userId: USER }, SECRET), SECRET);
    const b = readConnectState(
      mintConnectState({ mailboxId: MAILBOX, userId: USER }, SECRET), SECRET);
    expect(a?.nonce).not.toBe(b?.nonce);
  });

  it("builds one redirect URI, trailing slashes and all", () => {
    expect(connectRedirectUri("https://app.nudgerow.com"))
      .toBe("https://app.nudgerow.com/api/gmail/callback");
    expect(connectRedirectUri("https://app.nudgerow.com/"))
      .toBe("https://app.nudgerow.com/api/gmail/callback");
  });
});
