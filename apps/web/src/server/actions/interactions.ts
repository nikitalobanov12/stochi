"use server";

import { inArray, or, and, eq, gte, lte } from "drizzle-orm";
import { db } from "~/server/db";
import { interaction, ratioRule, timingRule, log } from "~/server/db/schema";
import { env } from "~/env";
import { logger } from "~/lib/logger";
import {
  classifyEngineRequestError,
  resolveEngineFallbackReason,
} from "~/lib/engine/telemetry";
import { mapEngineTimingWarnings } from "~/lib/engine/timing";
import {
  checkTimingViaEngine,
  isEngineConfigured,
} from "~/lib/engine/client";
import { getSession } from "~/server/better-auth/server";
import { getStartOfDayInTimezone } from "~/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type InteractionWarning = {
  id: string;
  type: "inhibition" | "synergy" | "competition";
  severity: "low" | "medium" | "critical";
  mechanism: string | null;
  researchUrl: string | null;
  suggestion: string | null;
  source: {
    id: string;
    name: string;
    form: string | null;
  };
  target: {
    id: string;
    name: string;
    form: string | null;
  };
};

export type RatioWarning = {
  id: string;
  severity: "low" | "medium" | "critical";
  message: string;
  currentRatio: number;
  optimalRatio: number | null;
  minRatio: number | null;
  maxRatio: number | null;
  researchUrl: string | null; // Link to Examine.com or study
  source: {
    id: string;
    name: string;
    dosage: number;
    unit: string;
  };
  target: {
    id: string;
    name: string;
    dosage: number;
    unit: string;
  };
};

export type TimingWarning = {
  id: string;
  severity: "low" | "medium" | "critical";
  reason: string;
  minHoursApart: number;
  actualHoursApart: number;
  source: {
    id: string;
    name: string;
    loggedAt: Date;
  };
  target: {
    id: string;
    name: string;
    loggedAt: Date;
  };
};

// ============================================================================
// Go Engine Integration (Primary)
// The Go engine at ENGINE_URL handles interaction and ratio checking with
// accurate stoichiometric calculations using elemental weights.
// TS fallback is kept for resilience when engine is unavailable.
// ============================================================================

type DosageInput = {
  supplementId: string;
  amount: number;
  unit: string;
};

type EngineRatioWarning = {
  id: string;
  severity: "low" | "medium" | "critical";
  currentRatio: number;
  optimalRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  warningMessage: string;
  researchUrl?: string; // Link to Examine.com or study
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

type EngineAnalyzeResponse = {
  status: "green" | "yellow" | "red";
  warnings: InteractionWarning[];
  synergies: InteractionWarning[];
  ratioWarnings?: EngineRatioWarning[];
  ratioEvaluationGaps?: Array<{
    sourceSupplementId: string;
    targetSupplementId: string;
    reason: "missing_dosage" | "missing_supplement_data" | "normalization_failed";
  }>;
};

/**
 * Call the Go engine to check interactions (if configured)
 * Returns null if engine not available, letting caller fall back to TS impl
 */
async function checkInteractionsViaEngine(
  userId: string,
  supplementIds: string[],
  dosages?: DosageInput[],
): Promise<{
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  ratioEvaluationGaps: Array<{
    sourceSupplementId: string;
    targetSupplementId: string;
    reason: "missing_dosage" | "missing_supplement_data" | "normalization_failed";
  }>;
} | null> {
  if (!isEngineConfigured()) {
    return null;
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(`${env.ENGINE_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": env.ENGINE_INTERNAL_KEY!,
        "X-User-ID": userId,
      },
      body: JSON.stringify({
        supplementIds,
        dosages: dosages?.map((d) => ({
          supplementId: d.supplementId,
          amount: d.amount,
          unit: d.unit,
        })),
      }),
      // Allow 8s for cold start on Fly.io, fall back to TS if engine is slow
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      logger.error("Engine analyze request failed with non-2xx response", {
        context: "engine.analyze",
        data: {
          endpoint: "/api/analyze",
          statusCode: response.status,
          fallbackReason: resolveEngineFallbackReason({
            engineConfigured: true,
            hasSession: true,
            statusCode: response.status,
          }),
          durationMs: Date.now() - startedAt,
          responseBody,
        },
      });
      return null;
    }

    const data = (await response.json()) as EngineAnalyzeResponse;

    // Convert engine ratio warnings to our RatioWarning format
    const ratioWarnings: RatioWarning[] = (data.ratioWarnings ?? []).map(
      (rw) => {
        // Find dosage info for source and target
        const sourceDosage = dosages?.find(
          (d) => d.supplementId === rw.source.id,
        );
        const targetDosage = dosages?.find(
          (d) => d.supplementId === rw.target.id,
        );

        return {
          id: rw.id,
          severity: rw.severity,
          message: rw.warningMessage,
          currentRatio: rw.currentRatio,
          optimalRatio: rw.optimalRatio ?? null,
          minRatio: rw.minRatio ?? null,
          maxRatio: rw.maxRatio ?? null,
          researchUrl: rw.researchUrl ?? null,
          source: {
            id: rw.source.id,
            name: rw.source.name,
            dosage: sourceDosage?.amount ?? 0,
            unit: sourceDosage?.unit ?? "mg",
          },
          target: {
            id: rw.target.id,
            name: rw.target.name,
            dosage: targetDosage?.amount ?? 0,
            unit: targetDosage?.unit ?? "mg",
          },
        };
      },
    );

    // Combine warnings and synergies into single array (matching TS behavior)
    // Note: Go returns null instead of [] for empty arrays
    const warnings = data.warnings ?? [];
    const synergies = data.synergies ?? [];
    const ratioEvaluationGaps = data.ratioEvaluationGaps ?? [];
    logger.debug("Engine analyze request succeeded", {
      context: "engine.analyze",
      data: {
        endpoint: "/api/analyze",
        durationMs: Date.now() - startedAt,
        warningCount: warnings.length,
        synergyCount: synergies.length,
        ratioWarningCount: ratioWarnings.length,
        ratioGapCount: ratioEvaluationGaps.length,
      },
    });
    return {
      interactions: [...warnings, ...synergies],
      ratioWarnings,
      ratioEvaluationGaps,
    };
  } catch (err) {
    logger.error("Engine analyze request failed, falling back to TypeScript", {
      context: "engine.analyze",
      data: {
        endpoint: "/api/analyze",
        fallbackReason: classifyEngineRequestError(err),
        durationMs: Date.now() - startedAt,
        error: err,
      },
    });
    return null;
  }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Check for interactions between a set of supplements.
 * Uses Go engine if available, falls back to TypeScript implementation.
 *
 * @param supplementIds - Array of supplement IDs to check
 * @param dosages - Optional dosage data for ratio calculations (enables stoichiometric checks)
 * @returns Object containing interaction warnings and ratio warnings
 */
export async function checkInteractions(
  supplementIds: string[],
  dosages?: Array<{ id: string; dosage: number; unit: string }>,
): Promise<{
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  ratioEvaluationGaps: Array<{
    sourceSupplementId: string;
    targetSupplementId: string;
    reason: "missing_dosage" | "missing_supplement_data" | "normalization_failed";
  }>;
}> {
  if (supplementIds.length < 2) {
    return { interactions: [], ratioWarnings: [], ratioEvaluationGaps: [] };
  }

  const startedAt = Date.now();

  // Convert dosages to engine format
  const engineDosages = dosages?.map((d) => ({
    supplementId: d.id,
    amount: d.dosage,
    unit: d.unit,
  }));

  // Try Go engine first (only if we have a valid session)
  const session = await getSession();
  const sessionUserId = session?.user?.id;
  const hasSession = !!sessionUserId;
  const engineConfigured = isEngineConfigured();

  if (sessionUserId) {
    const engineResult = await checkInteractionsViaEngine(
      sessionUserId,
      supplementIds,
      engineDosages,
    );
    if (engineResult !== null) {
      logger.debug("Using Go engine for interaction check", {
        context: "engine.analyze",
        data: {
          engineUsed: true,
          durationMs: Date.now() - startedAt,
          supplementCount: supplementIds.length,
        },
      });
      return engineResult;
    }
  }

  const fallbackReason = resolveEngineFallbackReason({
    engineConfigured,
    hasSession,
  });
  if (fallbackReason) {
    logger.debug("Falling back to TypeScript interaction check", {
      context: "engine.analyze",
      data: {
        engineUsed: false,
        fallbackReason,
        durationMs: Date.now() - startedAt,
        supplementCount: supplementIds.length,
      },
    });
  }

  // Fall back to TypeScript implementation
  logger.debug("Using TypeScript fallback for interaction check", {
    context: "engine.analyze",
  });

  // Find all interactions where both source and target are in our set
  const interactions = await db.query.interaction.findMany({
    where: or(
      inArray(interaction.sourceId, supplementIds),
      inArray(interaction.targetId, supplementIds),
    ),
    with: {
      source: true,
      target: true,
    },
  });

  // Filter to only include interactions where BOTH supplements are in the set
  const relevantInteractions = interactions.filter(
    (i) =>
      supplementIds.includes(i.sourceId) && supplementIds.includes(i.targetId),
  );

  const interactionWarnings = relevantInteractions.map((i) => ({
    id: i.id,
    type: i.type,
    severity: i.severity,
    mechanism: i.mechanism,
    researchUrl: i.researchUrl ?? null,
    suggestion: i.suggestion ?? null,
    source: {
      id: i.source.id,
      name: i.source.name,
      form: i.source.form,
    },
    target: {
      id: i.target.id,
      name: i.target.name,
      form: i.target.form,
    },
  }));

  // Check ratio warnings using TS fallback if dosages provided
  let ratioWarnings: RatioWarning[] = [];
  if (dosages && dosages.length >= 2) {
    ratioWarnings = await checkRatioWarnings(dosages);
  }

  return {
    interactions: interactionWarnings,
    ratioWarnings,
    ratioEvaluationGaps: [],
  };
}

/**
 * Check ratio-based warnings for a set of supplements with dosages.
 * Used for stoichiometric imbalance detection (e.g., Zn:Cu ratio).
 */
export async function checkRatioWarnings(
  supplements: Array<{ id: string; dosage: number; unit: string }>,
): Promise<RatioWarning[]> {
  if (supplements.length < 2) {
    return [];
  }

  const supplementIds = supplements.map((s) => s.id);
  const dosageMap = new Map(supplements.map((s) => [s.id, s]));

  // Get all ratio rules involving these supplements
  const rules = await db.query.ratioRule.findMany({
    where: or(
      inArray(ratioRule.sourceSupplementId, supplementIds),
      inArray(ratioRule.targetSupplementId, supplementIds),
    ),
    with: {
      sourceSupplement: true,
      targetSupplement: true,
    },
  });

  const warnings: RatioWarning[] = [];

  for (const rule of rules) {
    const sourceDosage = dosageMap.get(rule.sourceSupplementId);
    const targetDosage = dosageMap.get(rule.targetSupplementId);

    // Both supplements must be present
    if (!sourceDosage || !targetDosage) continue;

    // Calculate ratio (source:target)
    // Note: This is simplified - real implementation would normalize units
    const ratio = sourceDosage.dosage / targetDosage.dosage;

    // Check if ratio is outside acceptable range with a 15% tolerance buffer
    // This prevents warnings for ratios that are close enough (e.g., 33:1 when min is 40:1)
    // Ratios within 15% of the boundary are considered acceptable
    const toleranceFactor = 0.15;
    const effectiveMinRatio =
      rule.minRatio !== null ? rule.minRatio * (1 - toleranceFactor) : null;
    const effectiveMaxRatio =
      rule.maxRatio !== null ? rule.maxRatio * (1 + toleranceFactor) : null;

    const isBelowMin = effectiveMinRatio !== null && ratio < effectiveMinRatio;
    const isAboveMax = effectiveMaxRatio !== null && ratio > effectiveMaxRatio;

    if (isBelowMin || isAboveMax) {
      warnings.push({
        id: rule.id,
        severity: rule.severity,
        message: rule.warningMessage,
        currentRatio: Math.round(ratio * 10) / 10,
        optimalRatio: rule.optimalRatio,
        minRatio: rule.minRatio,
        maxRatio: rule.maxRatio,
        researchUrl: rule.researchUrl ?? null,
        source: {
          id: rule.sourceSupplement.id,
          name: rule.sourceSupplement.name,
          dosage: sourceDosage.dosage,
          unit: sourceDosage.unit,
        },
        target: {
          id: rule.targetSupplement.id,
          name: rule.targetSupplement.name,
          dosage: targetDosage.dosage,
          unit: targetDosage.unit,
        },
      });
    }
  }

  return warnings;
}

/**
 * Check timing-based warnings for supplements logged within a time window.
 * Uses Go engine if available, falls back to TypeScript implementation.
 * Used for transporter competition (e.g., Tyrosine and 5-HTP need 4h apart).
 */
export async function checkTimingWarnings(
  userId: string,
  supplementId: string,
  loggedAt: Date,
): Promise<TimingWarning[]> {
  const startedAt = Date.now();

  // Try Go engine first
  if (isEngineConfigured()) {
    try {
      const response = await checkTimingViaEngine(
        userId,
        supplementId,
        loggedAt,
      );
      logger.debug("Using Go engine for timing check");

      // Convert engine format to our TimingWarning format
      // Note: Go returns null instead of [] for empty arrays
      const warnings = response.warnings ?? [];
      logger.debug("Engine timing request succeeded", {
        context: "engine.timing",
        data: {
          endpoint: "/api/timing",
          engineUsed: true,
          durationMs: Date.now() - startedAt,
          warningCount: warnings.length,
        },
      });
      return mapEngineTimingWarnings(loggedAt, warnings);
    } catch (err) {
      logger.error("Engine timing check failed, falling back to TypeScript", {
        context: "engine.timing",
        data: {
          endpoint: "/api/timing",
          engineUsed: false,
          fallbackReason: classifyEngineRequestError(err),
          durationMs: Date.now() - startedAt,
          error: err,
        },
      });
    }
  } else {
    logger.debug("Engine timing check disabled, using TypeScript fallback", {
      context: "engine.timing",
      data: {
        endpoint: "/api/timing",
        engineUsed: false,
        fallbackReason: "not_configured",
        durationMs: Date.now() - startedAt,
      },
    });
  }

  // Fall back to TypeScript implementation
  logger.debug("Using TypeScript fallback for timing check");

  // Get timing rules for this supplement
  const rules = await db.query.timingRule.findMany({
    where: or(
      eq(timingRule.sourceSupplementId, supplementId),
      eq(timingRule.targetSupplementId, supplementId),
    ),
    with: {
      sourceSupplement: true,
      targetSupplement: true,
    },
  });

  if (rules.length === 0) return [];

  // Collect all other supplement IDs and find the max time window needed
  const otherSupplementIds: string[] = [];
  let maxWindowMs = 0;

  for (const rule of rules) {
    const otherId =
      rule.sourceSupplementId === supplementId
        ? rule.targetSupplementId
        : rule.sourceSupplementId;
    otherSupplementIds.push(otherId);
    maxWindowMs = Math.max(maxWindowMs, rule.minHoursApart * 60 * 60 * 1000);
  }

  // Single batched query for all potentially conflicting logs
  const windowStart = new Date(loggedAt.getTime() - maxWindowMs);
  const windowEnd = new Date(loggedAt.getTime() + maxWindowMs);

  const allConflictingLogs = await db.query.log.findMany({
    where: and(
      eq(log.userId, userId),
      inArray(log.supplementId, otherSupplementIds),
      gte(log.loggedAt, windowStart),
      lte(log.loggedAt, windowEnd),
    ),
    with: {
      supplement: true,
    },
  });

  // Group logs by supplement ID for efficient lookup
  const logsBySupplementId = new Map<string, typeof allConflictingLogs>();
  for (const logEntry of allConflictingLogs) {
    const existing = logsBySupplementId.get(logEntry.supplementId) ?? [];
    existing.push(logEntry);
    logsBySupplementId.set(logEntry.supplementId, existing);
  }

  const warnings: TimingWarning[] = [];

  for (const rule of rules) {
    const otherSupplementId =
      rule.sourceSupplementId === supplementId
        ? rule.targetSupplementId
        : rule.sourceSupplementId;

    const conflictingLogs = logsBySupplementId.get(otherSupplementId) ?? [];

    for (const conflictLog of conflictingLogs) {
      const hoursDiff =
        Math.abs(loggedAt.getTime() - conflictLog.loggedAt.getTime()) /
        (1000 * 60 * 60);

      if (hoursDiff < rule.minHoursApart) {
        const isSource = rule.sourceSupplementId === supplementId;

        warnings.push({
          id: rule.id,
          severity: rule.severity,
          reason: rule.reason,
          minHoursApart: rule.minHoursApart,
          actualHoursApart: Math.round(hoursDiff * 10) / 10,
          source: isSource
            ? {
                id: supplementId,
                name: rule.sourceSupplement.name,
                loggedAt,
              }
            : {
                id: conflictLog.supplementId,
                name: conflictLog.supplement.name,
                loggedAt: conflictLog.loggedAt,
              },
          target: isSource
            ? {
                id: conflictLog.supplementId,
                name: conflictLog.supplement.name,
                loggedAt: conflictLog.loggedAt,
              }
            : {
                id: supplementId,
                name: rule.targetSupplement.name,
                loggedAt,
              },
        });
      }
    }
  }

  return warnings;
}

/**
 * Get summary of today's interactions.
 *
 * @param userId - User ID
 * @param timezone - User's IANA timezone for accurate "today" calculation
 */
export async function getTodayInteractionSummary(
  userId: string,
  timezone?: string | null,
): Promise<{
  total: number;
  critical: number;
  medium: number;
  low: number;
  synergies: number;
  ratioWarnings: number;
}> {
  const today = getStartOfDayInTimezone(timezone);

  // Get today's logged supplements with dosages
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, today)),
    columns: {
      supplementId: true,
      dosage: true,
      unit: true,
    },
  });

  const uniqueSupplementIds = [
    ...new Set(todayLogs.map((l) => l.supplementId)),
  ];

  if (uniqueSupplementIds.length < 2) {
    return {
      total: 0,
      critical: 0,
      medium: 0,
      low: 0,
      synergies: 0,
      ratioWarnings: 0,
    };
  }

  // Build dosage map (use latest dosage for each supplement)
  const dosageMap = new Map<
    string,
    { id: string; dosage: number; unit: string }
  >();
  for (const l of todayLogs) {
    dosageMap.set(l.supplementId, {
      id: l.supplementId,
      dosage: l.dosage,
      unit: l.unit,
    });
  }
  const dosages = Array.from(dosageMap.values());

  const { interactions, ratioWarnings } = await checkInteractions(
    uniqueSupplementIds,
    dosages,
  );

  const warnings = interactions.filter((i) => i.type !== "synergy");
  const synergies = interactions.filter((i) => i.type === "synergy");

  return {
    total: warnings.length,
    critical: warnings.filter((i) => i.severity === "critical").length,
    medium: warnings.filter((i) => i.severity === "medium").length,
    low: warnings.filter((i) => i.severity === "low").length,
    synergies: synergies.length,
    ratioWarnings: ratioWarnings.length,
  };
}

/**
 * Get all interactions relevant to a user's stacks and recent logs.
 * Used for detailed interaction display.
 *
 * @param userId - User ID
 * @param timezone - User's IANA timezone for accurate "today" calculation
 */
export async function getUserInteractions(
  userId: string,
  timezone?: string | null,
): Promise<{
  today: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  inStacks: Array<{
    stackId: string;
    stackName: string;
    interactions: InteractionWarning[];
  }>;
}> {
  const { stack } = await import("~/server/db/schema");

  const today = getStartOfDayInTimezone(timezone);

  // Get today's logged supplements with dosages
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, today)),
    columns: {
      supplementId: true,
      dosage: true,
      unit: true,
    },
  });

  const todaySupplementIds = [...new Set(todayLogs.map((l) => l.supplementId))];

  // Build dosage map
  const dosageMap = new Map<
    string,
    { id: string; dosage: number; unit: string }
  >();
  for (const l of todayLogs) {
    dosageMap.set(l.supplementId, {
      id: l.supplementId,
      dosage: l.dosage,
      unit: l.unit,
    });
  }
  const dosages = Array.from(dosageMap.values());

  const { interactions: todayInteractions, ratioWarnings } =
    await checkInteractions(todaySupplementIds, dosages);

  // Get user's stacks
  const userStacks = await db.query.stack.findMany({
    where: eq(stack.userId, userId),
    with: {
      items: true,
    },
  });

  const stackInteractions = await Promise.all(
    userStacks.map(async (s) => {
      const supplementIds = s.items.map((item) => item.supplementId);
      const { interactions } = await checkInteractions(supplementIds);
      return {
        stackId: s.id,
        stackName: s.name,
        interactions,
      };
    }),
  );

  return {
    today: todayInteractions,
    ratioWarnings,
    inStacks: stackInteractions.filter((s) => s.interactions.length > 0),
  };
}

/**
 * Comprehensive check for a new log entry.
 * Returns all relevant warnings (interactions, ratios, timing).
 *
 * @param userId - User ID
 * @param supplementId - Supplement being logged
 * @param dosage - Dosage amount
 * @param unit - Dosage unit
 * @param loggedAt - Timestamp of the log
 * @param timezone - User's IANA timezone for accurate day boundary calculation
 */
export async function checkLogWarnings(
  userId: string,
  supplementId: string,
  dosage: number,
  unit: string,
  loggedAt: Date,
  timezone?: string | null,
): Promise<{
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
}> {
  // Calculate "today" for the logged timestamp in user's timezone
  const today = getStartOfDayInTimezone(timezone);

  // Get today's other logged supplements
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, today)),
    with: {
      supplement: true,
    },
  });

  // Include the new supplement in the check
  const allSupplements = [
    ...todayLogs.map((l) => ({
      id: l.supplementId,
      dosage: l.dosage,
      unit: l.unit,
    })),
    { id: supplementId, dosage, unit },
  ];

  const uniqueIds = [...new Set(allSupplements.map((s) => s.id))];

  const [{ interactions, ratioWarnings }, timingWarnings] = await Promise.all([
    checkInteractions(uniqueIds, allSupplements),
    checkTimingWarnings(userId, supplementId, loggedAt),
  ]);

  // Filter to only interactions involving the new supplement
  const relevantInteractions = interactions.filter(
    (i) => i.source.id === supplementId || i.target.id === supplementId,
  );

  return {
    interactions: relevantInteractions,
    ratioWarnings,
    timingWarnings,
  };
}
