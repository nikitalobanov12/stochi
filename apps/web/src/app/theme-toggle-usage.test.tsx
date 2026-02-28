import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("theme toggle usage", () => {
  it("renders theme toggle in landing nav but not demo or dashboard", () => {
    const landing = readFileSync("src/app/landing-page.tsx", "utf8");
    const demoLayout = readFileSync("src/app/demo/layout.tsx", "utf8");
    const dashboardLayout = readFileSync(
      "src/app/dashboard/layout.tsx",
      "utf8",
    );

    assert.equal(landing.includes("ThemeToggle"), true);
    assert.equal(demoLayout.includes("ThemeToggle"), false);
    assert.equal(dashboardLayout.includes("ThemeToggle"), false);
  });

  it("marks landing and demo roots for light-mode style overrides", () => {
    const landing = readFileSync("src/app/landing-page.tsx", "utf8");
    const demoLayout = readFileSync("src/app/demo/layout.tsx", "utf8");

    assert.equal(landing.includes("landing-theme"), true);
    assert.equal(demoLayout.includes("demo-theme"), true);
  });
});
