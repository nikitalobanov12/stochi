import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("providers theming", () => {
  it("does not wrap app with ThemeProvider", () => {
    const source = readFileSync("src/components/providers.tsx", "utf8");

    assert.equal(source.includes("<ThemeProvider"), false);
    assert.equal(source.includes('attribute="class"'), false);
    assert.equal(source.includes('defaultTheme="system"'), false);
    assert.equal(source.includes("enableSystem"), false);
  });
});
