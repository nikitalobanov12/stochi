import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("demo layout calm shell contract", () => {
  it("uses semantic shell surfaces for header and mobile nav", () => {
    const source = readFileSync("src/app/demo/layout.tsx", "utf8");

    assert.equal(source.includes("bg-background/85"), true);
    assert.equal(source.includes("border-border/80"), true);
  });
});
