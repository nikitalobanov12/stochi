import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSafetyActionBuckets } from "~/components/dashboard/safety-actions";

describe("buildSafetyActionBuckets", () => {
  it("prioritizes critical warnings under Avoid now", () => {
    const buckets = buildSafetyActionBuckets({
      interactions: [
        {
          id: "i1",
          type: "competition",
          severity: "critical",
          source: { id: "a", name: "A", form: null },
          target: { id: "b", name: "B", form: null },
          mechanism: null,
          researchUrl: null,
          suggestion: null,
        },
      ],
      ratioWarnings: [],
      timingWarnings: [],
    });

    assert.equal(buckets.avoidNow.length, 1);
    assert.match(buckets.avoidNow[0] ?? "", /avoid|separate/i);
  });

  it("places non-critical timing/ratio items into Optimize later", () => {
    const buckets = buildSafetyActionBuckets({
      interactions: [],
      ratioWarnings: [
        {
          id: "r1",
          severity: "medium",
          message: "Zn:Cu is imbalanced",
          currentRatio: 20,
          optimalRatio: 12,
          minRatio: 8,
          maxRatio: 15,
          researchUrl: null,
          source: { id: "zn", name: "Zinc", dosage: 30, unit: "mg" },
          target: { id: "cu", name: "Copper", dosage: 1, unit: "mg" },
        },
      ],
      timingWarnings: [
        {
          id: "t1",
          severity: "low",
          reason: "Need spacing",
          minHoursApart: 4,
          actualHoursApart: 2,
          source: { id: "tyr", name: "Tyrosine", loggedAt: new Date() },
          target: { id: "5htp", name: "5-HTP", loggedAt: new Date() },
        },
      ],
    });

    assert.equal(buckets.optimizeLater.length >= 2, true);
  });

  it("creates Do now actions from synergies", () => {
    const buckets = buildSafetyActionBuckets({
      interactions: [
        {
          id: "i2",
          type: "synergy",
          severity: "low",
          source: { id: "d3", name: "Vitamin D3", form: null },
          target: { id: "k2", name: "Vitamin K2", form: null },
          mechanism: null,
          researchUrl: null,
          suggestion: null,
        },
      ],
      ratioWarnings: [],
      timingWarnings: [],
    });

    assert.equal(buckets.doNow.length, 1);
    assert.match(buckets.doNow[0] ?? "", /together|combine|pair/i);
  });
});
