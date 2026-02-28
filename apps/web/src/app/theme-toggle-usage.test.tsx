import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("theme toggle usage", () => {
  it("does not render theme toggles in landing or demo layout", () => {
    const landing = readFileSync("src/app/landing-page.tsx", "utf8");
    const demoLayout = readFileSync("src/app/demo/layout.tsx", "utf8");

    assert.equal(landing.includes("ThemeToggle"), false);
    assert.equal(demoLayout.includes("ThemeToggle"), false);
  });
});
