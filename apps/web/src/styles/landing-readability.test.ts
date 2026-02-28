import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("landing readability contract", () => {
  it("increases dark-mode contrast and reading rhythm for landing copy", () => {
    const css = readFileSync("src/styles/globals.css", "utf8");

    assert.equal(css.includes(".dark .landing-theme"), true);
    assert.equal(css.includes("text-white/50"), true);
    assert.equal(css.includes("line-height: 1.75"), true);
  });
});
