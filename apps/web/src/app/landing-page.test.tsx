import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("landing page editorial contract", () => {
  it("uses semantic styling without view-mode toggles", () => {
    const page = readFileSync("src/app/landing-page.tsx", "utf8");

    assert.equal(page.includes("bg-background"), true);
    assert.equal(page.includes("text-foreground"), true);
    assert.equal(page.includes("isFocusedMode"), false);
    assert.equal(page.includes("Focused View"), false);
    assert.equal(page.includes("Full View"), false);
    assert.equal(page.includes("const showExtendedContent = false"), false);
    assert.equal(page.includes("TerminalAnalyzer interactionDb"), true);
  });
});
