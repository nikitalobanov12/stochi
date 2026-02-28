export type EngineFallbackReason =
  | "not_configured"
  | "no_session"
  | "timeout"
  | "non_ok_response"
  | "network_error"
  | "unknown_error";

type ResolveEngineFallbackReasonParams = {
  engineConfigured: boolean;
  hasSession: boolean;
  statusCode?: number;
  error?: unknown;
};

export function classifyEngineRequestError(
  error: unknown,
): Exclude<EngineFallbackReason, "not_configured" | "no_session" | "non_ok_response"> {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "timeout";
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    if (
      normalizedMessage.includes("timeout") ||
      normalizedMessage.includes("timed out") ||
      normalizedMessage.includes("aborted")
    ) {
      return "timeout";
    }

    if (error instanceof TypeError) {
      return "network_error";
    }
  }

  return "unknown_error";
}

export function resolveEngineFallbackReason(
  params: ResolveEngineFallbackReasonParams,
): EngineFallbackReason | null {
  if (!params.engineConfigured) {
    return "not_configured";
  }

  if (!params.hasSession) {
    return "no_session";
  }

  if (typeof params.statusCode === "number") {
    return "non_ok_response";
  }

  if (params.error) {
    return classifyEngineRequestError(params.error);
  }

  return null;
}
