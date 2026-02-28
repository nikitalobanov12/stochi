import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("onboarding protocol-first contract", () => {
  it("captures per-supplement timing in onboarding payload", () => {
    const source = readFileSync(
      "src/components/onboarding/welcome-flow.tsx",
      "utf8",
    );

    assert.equal(source.includes("timeSlot: s.timeSlot"), true);
  });

  it("uses protocol-first copy in build step", () => {
    const source = readFileSync(
      "src/components/onboarding/steps/build-stack-step.tsx",
      "utf8",
    );

    assert.equal(source.includes("Build your daily protocol"), true);
    assert.equal(source.includes("Supplements in protocol"), true);
  });

  it("uses protocol language in experience guidance", () => {
    const source = readFileSync(
      "src/components/onboarding/steps/experience-step.tsx",
      "utf8",
    );

    assert.equal(source.includes("stacking strategies"), false);
    assert.equal(source.includes("protocol strategies"), true);
  });
});
