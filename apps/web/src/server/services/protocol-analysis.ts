import { eq, or, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import {
  interaction,
  timingRule,
  ratioRule,
  type timeSlotEnum,
  type frequencyEnum,
  type dosageUnitEnum,
  type optimalTimeOfDayEnum,
} from "~/server/db/schema";

// ============================================================================
// Types
// ============================================================================

type TimeSlot = (typeof timeSlotEnum.enumValues)[number];
type Frequency = (typeof frequencyEnum.enumValues)[number];
type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];
type OptimalTimeOfDay = (typeof optimalTimeOfDayEnum.enumValues)[number];

type ProtocolItem = {
  id: string;
  supplementId: string;
  dosage: number;
  unit: DosageUnit;
  timeSlot: TimeSlot;
  frequency: Frequency;
  daysOfWeek: string[] | null;
  groupName: string | null;
  supplement: {
    id: string;
    name: string;
    form: string | null;
    optimalTimeOfDay: OptimalTimeOfDay | null;
    safetyCategory: string | null;
    elementalWeight: number | null;
  };
};

type Protocol = {
  id: string;
  name: string;
  items: ProtocolItem[];
};

// Issue severity levels
export type IssueSeverity = "info" | "warning" | "critical";

// Types of issues we can detect
export type IssueType =
  | "conflict" // Inhibition/competition at same time
  | "timing" // Wrong time of day vs optimal
  | "spacing" // Need more time apart (timing rules)
  | "ratio" // Stoichiometric imbalance
  | "redundancy" // Same supplement in multiple slots
  | "missing_synergy"; // Could add synergistic supplement

// A single issue detected in the protocol
export type ProtocolIssue = {
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedItems: string[]; // Protocol item IDs
  suggestion?: string;
  researchUrl?: string | null;
};

// Analysis result
export type ProtocolAnalysis = {
  score: number; // 0-100
  issues: ProtocolIssue[];
  synergies: ProtocolIssue[]; // Positive findings (missing_synergy type)
  summary: {
    totalItems: number;
    conflictCount: number;
    timingIssueCount: number;
    spacingIssueCount: number;
    ratioIssueCount: number;
    redundancyCount: number;
    missingSynergyCount: number;
  };
};

// ============================================================================
// Time Slot Mapping
// ============================================================================

/**
 * Map optimal time of day to compatible time slots.
 * e.g., "morning" optimal -> morning slot is ideal
 */
const OPTIMAL_TIME_SLOT_MAP: Record<OptimalTimeOfDay, TimeSlot[]> = {
  morning: ["morning"],
  afternoon: ["afternoon"],
  evening: ["evening"],
  bedtime: ["bedtime"],
  with_meals: ["morning", "afternoon", "evening"], // Any meal time
  any: ["morning", "afternoon", "evening", "bedtime"], // All slots are fine
};

/**
 * Check if a time slot is compatible with the optimal time of day.
 */
function isTimeSlotCompatible(
  slot: TimeSlot,
  optimal: OptimalTimeOfDay | null,
): boolean {
  if (!optimal) return true; // No preference
  return OPTIMAL_TIME_SLOT_MAP[optimal].includes(slot);
}

/**
 * Get a human-readable description of the optimal time.
 */
function getOptimalTimeDescription(optimal: OptimalTimeOfDay): string {
  switch (optimal) {
    case "morning":
      return "morning";
    case "afternoon":
      return "afternoon";
    case "evening":
      return "evening";
    case "bedtime":
      return "at bedtime";
    case "with_meals":
      return "with a meal";
    case "any":
      return "at any time";
  }
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze a protocol for issues and calculate a health score.
 */
export async function analyzeProtocol(
  protocol: Protocol,
): Promise<ProtocolAnalysis> {
  const issues: ProtocolIssue[] = [];
  const synergies: ProtocolIssue[] = [];

  if (protocol.items.length === 0) {
    return {
      score: 100,
      issues: [],
      synergies: [],
      summary: {
        totalItems: 0,
        conflictCount: 0,
        timingIssueCount: 0,
        spacingIssueCount: 0,
        ratioIssueCount: 0,
        redundancyCount: 0,
        missingSynergyCount: 0,
      },
    };
  }

  // Run all checks
  const [
    conflictIssues,
    timingIssues,
    spacingIssues,
    ratioIssues,
    redundancyIssues,
    synergyOpportunities,
  ] = await Promise.all([
    checkConflicts(protocol.items),
    checkTimingIssues(protocol.items),
    checkSpacingIssues(protocol.items),
    checkRatioIssues(protocol.items),
    checkRedundancies(protocol.items),
    checkMissingSynergies(protocol.items),
  ]);

  issues.push(
    ...conflictIssues,
    ...timingIssues,
    ...spacingIssues,
    ...ratioIssues,
    ...redundancyIssues,
  );
  synergies.push(...synergyOpportunities);

  // Calculate score
  const score = calculateScore(issues, protocol.items.length);

  return {
    score,
    issues,
    synergies,
    summary: {
      totalItems: protocol.items.length,
      conflictCount: conflictIssues.length,
      timingIssueCount: timingIssues.length,
      spacingIssueCount: spacingIssues.length,
      ratioIssueCount: ratioIssues.length,
      redundancyCount: redundancyIssues.length,
      missingSynergyCount: synergyOpportunities.length,
    },
  };
}

/**
 * Calculate a health score based on issues.
 * Starts at 100, deducts points based on severity and type.
 */
function calculateScore(issues: ProtocolIssue[], itemCount: number): number {
  if (itemCount === 0) return 100;

  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case "critical":
        score -= 15;
        break;
      case "warning":
        score -= 8;
        break;
      case "info":
        score -= 3;
        break;
    }
  }

  // Don't go below 0
  return Math.max(0, Math.round(score));
}

// ============================================================================
// Individual Check Functions
// ============================================================================

/**
 * Check for conflicts (inhibition/competition) between supplements in the same time slot.
 */
async function checkConflicts(items: ProtocolItem[]): Promise<ProtocolIssue[]> {
  const issues: ProtocolIssue[] = [];
  const supplementIds = items.map((i) => i.supplementId);

  if (supplementIds.length < 2) return issues;

  // Get all negative interactions between these supplements
  const negativeInteractions = await db.query.interaction.findMany({
    where: or(
      inArray(interaction.sourceId, supplementIds),
      inArray(interaction.targetId, supplementIds),
    ),
    with: {
      source: true,
      target: true,
    },
  });

  // Filter to inhibition/competition only and where both are in our list
  const conflicts = negativeInteractions.filter(
    (i) =>
      (i.type === "inhibition" || i.type === "competition") &&
      supplementIds.includes(i.sourceId) &&
      supplementIds.includes(i.targetId),
  );

  // Group items by time slot
  const itemsBySlot = new Map<TimeSlot, ProtocolItem[]>();
  for (const item of items) {
    const existing = itemsBySlot.get(item.timeSlot) ?? [];
    existing.push(item);
    itemsBySlot.set(item.timeSlot, existing);
  }

  // Check for conflicts within each time slot
  for (const conflict of conflicts) {
    // Find items for source and target supplements
    const sourceItems = items.filter(
      (i) => i.supplementId === conflict.sourceId,
    );
    const targetItems = items.filter(
      (i) => i.supplementId === conflict.targetId,
    );

    // Check if any are in the same time slot
    for (const sourceItem of sourceItems) {
      for (const targetItem of targetItems) {
        if (sourceItem.timeSlot === targetItem.timeSlot) {
          issues.push({
            type: "conflict",
            severity: conflict.severity === "critical" ? "critical" : "warning",
            title: `${conflict.source.name} conflicts with ${conflict.target.name}`,
            description:
              conflict.mechanism ??
              `${conflict.type} interaction detected in ${sourceItem.timeSlot} slot.`,
            affectedItems: [sourceItem.id, targetItem.id],
            suggestion:
              conflict.suggestion ??
              "Consider taking these at different times.",
            researchUrl: conflict.researchUrl,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check for timing issues (wrong time of day vs optimal).
 */
async function checkTimingIssues(
  items: ProtocolItem[],
): Promise<ProtocolIssue[]> {
  const issues: ProtocolIssue[] = [];

  for (const item of items) {
    const optimal = item.supplement.optimalTimeOfDay;
    if (!optimal || optimal === "any") continue;

    if (!isTimeSlotCompatible(item.timeSlot, optimal)) {
      const optimalDesc = getOptimalTimeDescription(optimal);
      issues.push({
        type: "timing",
        severity: "info",
        title: `${item.supplement.name} is better taken ${optimalDesc}`,
        description: `Currently scheduled for ${item.timeSlot}, but ${item.supplement.name} is optimally absorbed or effective when taken ${optimalDesc}.`,
        affectedItems: [item.id],
        suggestion: `Move ${item.supplement.name} to a ${optimalDesc} slot for better results.`,
      });
    }
  }

  return issues;
}

/**
 * Check for spacing issues (supplements that need time apart).
 */
async function checkSpacingIssues(
  items: ProtocolItem[],
): Promise<ProtocolIssue[]> {
  const issues: ProtocolIssue[] = [];
  const supplementIds = items.map((i) => i.supplementId);

  if (supplementIds.length < 2) return issues;

  // Get timing rules between these supplements
  const rules = await db.query.timingRule.findMany({
    where: or(
      inArray(timingRule.sourceSupplementId, supplementIds),
      inArray(timingRule.targetSupplementId, supplementIds),
    ),
    with: {
      sourceSupplement: true,
      targetSupplement: true,
    },
  });

  // Filter to rules where both supplements are in our list
  const relevantRules = rules.filter(
    (r) =>
      supplementIds.includes(r.sourceSupplementId) &&
      supplementIds.includes(r.targetSupplementId),
  );

  // Check if any pair is in the same time slot (they need spacing)
  for (const rule of relevantRules) {
    const sourceItems = items.filter(
      (i) => i.supplementId === rule.sourceSupplementId,
    );
    const targetItems = items.filter(
      (i) => i.supplementId === rule.targetSupplementId,
    );

    for (const sourceItem of sourceItems) {
      for (const targetItem of targetItems) {
        if (sourceItem.timeSlot === targetItem.timeSlot) {
          issues.push({
            type: "spacing",
            severity: rule.severity === "critical" ? "critical" : "warning",
            title: `${rule.sourceSupplement.name} and ${rule.targetSupplement.name} need spacing`,
            description: rule.reason,
            affectedItems: [sourceItem.id, targetItem.id],
            suggestion: `Take these ${rule.minHoursApart}+ hours apart.`,
            researchUrl: rule.researchUrl,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check for ratio imbalances (stoichiometric issues).
 */
async function checkRatioIssues(
  items: ProtocolItem[],
): Promise<ProtocolIssue[]> {
  const issues: ProtocolIssue[] = [];
  const supplementIds = items.map((i) => i.supplementId);

  if (supplementIds.length < 2) return issues;

  // Get ratio rules
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

  // Filter to rules where both supplements are in our list
  const relevantRules = rules.filter(
    (r) =>
      supplementIds.includes(r.sourceSupplementId) &&
      supplementIds.includes(r.targetSupplementId),
  );

  for (const rule of relevantRules) {
    // Calculate total daily dosage for each supplement
    // (sum across all time slots for "daily" frequency)
    const sourceItems = items.filter(
      (i) => i.supplementId === rule.sourceSupplementId,
    );
    const targetItems = items.filter(
      (i) => i.supplementId === rule.targetSupplementId,
    );

    if (sourceItems.length === 0 || targetItems.length === 0) continue;

    // Sum dosages (simplified - not converting units)
    const sourceDosage = sourceItems.reduce((sum, i) => sum + i.dosage, 0);
    const targetDosage = targetItems.reduce((sum, i) => sum + i.dosage, 0);

    if (targetDosage === 0) continue;

    // Apply elemental weight if available
    const sourceElemental =
      sourceDosage *
      ((rule.sourceSupplement.elementalWeight ?? 100) / 100);
    const targetElemental =
      targetDosage *
      ((rule.targetSupplement.elementalWeight ?? 100) / 100);

    const ratio = sourceElemental / targetElemental;

    // Check if ratio is outside acceptable range with 15% tolerance
    const toleranceFactor = 0.15;
    const effectiveMinRatio =
      rule.minRatio !== null ? rule.minRatio * (1 - toleranceFactor) : null;
    const effectiveMaxRatio =
      rule.maxRatio !== null ? rule.maxRatio * (1 + toleranceFactor) : null;

    const isBelowMin = effectiveMinRatio !== null && ratio < effectiveMinRatio;
    const isAboveMax = effectiveMaxRatio !== null && ratio > effectiveMaxRatio;

    if (isBelowMin || isAboveMax) {
      const affectedItemIds = [
        ...sourceItems.map((i) => i.id),
        ...targetItems.map((i) => i.id),
      ];

      issues.push({
        type: "ratio",
        severity: rule.severity === "critical" ? "critical" : "warning",
        title: rule.warningMessage,
        description: `Current ratio: ${ratio.toFixed(1)}:1. ${
          rule.optimalRatio
            ? `Optimal: ${rule.optimalRatio}:1.`
            : rule.minRatio && rule.maxRatio
              ? `Recommended range: ${rule.minRatio}:1 to ${rule.maxRatio}:1.`
              : ""
        }`,
        affectedItems: affectedItemIds,
        suggestion:
          isBelowMin
            ? `Consider increasing ${rule.sourceSupplement.name} or reducing ${rule.targetSupplement.name}.`
            : `Consider reducing ${rule.sourceSupplement.name} or increasing ${rule.targetSupplement.name}.`,
        researchUrl: rule.researchUrl,
      });
    }
  }

  return issues;
}

/**
 * Check for redundancies (same supplement in multiple time slots).
 * This isn't necessarily bad, but worth flagging.
 */
async function checkRedundancies(
  items: ProtocolItem[],
): Promise<ProtocolIssue[]> {
  const issues: ProtocolIssue[] = [];

  // Group by supplement ID
  const itemsBySupplementId = new Map<string, ProtocolItem[]>();
  for (const item of items) {
    const existing = itemsBySupplementId.get(item.supplementId) ?? [];
    existing.push(item);
    itemsBySupplementId.set(item.supplementId, existing);
  }

  // Check for supplements in multiple time slots
  for (const [, supplementItems] of itemsBySupplementId) {
    if (supplementItems.length <= 1) continue;

    // Get unique time slots
    const timeSlots = new Set(supplementItems.map((i) => i.timeSlot));
    if (timeSlots.size <= 1) continue; // Multiple doses at same time is fine

    const supplementName = supplementItems[0]!.supplement.name;
    const slotList = Array.from(timeSlots).join(", ");

    issues.push({
      type: "redundancy",
      severity: "info",
      title: `${supplementName} is scheduled multiple times`,
      description: `${supplementName} appears in ${timeSlots.size} different time slots: ${slotList}.`,
      affectedItems: supplementItems.map((i) => i.id),
      suggestion:
        "This may be intentional (split dosing), but verify this is your intended protocol.",
    });
  }

  return issues;
}

/**
 * Check for missing synergy opportunities.
 * Looks for supplements in the protocol that have synergistic partners not currently included.
 */
async function checkMissingSynergies(
  items: ProtocolItem[],
): Promise<ProtocolIssue[]> {
  const opportunities: ProtocolIssue[] = [];
  const supplementIds = items.map((i) => i.supplementId);

  if (supplementIds.length === 0) return opportunities;

  // Get synergy interactions where one supplement is in our list
  const synergyInteractions = await db.query.interaction.findMany({
    where: eq(interaction.type, "synergy"),
    with: {
      source: true,
      target: true,
    },
  });

  // Find synergies where we have one supplement but not the other
  for (const synergy of synergyInteractions) {
    const hasSource = supplementIds.includes(synergy.sourceId);
    const hasTarget = supplementIds.includes(synergy.targetId);

    // If we have both, no opportunity needed
    if (hasSource && hasTarget) continue;

    // If we have one but not the other, suggest adding the missing one
    if (hasSource && !hasTarget) {
      const sourceItem = items.find((i) => i.supplementId === synergy.sourceId);
      if (!sourceItem) continue;

      opportunities.push({
        type: "missing_synergy",
        severity: "info",
        title: `Consider adding ${synergy.target.name}`,
        description:
          synergy.mechanism ??
          `${synergy.target.name} has synergistic benefits with ${synergy.source.name}.`,
        affectedItems: [sourceItem.id],
        suggestion: `Adding ${synergy.target.name} could enhance the effects of ${synergy.source.name}.`,
        researchUrl: synergy.researchUrl,
      });
    } else if (!hasSource && hasTarget) {
      const targetItem = items.find((i) => i.supplementId === synergy.targetId);
      if (!targetItem) continue;

      opportunities.push({
        type: "missing_synergy",
        severity: "info",
        title: `Consider adding ${synergy.source.name}`,
        description:
          synergy.mechanism ??
          `${synergy.source.name} has synergistic benefits with ${synergy.target.name}.`,
        affectedItems: [targetItem.id],
        suggestion: `Adding ${synergy.source.name} could enhance the effects of ${synergy.target.name}.`,
        researchUrl: synergy.researchUrl,
      });
    }
  }

  // Deduplicate by supplement name (might have multiple synergies pointing to same supplement)
  const seen = new Set<string>();
  return opportunities.filter((o) => {
    if (seen.has(o.title)) return false;
    seen.add(o.title);
    return true;
  });
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  Protocol as AnalyzableProtocol,
  ProtocolItem as AnalyzableProtocolItem,
};
