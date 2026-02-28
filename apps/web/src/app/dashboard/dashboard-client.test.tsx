import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("dashboard visual density contract", () => {
  it("keeps secondary panels collapsed and action sections focused", () => {
    const source = readFileSync("src/app/dashboard/dashboard-client.tsx", "utf8");

    assert.equal(source.includes("System Feed"), true);
    assert.equal(source.includes("Recent Activity"), true);
    assert.equal(source.includes("Next Actions"), true);
    assert.equal(source.includes("<details"), true);
  });

  it("routes empty protocol CTA to protocol builder", () => {
    const source = readFileSync("src/app/dashboard/dashboard-client.tsx", "utf8");

    assert.equal(source.includes('router.push("/dashboard/protocol")'), true);
  });

  it("uses protocol-oriented quick prompt language", () => {
    const source = readFileSync("src/app/dashboard/dashboard-command-bar.tsx", "utf8");

    assert.equal(source.includes("Log Protocol..."), true);
    assert.equal(source.includes("Log Stack..."), false);
  });
});
