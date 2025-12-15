import { env } from "~/env";
import { type InteractionWarning, type TimingWarning } from "~/server/actions/interactions";

/**
 * Traffic light status from the Go engine
 */
export type TrafficLightStatus = "green" | "yellow" | "red";

/**
 * Response from the Go engine analyze endpoint
 */
export type AnalyzeResponse = {
  status: TrafficLightStatus;
  warnings: InteractionWarning[];
  synergies: InteractionWarning[];
  timingWarnings?: TimingWarning[];
};

/**
 * Check if the Go engine is configured
 */
export function isEngineConfigured(): boolean {
  return !!env.ENGINE_URL;
}

/**
 * Get the engine URL, throwing if not configured
 */
function getEngineUrl(): string {
  if (!env.ENGINE_URL) {
    throw new Error("ENGINE_URL not configured");
  }
  return env.ENGINE_URL;
}

/**
 * Call the Go engine to analyze interactions between supplements
 * 
 * @param sessionToken - The user's session token for authentication
 * @param supplementIds - Array of supplement IDs to analyze
 * @param includeTiming - Whether to include timing analysis
 * @returns Analysis response from the engine
 */
export async function analyzeInteractions(
  sessionToken: string,
  supplementIds: string[],
  includeTiming = false,
): Promise<AnalyzeResponse> {
  const engineUrl = getEngineUrl();

  const response = await fetch(`${engineUrl}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      supplementIds,
      includeTiming,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Engine request failed: ${response.status} ${error}`);
  }

  return response.json() as Promise<AnalyzeResponse>;
}

/**
 * Check the health of the Go engine
 * 
 * @returns true if the engine is healthy
 */
export async function checkEngineHealth(): Promise<boolean> {
  if (!isEngineConfigured()) {
    return false;
  }

  try {
    const response = await fetch(`${env.ENGINE_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json() as { status: string };
    return data.status === "healthy";
  } catch {
    return false;
  }
}

/**
 * Calculate traffic light status from warnings (used when falling back to TS implementation)
 */
export function calculateTrafficLight(
  warnings: InteractionWarning[],
): TrafficLightStatus {
  if (warnings.length === 0) {
    return "green";
  }

  for (const w of warnings) {
    if (w.severity === "critical") {
      return "red";
    }
  }

  for (const w of warnings) {
    if (w.severity === "medium") {
      return "yellow";
    }
  }

  return "green";
}
