import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("db module import safety", () => {
  it("does not crash on import when env validation is skipped", async () => {
    process.env.SKIP_ENV_VALIDATION = "1";
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_SECRET;

    await assert.doesNotReject(async () => {
      await import("./index");
    });
  });
});
