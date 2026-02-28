import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  classifyEngineRequestError,
  resolveEngineFallbackReason,
} from "~/lib/engine/telemetry";

describe("engine telemetry", () => {
  it("classifies timeout errors from aborted engine requests", () => {
    const timeoutError = new DOMException("signal timed out", "TimeoutError");

    const reason = classifyEngineRequestError(timeoutError);

    assert.equal(reason, "timeout");
  });

  it("classifies network fetch failures", () => {
    const networkError = new TypeError("fetch failed");

    const reason = classifyEngineRequestError(networkError);

    assert.equal(reason, "network_error");
  });

  it("classifies engine non-2xx errors from client wrapper message", () => {
    const engineError = new Error(
      "Engine timing check failed: 503 service unavailable",
    );

    const reason = classifyEngineRequestError(engineError);

    assert.equal(reason, "non_ok_response");
  });

  it("returns non_ok_response when engine responds with non-2xx", () => {
    const reason = resolveEngineFallbackReason({
      engineConfigured: true,
      hasSession: true,
      statusCode: 503,
    });

    assert.equal(reason, "non_ok_response");
  });

  it("returns not_configured when engine is disabled", () => {
    const reason = resolveEngineFallbackReason({
      engineConfigured: false,
      hasSession: true,
    });

    assert.equal(reason, "not_configured");
  });

  it("returns no_session when user context is missing", () => {
    const reason = resolveEngineFallbackReason({
      engineConfigured: true,
      hasSession: false,
    });

    assert.equal(reason, "no_session");
  });
});
