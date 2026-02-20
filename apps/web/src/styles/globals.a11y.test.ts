import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("global motion and accessibility contract", () => {
  it("defines motion tokens, reduced motion, and focus-visible styles", () => {
    const css = readFileSync("src/styles/globals.css", "utf8");

    assert.equal(css.includes("--motion-fast"), true);
    assert.equal(css.includes("@media (prefers-reduced-motion: reduce)"), true);
    assert.equal(css.includes(":focus-visible"), true);
    assert.equal(css.includes(".text-editorial-kicker"), true);
  });
});
