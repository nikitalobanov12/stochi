import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

describe("repo quality contract", () => {
  it("defines a visible github actions quality gate", () => {
    const workflowPath = "../../.github/workflows/quality.yml";

    assert.equal(existsSync(workflowPath), true);

    const workflow = readFileSync(workflowPath, "utf8");

    assert.equal(workflow.includes("push:"), true);
    assert.equal(workflow.includes("pull_request:"), true);
    assert.equal(workflow.includes("bun run check"), true);
    assert.equal(workflow.includes("bun test"), true);
    assert.equal(workflow.includes("go test ./..."), true);
  });
});
