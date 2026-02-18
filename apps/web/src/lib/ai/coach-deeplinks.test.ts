import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildLogCommandHref,
  buildStackIntentHref,
  parseCoachCommandParam,
  parseStackIntentParam,
} from "~/lib/ai/coach-deeplinks";

describe("coach-deeplinks", () => {
  it("builds encoded log command links", () => {
    const href = buildLogCommandHref("magnesium glycinate");
    assert.equal(href, "/dashboard/log?coachCommand=magnesium%20glycinate");
  });

  it("parses and trims incoming command params", () => {
    const command = parseCoachCommandParam("  zinc picolinate  ");
    assert.equal(command, "zinc picolinate");
  });

  it("returns null for empty command params", () => {
    const command = parseCoachCommandParam("   ");
    assert.equal(command, null);
  });

  it("accepts array params and uses first value", () => {
    const command = parseCoachCommandParam(["zinc", "copper"]);
    assert.equal(command, "zinc");
  });

  it("builds stack intent links", () => {
    const href = buildStackIntentHref("stack_123", "interactions");
    assert.equal(href, "/dashboard/stacks/stack_123?intent=interactions");
  });

  it("parses only allowed stack intents", () => {
    assert.equal(parseStackIntentParam("interactions"), "interactions");
    assert.equal(parseStackIntentParam("compounds"), "compounds");
    assert.equal(parseStackIntentParam("settings"), "settings");
  });

  it("returns null for invalid stack intents", () => {
    assert.equal(parseStackIntentParam("unknown"), null);
  });
});
