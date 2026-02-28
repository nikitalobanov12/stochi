import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("light mode contrast", () => {
  it("uses stronger text and card contrast for landing/demo in light mode", () => {
    const css = readFileSync("src/styles/globals.css", "utf8");

    assert.equal(
      css.includes(
        "color: color-mix(in oklab, var(--text-primary) 88%, transparent) !important;",
      ),
      true,
    );
    assert.equal(
      css.includes("background-color: var(--surface-2) !important;"),
      true,
    );
    assert.equal(css.includes("border-color: color-mix("), true);
    assert.equal(css.includes("var(--text-primary) 18%"), true);
    assert.equal(css.includes(".light .landing-theme .glass-card"), true);
    assert.equal(css.includes(".light .landing-theme .bento-card"), true);
  });
});
