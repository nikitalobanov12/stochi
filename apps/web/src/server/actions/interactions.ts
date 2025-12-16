"use server";

import { inArray, or, and, eq, gte, lte } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "~/server/db";
import { interaction, ratioRule, timingRule, log } from "~/server/db/schema";
import { env } from "~/env";
import { logger } from "~/lib/logger";

export type InteractionWarning = {
  id: string;
  type: "inhibition" | "synergy" | "competition";
  severity: "low" | "medium" | "critical";
  mechanism: string | null;
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
// Go Engine Integration
// ============================================================================

type EngineAnalyzeResponse = {
  status: "green" | "yellow" | "red";
  warnings: InteractionWarning[];
  synergies: InteractionWarning[];
};

/**
 * Get session token from cookies for Go engine auth
 */
async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("better-auth.session_token")?.value ?? null;
}

/**
 * Call the Go engine to check interactions (if configured)
 * Returns null if engine not available, letting caller fall back to TS impl
 */
async function checkInteractionsViaEngine(
  supplementIds: string[],
): Promise<InteractionWarning[] | null> {
  if (!env.ENGINE_URL) {
    return null;
  }

  const token = await getSessionToken();
  if (!token) {
    logger.warn("No session token available for engine call");
    return null;
  }

  try {
    const response = await fetch(`${env.ENGINE_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ supplementIds }),
      // Short timeout - fall back to TS if engine is slow
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      logger.error(`Engine returned ${response.status}: ${await response.text()}`);
      return null;
    }

    const data = (await response.json()) as EngineAnalyzeResponse;
    // Combine warnings and synergies into single array (matching TS behavior)
    return [...data.warnings, ...data.synergies];
  } catch (err) {
    logger.error("Engine request failed, falling back to TS", { data: err });
    return null;
  }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Check for interactions between a set of supplements.
 * Uses Go engine if available, falls back to TypeScript implementation.
 */
export async function checkInteractions(
  supplementIds: string[],
): Promise<InteractionWarning[]> {
  if (supplementIds.length < 2) {
    return [];
  }

  // Try Go engine first
  const engineResult = await checkInteractionsViaEngine(supplementIds);
  if (engineResult !== null) {
    logger.debug("Using Go engine for interaction check");
    return engineResult;
  }

  // Fall back to TypeScript implementation
  logger.debug("Using TypeScript fallback for interaction check");

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
      supplementIds.includes(i.sourceId) &&
      supplementIds.includes(i.targetId),
  );

  return relevantInteractions.map((i) => ({
    id: i.id,
    type: i.type,
    severity: i.severity,
    mechanism: i.mechanism,
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

    // Check if ratio is outside acceptable range
    const isBelowMin = rule.minRatio !== null && ratio < rule.minRatio;
    const isAboveMax = rule.maxRatio !== null && ratio > rule.maxRatio;

    if (isBelowMin || isAboveMax) {
      warnings.push({
        id: rule.id,
        severity: rule.severity,
        message: rule.warningMessage,
        currentRatio: Math.round(ratio * 10) / 10,
        optimalRatio: rule.optimalRatio,
        minRatio: rule.minRatio,
        maxRatio: rule.maxRatio,
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
 * Used for transporter competition (e.g., Tyrosine and 5-HTP need 4h apart).
 */
export async function checkTimingWarnings(
  userId: string,
  supplementId: string,
  loggedAt: Date,
): Promise<TimingWarning[]> {
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
 * Get interaction count and severity breakdown for today's logged supplements.
 * Used for the dashboard summary card.
 */
export async function getTodayInteractionSummary(userId: string): Promise<{
  total: number;
  critical: number;
  medium: number;
  low: number;
  synergies: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's logged supplements
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, today)),
    columns: {
      supplementId: true,
    },
  });

  const uniqueSupplementIds = [...new Set(todayLogs.map((l) => l.supplementId))];

  if (uniqueSupplementIds.length < 2) {
    return { total: 0, critical: 0, medium: 0, low: 0, synergies: 0 };
  }

  const interactions = await checkInteractions(uniqueSupplementIds);

  const warnings = interactions.filter((i) => i.type !== "synergy");
  const synergies = interactions.filter((i) => i.type === "synergy");

  return {
    total: warnings.length,
    critical: warnings.filter((i) => i.severity === "critical").length,
    medium: warnings.filter((i) => i.severity === "medium").length,
    low: warnings.filter((i) => i.severity === "low").length,
    synergies: synergies.length,
  };
}

/**
 * Get all interactions relevant to a user's stacks and recent logs.
 * Used for detailed interaction display.
 */
export async function getUserInteractions(userId: string): Promise<{
  today: InteractionWarning[];
  inStacks: Array<{
    stackId: string;
    stackName: string;
    interactions: InteractionWarning[];
  }>;
}> {
  const { stack } = await import("~/server/db/schema");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's logged supplements
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, today)),
    columns: {
      supplementId: true,
    },
  });

  const todaySupplementIds = [...new Set(todayLogs.map((l) => l.supplementId))];
  const todayInteractions = await checkInteractions(todaySupplementIds);

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
      const interactions = await checkInteractions(supplementIds);
      return {
        stackId: s.id,
        stackName: s.name,
        interactions,
      };
    }),
  );

  return {
    today: todayInteractions,
    inStacks: stackInteractions.filter((s) => s.interactions.length > 0),
  };
}

/**
 * Comprehensive check for a new log entry.
 * Returns all relevant warnings (interactions, ratios, timing).
 */
export async function checkLogWarnings(
  userId: string,
  supplementId: string,
  dosage: number,
  unit: string,
  loggedAt: Date,
): Promise<{
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
}> {
  const today = new Date(loggedAt);
  today.setHours(0, 0, 0, 0);

  // Get today's other logged supplements
  const todayLogs = await db.query.log.findMany({
    where: and(
      eq(log.userId, userId),
      gte(log.loggedAt, today),
    ),
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

  const [interactions, ratioWarnings, timingWarnings] = await Promise.all([
    checkInteractions(uniqueIds),
    checkRatioWarnings(allSupplements),
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
