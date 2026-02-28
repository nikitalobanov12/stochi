import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateContractFixture } from "~/lib/engine/contract-fixtures";
import {
  equivalentWarningFixture,
  severityDriftFixture,
} from "~/lib/engine/fixtures/contract-fixtures";

describe("contract fixtures", () => {
  it("marks known-equivalent fixture payloads as equivalent", () => {
    const result = evaluateContractFixture(equivalentWarningFixture);

    assert.equal(result.matchesExpected, true);
  });

  it("detects known drift fixture payloads", () => {
    const result = evaluateContractFixture(severityDriftFixture);

    assert.equal(result.matchesExpected, true);
  });
});
