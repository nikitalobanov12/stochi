import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getTypingStepDelayMs } from "~/lib/ai/coach-typing";

describe("getTypingStepDelayMs", () => {
  it("adds longer delay for sentence punctuation", () => {
    assert.equal(getTypingStepDelayMs("."), 150);
    assert.equal(getTypingStepDelayMs("!"), 150);
    assert.equal(getTypingStepDelayMs("?"), 150);
  });

  it("adds medium delay for comma and semicolon", () => {
    assert.equal(getTypingStepDelayMs(","), 95);
    assert.equal(getTypingStepDelayMs(";"), 95);
    assert.equal(getTypingStepDelayMs(":"), 95);
  });

  it("uses baseline delay for regular characters", () => {
    assert.equal(getTypingStepDelayMs("a"), 26);
    assert.equal(getTypingStepDelayMs(" "), 26);
  });
});
