import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("providers theming", () => {
  it("wraps app with ThemeProvider using system default", () => {
    const source = readFileSync("src/components/providers.tsx", "utf8");

    assert.equal(source.includes("<ThemeProvider"), true);
    assert.equal(source.includes('attribute="class"'), true);
    assert.equal(source.includes('defaultTheme="system"'), true);
    assert.equal(source.includes("enableSystem"), true);
  });
});
