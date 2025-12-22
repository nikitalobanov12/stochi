/**
 * Biomarker Calibration Service for Stochi
 *
 * Implements Individual Absorption Factor (IAF) calculation for personalized
 * pharmacokinetic model calibration based on blood test results.
 *
 * The algorithm:
 * 1. User provides blood test result (e.g., 25-OH-D = 50 ng/mL)
 * 2. We predict what the level should be based on their logged intake
 * 3. IAF = measured / predicted
 * 4. Apply IAF to adjust F (bioavailability) or CL (clearance)
 *
 * Usage:
 * ```ts
 * import { calculateCalibration, applyCalibration } from '~/server/services/calibration';
 *
 * // Calculate calibration from blood test
 * const calibration = await calculateCalibration({
 *   userId: 'user-123',
 *   biomarkerType: '25_oh_d',
 *   measuredValue: 50,
 *   unit: 'ng/mL',
 *   measuredAt: new Date(),
 * });
 *
 * // Apply calibration to future calculations
 * const adjustedBioavailability = applyCalibration(
 *   baselineBioavailability,
 *   calibration.calibratedF
 * );
 * ```
 */

import { and, eq, gte, lte, desc } from "drizzle-orm";
import { db } from "~/server/db";
import { log, supplement, userBiomarker } from "~/server/db/schema";

// ============================================================================
// Types
// ============================================================================

export type BiomarkerType =
  | "25_oh_d"
  | "ferritin"
  | "serum_iron"
  | "rbc_magnesium"
  | "serum_zinc"
  | "serum_copper"
  | "b12"
  | "folate";

export type CalibrationInput = {
  userId: string;
  biomarkerType: BiomarkerType;
  measuredValue: number;
  unit: string;
  measuredAt: Date;
  notes?: string;
};

export type CalibrationResult = {
  biomarkerType: BiomarkerType;
  measuredValue: number;
  predictedValue: number;
  individualAbsorptionFactor: number;
  calibratedF: number | null;
  calibratedCL: number | null;
  confidence: "high" | "medium" | "low";
  datapointsUsed: number;
};

export type BiomarkerMapping = {
  supplementNames: string[];
  safetyCategory: string | null;
  conversionFactor: number;
  halfLifeDays: number;
  steadyStateDays: number;
  targetRange: { min: number; max: number };
  unit: string;
};

// ============================================================================
// Biomarker Configuration
// ============================================================================

/**
 * Mapping of biomarker types to supplement tracking and reference ranges
 */
export const BIOMARKER_CONFIG: Record<BiomarkerType, BiomarkerMapping> = {
  "25_oh_d": {
    supplementNames: ["Vitamin D3"],
    safetyCategory: "vitamin-d3",
    conversionFactor: 0.025, // IU to ng/mL serum level approximation
    halfLifeDays: 15, // Vitamin D has ~15 day half-life
    steadyStateDays: 90, // ~3 months to reach steady state
    targetRange: { min: 40, max: 60 }, // ng/mL optimal range
    unit: "ng/mL",
  },
  ferritin: {
    supplementNames: ["Iron Bisglycinate"],
    safetyCategory: "iron",
    conversionFactor: 0.5, // mg elemental iron to ferritin approximation
    halfLifeDays: 30, // Ferritin reflects long-term stores
    steadyStateDays: 120, // ~4 months
    targetRange: { min: 50, max: 150 }, // ng/mL for optimal health
    unit: "ng/mL",
  },
  serum_iron: {
    supplementNames: ["Iron Bisglycinate"],
    safetyCategory: "iron",
    conversionFactor: 1.0,
    halfLifeDays: 1, // Serum iron is highly variable
    steadyStateDays: 7,
    targetRange: { min: 60, max: 170 }, // mcg/dL
    unit: "mcg/dL",
  },
  rbc_magnesium: {
    supplementNames: [
      "Magnesium Glycinate",
      "Magnesium Citrate",
      "Magnesium L-Threonate",
      "Magnesium Oxide",
      "Magnesium Malate",
    ],
    safetyCategory: "magnesium",
    conversionFactor: 0.01, // mg to mEq/L approximation
    halfLifeDays: 30, // RBC Mg reflects tissue stores
    steadyStateDays: 90,
    targetRange: { min: 5.0, max: 6.5 }, // mg/dL
    unit: "mg/dL",
  },
  serum_zinc: {
    supplementNames: ["Zinc Picolinate", "Zinc Gluconate", "Zinc Carnosine"],
    safetyCategory: "zinc",
    conversionFactor: 0.5,
    halfLifeDays: 14,
    steadyStateDays: 60,
    targetRange: { min: 80, max: 120 }, // mcg/dL
    unit: "mcg/dL",
  },
  serum_copper: {
    supplementNames: ["Copper Bisglycinate"],
    safetyCategory: "copper",
    conversionFactor: 10,
    halfLifeDays: 30,
    steadyStateDays: 90,
    targetRange: { min: 70, max: 140 }, // mcg/dL
    unit: "mcg/dL",
  },
  b12: {
    supplementNames: ["Vitamin B12"],
    safetyCategory: null,
    conversionFactor: 0.1,
    halfLifeDays: 6, // B12 has 6-day plasma half-life
    steadyStateDays: 60,
    targetRange: { min: 500, max: 1000 }, // pg/mL
    unit: "pg/mL",
  },
  folate: {
    supplementNames: ["Folate"],
    safetyCategory: null,
    conversionFactor: 0.05,
    halfLifeDays: 3,
    steadyStateDays: 30,
    targetRange: { min: 10, max: 25 }, // ng/mL
    unit: "ng/mL",
  },
};

// ============================================================================
// Calibration Functions
// ============================================================================

/**
 * Calculate personalized calibration factors from a blood test result.
 *
 * Algorithm:
 * 1. Get supplement intake logs for the relevant period
 * 2. Calculate predicted serum level based on average intake
 * 3. Compare to measured value to derive IAF
 * 4. Determine if adjustment should be to F (bioavailability) or CL (clearance)
 */
export async function calculateCalibration(
  input: CalibrationInput,
): Promise<CalibrationResult> {
  const config = BIOMARKER_CONFIG[input.biomarkerType];
  const lookbackDays = config.steadyStateDays;

  // Get relevant supplements for this biomarker
  const relevantSupplements = await db.query.supplement.findMany({
    where: (s, { inArray }) => inArray(s.name, config.supplementNames),
  });

  if (relevantSupplements.length === 0) {
    return {
      biomarkerType: input.biomarkerType,
      measuredValue: input.measuredValue,
      predictedValue: 0,
      individualAbsorptionFactor: 1,
      calibratedF: null,
      calibratedCL: null,
      confidence: "low",
      datapointsUsed: 0,
    };
  }

  const supplementIds = relevantSupplements.map((s) => s.id);

  // Get intake logs for the lookback period
  const lookbackStart = new Date(
    input.measuredAt.getTime() - lookbackDays * 24 * 60 * 60 * 1000,
  );

  const intakeLogs = await db.query.log.findMany({
    where: and(
      eq(log.userId, input.userId),
      gte(log.loggedAt, lookbackStart),
      lte(log.loggedAt, input.measuredAt),
    ),
    with: {
      supplement: true,
    },
  });

  // Filter to relevant supplements and calculate total intake
  const relevantLogs = intakeLogs.filter((l) =>
    supplementIds.includes(l.supplementId),
  );

  if (relevantLogs.length === 0) {
    return {
      biomarkerType: input.biomarkerType,
      measuredValue: input.measuredValue,
      predictedValue: 0,
      individualAbsorptionFactor: 1,
      calibratedF: null,
      calibratedCL: null,
      confidence: "low",
      datapointsUsed: 0,
    };
  }

  // Calculate average daily intake
  const totalDosage = relevantLogs.reduce((sum, l) => sum + l.dosage, 0);
  const daysCovered =
    (input.measuredAt.getTime() - lookbackStart.getTime()) /
    (24 * 60 * 60 * 1000);
  const avgDailyDosage = totalDosage / daysCovered;

  // Predict serum level based on average intake and conversion factor
  // This is a simplified model - real PK would use compartmental modeling
  const predictedValue = avgDailyDosage * config.conversionFactor;

  // Calculate Individual Absorption Factor
  // IAF > 1 means user absorbs/retains more than predicted
  // IAF < 1 means user absorbs/retains less than predicted
  const iaf = predictedValue > 0 ? input.measuredValue / predictedValue : 1;

  // Determine calibration adjustments
  // If IAF < 1, user needs higher doses (lower bioavailability) - adjust F down
  // If IAF > 1, user retains more (lower clearance) - adjust CL down
  let calibratedF: number | null = null;
  let calibratedCL: number | null = null;

  if (iaf < 1) {
    // Lower absorption - adjust bioavailability factor
    calibratedF = iaf; // Multiply baseline F by this factor
  } else if (iaf > 1) {
    // Higher retention - adjust clearance factor
    calibratedCL = 1 / iaf; // Multiply baseline CL by this factor
  }

  // Determine confidence based on data quality
  let confidence: "high" | "medium" | "low" = "low";
  if (
    relevantLogs.length >= 60 &&
    daysCovered >= config.steadyStateDays * 0.8
  ) {
    confidence = "high";
  } else if (relevantLogs.length >= 20) {
    confidence = "medium";
  }

  return {
    biomarkerType: input.biomarkerType,
    measuredValue: input.measuredValue,
    predictedValue: Math.round(predictedValue * 10) / 10,
    individualAbsorptionFactor: Math.round(iaf * 100) / 100,
    calibratedF,
    calibratedCL,
    confidence,
    datapointsUsed: relevantLogs.length,
  };
}

/**
 * Save a calibration result to the database
 */
export async function saveCalibration(
  input: CalibrationInput,
  result: CalibrationResult,
): Promise<string> {
  // Find the primary supplement for this biomarker
  const config = BIOMARKER_CONFIG[input.biomarkerType];
  const primarySupplement = await db.query.supplement.findFirst({
    where: eq(supplement.name, config.supplementNames[0]!),
  });

  const [inserted] = await db
    .insert(userBiomarker)
    .values({
      userId: input.userId,
      supplementId: primarySupplement?.id ?? null,
      biomarkerType: input.biomarkerType,
      value: input.measuredValue,
      unit: input.unit,
      measuredAt: input.measuredAt,
      calibratedF: result.calibratedF,
      calibratedCL: result.calibratedCL,
      notes: input.notes,
    })
    .returning();

  return inserted!.id;
}

/**
 * Get the most recent calibration for a user and biomarker type
 */
export async function getLatestCalibration(
  userId: string,
  biomarkerType: BiomarkerType,
): Promise<{
  calibratedF: number | null;
  calibratedCL: number | null;
  measuredAt: Date;
} | null> {
  const result = await db.query.userBiomarker.findFirst({
    where: and(
      eq(userBiomarker.userId, userId),
      eq(userBiomarker.biomarkerType, biomarkerType),
    ),
    orderBy: [desc(userBiomarker.measuredAt)],
  });

  if (!result) return null;

  return {
    calibratedF: result.calibratedF,
    calibratedCL: result.calibratedCL,
    measuredAt: result.measuredAt,
  };
}

/**
 * Get all calibrations for a user
 */
export async function getUserCalibrations(userId: string) {
  return db.query.userBiomarker.findMany({
    where: eq(userBiomarker.userId, userId),
    orderBy: [desc(userBiomarker.measuredAt)],
    with: {
      supplement: true,
    },
  });
}

/**
 * Apply calibration factor to a baseline value
 */
export function applyCalibration(
  baselineValue: number,
  calibrationFactor: number | null,
): number {
  if (calibrationFactor === null) return baselineValue;
  return baselineValue * calibrationFactor;
}

/**
 * Get reference ranges for a biomarker
 */
export function getBiomarkerReferenceRange(biomarkerType: BiomarkerType): {
  min: number;
  max: number;
  unit: string;
  optimal: string;
} {
  const config = BIOMARKER_CONFIG[biomarkerType];
  return {
    min: config.targetRange.min,
    max: config.targetRange.max,
    unit: config.unit,
    optimal: `${config.targetRange.min}-${config.targetRange.max} ${config.unit}`,
  };
}

/**
 * Evaluate if a measured value is within optimal range
 */
export function evaluateBiomarkerStatus(
  biomarkerType: BiomarkerType,
  measuredValue: number,
): "deficient" | "suboptimal" | "optimal" | "elevated" | "high" {
  const config = BIOMARKER_CONFIG[biomarkerType];
  const { min, max } = config.targetRange;

  if (measuredValue < min * 0.5) return "deficient";
  if (measuredValue < min) return "suboptimal";
  if (measuredValue <= max) return "optimal";
  if (measuredValue <= max * 1.5) return "elevated";
  return "high";
}
