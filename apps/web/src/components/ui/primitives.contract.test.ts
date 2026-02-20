import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("ui primitive token contract", () => {
  it("uses semantic surface tokens across primitives", () => {
    const button = readFileSync(
      new URL("./button.tsx", import.meta.url),
      "utf8",
    );
    const card = readFileSync(new URL("./card.tsx", import.meta.url), "utf8");
    const input = readFileSync(new URL("./input.tsx", import.meta.url), "utf8");
    const badge = readFileSync(new URL("./badge.tsx", import.meta.url), "utf8");
    const dialog = readFileSync(
      new URL("./dialog.tsx", import.meta.url),
      "utf8",
    );

    assert.equal(button.includes("focus-visible:ring"), true);
    assert.equal(card.includes("bg-card"), true);
    assert.equal(input.includes("bg-input"), true);
    assert.equal(badge.includes("bg-secondary"), true);
    assert.equal(dialog.includes("border-border"), true);
  });
});
