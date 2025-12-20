import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "~/server/db";
import { log, supplement, type mealContextEnum } from "~/server/db/schema";
import {
  SAFETY_LIMITS,
  type SafetyCategory,
} from "~/server/data/safety-limits";
import {
  getBioavailabilityRule,
  isMealContextOptimal,
  type BioavailabilityModifier,
} from "~/server/data/bioavailability-rules";

type MealContext = (typeof mealContextEnum.enumValues)[number];

// ============================================================================
// Types
// ============================================================================

export type SafetyStatus = "safe" | "warning" | "blocked" | "experimental";

export type SafetyCheckResult = {
  /** Whether the dosage is safe */
  isSafe: boolean;
  /** Whether this is a hard limit (BLOCK) or soft limit (WARNING) */
  isHardLimit: boolean;
  /** The safety category being checked (if applicable) */
  category: SafetyCategory | null;
  /** Current daily elemental total including the new dose */
  currentTotal: number;
  /** The upper limit for this category */
  limit: number;
  /** Unit for the limit */
  unit: string;
  /** Percentage of limit reached (e.g., 120 = 120% of UL) */
  percentOfLimit: number;
  /** Human-readable warning message */
  message: string | null;
  /** Source of the limit (NIH, etc.) */
  source: string | null;
  /** Safety status: safe, warning, blocked, or experimental */
  status: SafetyStatus;
};

export type SupplementWithSafety = {
  id: string;
  name: string;
  elementalWeight: number | null;
  safetyCategory: string | null;
  defaultUnit: string | null;
  isResearchChemical?: boolean;
};

// ============================================================================
// Unit Conversion
// ============================================================================

/**
 * Convert a dosage to milligrams.
 * IU cannot be converted (requires requiredUnit enforcement).
 */
function convertToMg(dosage: number, unit: string): number | null {
  switch (unit) {
    case "mg":
      return dosage;
    case "mcg":
      return dosage / 1000;
    case "g":
      return dosage * 1000;
    case "IU":
      // IU cannot be converted - must use requiredUnit enforcement
      return null;
    default:
      return null;
  }
}

/**
 * Convert dosage to the target unit for comparison.
 * Returns null if conversion is not possible (e.g., IU to mg).
 */
function convertDosage(
  dosage: number,
  fromUnit: string,
  toUnit: string,
): number | null {
  // Same unit, no conversion needed
  if (fromUnit === toUnit) return dosage;

  // IU cannot be converted
  if (fromUnit === "IU" || toUnit === "IU") return null;

  // Convert to mg first, then to target
  const inMg = convertToMg(dosage, fromUnit);
  if (inMg === null) return null;

  switch (toUnit) {
    case "mg":
      return inMg;
    case "mcg":
      return inMg * 1000;
    case "g":
      return inMg / 1000;
    default:
      return null;
  }
}

// ============================================================================
// Elemental Weight Calculation
// ============================================================================

/**
 * Calculate the elemental weight from a compound dosage.
 * e.g., 50mg Zinc Picolinate (21% elemental) = 10.5mg elemental zinc
 *
 * @param compoundDosage - The dosage of the compound form
 * @param elementalWeightPercent - The percentage of elemental content (e.g., 21 for 21%)
 */
export function calculateElementalDosage(
  compoundDosage: number,
  elementalWeightPercent: number | null,
): number {
  // If no elemental weight defined, assume 100% (pure form)
  if (elementalWeightPercent === null || elementalWeightPercent === 0) {
    return compoundDosage;
  }
  return compoundDosage * (elementalWeightPercent / 100);
}

// ============================================================================
// Daily Total Calculation
// ============================================================================

/**
 * Get date range for a given period (daily or weekly).
 * @param period - "daily" for today only, "weekly" for last 7 days
 */
function getDateRange(period: "daily" | "weekly" = "daily"): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  if (period === "weekly") {
    // Start from 6 days ago at midnight (7-day window including today)
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
      0,
      0,
      0,
      0,
    );
    return { start, end };
  }

  // Daily: midnight to midnight today
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  return { start, end };
}

/**
 * Get the elemental total for a safety category over a given period.
 * Sums all logs from the period that belong to supplements with the given safetyCategory.
 *
 * @param userId - The user's ID
 * @param safetyCategory - The safety category to sum (e.g., "zinc", "magnesium")
 * @param targetUnit - The unit to convert all dosages to
 * @param period - "daily" (default) or "weekly" for 7-day aggregation
 */
export async function getElementalTotal(
  userId: string,
  safetyCategory: SafetyCategory,
  targetUnit: "mg" | "mcg" | "IU",
  period: "daily" | "weekly" = "daily",
): Promise<number> {
  const { start, end } = getDateRange(period);

  // Get all supplements with this safety category
  const supplementsInCategory = await db.query.supplement.findMany({
    where: eq(supplement.safetyCategory, safetyCategory),
    columns: {
      id: true,
      elementalWeight: true,
    },
  });

  if (supplementsInCategory.length === 0) return 0;

  const supplementIds = supplementsInCategory.map((s) => s.id);
  const elementalWeightMap = new Map(
    supplementsInCategory.map((s) => [s.id, s.elementalWeight]),
  );

  // Get today's logs for these supplements
  const logs = await db.query.log.findMany({
    where: and(
      eq(log.userId, userId),
      gte(log.loggedAt, start),
      lte(log.loggedAt, end),
    ),
    columns: {
      supplementId: true,
      dosage: true,
      unit: true,
    },
  });

  // Filter to only logs for supplements in this category
  const relevantLogs = logs.filter((l) =>
    supplementIds.includes(l.supplementId),
  );

  // Sum the elemental amounts
  let total = 0;
  for (const logEntry of relevantLogs) {
    const elementalWeight =
      elementalWeightMap.get(logEntry.supplementId) ?? 100;
    const elementalDosage = calculateElementalDosage(
      logEntry.dosage,
      elementalWeight,
    );

    // Convert to target unit
    const converted = convertDosage(elementalDosage, logEntry.unit, targetUnit);
    if (converted !== null) {
      total += converted;
    } else if (logEntry.unit === targetUnit) {
      // IU case: if both are IU, just add directly
      total += elementalDosage;
    }
  }

  return total;
}

// ============================================================================
// Safety Check
// ============================================================================

/**
 * Check if a dosage is safe based on daily/weekly limits.
 * This considers all logs from the period plus the proposed new dose.
 *
 * @param userId - The user's ID
 * @param supplementData - The supplement being logged
 * @param dosage - The proposed dosage (compound weight)
 * @param unit - The unit of the dosage
 */
export async function checkSafetyLimit(
  userId: string,
  supplementData: SupplementWithSafety,
  dosage: number,
  unit: string,
): Promise<SafetyCheckResult> {
  // Research chemicals bypass safety limits - return experimental status
  if (supplementData.isResearchChemical) {
    return {
      isSafe: true,
      isHardLimit: false,
      category: null,
      currentTotal: dosage,
      limit: 0,
      unit: unit,
      percentOfLimit: 0,
      message: "Research compound - no established safety limits",
      source: null,
      status: "experimental",
    };
  }

  // No safety category = no limit to check
  if (!supplementData.safetyCategory) {
    return {
      isSafe: true,
      isHardLimit: false,
      category: null,
      currentTotal: 0,
      limit: 0,
      unit: unit,
      percentOfLimit: 0,
      message: null,
      source: null,
      status: "safe",
    };
  }

  const category = supplementData.safetyCategory as SafetyCategory;
  const safetyLimit = SAFETY_LIMITS[category];

  if (!safetyLimit) {
    return {
      isSafe: true,
      isHardLimit: false,
      category,
      currentTotal: 0,
      limit: 0,
      unit: unit,
      percentOfLimit: 0,
      message: null,
      source: null,
      status: "safe",
    };
  }

  // Check for required unit (IU supplements must be logged in IU)
  if (safetyLimit.requiredUnit && unit !== safetyLimit.requiredUnit) {
    return {
      isSafe: false,
      isHardLimit: true,
      category,
      currentTotal: 0,
      limit: safetyLimit.limit,
      unit: safetyLimit.unit,
      percentOfLimit: 0,
      message: `${supplementData.name} must be logged in ${safetyLimit.requiredUnit}. Please enter the dosage in ${safetyLimit.requiredUnit}.`,
      source: safetyLimit.source,
      status: "blocked",
    };
  }

  // Calculate elemental dosage of the new dose
  const elementalDosage = calculateElementalDosage(
    dosage,
    supplementData.elementalWeight,
  );

  // Convert to the limit's unit
  const convertedDosage = convertDosage(
    elementalDosage,
    unit,
    safetyLimit.unit,
  );

  // If we can't convert (IU mismatch), check if units match directly
  let newDoseInLimitUnit: number;
  if (convertedDosage !== null) {
    newDoseInLimitUnit = convertedDosage;
  } else if (unit === safetyLimit.unit) {
    newDoseInLimitUnit = elementalDosage;
  } else {
    // Can't compare units - skip safety check
    return {
      isSafe: true,
      isHardLimit: false,
      category,
      currentTotal: 0,
      limit: safetyLimit.limit,
      unit: safetyLimit.unit,
      percentOfLimit: 0,
      message: null,
      source: safetyLimit.source,
      status: "safe",
    };
  }

  // Determine the period for aggregation (daily or weekly)
  const period = safetyLimit.period ?? "daily";
  const periodLabel = period === "weekly" ? "weekly" : "daily";

  // Get existing total for this category over the period
  const existingTotal = await getElementalTotal(
    userId,
    category,
    safetyLimit.unit as "mg" | "mcg" | "IU",
    period,
  );

  const totalWithNewDose = existingTotal + newDoseInLimitUnit;
  const percentOfLimit = (totalWithNewDose / safetyLimit.limit) * 100;
  const isSafe = totalWithNewDose <= safetyLimit.limit;

  // Determine status
  let status: SafetyStatus;
  if (isSafe) {
    status = "safe";
  } else if (safetyLimit.isHardLimit) {
    status = "blocked";
  } else {
    status = "warning";
  }

  // Build warning message
  let message: string | null = null;
  if (!isSafe) {
    const categoryDisplay = category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    if (safetyLimit.isHardLimit) {
      message = `This dose would put you at ${Math.round(percentOfLimit)}% of the safe ${periodLabel} limit for ${categoryDisplay} (${safetyLimit.limit}${safetyLimit.unit}). ${safetyLimit.notes ?? ""}`;
    } else {
      message = `This dose would put you at ${Math.round(percentOfLimit)}% of the recommended ${periodLabel} limit for ${categoryDisplay} (${safetyLimit.limit}${safetyLimit.unit}). ${safetyLimit.notes ?? ""}`;
    }
  }

  return {
    isSafe,
    isHardLimit: safetyLimit.isHardLimit,
    category,
    currentTotal: totalWithNewDose,
    limit: safetyLimit.limit,
    unit: safetyLimit.unit,
    percentOfLimit: Math.round(percentOfLimit),
    message,
    source: safetyLimit.source,
    status,
  };
}

/**
 * Check safety for multiple items (e.g., a stack).
 * Returns the most severe violation found.
 */
export async function checkStackSafety(
  userId: string,
  items: Array<{
    supplement: SupplementWithSafety;
    dosage: number;
    unit: string;
  }>,
): Promise<SafetyCheckResult | null> {
  // Group items by safety category to calculate combined totals
  const categoryTotals = new Map<SafetyCategory, number>();

  for (const item of items) {
    // Skip research chemicals - they have no safety limits
    if (item.supplement.isResearchChemical) continue;
    if (!item.supplement.safetyCategory) continue;

    const category = item.supplement.safetyCategory as SafetyCategory;
    const safetyLimit = SAFETY_LIMITS[category];
    if (!safetyLimit) continue;

    // Check required unit
    if (safetyLimit.requiredUnit && item.unit !== safetyLimit.requiredUnit) {
      return {
        isSafe: false,
        isHardLimit: true,
        category,
        currentTotal: 0,
        limit: safetyLimit.limit,
        unit: safetyLimit.unit,
        percentOfLimit: 0,
        message: `${item.supplement.name} must be logged in ${safetyLimit.requiredUnit}.`,
        source: safetyLimit.source,
        status: "blocked",
      };
    }

    // Calculate elemental dosage
    const elementalDosage = calculateElementalDosage(
      item.dosage,
      item.supplement.elementalWeight,
    );

    // Convert to limit unit
    const convertedDosage = convertDosage(
      elementalDosage,
      item.unit,
      safetyLimit.unit,
    );
    const doseInLimitUnit =
      convertedDosage !== null
        ? convertedDosage
        : item.unit === safetyLimit.unit
          ? elementalDosage
          : null;

    if (doseInLimitUnit !== null) {
      const existing = categoryTotals.get(category) ?? 0;
      categoryTotals.set(category, existing + doseInLimitUnit);
    }
  }

  // Check each category's total
  let worstViolation: SafetyCheckResult | null = null;

  for (const [category, stackTotal] of categoryTotals) {
    const safetyLimit = SAFETY_LIMITS[category];
    if (!safetyLimit) continue;

    // Determine the period for aggregation (daily or weekly)
    const period = safetyLimit.period ?? "daily";
    const periodLabel = period === "weekly" ? "weekly" : "daily";

    // Get existing total for this category over the period
    const existingTotal = await getElementalTotal(
      userId,
      category,
      safetyLimit.unit as "mg" | "mcg" | "IU",
      period,
    );

    const totalWithStack = existingTotal + stackTotal;
    const percentOfLimit = (totalWithStack / safetyLimit.limit) * 100;

    if (totalWithStack > safetyLimit.limit) {
      const categoryDisplay = category
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      const result: SafetyCheckResult = {
        isSafe: false,
        isHardLimit: safetyLimit.isHardLimit,
        category,
        currentTotal: totalWithStack,
        limit: safetyLimit.limit,
        unit: safetyLimit.unit,
        percentOfLimit: Math.round(percentOfLimit),
        message: `This stack would put you at ${Math.round(percentOfLimit)}% of the safe ${periodLabel} limit for ${categoryDisplay} (${safetyLimit.limit}${safetyLimit.unit}).`,
        source: safetyLimit.source,
        status: safetyLimit.isHardLimit ? "blocked" : "warning",
      };

      // Prioritize hard limits over soft limits
      if (
        !worstViolation ||
        (safetyLimit.isHardLimit && !worstViolation.isHardLimit) ||
        (safetyLimit.isHardLimit === worstViolation.isHardLimit &&
          percentOfLimit > worstViolation.percentOfLimit)
      ) {
        worstViolation = result;
      }
    }
  }

  return worstViolation;
}

// ============================================================================
// Meal Context Checking
// ============================================================================

export type MealContextCheckResult = {
  /** Whether the meal context is optimal for this supplement */
  isOptimal: boolean;
  /** Warning message if not optimal */
  warning?: string;
  /** Bioavailability multiplier (1.0 = baseline, 1.5 = 50% better absorption) */
  multiplier: number;
  /** The bioavailability rule that matched (if any) */
  rule?: BioavailabilityModifier;
  /** Mechanism explanation */
  mechanism?: string;
  /** Research URL for citation */
  researchUrl?: string;
};

/**
 * Check if the meal context is optimal for a given supplement.
 * Returns warnings for fat-soluble vitamins taken without fat,
 * amino acids taken with protein, etc.
 *
 * @param supplementName - Name of the supplement
 * @param mealContext - The meal context (fasted, with_meal, with_fat, post_meal)
 * @param safetyCategory - Optional safety category for matching
 */
export function checkMealContext(
  supplementName: string,
  mealContext: MealContext | null | undefined,
  safetyCategory?: string | null,
): MealContextCheckResult {
  const rule = getBioavailabilityRule(supplementName, safetyCategory);
  
  if (!rule) {
    return { isOptimal: true, multiplier: 1.0 };
  }
  
  const result = isMealContextOptimal(supplementName, mealContext, safetyCategory);
  
  return {
    ...result,
    rule,
    mechanism: rule.mechanism,
    researchUrl: rule.researchUrl,
  };
}

/**
 * Check meal context for multiple supplements (e.g., a stack).
 * Returns all warnings for supplements with suboptimal meal context.
 */
export function checkStackMealContext(
  items: Array<{
    supplementName: string;
    safetyCategory?: string | null;
  }>,
  mealContext: MealContext | null | undefined,
): MealContextCheckResult[] {
  const warnings: MealContextCheckResult[] = [];
  
  for (const item of items) {
    const result = checkMealContext(
      item.supplementName,
      mealContext,
      item.safetyCategory,
    );
    
    if (!result.isOptimal && result.warning) {
      warnings.push(result);
    }
  }
  
  return warnings;
}

/**
 * Get a summary of bioavailability impact for a log entry.
 * Used for the mechanistic feed display.
 */
export function getBioavailabilitySummary(
  supplementName: string,
  mealContext: MealContext | null | undefined,
  safetyCategory?: string | null,
): {
  hasImpact: boolean;
  description: string;
  percentChange: number;
} {
  const result = checkMealContext(supplementName, mealContext, safetyCategory);
  
  if (!result.rule) {
    return {
      hasImpact: false,
      description: "No specific meal timing recommendations.",
      percentChange: 0,
    };
  }
  
  const percentChange = Math.round((result.multiplier - 1) * 100);
  
  if (result.isOptimal) {
    return {
      hasImpact: true,
      description: `Optimal absorption: +${percentChange}% bioavailability with current meal context.`,
      percentChange,
    };
  }
  
  return {
    hasImpact: true,
    description: result.warning ?? "Suboptimal meal context for absorption.",
    percentChange: 0, // Not getting the bonus
  };
}
