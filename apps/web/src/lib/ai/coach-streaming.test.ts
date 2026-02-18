import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildStreamingFrames } from "~/lib/ai/coach-streaming";

describe("buildStreamingFrames", () => {
  it("returns incremental frames ending with full text", () => {
    const text = "What this means is your consistency improved this week.";
    const frames = buildStreamingFrames(text, 3);

    assert.equal(frames.length > 1, true);
    assert.ok(frames[0]);
    assert.equal(frames[0].length > 0, true);
    assert.equal(frames.at(-1), text);
  });

  it("handles empty text", () => {
    const frames = buildStreamingFrames("", 2);
    assert.deepEqual(frames, [""]);
  });
});
