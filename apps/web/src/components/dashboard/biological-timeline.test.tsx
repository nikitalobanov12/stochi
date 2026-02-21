import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("biological timeline chart guard", () => {
  it("defers responsive chart rendering until client mount", () => {
    const source = readFileSync(
      "src/components/dashboard/biological-timeline.tsx",
      "utf8",
    );

    assert.equal(source.includes("useSyncExternalStore"), true);
    assert.equal(source.includes("if (!isClient)"), true);
  });
});
