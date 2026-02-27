import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { computeDemoWarnings } from "./demo-warnings";

describe("computeDemoWarnings", () => {
  it("creates a Zn:Cu ratio warning when copper is missing", () => {
    const now = new Date("2026-02-27T12:00:00.000Z");
    const { ratioWarnings } = computeDemoWarnings({
      logs: [
        {
          id: "l1",
          loggedAt: now,
          dosage: 50,
          unit: "mg",
          supplement: {
            id: "supp-3",
            name: "Zinc Picolinate",
            isResearchChemical: false,
            route: "oral",
            category: "mineral",
          },
        },
      ],
    });

    assert.equal(ratioWarnings.length, 1);
    assert.ok(ratioWarnings[0]!.source.name.toLowerCase().includes("zinc"));
    assert.ok(ratioWarnings[0]!.target.name.toLowerCase().includes("copper"));
  });

  it("creates a synergy interaction for caffeine + l-theanine", () => {
    const now = new Date("2026-02-27T12:00:00.000Z");
    const { interactions } = computeDemoWarnings({
      logs: [
        {
          id: "l1",
          loggedAt: now,
          dosage: 100,
          unit: "mg",
          supplement: {
            id: "supp-10",
            name: "Caffeine",
            isResearchChemical: false,
            route: "oral",
            category: "nootropic",
          },
        },
        {
          id: "l2",
          loggedAt: now,
          dosage: 200,
          unit: "mg",
          supplement: {
            id: "supp-7",
            name: "L-Theanine",
            isResearchChemical: false,
            route: "oral",
            category: "amino-acid",
          },
        },
      ],
    });

    const pair = interactions.find(
      (i: {
        source: { name: string };
        target: { name: string };
        type: string;
      }) =>
        i.source.name.toLowerCase().includes("caffeine") ||
        i.target.name.toLowerCase().includes("caffeine"),
    );
    assert.ok(pair);
    assert.equal(pair!.type, "synergy");
  });

  it("creates a timing warning for tyrosine + 5-htp within 4 hours", () => {
    const now = new Date("2026-02-27T12:00:00.000Z");
    const oneHourAgo = new Date("2026-02-27T11:00:00.000Z");
    const { timingWarnings } = computeDemoWarnings({
      logs: [
        {
          id: "l1",
          loggedAt: oneHourAgo,
          dosage: 500,
          unit: "mg",
          supplement: {
            id: "supp-13",
            name: "L-Tyrosine",
            isResearchChemical: false,
            route: "oral",
            category: "amino-acid",
          },
        },
        {
          id: "l2",
          loggedAt: now,
          dosage: 100,
          unit: "mg",
          supplement: {
            id: "supp-14",
            name: "5-HTP",
            isResearchChemical: false,
            route: "oral",
            category: "amino-acid",
          },
        },
      ],
    });

    assert.equal(timingWarnings.length, 1);
    assert.equal(timingWarnings[0]!.minHoursApart, 4);
  });
});
