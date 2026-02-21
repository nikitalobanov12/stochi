import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("demo dashboard calm contract", () => {
  it("removes mode toggles and keeps a clearer start-first demo flow", () => {
    const source = readFileSync("src/app/demo/demo-dashboard-client.tsx", "utf8");

    assert.equal(source.includes("Clean Mode"), false);
    assert.equal(source.includes("Guided Mode"), false);
    assert.equal(source.includes("Quick Demo Tips"), false);
    assert.equal(source.includes("DemoTipsPanel"), false);
    assert.equal(source.includes("Why This Demo Is Impressive"), false);
    assert.equal(source.includes("Try This In 60 Seconds"), false);
    assert.equal(source.includes("Start here"), true);
    assert.equal(source.includes("Log one supplement in the command bar"), true);
    assert.equal(source.includes("Then run one protocol"), true);
    assert.equal(source.includes("Watch the timeline + alerts update"), true);
    assert.equal(source.includes("href=\"#demo-command-bar\""), true);
    assert.equal(source.includes("id=\"demo-protocols\""), true);
    assert.equal(source.includes("font-mono text-[10px]"), false);
  });

  it("uses tighter spacing density for cleaner first viewport", () => {
    const source = readFileSync("src/app/demo/demo-dashboard-client.tsx", "utf8");

    assert.equal(source.includes("<div className=\"space-y-4\">"), true);
    assert.equal(source.includes("grid grid-cols-1 gap-4 lg:grid-cols-12"), true);
    assert.equal(source.includes("space-y-4 lg:col-span-8"), true);
    assert.equal(source.includes("space-y-4 lg:col-span-4"), true);
    assert.equal(source.includes("section id=\"demo-protocols\" className=\"space-y-2\""), true);
    assert.equal(source.includes("space-y-5"), false);
  });
});
