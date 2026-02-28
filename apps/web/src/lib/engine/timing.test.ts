import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapEngineTimingWarnings } from "~/lib/engine/timing";

describe("mapEngineTimingWarnings", () => {
  it("uses engine-provided source and target timestamps when available", () => {
    const fallbackLoggedAt = new Date("2026-02-28T08:00:00.000Z");

    const mapped = mapEngineTimingWarnings(fallbackLoggedAt, [
      {
        id: "w1",
        severity: "medium",
        reason: "Needs spacing",
        minHoursApart: 4,
        actualHoursApart: 1.2,
        source: { id: "a", name: "L-Tyrosine" },
        target: { id: "b", name: "5-HTP" },
        sourceLoggedAt: "2026-02-28T06:00:00.000Z",
        targetLoggedAt: "2026-02-28T07:10:00.000Z",
      },
    ]);

    assert.equal(mapped.length, 1);
    assert.equal(mapped[0]?.source.loggedAt.toISOString(), "2026-02-28T06:00:00.000Z");
    assert.equal(mapped[0]?.target.loggedAt.toISOString(), "2026-02-28T07:10:00.000Z");
  });

  it("falls back to provided loggedAt when engine timestamps are missing or invalid", () => {
    const fallbackLoggedAt = new Date("2026-02-28T08:00:00.000Z");

    const mapped = mapEngineTimingWarnings(fallbackLoggedAt, [
      {
        id: "w2",
        severity: "low",
        reason: "Spacing reminder",
        minHoursApart: 2,
        actualHoursApart: 1.5,
        source: { id: "c", name: "Caffeine" },
        target: { id: "d", name: "Magnesium" },
        sourceLoggedAt: "not-a-date",
      },
    ]);

    assert.equal(mapped.length, 1);
    assert.equal(
      mapped[0]?.source.loggedAt.toISOString(),
      fallbackLoggedAt.toISOString(),
    );
    assert.equal(
      mapped[0]?.target.loggedAt.toISOString(),
      fallbackLoggedAt.toISOString(),
    );
  });
});
