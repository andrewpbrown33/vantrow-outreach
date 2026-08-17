import { describe, expect, it } from "vitest";
import { replySubject, stripReplyPrefix } from "./subject";

describe("reply subjects", () => {
  it("prefixes a thread subject with Re:", () => {
    expect(replySubject("Quiet question on Meridian")).toBe("Re: Quiet question on Meridian");
  });

  it("never stacks Re: markers, whatever their case or spacing", () => {
    for (const raw of [
      "Re: Quiet question", "RE: Quiet question", "re: Quiet question",
      "Re:  Re: Quiet question", " re:re: Quiet question",
    ]) {
      expect(replySubject(raw)).toBe("Re: Quiet question");
    }
  });

  it("leaves Fwd: alone — forwarding is not threading", () => {
    expect(replySubject("Fwd: budget")).toBe("Re: Fwd: budget");
  });

  it("does not eat a subject that merely contains the word re", () => {
    expect(stripReplyPrefix("regarding the roof")).toBe("regarding the roof");
    expect(stripReplyPrefix("Rework at {{company}}")).toBe("Rework at {{company}}");
  });

  it("degrades to a bare Re: when the thread subject is empty", () => {
    expect(replySubject("")).toBe("Re:");
    expect(replySubject("Re: ")).toBe("Re:");
  });
});
