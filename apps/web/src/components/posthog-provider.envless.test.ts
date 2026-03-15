import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("posthog provider import safety", () => {
  it("does not crash on import when server env vars are missing", async () => {
    const env = { ...process.env };
    delete env.DATABASE_URL;
    delete env.BETTER_AUTH_SECRET;
    delete env.NEXT_PUBLIC_POSTHOG_KEY;
    delete env.NEXT_PUBLIC_POSTHOG_HOST;

    const result = spawnSync(
      process.execPath,
      ["--eval", 'await import("./src/components/posthog-provider.tsx")'],
      {
        cwd: process.cwd(),
        env,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
});
