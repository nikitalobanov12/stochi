import { env } from "~/env";
import { type InteractionWarning, type TimingWarning } from "~/server/actions/interactions";

/**
 * Traffic light status from the Go engine
 */
export type TrafficLightStatus = "green" | "yellow" | "red";

/**
 * Dosage unit type matching the Go engine
 */
export type DosageUnit = "mg" | "mcg" | "g" | "IU" | "ml";

/**
 * Dosage input for ratio calculations
 */
export type DosageInput = {
  supplementId: string;
  amount: number;
  unit: DosageUnit;
};

/**
 * Ratio warning from the Go engine
 */
export type RatioWarning = {
  id: string;
  severity: "low" | "medium" | "critical";
  currentRatio: number;
  optimalRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  warningMessage: string;
  source: {
    id: string;
    name: string;
    form?: string;
  };
  target: {
    id: string;
    name: string;
    form?: string;
  };
};

/**
 * Response from the Go engine analyze endpoint
 */
export type AnalyzeResponse = {
  status: TrafficLightStatus;
  warnings: InteractionWarning[];
  synergies: InteractionWarning[];
  timingWarnings?: TimingWarning[];
  ratioWarnings?: RatioWarning[];
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
 * @param options - Optional parameters for analysis
 * @param options.includeTiming - Whether to include timing analysis
 * @param options.dosages - Dosage data for ratio calculations
 * @returns Analysis response from the engine
 */
export async function analyzeInteractions(
  sessionToken: string,
  supplementIds: string[],
  options: {
    includeTiming?: boolean;
    dosages?: DosageInput[];
  } = {},
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
      includeTiming: options.includeTiming ?? false,
      dosages: options.dosages,
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
