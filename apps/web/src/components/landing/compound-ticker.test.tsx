import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("compound ticker edge masks", () => {
  it("uses theme-aware background masks instead of hardcoded dark color", () => {
    const source = readFileSync(
      "src/components/landing/compound-ticker.tsx",
      "utf8",
    );

    assert.equal(source.includes("from-[#0A0C10]"), false);
    assert.equal(source.includes("from-background"), true);
  });
});
