import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRatioGapMessage,
  formatRatioGapReason,
} from "~/lib/engine/ratio-gaps";

describe("ratio gaps", () => {
  it("formats known gap reasons into human-readable text", () => {
    assert.equal(formatRatioGapReason("missing_dosage"), "missing dosage");
    assert.equal(
      formatRatioGapReason("missing_supplement_data"),
      "missing supplement data",
    );
    assert.equal(
      formatRatioGapReason("normalization_failed"),
      "unit normalization failed",
    );
  });

  it("builds concise user-facing messages for ratio evaluation gaps", () => {
    const message = buildRatioGapMessage({
      sourceSupplementId: "zn",
      targetSupplementId: "cu",
      reason: "missing_dosage",
    });

    assert.match(message, /could not evaluate/i);
    assert.match(message, /missing dosage/i);
  });
});
