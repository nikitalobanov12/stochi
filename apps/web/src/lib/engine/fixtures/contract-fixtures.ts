import { type ContractFixture } from "~/lib/engine/contract-fixtures";

export const equivalentWarningFixture: ContractFixture = {
  name: "equivalent-zn-cu-warning",
  expectedEquivalent: true,
  tsPayload: {
    warnings: [
      {
        id: "i-zn-cu",
        type: "competition",
        severity: "medium",
        source: { id: "zn", name: "Zinc" },
        target: { id: "cu", name: "Copper" },
      },
    ],
    synergies: [
      {
        id: "i-d3-k2",
        type: "synergy",
        severity: "low",
        source: { id: "d3", name: "Vitamin D3" },
        target: { id: "k2", name: "Vitamin K2" },
      },
    ],
    ratioWarnings: [
      {
        id: "r-zn-cu",
        severity: "critical",
        currentRatio: 26,
        source: { id: "zn", name: "Zinc" },
        target: { id: "cu", name: "Copper" },
      },
    ],
  },
  goPayload: {
    warnings: [
      {
        id: "i-d3-k2",
        type: "synergy",
        severity: "low",
        source: { id: "d3", name: "Vitamin D3" },
        target: { id: "k2", name: "Vitamin K2" },
      },
      {
        id: "i-zn-cu",
        type: "competition",
        severity: "medium",
        source: { id: "zn", name: "Zinc" },
        target: { id: "cu", name: "Copper" },
      },
    ],
    synergies: null,
    ratioWarnings: [
      {
        id: "r-zn-cu",
        severity: "critical",
        currentRatio: 26,
        source: { id: "zn", name: "Zinc" },
        target: { id: "cu", name: "Copper" },
      },
    ],
  },
};

export const severityDriftFixture: ContractFixture = {
  name: "severity-drift-warning",
  expectedEquivalent: false,
  tsPayload: {
    warnings: [
      {
        id: "i-zn-cu",
        type: "competition",
        severity: "critical",
        source: { id: "zn", name: "Zinc" },
        target: { id: "cu", name: "Copper" },
      },
    ],
  },
  goPayload: {
    warnings: [
      {
        id: "i-zn-cu",
        type: "competition",
        severity: "medium",
        source: { id: "zn", name: "Zinc" },
        target: { id: "cu", name: "Copper" },
      },
    ],
  },
};
