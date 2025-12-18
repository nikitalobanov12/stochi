import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "~/server/db";
import { log, supplement } from "~/server/db/schema";
import {
  SAFETY_LIMITS,
  type SafetyCategory,
} from "~/server/data/safety-limits";

// ============================================================================
// Types
// ============================================================================

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
};

export type SupplementWithSafety = {
  id: string;
  name: string;
  elementalWeight: number | null;
  safetyCategory: string | null;
  defaultUnit: string | null;
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
  toUnit: string
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
  elementalWeightPercent: number | null
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
 * Get today's date range in user's timezone (midnight to midnight).
 */
function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get the daily elemental total for a safety category.
 * Sums all logs from today that belong to supplements with the given safetyCategory.
 *
 * @param userId - The user's ID
 * @param safetyCategory - The safety category to sum (e.g., "zinc", "magnesium")
 * @param targetUnit - The unit to convert all dosages to
 */
export async function getDailyElementalTotal(
  userId: string,
  safetyCategory: SafetyCategory,
  targetUnit: "mg" | "mcg" | "IU"
): Promise<number> {
  const { start, end } = getTodayRange();

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
    supplementsInCategory.map((s) => [s.id, s.elementalWeight])
  );

  // Get today's logs for these supplements
  const logs = await db.query.log.findMany({
    where: and(
      eq(log.userId, userId),
      gte(log.loggedAt, start),
      lte(log.loggedAt, end)
    ),
    columns: {
      supplementId: true,
      dosage: true,
      unit: true,
    },
  });

  // Filter to only logs for supplements in this category
  const relevantLogs = logs.filter((l) => supplementIds.includes(l.supplementId));

  // Sum the elemental amounts
  let total = 0;
  for (const logEntry of relevantLogs) {
    const elementalWeight = elementalWeightMap.get(logEntry.supplementId) ?? 100;
    const elementalDosage = calculateElementalDosage(logEntry.dosage, elementalWeight);

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
 * Check if a dosage is safe based on daily limits.
 * This considers all logs from today plus the proposed new dose.
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
  unit: string
): Promise<SafetyCheckResult> {
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
    };
  }

  // Calculate elemental dosage of the new dose
  const elementalDosage = calculateElementalDosage(
    dosage,
    supplementData.elementalWeight
  );

  // Convert to the limit's unit
  const convertedDosage = convertDosage(elementalDosage, unit, safetyLimit.unit);

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
    };
  }

  // Get today's existing total for this category
  const existingTotal = await getDailyElementalTotal(
    userId,
    category,
    safetyLimit.unit as "mg" | "mcg" | "IU"
  );

  const totalWithNewDose = existingTotal + newDoseInLimitUnit;
  const percentOfLimit = (totalWithNewDose / safetyLimit.limit) * 100;
  const isSafe = totalWithNewDose <= safetyLimit.limit;

  // Build warning message
  let message: string | null = null;
  if (!isSafe) {
    const categoryDisplay = category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    if (safetyLimit.isHardLimit) {
      message = `This dose would put you at ${Math.round(percentOfLimit)}% of the safe daily limit for ${categoryDisplay} (${safetyLimit.limit}${safetyLimit.unit}). ${safetyLimit.notes ?? ""}`;
    } else {
      message = `This dose would put you at ${Math.round(percentOfLimit)}% of the recommended daily limit for ${categoryDisplay} (${safetyLimit.limit}${safetyLimit.unit}). ${safetyLimit.notes ?? ""}`;
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
  }>
): Promise<SafetyCheckResult | null> {
  // Group items by safety category to calculate combined totals
  const categoryTotals = new Map<SafetyCategory, number>();

  for (const item of items) {
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
      };
    }

    // Calculate elemental dosage
    const elementalDosage = calculateElementalDosage(
      item.dosage,
      item.supplement.elementalWeight
    );

    // Convert to limit unit
    const convertedDosage = convertDosage(elementalDosage, item.unit, safetyLimit.unit);
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

    // Get existing daily total
    const existingTotal = await getDailyElementalTotal(
      userId,
      category,
      safetyLimit.unit as "mg" | "mcg" | "IU"
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
        message: `This stack would put you at ${Math.round(percentOfLimit)}% of the safe daily limit for ${categoryDisplay} (${safetyLimit.limit}${safetyLimit.unit}).`,
        source: safetyLimit.source,
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
