import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { areSafetyContractsEquivalent } from "~/lib/engine/contract";

describe("areSafetyContractsEquivalent", () => {
  it("treats equivalent Go and TS outputs as equal regardless of ordering", () => {
    const tsOutput = {
      warnings: [
        {
          id: "i-1",
          type: "competition",
          severity: "medium",
          source: { id: "zn", name: "Zinc" },
          target: { id: "cu", name: "Copper" },
        },
      ],
      synergies: [
        {
          id: "i-2",
          type: "synergy",
          severity: "low",
          source: { id: "d3", name: "Vitamin D3" },
          target: { id: "k2", name: "Vitamin K2" },
        },
      ],
      ratioWarnings: [
        {
          id: "r-1",
          severity: "critical",
          currentRatio: 26,
          source: { id: "zn", name: "Zinc" },
          target: { id: "cu", name: "Copper" },
        },
      ],
      timingWarnings: [
        {
          id: "t-1",
          severity: "medium",
          minHoursApart: 4,
          source: { id: "tyr", name: "L-Tyrosine" },
          target: { id: "5htp", name: "5-HTP" },
        },
      ],
    };

    const goOutput = {
      warnings: [
        {
          id: "i-2",
          type: "synergy",
          severity: "low",
          source: { id: "d3", name: "Vitamin D3" },
          target: { id: "k2", name: "Vitamin K2" },
        },
        {
          id: "i-1",
          type: "competition",
          severity: "medium",
          source: { id: "zn", name: "Zinc" },
          target: { id: "cu", name: "Copper" },
        },
      ],
      synergies: null,
      ratioWarnings: [
        {
          id: "r-1",
          severity: "critical",
          currentRatio: 26,
          source: { id: "zn", name: "Zinc" },
          target: { id: "cu", name: "Copper" },
        },
      ],
      timingWarnings: [
        {
          id: "t-1",
          severity: "medium",
          minHoursApart: 4,
          source: { id: "tyr", name: "L-Tyrosine" },
          target: { id: "5htp", name: "5-HTP" },
        },
      ],
    };

    assert.equal(areSafetyContractsEquivalent(tsOutput, goOutput), true);
  });

  it("returns false when severity drifts between implementations", () => {
    const tsOutput = {
      warnings: [
        {
          id: "i-1",
          type: "competition",
          severity: "critical",
          source: { id: "zn", name: "Zinc" },
          target: { id: "cu", name: "Copper" },
        },
      ],
    };

    const goOutput = {
      warnings: [
        {
          id: "i-1",
          type: "competition",
          severity: "medium",
          source: { id: "zn", name: "Zinc" },
          target: { id: "cu", name: "Copper" },
        },
      ],
    };

    assert.equal(areSafetyContractsEquivalent(tsOutput, goOutput), false);
  });
});
