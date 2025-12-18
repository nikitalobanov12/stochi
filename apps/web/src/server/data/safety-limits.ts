/**
 * Safe upper limits for supplements based on NIH, Endocrine Society, and other authoritative sources.
 * These are used to validate dosage logging and ensure safety.
 *
 * IMPORTANT: These are UPPER limits for ELEMENTAL amounts, not compound weight.
 * The safety service converts compound weight to elemental weight before checking.
 *
 * Hard limits = BLOCK (no override) - high toxicity risk
 * Soft limits = WARNING with "Proceed Anyway" option - GI distress or mild symptoms
 */

export type SafetyCategory =
  | "magnesium"
  | "zinc"
  | "iron"
  | "copper"
  | "calcium"
  | "selenium"
  | "vitamin-d3"
  | "vitamin-b6"
  | "vitamin-c"
  | "vitamin-e"
  | "vitamin-a";

export type SafetyLimit = {
  /** Upper limit value (elemental amount) */
  limit: number;
  /** Unit for the limit */
  unit: "mg" | "mcg" | "IU";
  /** Source of the limit (NIH, Endocrine Society, etc.) */
  source: string;
  /** Hard limit = BLOCK without override, Soft limit = WARNING with "Proceed Anyway" */
  isHardLimit: boolean;
  /** For IU supplements, require this unit (no conversion allowed) */
  requiredUnit?: "IU";
  /** Additional notes about the limit */
  notes?: string;
};

/**
 * Upper limits keyed by safety category.
 * These categories map to the `safetyCategory` column in the supplement table.
 *
 * Hard limits (BLOCK): zinc, iron, copper, vitamin-a, vitamin-b6, vitamin-d3, selenium
 * Soft limits (WARNING): magnesium, vitamin-c, calcium, vitamin-e
 */
export const SAFETY_LIMITS: Record<SafetyCategory, SafetyLimit> = {
  // ============================================
  // HARD LIMITS - BLOCK without override
  // High toxicity risk at elevated doses
  // ============================================
  zinc: {
    limit: 40,
    unit: "mg",
    source: "NIH",
    isHardLimit: true,
    notes: "Elemental zinc UL; higher doses deplete copper and cause GI distress",
  },
  iron: {
    limit: 45,
    unit: "mg",
    source: "NIH",
    isHardLimit: true,
    notes: "Elemental iron UL; acute toxicity risk, especially in children",
  },
  copper: {
    limit: 10,
    unit: "mg",
    source: "NIH",
    isHardLimit: true,
    notes: "Elemental copper UL; liver toxicity at high doses",
  },
  "vitamin-a": {
    limit: 10000,
    unit: "IU",
    source: "NIH",
    isHardLimit: true,
    requiredUnit: "IU",
    notes: "Preformed vitamin A (retinol); teratogenic and hepatotoxic at high doses",
  },
  "vitamin-b6": {
    limit: 100,
    unit: "mg",
    source: "NIH",
    isHardLimit: true,
    notes: "Higher doses cause peripheral neuropathy (nerve damage)",
  },
  "vitamin-d3": {
    limit: 10000,
    unit: "IU",
    source: "Endocrine Society",
    isHardLimit: true,
    requiredUnit: "IU",
    notes: "NIH UL is 4,000 IU; Endocrine Society allows up to 10,000 IU for deficiency correction",
  },
  selenium: {
    limit: 400,
    unit: "mcg",
    source: "NIH",
    isHardLimit: true,
    notes: "Selenosis (toxicity) occurs above this level; hair loss, nail brittleness, neurological issues",
  },

  // ============================================
  // SOFT LIMITS - WARNING with "Proceed Anyway"
  // Lower toxicity risk, primarily GI symptoms
  // ============================================
  magnesium: {
    limit: 350,
    unit: "mg",
    source: "NIH",
    isHardLimit: false,
    notes: "UL applies to supplemental magnesium only (not dietary); excess causes diarrhea",
  },
  "vitamin-c": {
    limit: 2000,
    unit: "mg",
    source: "NIH",
    isHardLimit: false,
    notes: "Excess causes GI distress and diarrhea; water-soluble so excreted",
  },
  calcium: {
    limit: 2500,
    unit: "mg",
    source: "NIH",
    isHardLimit: false,
    notes: "Includes diet + supplements; excess may increase cardiovascular risk",
  },
  "vitamin-e": {
    limit: 1000,
    unit: "IU",
    source: "NIH",
    isHardLimit: false,
    requiredUnit: "IU",
    notes: "High doses may increase bleeding risk; 1000 IU = 670mg alpha-tocopherol",
  },
};

/**
 * Get the safety limit for a given safety category.
 * Returns undefined if no limit is defined.
 */
export function getSafetyLimit(category: SafetyCategory): SafetyLimit | undefined {
  return SAFETY_LIMITS[category];
}

/**
 * Check if a safety category has a hard limit (BLOCK without override).
 */
export function isHardLimit(category: SafetyCategory): boolean {
  return SAFETY_LIMITS[category]?.isHardLimit ?? false;
}

/**
 * Get all hard limit categories.
 */
export function getHardLimitCategories(): SafetyCategory[] {
  return (Object.keys(SAFETY_LIMITS) as SafetyCategory[]).filter(
    (cat) => SAFETY_LIMITS[cat].isHardLimit
  );
}

/**
 * Get all soft limit categories.
 */
export function getSoftLimitCategories(): SafetyCategory[] {
  return (Object.keys(SAFETY_LIMITS) as SafetyCategory[]).filter(
    (cat) => !SAFETY_LIMITS[cat].isHardLimit
  );
}

/**
 * Format safety limits as a string for inclusion in LLM prompts.
 * Shows the key minerals/vitamins with known toxicity risks.
 */
export function formatSafetyLimitsForPrompt(): string {
  const relevantCategories: SafetyCategory[] = [
    "vitamin-d3",
    "zinc",
    "copper",
    "iron",
    "calcium",
    "magnesium",
    "selenium",
    "vitamin-b6",
  ];

  return relevantCategories
    .map((category) => {
      const limit = SAFETY_LIMITS[category];
      const displayName = category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return `${displayName}: max ${limit.limit}${limit.unit}`;
    })
    .join(", ");
}
