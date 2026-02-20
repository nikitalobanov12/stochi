import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("layout typography contract", () => {
  it("uses editorial fonts and display variable", () => {
    const layout = readFileSync(
      new URL("./layout.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(
      new URL("../styles/globals.css", import.meta.url),
      "utf8",
    );

    assert.equal(layout.includes("Inter("), false);
    assert.equal(layout.includes("Manrope("), true);
    assert.equal(layout.includes("Cormorant_Garamond("), true);
    assert.equal(layout.includes("--font-heading"), true);
    assert.equal(css.includes(".font-display"), true);
  });
});
