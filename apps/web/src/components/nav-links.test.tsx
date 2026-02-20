import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("dashboard navigation contract", () => {
  it("supports accessible active states in nav links", () => {
    const navLinksFile = readFileSync(
      new URL("./nav-links.tsx", import.meta.url),
      "utf8",
    );

    assert.equal(navLinksFile.includes("aria-current"), true);
    assert.equal(navLinksFile.includes("bg-secondary/70"), true);
  });
});
