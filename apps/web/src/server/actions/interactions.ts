"use server";

import { inArray, or, and, eq, gte, lte } from "drizzle-orm";
import { db } from "~/server/db";
import { interaction, ratioRule, timingRule, log } from "~/server/db/schema";
import { env } from "~/env";
import { logger } from "~/lib/logger";
import { checkTimingViaEngine, isEngineConfigured, type EngineTimingWarning } from "~/lib/engine/client";
import { getSession } from "~/server/better-auth/server";

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
};

/**
 * Call the Go engine to check interactions (if configured)
 * Returns null if engine not available, letting caller fall back to TS impl
 */
async function checkInteractionsViaEngine(
  userId: string,
  supplementIds: string[],
  dosages?: DosageInput[],
): Promise<{ interactions: InteractionWarning[]; ratioWarnings: RatioWarning[] } | null> {
  if (!isEngineConfigured()) {
    return null;
  }

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
      // Short timeout - fall back to TS if engine is slow
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      logger.error(`Engine returned ${response.status}: ${await response.text()}`);
      return null;
    }

    const data = (await response.json()) as EngineAnalyzeResponse;

    // Convert engine ratio warnings to our RatioWarning format
    const ratioWarnings: RatioWarning[] = (data.ratioWarnings ?? []).map((rw) => {
      // Find dosage info for source and target
      const sourceDosage = dosages?.find((d) => d.supplementId === rw.source.id);
      const targetDosage = dosages?.find((d) => d.supplementId === rw.target.id);

      return {
        id: rw.id,
        severity: rw.severity,
        message: rw.warningMessage,
        currentRatio: rw.currentRatio,
        optimalRatio: rw.optimalRatio ?? null,
        minRatio: rw.minRatio ?? null,
        maxRatio: rw.maxRatio ?? null,
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
    });

    // Combine warnings and synergies into single array (matching TS behavior)
    return {
      interactions: [...data.warnings, ...data.synergies],
      ratioWarnings,
    };
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
 *
 * @param supplementIds - Array of supplement IDs to check
 * @param dosages - Optional dosage data for ratio calculations (enables stoichiometric checks)
 * @returns Object containing interaction warnings and ratio warnings
 */
export async function checkInteractions(
  supplementIds: string[],
  dosages?: Array<{ id: string; dosage: number; unit: string }>,
): Promise<{ interactions: InteractionWarning[]; ratioWarnings: RatioWarning[] }> {
  if (supplementIds.length < 2) {
    return { interactions: [], ratioWarnings: [] };
  }

  // Convert dosages to engine format
  const engineDosages = dosages?.map((d) => ({
    supplementId: d.id,
    amount: d.dosage,
    unit: d.unit,
  }));

  // Try Go engine first (only if we have a valid session)
  const session = await getSession();
  if (session?.user?.id) {
    const engineResult = await checkInteractionsViaEngine(session.user.id, supplementIds, engineDosages);
    if (engineResult !== null) {
      logger.debug("Using Go engine for interaction check");
      return engineResult;
    }
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

  return { interactions: interactionWarnings, ratioWarnings };
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
 * Uses Go engine if available, falls back to TypeScript implementation.
 * Used for transporter competition (e.g., Tyrosine and 5-HTP need 4h apart).
 */
export async function checkTimingWarnings(
  userId: string,
  supplementId: string,
  loggedAt: Date,
): Promise<TimingWarning[]> {
  // Try Go engine first
  if (isEngineConfigured()) {
    try {
      const response = await checkTimingViaEngine(userId, supplementId, loggedAt);
      logger.debug("Using Go engine for timing check");

      // Convert engine format to our TimingWarning format
      return response.warnings.map((w: EngineTimingWarning) => ({
        id: w.id,
        severity: w.severity,
        reason: w.reason,
        minHoursApart: w.minHoursApart,
        actualHoursApart: w.actualHoursApart,
        source: {
          id: w.source.id,
          name: w.source.name,
          loggedAt, // Engine doesn't return timestamps, use the provided one
        },
        target: {
          id: w.target.id,
          name: w.target.name,
          loggedAt, // Approximate - the actual conflict log time isn't returned
        },
      }));
    } catch (err) {
      logger.error("Engine timing check failed, falling back to TS", { data: err });
    }
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
 * Get interaction count and severity breakdown for today's logged supplements.
 * Used for the dashboard summary card.
 */
export async function getTodayInteractionSummary(userId: string): Promise<{
  total: number;
  critical: number;
  medium: number;
  low: number;
  synergies: number;
  ratioWarnings: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's logged supplements with dosages
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, today)),
    columns: {
      supplementId: true,
      dosage: true,
      unit: true,
    },
  });

  const uniqueSupplementIds = [...new Set(todayLogs.map((l) => l.supplementId))];

  if (uniqueSupplementIds.length < 2) {
    return { total: 0, critical: 0, medium: 0, low: 0, synergies: 0, ratioWarnings: 0 };
  }

  // Build dosage map (use latest dosage for each supplement)
  const dosageMap = new Map<string, { id: string; dosage: number; unit: string }>();
  for (const l of todayLogs) {
    dosageMap.set(l.supplementId, { id: l.supplementId, dosage: l.dosage, unit: l.unit });
  }
  const dosages = Array.from(dosageMap.values());

  const { interactions, ratioWarnings } = await checkInteractions(uniqueSupplementIds, dosages);

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
 */
export async function getUserInteractions(userId: string): Promise<{
  today: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  inStacks: Array<{
    stackId: string;
    stackName: string;
    interactions: InteractionWarning[];
  }>;
}> {
  const { stack } = await import("~/server/db/schema");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
  const dosageMap = new Map<string, { id: string; dosage: number; unit: string }>();
  for (const l of todayLogs) {
    dosageMap.set(l.supplementId, { id: l.supplementId, dosage: l.dosage, unit: l.unit });
  }
  const dosages = Array.from(dosageMap.values());

  const { interactions: todayInteractions, ratioWarnings } = await checkInteractions(todaySupplementIds, dosages);

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
