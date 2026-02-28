import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("theme mode card", () => {
  it("offers system, light, and dark mode actions", () => {
    const source = readFileSync(
      "src/components/settings/theme-mode-card.tsx",
      "utf8",
    );

    assert.equal(source.includes('setTheme("system")'), true);
    assert.equal(source.includes('setTheme("light")'), true);
    assert.equal(source.includes('setTheme("dark")'), true);
  });
});
