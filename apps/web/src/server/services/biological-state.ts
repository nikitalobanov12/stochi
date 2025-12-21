import { and, gte, lte, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { log, interaction } from "~/server/db/schema";
import { type SafetyCategory, isHardLimit } from "~/server/data/safety-limits";

// ============================================================================
// Types
// ============================================================================

export type ActiveCompound = {
  /** Log entry ID */
  logId: string;
  /** Supplement ID */
  supplementId: string;
  /** Supplement name */
  name: string;
  /** Original dosage logged */
  dosage: number;
  /** Unit of dosage */
  unit: string;
  /** When the supplement was logged */
  loggedAt: Date;
  /** Current estimated concentration as percentage of Cmax (0-100) */
  concentrationPercent: number;
  /** Phase of pharmacokinetic curve */
  phase: "absorbing" | "peak" | "eliminating" | "cleared";
  /** Time to peak in minutes (Tmax) */
  peakMinutes: number | null;
  /** Half-life in minutes */
  halfLifeMinutes: number | null;
  /** Bioavailability percentage */
  bioavailabilityPercent: number | null;
  /** Supplement category */
  category: string | null;
};

export type ExclusionZone = {
  /** ID of the timing rule */
  ruleId: string;
  /** Source supplement that was logged */
  sourceSupplementId: string;
  sourceSupplementName: string;
  /** Target supplement that should be avoided */
  targetSupplementId: string;
  targetSupplementName: string;
  /** When the exclusion zone ends */
  endsAt: Date;
  /** Minutes remaining in the exclusion zone */
  minutesRemaining: number;
  /** Reason for the exclusion (mechanistic jargon) */
  reason: string;
  /** Severity of the timing conflict */
  severity: "low" | "medium" | "critical";
  /** PubMed/Examine.com citation URL */
  researchUrl: string | null;
};

export type OptimizationOpportunity = {
  /** Type of optimization */
  type: "synergy" | "timing" | "stacking";
  /** Supplement IDs involved */
  supplementIds: string[];
  /** Human-readable title */
  title: string;
  /** Actionable description */
  description: string;
  /** Priority (higher = more important) */
  priority: number;
  /** Safety warning for high-risk supplements (e.g., Iron, Vitamin A) */
  safetyWarning?: string;
};

export type BiologicalState = {
  /** Currently active compounds in the system */
  activeCompounds: ActiveCompound[];
  /** Active exclusion zones (timing conflicts) */
  exclusionZones: ExclusionZone[];
  /** Suggested optimization opportunities */
  optimizations: OptimizationOpportunity[];
  /** Bio-score (0-100, higher is better) */
  bioScore: number;
  /** Timestamp of the state calculation */
  calculatedAt: Date;
};

export type TimelineDataPoint = {
  /** Minutes from window start */
  minutesFromStart: number;
  /** ISO timestamp */
  timestamp: string;
  /** Concentration values by supplement ID (0-100) */
  concentrations: Record<string, number>;
};

// ============================================================================
// Pharmacokinetic Calculations
// ============================================================================

/** Kinetics type for dispatch */
export type KineticsType = "first_order" | "michaelis_menten";

/** Parameters for concentration calculation with extended PK data */
export type ConcentrationParams = {
  minutesSinceIngestion: number;
  peakMinutes: number;
  halfLifeMinutes: number;
  dose?: number;
  kineticsType?: KineticsType;
  vmax?: number | null;
  km?: number | null;
  rdaAmount?: number | null;
};

/**
 * Calculate elimination rate constant (k) from half-life.
 * k = ln(2) / t½
 */
function calculateEliminationConstant(halfLifeMinutes: number): number {
  return Math.log(2) / halfLifeMinutes;
}

/**
 * Lambert W function (principal branch W₀) using Halley's method.
 *
 * The Lambert W function is defined as the inverse of f(W) = W * e^W,
 * i.e., it satisfies: W(x) * e^W(x) = x
 *
 * Halley's method provides cubic convergence, typically 3-5 iterations.
 */
export function lambertW0(x: number): number {
  // Handle special cases
  if (Number.isNaN(x)) return NaN;
  if (x === 0) return 0;
  if (x === Math.E) return 1;
  if (x < -1 / Math.E) return NaN; // No real solution for x < -1/e
  if (x === -1 / Math.E) return -1;

  // Initial guess
  let w: number;
  if (x < 1) {
    w = x; // Linear approximation for small x
  } else if (x < 10) {
    w = Math.log(x); // For moderate x
  } else {
    // Asymptotic expansion for large x
    const lnx = Math.log(x);
    const lnlnx = Math.log(lnx);
    w = lnx - lnlnx + lnlnx / lnx;
  }

  // Halley's method iteration
  const maxIterations = 50;
  const tolerance = 1e-12;

  for (let i = 0; i < maxIterations; i++) {
    const ew = Math.exp(w);
    const wew = w * ew;

    // f = W*e^W - x
    const f = wew - x;

    // Check convergence
    if (Math.abs(f) < tolerance * Math.abs(x)) {
      break;
    }

    // f' = e^W * (W + 1)
    const fp = ew * (w + 1);

    // f'' = e^W * (W + 2)
    const fpp = ew * (w + 2);

    // Halley's update
    const denom = 2 * fp * fp - f * fpp;
    if (denom === 0) {
      // Fall back to Newton's method
      w -= f / fp;
    } else {
      w -= (2 * f * fp) / denom;
    }
  }

  return w;
}

/**
 * Calculate absorbed amount using Michaelis-Menten kinetics.
 *
 * Uses the Lambert W function for analytical solution:
 *   A(t) = Km * W((A0/Km) * e^((A0 - Vmax*t)/Km))
 *
 * This avoids expensive numerical integration while maintaining accuracy.
 */
function calculateMMAbsorbedAmount(
  initialDose: number,
  vmax: number,
  km: number,
  minutes: number,
): number {
  if (initialDose <= 0 || minutes <= 0) return 0;

  // Calculate the argument for Lambert W
  // x = (A0/Km) * e^((A0 - Vmax*t)/Km)
  const a0OverKm = initialDose / km;
  const exponent = (initialDose - vmax * minutes) / km;
  const x = a0OverKm * Math.exp(exponent);

  // Handle edge cases
  if (x < 0) return 0; // All absorbed/cleared
  if (!Number.isFinite(x)) return initialDose; // Very early in absorption

  // Calculate W(x) and return Km * W(x)
  const w = lambertW0(x);
  const result = km * w;

  // Can't absorb more than we started with
  if (result > initialDose) return initialDose;
  if (result < 0) return 0;

  return result;
}

/**
 * Calculate concentration using Michaelis-Menten kinetics.
 *
 * For supplements with saturable transporters (Vitamin C, Magnesium, Iron),
 * absorption follows MM kinetics where efficiency drops at higher doses.
 */
function calculateMichaelisMentenConcentration(
  params: ConcentrationParams,
): number {
  const { minutesSinceIngestion, dose = 0, vmax, km } = params;
  let { peakMinutes, halfLifeMinutes } = params;

  // Validate MM parameters - fall back to first-order if not set
  if (!vmax || !km || vmax <= 0 || km <= 0) {
    return calculateFirstOrderConcentration(params);
  }

  // Use defaults for peak/halflife if not specified
  if (peakMinutes <= 0) peakMinutes = 60;
  if (halfLifeMinutes <= 0) halfLifeMinutes = 240;

  // Calculate effective absorbed amount using MM absorption
  const effectiveDose = calculateMMAbsorbedAmount(
    dose,
    vmax,
    km,
    minutesSinceIngestion,
  );

  // Normalize to percentage of theoretical max concentration
  const maxConcentration = calculateMMAbsorbedAmount(dose, vmax, km, peakMinutes);
  if (maxConcentration <= 0) return 0;

  // During absorption phase
  if (minutesSinceIngestion < peakMinutes) {
    // Non-linear absorption ramp
    return (effectiveDose / maxConcentration) * 100;
  }

  // At and after peak - use first-order elimination from achieved Cmax
  // (Most supplements follow first-order elimination even with MM absorption)
  const k = calculateEliminationConstant(halfLifeMinutes);
  const timeSincePeak = minutesSinceIngestion - peakMinutes;
  const concentration = 100 * Math.exp(-k * timeSincePeak);

  return concentration < 1 ? 0 : concentration;
}

/**
 * Calculate concentration using first-order kinetics.
 *
 * For t < Tmax (absorption phase):
 *   Uses linear approximation: C(t) = Cmax * (t / Tmax)
 *
 * For t >= Tmax (elimination phase):
 *   C(t) = Cmax * e^(-k * (t - Tmax))
 *
 * Returns concentration as percentage of Cmax (0-100).
 */
function calculateFirstOrderConcentration(params: ConcentrationParams): number {
  const { minutesSinceIngestion } = params;
  let { peakMinutes, halfLifeMinutes } = params;

  // Use defaults if not specified
  if (peakMinutes <= 0) peakMinutes = DEFAULT_PEAK_MINUTES;
  if (halfLifeMinutes <= 0) halfLifeMinutes = DEFAULT_HALF_LIFE_MINUTES;

  // Absorption phase (linear ramp to peak)
  if (minutesSinceIngestion < peakMinutes) {
    return (minutesSinceIngestion / peakMinutes) * 100;
  }

  // At peak
  if (minutesSinceIngestion === peakMinutes) {
    return 100;
  }

  // Elimination phase (exponential decay)
  const k = calculateEliminationConstant(halfLifeMinutes);
  const timeSincePeak = minutesSinceIngestion - peakMinutes;
  const concentration = 100 * Math.exp(-k * timeSincePeak);

  // Consider cleared when below 1%
  return concentration < 1 ? 0 : concentration;
}

/**
 * Apply logarithmic dampening for high-dose supplements without full MM parameters.
 *
 * For doses > 3x RDA, applies: effectiveDose = 3*RDA + RDA*ln(1 + excess/RDA)
 * This provides a smooth transition from linear to logarithmic absorption.
 */
export function applyAbsorptionDampening(dose: number, rda: number): number {
  if (rda <= 0) return dose; // No RDA defined, return unchanged

  const threshold = 3 * rda;
  if (dose <= threshold) return dose; // Linear absorption below threshold

  // Logarithmic dampening above threshold
  const excess = dose - threshold;
  const dampenedExcess = rda * Math.log(1 + excess / rda);
  return threshold + dampenedExcess;
}

/**
 * Calculate absorption efficiency (0-1) for a given dose using MM kinetics.
 *
 * Efficiency = Km / (Km + Dose)
 *
 * Shows how absorption rate decreases as dose increases beyond Km.
 */
export function calculateAbsorptionEfficiency(
  dose: number,
  km: number,
): number {
  if (km <= 0 || dose < 0) return 0;
  if (dose === 0) return 1; // 100% efficiency at zero dose
  return km / (km + dose);
}

/**
 * Calculate concentration at time t, dispatching to appropriate kinetic model.
 *
 * Supports both the legacy 3-argument signature (first-order only) and
 * the new params object with full MM support.
 *
 * Returns concentration as percentage of Cmax (0-100).
 */
export function calculateConcentration(
  minutesSinceIngestion: number,
  peakMinutes: number,
  halfLifeMinutes: number,
): number;
export function calculateConcentration(params: ConcentrationParams): number;
export function calculateConcentration(
  minutesSinceIngestionOrParams: number | ConcentrationParams,
  peakMinutes?: number,
  halfLifeMinutes?: number,
): number {
  // Handle legacy 3-argument signature
  if (typeof minutesSinceIngestionOrParams === "number") {
    const params: ConcentrationParams = {
      minutesSinceIngestion: minutesSinceIngestionOrParams,
      peakMinutes: peakMinutes ?? DEFAULT_PEAK_MINUTES,
      halfLifeMinutes: halfLifeMinutes ?? DEFAULT_HALF_LIFE_MINUTES,
      kineticsType: "first_order",
    };
    return calculateFirstOrderConcentration(params);
  }

  // New params object signature
  const params = minutesSinceIngestionOrParams;

  // Before ingestion
  if (params.minutesSinceIngestion < 0) return 0;

  // Dispatch to appropriate kinetic model
  if (params.kineticsType === "michaelis_menten") {
    return calculateMichaelisMentenConcentration(params);
  }

  // Default to first-order, but check if we should apply heuristic dampening
  // for supplements with RDA but no MM params
  if (params.rdaAmount && params.dose) {
    const effectiveDose = applyAbsorptionDampening(params.dose, params.rdaAmount);
    // Scale concentration proportionally to dampening effect
    const dampeningFactor = effectiveDose / params.dose;
    const baseConcentration = calculateFirstOrderConcentration(params);
    return baseConcentration * dampeningFactor;
  }

  return calculateFirstOrderConcentration(params);
}

/**
 * Determine the pharmacokinetic phase based on concentration and timing.
 */
function determinePhase(
  minutesSinceIngestion: number,
  peakMinutes: number,
  concentrationPercent: number,
): "absorbing" | "peak" | "eliminating" | "cleared" {
  if (concentrationPercent < 1) return "cleared";
  if (minutesSinceIngestion < peakMinutes) return "absorbing";
  if (minutesSinceIngestion <= peakMinutes + 30) return "peak"; // ±30min window
  return "eliminating";
}

// ============================================================================
// Default PK Parameters
// ============================================================================

// Conservative defaults when PK data is missing
const DEFAULT_PEAK_MINUTES = 60; // 1 hour
const DEFAULT_HALF_LIFE_MINUTES = 240; // 4 hours

// ============================================================================
// Biological State Service
// ============================================================================

/**
 * Get the biological state for a user over a rolling 24-hour window.
 * This returns all active compounds, exclusion zones, and optimization opportunities.
 */
export async function getBiologicalState(userId: string): Promise<BiologicalState> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h ago

  // Fetch logs from the last 24 hours with supplement data
  const recentLogs = await db.query.log.findMany({
    where: and(
      eq(log.userId, userId),
      gte(log.loggedAt, windowStart),
      lte(log.loggedAt, now),
    ),
    with: {
      supplement: true,
    },
    orderBy: (log, { desc }) => [desc(log.loggedAt)],
  });

  // Calculate active compounds
  const activeCompounds: ActiveCompound[] = [];

  for (const logEntry of recentLogs) {
    const supp = logEntry.supplement;
    const peakMinutes = supp.peakMinutes ?? DEFAULT_PEAK_MINUTES;
    const halfLifeMinutes = supp.halfLifeMinutes ?? DEFAULT_HALF_LIFE_MINUTES;

    const minutesSinceIngestion =
      (now.getTime() - logEntry.loggedAt.getTime()) / (1000 * 60);

    // Use extended concentration calculation with MM kinetics support
    const concentrationPercent = calculateConcentration({
      minutesSinceIngestion,
      peakMinutes,
      halfLifeMinutes,
      dose: logEntry.dosage,
      kineticsType: supp.kineticsType ?? "first_order",
      vmax: supp.vmax,
      km: supp.km,
      rdaAmount: supp.rdaAmount,
    });

    const phase = determinePhase(
      minutesSinceIngestion,
      peakMinutes,
      concentrationPercent,
    );

    activeCompounds.push({
      logId: logEntry.id,
      supplementId: supp.id,
      name: supp.name,
      dosage: logEntry.dosage,
      unit: logEntry.unit,
      loggedAt: logEntry.loggedAt,
      concentrationPercent: Math.round(concentrationPercent * 10) / 10,
      phase,
      peakMinutes: supp.peakMinutes,
      halfLifeMinutes: supp.halfLifeMinutes,
      bioavailabilityPercent: supp.bioavailabilityPercent,
      category: supp.category,
    });
  }

  // Calculate exclusion zones from timing rules
  const exclusionZones = await calculateExclusionZones(userId, recentLogs, now);

  // Calculate optimization opportunities
  const optimizations = await calculateOptimizations(userId, activeCompounds);

  // Calculate bio-score
  const bioScore = calculateBioScore(activeCompounds, exclusionZones, optimizations);

  return {
    activeCompounds,
    exclusionZones,
    optimizations,
    bioScore,
    calculatedAt: now,
  };
}

/**
 * Calculate active exclusion zones based on timing rules.
 */
async function calculateExclusionZones(
  _userId: string,
  recentLogs: Array<{ id: string; supplementId: string; loggedAt: Date; supplement: { id: string; name: string } }>,
  now: Date,
): Promise<ExclusionZone[]> {
  if (recentLogs.length === 0) return [];

  // Get all timing rules
  const timingRules = await db.query.timingRule.findMany({
    with: {
      sourceSupplement: true,
      targetSupplement: true,
    },
  });

  const exclusionZones: ExclusionZone[] = [];
  const loggedSupplementIds = new Set(recentLogs.map((l) => l.supplementId));

  for (const rule of timingRules) {
    // Check if user has logged the source supplement
    const sourceLog = recentLogs.find((l) => l.supplementId === rule.sourceSupplementId);
    if (!sourceLog) continue;

    // Calculate when the exclusion zone ends
    const minMinutesApart = rule.minHoursApart * 60;
    const exclusionEndsAt = new Date(sourceLog.loggedAt.getTime() + minMinutesApart * 60 * 1000);

    // Skip if exclusion zone has already passed
    if (exclusionEndsAt <= now) continue;

    // Check if target supplement is in user's typical stack (has been logged recently)
    // This helps us show relevant exclusions
    const isTargetRelevant = loggedSupplementIds.has(rule.targetSupplementId);

    // Only show exclusion zones for relevant supplements
    // (ones the user has logged in the last 24h)
    if (!isTargetRelevant) continue;

    const minutesRemaining = Math.round((exclusionEndsAt.getTime() - now.getTime()) / (1000 * 60));

    exclusionZones.push({
      ruleId: rule.id,
      sourceSupplementId: rule.sourceSupplementId,
      sourceSupplementName: rule.sourceSupplement.name,
      targetSupplementId: rule.targetSupplementId,
      targetSupplementName: rule.targetSupplement.name,
      endsAt: exclusionEndsAt,
      minutesRemaining,
      reason: rule.reason,
      severity: rule.severity,
      researchUrl: rule.researchUrl,
    });
  }

  return exclusionZones.sort((a, b) => a.minutesRemaining - b.minutesRemaining);
}

/**
 * Calculate optimization opportunities based on active compounds and interactions.
 */
async function calculateOptimizations(
  _userId: string,
  activeCompounds: ActiveCompound[],
): Promise<OptimizationOpportunity[]> {
  if (activeCompounds.length === 0) return [];

  const optimizations: OptimizationOpportunity[] = [];
  const activeSupplementIds = new Set(activeCompounds.map((c) => c.supplementId));

  // Get synergy interactions for active supplements
  const synergyInteractions = await db.query.interaction.findMany({
    where: eq(interaction.type, "synergy"),
    with: {
      source: true,
      target: true,
    },
  });

  /**
   * Generate safety warning for high-risk supplements.
   * Returns a warning string if the supplement has a hard safety limit.
   */
  function getSafetyWarning(supplement: { name: string; safetyCategory: string | null }): string | undefined {
    if (!supplement.safetyCategory) return undefined;
    const category = supplement.safetyCategory as SafetyCategory;
    if (!isHardLimit(category)) return undefined;
    
    // Custom warnings for specific high-risk supplements
    const warnings: Partial<Record<SafetyCategory, string>> = {
      iron: "Caution: Only supplement if Ferritin <150ng/mL. Test before use.",
      "vitamin-a": "Caution: High doses are teratogenic. Not recommended during pregnancy.",
      selenium: "Caution: Narrow therapeutic window. Don't exceed 200mcg/day without testing.",
    };
    return warnings[category] ?? `Caution: ${supplement.name} has a hard safety limit.`;
  }

  // Check for synergies that could be leveraged
  for (const synergy of synergyInteractions) {
    const hasSource = activeSupplementIds.has(synergy.sourceId);
    const hasTarget = activeSupplementIds.has(synergy.targetId);

    // If user has one of the synergy pair, suggest adding the other
    if (hasSource && !hasTarget) {
      optimizations.push({
        type: "synergy",
        supplementIds: [synergy.sourceId, synergy.targetId],
        title: `Enhance ${synergy.source.name} with ${synergy.target.name}`,
        description: synergy.suggestion ?? `${synergy.source.name} and ${synergy.target.name} have synergistic effects.`,
        priority: 2,
        safetyWarning: getSafetyWarning(synergy.target),
      });
    } else if (hasTarget && !hasSource) {
      optimizations.push({
        type: "synergy",
        supplementIds: [synergy.sourceId, synergy.targetId],
        title: `Enhance ${synergy.target.name} with ${synergy.source.name}`,
        description: synergy.suggestion ?? `${synergy.target.name} and ${synergy.source.name} have synergistic effects.`,
        priority: 2,
        safetyWarning: getSafetyWarning(synergy.source),
      });
    } else if (hasSource && hasTarget) {
      // User already has both - note the active synergy
      optimizations.push({
        type: "synergy",
        supplementIds: [synergy.sourceId, synergy.targetId],
        title: `Active synergy: ${synergy.source.name} + ${synergy.target.name}`,
        description: synergy.suggestion ?? "You're getting the benefit of this synergy!",
        priority: 1,
      });
    }
  }

  // Sort by priority (higher first)
  return optimizations.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate bio-score based on current state.
 * 
 * Formula:
 * - Start at 100
 * - Critical interactions: -50 points each
 * - Medium interactions: -25 points each  
 * - Timing violations: -15 points each
 * - Active synergies: +5 points each (capped at +20)
 * 
 * Clamped to 0-100 range.
 */
function calculateBioScore(
  activeCompounds: ActiveCompound[],
  exclusionZones: ExclusionZone[],
  optimizations: OptimizationOpportunity[],
): number {
  let score = 100;

  // Penalize for timing violations (active exclusion zones)
  for (const zone of exclusionZones) {
    if (zone.severity === "critical") {
      score -= 50;
    } else if (zone.severity === "medium") {
      score -= 25;
    } else {
      score -= 15;
    }
  }

  // Bonus for active synergies (capped)
  const activeSynergies = optimizations.filter(
    (o) => o.type === "synergy" && o.title.startsWith("Active synergy"),
  );
  const synergyBonus = Math.min(activeSynergies.length * 5, 20);
  score += synergyBonus;

  // Penalty if no active compounds (empty state)
  if (activeCompounds.length === 0) {
    score = 50; // Neutral state
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate timeline data points for visualization.
 * Returns concentration curves for the rolling 24h window.
 * 
 * @param userId - User ID
 * @param intervalMinutes - Interval between data points (default: 15)
 * @param windowHours - Window size in hours (default: 24)
 */
export async function getTimelineData(
  userId: string,
  intervalMinutes = 15,
  windowHours = 24,
): Promise<TimelineDataPoint[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // Project 4h into future

  // Fetch logs from the window
  const logs = await db.query.log.findMany({
    where: and(
      eq(log.userId, userId),
      gte(log.loggedAt, windowStart),
      lte(log.loggedAt, now),
    ),
    with: {
      supplement: true,
    },
    orderBy: (log, { asc }) => [asc(log.loggedAt)],
  });

  if (logs.length === 0) return [];

  const dataPoints: TimelineDataPoint[] = [];
  const totalMinutes = (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60);

  // Generate data points at each interval
  for (let minutes = 0; minutes <= totalMinutes; minutes += intervalMinutes) {
    const timestamp = new Date(windowStart.getTime() + minutes * 60 * 1000);
    const concentrations: Record<string, number> = {};

    for (const logEntry of logs) {
      const supp = logEntry.supplement;
      const peakMinutes = supp.peakMinutes ?? DEFAULT_PEAK_MINUTES;
      const halfLifeMinutes = supp.halfLifeMinutes ?? DEFAULT_HALF_LIFE_MINUTES;

      const minutesSinceIngestion =
        (timestamp.getTime() - logEntry.loggedAt.getTime()) / (1000 * 60);

      // Skip if before ingestion
      if (minutesSinceIngestion < 0) continue;

      // Use extended concentration calculation with MM kinetics support
      const concentration = calculateConcentration({
        minutesSinceIngestion,
        peakMinutes,
        halfLifeMinutes,
        dose: logEntry.dosage,
        kineticsType: supp.kineticsType ?? "first_order",
        vmax: supp.vmax,
        km: supp.km,
        rdaAmount: supp.rdaAmount,
      });

      // Aggregate multiple doses of the same supplement
      const currentConc = concentrations[supp.id] ?? 0;
      concentrations[supp.id] = Math.min(currentConc + concentration, 150); // Cap at 150%
    }

    const minutesFromStart = minutes;
    dataPoints.push({
      minutesFromStart,
      timestamp: timestamp.toISOString(),
      concentrations,
    });
  }

  return dataPoints;
}

/**
 * Get supplements that are currently in their peak window.
 * Useful for showing "active now" indicators.
 */
export async function getActiveSupplements(userId: string): Promise<ActiveCompound[]> {
  const state = await getBiologicalState(userId);
  return state.activeCompounds.filter(
    (c) => c.phase === "peak" || c.phase === "absorbing",
  );
}

/**
 * Check if it's safe to take a supplement based on timing rules.
 * Returns the blocking exclusion zone if any, or null if safe.
 */
export async function checkTimingSafety(
  userId: string,
  supplementId: string,
): Promise<ExclusionZone | null> {
  const state = await getBiologicalState(userId);
  
  return state.exclusionZones.find(
    (zone) => zone.targetSupplementId === supplementId,
  ) ?? null;
}

// ============================================================================
// Safety Headroom Types & Functions
// ============================================================================

export type SafetyHeadroom = {
  /** Safety category (e.g., "zinc", "magnesium") */
  category: string;
  /** Human-readable label */
  label: string;
  /** Current daily elemental total */
  current: number;
  /** Upper limit for this category */
  limit: number;
  /** Unit for display */
  unit: string;
  /** Percentage of limit used (0-100+) */
  percentUsed: number;
  /** Whether this is a hard limit (BLOCK) or soft limit (WARNING) */
  isHardLimit: boolean;
};

// Import safety limits dynamically to avoid circular dependency
import { SAFETY_LIMITS, type SafetyCategory as SafetyCategoryType } from "~/server/data/safety-limits";
import { getElementalTotal } from "~/server/services/safety";

/**
 * Get safety headroom for all relevant categories.
 * Shows how close the user is to daily limits for tracked minerals/vitamins.
 */
export async function getSafetyHeadroom(userId: string): Promise<SafetyHeadroom[]> {
  // Categories to track (most relevant for daily monitoring)
  const categoriesToCheck: SafetyCategoryType[] = [
    "magnesium",
    "zinc",
    "iron",
    "copper",
    "calcium",
    "vitamin-d3",
    "vitamin-c",
    "selenium",
  ];

  const headroom: SafetyHeadroom[] = [];

  for (const category of categoriesToCheck) {
    const limit = SAFETY_LIMITS[category];
    if (!limit) continue;

    // Get current daily total for this category
    const current = await getElementalTotal(
      userId,
      category,
      limit.unit as "mg" | "mcg" | "IU",
      limit.period ?? "daily",
    );

    // Only include categories where user has logged something
    if (current === 0) continue;

    // Format label nicely
    const label = category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    headroom.push({
      category,
      label,
      current: Math.round(current * 10) / 10,
      limit: limit.limit,
      unit: limit.unit,
      percentUsed: Math.round((current / limit.limit) * 100),
      isHardLimit: limit.isHardLimit,
    });
  }

  // Sort by percentage used (highest first)
  return headroom.sort((a, b) => b.percentUsed - a.percentUsed);
}
