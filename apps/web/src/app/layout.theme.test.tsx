import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("root layout theming", () => {
  it("forces dark class on html", () => {
    const source = readFileSync("src/app/layout.tsx", "utf8");

    assert.equal(
      source.includes(
        "className={`${jetbrainsMono.variable} ${manrope.variable} ${cormorantGaramond.variable} dark`}",
      ),
      true,
    );
  });

  it("does not use hydration-safe class switching", () => {
    const source = readFileSync("src/app/layout.tsx", "utf8");

    assert.equal(source.includes("suppressHydrationWarning"), false);
  });
});
