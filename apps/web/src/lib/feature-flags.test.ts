import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveBooleanFlag,
  resolveBooleanFlagWithKillSwitch,
} from "~/lib/feature-flags-utils";

describe("resolveBooleanFlag", () => {
  it("returns default when flag is undefined", () => {
    assert.equal(resolveBooleanFlag(undefined, false), false);
    assert.equal(resolveBooleanFlag(undefined, true), true);
  });

  it("treats 'true' as enabled and 'false' as disabled", () => {
    assert.equal(resolveBooleanFlag("true", false), true);
    assert.equal(resolveBooleanFlag("false", true), false);
  });

  it("forces disabled when kill switch is enabled", () => {
    assert.equal(resolveBooleanFlagWithKillSwitch("true", false, true), false);
    assert.equal(resolveBooleanFlagWithKillSwitch("false", true, true), false);
  });
});
