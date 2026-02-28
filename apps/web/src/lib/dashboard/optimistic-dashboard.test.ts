import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deriveOptimisticDashboardState, type DashboardRuleSnapshot } from "./optimistic-dashboard";
import type { LogEntry } from "~/components/log/log-context";

describe("deriveOptimisticDashboardState", () => {
  it("updates dashboard state from optimistic logs", () => {
    const now = new Date("2026-02-28T12:00:00.000Z");

    const logs: LogEntry[] = [
      {
        id: "l1",
        loggedAt: new Date("2026-02-28T11:30:00.000Z"),
        dosage: 50,
        unit: "mg",
        supplement: {
          id: "zinc",
          name: "Zinc",
          category: "mineral",
        },
      },
      {
        id: "l2",
        loggedAt: new Date("2026-02-28T10:00:00.000Z"),
        dosage: 1,
        unit: "mg",
        supplement: {
          id: "copper",
          name: "Copper",
          category: "mineral",
        },
      },
    ];

    const snapshot: DashboardRuleSnapshot = {
      supplements: [
        {
          id: "zinc",
          name: "Zinc",
          form: null,
          safetyCategory: "zinc",
          peakMinutes: 60,
          halfLifeMinutes: 240,
          kineticsType: "first_order",
          vmax: null,
          km: null,
          rdaAmount: null,
          bioavailabilityPercent: null,
          category: "mineral",
        },
        {
          id: "copper",
          name: "Copper",
          form: null,
          safetyCategory: "copper",
          peakMinutes: 60,
          halfLifeMinutes: 240,
          kineticsType: "first_order",
          vmax: null,
          km: null,
          rdaAmount: null,
          bioavailabilityPercent: null,
          category: "mineral",
        },
      ],
      interactionRules: [],
      ratioRules: [
        {
          id: "rr1",
          sourceSupplementId: "zinc",
          targetSupplementId: "copper",
          minRatio: 8,
          maxRatio: 15,
          optimalRatio: 10,
          warningMessage: "Zn:Cu imbalance",
          severity: "medium",
          researchUrl: null,
          sourceSupplement: { id: "zinc", name: "Zinc", form: null },
          targetSupplement: { id: "copper", name: "Copper", form: null },
        },
      ],
      timingRules: [],
    };

    const derived = deriveOptimisticDashboardState({ logs, snapshot, now });

    assert.equal(derived.todayLogCount, 2);
    assert.equal(derived.lastLogAt?.toISOString(), "2026-02-28T11:30:00.000Z");
    assert.equal(derived.ratioWarnings.length, 1);
    assert.equal(derived.safetyHeadroom.length > 0, true);
    assert.equal(derived.timelineData.length > 0, true);
    assert.equal(derived.biologicalState.activeCompounds.length, 2);
  });
});
