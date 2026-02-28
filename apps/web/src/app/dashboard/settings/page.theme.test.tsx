import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("settings appearance section", () => {
  it("renders a theme mode card in settings page", () => {
    const page = readFileSync("src/app/dashboard/settings/page.tsx", "utf8");

    assert.equal(page.includes("Appearance"), true);
    assert.equal(page.includes("ThemeModeCard"), true);
  });
});
