import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("dashboard editorial card contract", () => {
  it("uses token-driven card surfaces", () => {
    const bioScore = readFileSync(
      new URL("./bio-score-card.tsx", import.meta.url),
      "utf8",
    );
    const hud = readFileSync(
      new URL("./optimization-hud.tsx", import.meta.url),
      "utf8",
    );

    assert.equal(bioScore.includes("bg-card"), true);
    assert.equal(bioScore.includes("border-border"), true);
    assert.equal(hud.includes("bg-card"), true);
    assert.equal(hud.includes("border-border"), true);
  });
});
