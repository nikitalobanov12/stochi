import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("root layout theming", () => {
  it("does not force dark class on html", () => {
    const source = readFileSync("src/app/layout.tsx", "utf8");

    assert.equal(
      source.includes(
        "className={`${jetbrainsMono.variable} ${manrope.variable} ${cormorantGaramond.variable} dark`}",
      ),
      false,
    );
  });

  it("uses hydration-safe class switching", () => {
    const source = readFileSync("src/app/layout.tsx", "utf8");

    assert.equal(source.includes("suppressHydrationWarning"), true);
  });
});
