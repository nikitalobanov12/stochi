import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("landing page editorial contract", () => {
  it("uses semantic background and text tokens", () => {
    const page = readFileSync("src/app/landing-page.tsx", "utf8");

    assert.equal(page.includes("bg-background"), true);
    assert.equal(page.includes("text-foreground"), true);
  });
});
