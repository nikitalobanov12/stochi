import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("readability upgrades", () => {
  it("uses larger, less dense typography in key landing cards", () => {
    const mechanistic = readFileSync(
      "src/components/landing/mechanistic-feed.tsx",
      "utf8",
    );
    const expert = readFileSync(
      "src/components/landing/expert-stacks.tsx",
      "utf8",
    );
    const risk = readFileSync(
      "src/components/landing/risk-card-compact.tsx",
      "utf8",
    );

    assert.equal(mechanistic.includes("text-xs leading-6"), true);
    assert.equal(expert.includes("text-sm text-white/70"), true);
    assert.equal(risk.includes("text-sm text-white/70"), true);
  });

  it("uses larger text in demo start panel and system feed", () => {
    const demo = readFileSync("src/app/demo/demo-dashboard-client.tsx", "utf8");
    const consoleFeed = readFileSync(
      "src/components/dashboard/live-console-feed.tsx",
      "utf8",
    );

    assert.equal(demo.includes("text-muted-foreground text-sm"), true);
    assert.equal(consoleFeed.includes("font-mono text-xs"), true);
    assert.equal(consoleFeed.includes("text-xs leading-6"), true);
  });
});
