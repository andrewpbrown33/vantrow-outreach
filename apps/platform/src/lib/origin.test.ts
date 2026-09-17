/** The origin the app hands to Google and puts in sign-in mail: configured
 *  in production, never guessed from the request there. */

import { describe, expect, it } from "vitest";
import { APP_ORIGIN_ENV, appOrigin } from "./origin";

describe("appOrigin", () => {
  it("uses APP_ORIGIN when set, without a trailing slash", async () => {
    expect(await appOrigin({ APP_ORIGIN: "https://app.nudgerow.com/" }))
      .toBe("https://app.nudgerow.com");
    expect(await appOrigin({ APP_ORIGIN: " https://app.nudgerow.com ", NODE_ENV: "production" }))
      .toBe("https://app.nudgerow.com");
  });

  it("refuses to run production without it, naming the variable", async () => {
    await expect(appOrigin({ NODE_ENV: "production" }))
      .rejects.toThrow(new RegExp(APP_ORIGIN_ENV));
    await expect(appOrigin({ NODE_ENV: "production", APP_ORIGIN: "  " }))
      .rejects.toThrow(new RegExp(APP_ORIGIN_ENV));
  });
});
