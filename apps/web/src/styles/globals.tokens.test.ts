import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("globals semantic tokens", () => {
  it("defines editorial token contract", () => {
    const css = readFileSync("src/styles/globals.css", "utf8");

    assert.equal(css.includes("--surface-0"), true);
    assert.equal(css.includes("--text-primary"), true);
    assert.equal(css.includes("--accent-data"), true);
    assert.match(css, /:root\s*\{[\s\S]*--surface-0:/);
    assert.match(css, /\.dark\s*\{[\s\S]*--surface-0:/);
    assert.match(css, /:root\s*\{[\s\S]*--text-primary:/);
    assert.match(css, /\.dark\s*\{[\s\S]*--text-primary:/);
  });
});
