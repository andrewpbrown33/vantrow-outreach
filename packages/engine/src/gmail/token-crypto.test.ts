/** Tokens at rest: the sealed form opens, a tampered value does not, a value
 *  written before the key existed still reads, and production without a key
 *  refuses to write rather than falling back to plaintext. */

import { describe, expect, it } from "vitest";
import {
  TOKEN_KEY_ENV, canStoreToken, isEncryptedToken, loadTokenKey, openToken,
  sealToken,
} from "./token-crypto";

const KEY = Buffer.alloc(32, 7).toString("base64");
const OTHER_KEY = Buffer.alloc(32, 9).toString("base64");
const withKey = { [TOKEN_KEY_ENV]: KEY };
const prodNoKey = { NODE_ENV: "production" };
const TOKEN = "1//0gExampleRefreshToken-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

describe("token crypto", () => {
  it("round-trips through the stored form", () => {
    const stored = sealToken(TOKEN, withKey);
    expect(isEncryptedToken(stored)).toBe(true);
    expect(stored.startsWith("enc:v1:")).toBe(true);
    expect(stored.slice("enc:v1:".length).split(":")).toHaveLength(3);
    expect(stored).not.toContain(TOKEN);
    expect(openToken(stored, withKey)).toBe(TOKEN);
    // A fresh iv every time: the same token never seals to the same bytes.
    expect(sealToken(TOKEN, withKey)).not.toBe(stored);
  });

  it("refuses a value that was altered in the database, or sealed under another key", () => {
    const stored = sealToken(TOKEN, withKey);
    const [iv, tag, data] = stored.slice("enc:v1:".length).split(":") as [string, string, string];
    const flip = (s: string, at: number) =>
      s.slice(0, at) + (s[at] === "A" ? "B" : "A") + s.slice(at + 1);

    expect(() => openToken(`enc:v1:${iv}:${tag}:${flip(data, 3)}`, withKey))
      .toThrow(/failed to verify/);
    expect(() => openToken(`enc:v1:${iv}:${flip(tag, 3)}:${data}`, withKey))
      .toThrow(/failed to verify/);
    expect(() => openToken(stored, { [TOKEN_KEY_ENV]: OTHER_KEY }))
      .toThrow(/failed to verify/);
    expect(() => openToken("enc:v1:garbage", withKey)).toThrow(/malformed/);
  });

  it("legacy plaintext reads through, and is sealed on its next write", () => {
    // Written before the key existed: no prefix, no ciphertext.
    expect(isEncryptedToken(TOKEN)).toBe(false);
    expect(openToken(TOKEN, withKey)).toBe(TOKEN);
    expect(openToken(TOKEN, {})).toBe(TOKEN);
    // The next write under the key produces the sealed form.
    expect(isEncryptedToken(sealToken(openToken(TOKEN, withKey), withKey))).toBe(true);
  });

  it("production without a key refuses to store, naming the variable — but still reads what is there", () => {
    expect(canStoreToken(prodNoKey)).toBe(false);
    expect(() => sealToken(TOKEN, prodNoKey)).toThrow(new RegExp(TOKEN_KEY_ENV));
    expect(openToken(TOKEN, prodNoKey)).toBe(TOKEN);
    // Outside production a missing key means plaintext, so local runs and
    // this suite need no key.
    expect(canStoreToken({})).toBe(true);
    expect(sealToken(TOKEN, {})).toBe(TOKEN);
    expect(canStoreToken({ ...prodNoKey, ...withKey })).toBe(true);
  });

  it("an encrypted value cannot be opened without the key, and says which key", () => {
    const stored = sealToken(TOKEN, withKey);
    expect(() => openToken(stored, {})).toThrow(new RegExp(TOKEN_KEY_ENV));
  });

  it("rejects a key of the wrong size instead of falling back to plaintext", () => {
    expect(() => loadTokenKey({ [TOKEN_KEY_ENV]: Buffer.alloc(16).toString("base64") }))
      .toThrow(/32 bytes/);
    expect(() => sealToken(TOKEN, { [TOKEN_KEY_ENV]: "short" })).toThrow(/32 bytes/);
    expect(loadTokenKey({})).toBeNull();
  });
});
