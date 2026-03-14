import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("docs alignment contract", () => {
  it("keeps app metadata and root readme on the same product narrative", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    const readme = readFileSync("../../README.md", "utf8");

    assert.equal(
      layout.includes("Build safer supplement protocols with a live timeline, interaction warnings, and engine-backed analysis."),
      true,
    );
    assert.equal(
      readme.includes("Stochi is a supplement protocol intelligence app for building safer routines and seeing how compounds overlap over time."),
      true,
    );
  });

  it("updates the technical design doc to the current web stack and schema path", () => {
    const tdd = readFileSync("../../docs/technical_design_doc.md", "utf8");

    assert.equal(tdd.includes("Next.js 16 (App Router) + TypeScript."), true);
    assert.equal(tdd.includes("apps/web/src/server/db/schema.ts"), true);
    assert.equal(tdd.includes("Next.js 15"), false);
    assert.equal(tdd.includes("apps/web/db/schema.ts"), false);
  });

  it("updates the engine readme to describe internal auth headers", () => {
    const engineReadme = readFileSync("../../apps/engine/README.md", "utf8");

    assert.equal(engineReadme.includes("X-Internal-Key"), true);
    assert.equal(engineReadme.includes("X-User-ID"), true);
    assert.equal(engineReadme.includes("Authorization: Bearer <session_token>"), false);
  });
});
