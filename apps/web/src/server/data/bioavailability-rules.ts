import { type mealContextEnum } from "~/server/db/schema";

type MealContext = (typeof mealContextEnum.enumValues)[number];

// ============================================================================
// Bioavailability Modifiers
// ============================================================================

export type BioavailabilityModifier = {
  /** Supplement name or safety category to match */
  match: string;
  /** Whether this is a required context (warning if not met) */
  required: boolean;
  /** Optimal meal contexts for absorption */
  optimalContexts: MealContext[];
  /** Bioavailability multiplier when taken with optimal context */
  optimalMultiplier: number;
  /** Warning message when taken without optimal context */
  warningMessage: string;
  /** Mechanism explanation */
  mechanism: string;
  /** Research citation */
  researchUrl?: string;
};

/**
 * Fat-soluble vitamins and nutrients that require dietary fat for absorption
 */
export const FAT_SOLUBLE_COMPOUNDS: BioavailabilityModifier[] = [
  {
    match: "vitamin-d",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 1.47, // 47% increase with fat
    warningMessage:
      "Vitamin D3 is fat-soluble. Take with a meal containing fat for optimal absorption (+47% bioavailability).",
    mechanism:
      "Vitamin D3 requires bile salts and dietary fat for micelle formation and intestinal absorption.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/25441954/",
  },
  {
    match: "vitamin-k",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 1.8, // Up to 80% increase
    warningMessage:
      "Vitamin K2 is fat-soluble. Take with dietary fat for optimal absorption.",
    mechanism:
      "K2 (MK-7) absorption is significantly enhanced when consumed with dietary lipids.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/22516722/",
  },
  {
    match: "vitamin-a",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 1.5,
    warningMessage:
      "Vitamin A is fat-soluble. Take with dietary fat for proper absorption.",
    mechanism:
      "Retinol requires dietary fat for intestinal absorption via chylomicron incorporation.",
  },
  {
    match: "vitamin-e",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 1.4,
    warningMessage:
      "Vitamin E is fat-soluble. Take with a meal containing fat.",
    mechanism:
      "Alpha-tocopherol absorption depends on dietary fat and bile salt secretion.",
  },
  {
    match: "CoQ10",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 2.0, // Can double absorption
    warningMessage:
      "CoQ10 is highly lipophilic. Absorption can double when taken with dietary fat.",
    mechanism:
      "CoQ10 solubilization in dietary fat significantly enhances intestinal uptake.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/22429073/",
  },
  {
    match: "Omega",
    required: false, // Already a fat
    optimalContexts: ["with_meal"],
    optimalMultiplier: 1.3,
    warningMessage:
      "Fish oil absorbs better with a meal to stimulate bile release.",
    mechanism: "Dietary fat triggers gallbladder contraction and bile release.",
  },
  {
    match: "Curcumin",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 2.0,
    warningMessage:
      "Curcumin is poorly absorbed. Take with fat and black pepper for optimal bioavailability.",
    mechanism:
      "Curcumin's lipophilic nature requires fat for absorption; piperine inhibits glucuronidation.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/9619120/",
  },
  {
    match: "Resveratrol",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 1.5,
    warningMessage: "Resveratrol bioavailability improves with dietary fat.",
    mechanism: "Lipophilic polyphenol benefits from fat-mediated absorption.",
  },
  {
    match: "Astaxanthin",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 2.5,
    warningMessage:
      "Astaxanthin is highly fat-soluble. Take with fatty meal for 2.5x better absorption.",
    mechanism:
      "Carotenoid absorption is highly dependent on dietary lipid content.",
  },
  {
    match: "Lutein",
    required: true,
    optimalContexts: ["with_fat", "with_meal"],
    optimalMultiplier: 1.8,
    warningMessage:
      "Lutein is a carotenoid that requires dietary fat for absorption.",
    mechanism:
      "Carotenoid solubilization in mixed micelles requires dietary lipids.",
  },
];

/**
 * Compounds that should be taken on an empty stomach (fasted)
 */
export const FASTED_COMPOUNDS: BioavailabilityModifier[] = [
  {
    match: "L-Tyrosine",
    required: true,
    optimalContexts: ["fasted"],
    optimalMultiplier: 1.5,
    warningMessage:
      "L-Tyrosine competes with other amino acids for absorption. Take on empty stomach for best results.",
    mechanism:
      "Large neutral amino acid transporter (LAT1) competition reduces uptake when taken with protein.",
  },
  {
    match: "L-Tryptophan",
    required: true,
    optimalContexts: ["fasted"],
    optimalMultiplier: 1.6,
    warningMessage:
      "L-Tryptophan absorption is reduced when taken with protein. Take on empty stomach.",
    mechanism:
      "Competes with branched-chain amino acids for blood-brain barrier transport.",
  },
  {
    match: "5-HTP",
    required: true,
    optimalContexts: ["fasted"],
    optimalMultiplier: 1.4,
    warningMessage: "5-HTP is best absorbed on an empty stomach.",
    mechanism:
      "Amino acid derivative absorption is optimal without competing nutrients.",
  },
  {
    match: "Iron",
    required: true,
    optimalContexts: ["fasted"],
    optimalMultiplier: 1.8,
    warningMessage:
      "Iron absorption is significantly reduced by food, especially calcium and phytates. Take on empty stomach with vitamin C.",
    mechanism:
      "Dietary inhibitors (phytates, polyphenols, calcium) form insoluble complexes with iron.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/3290310/",
  },
];

/**
 * Compounds with specific meal timing considerations
 */
export const MEAL_TIMING_COMPOUNDS: BioavailabilityModifier[] = [
  {
    match: "Magnesium",
    required: false,
    optimalContexts: ["with_meal", "post_meal"],
    optimalMultiplier: 1.2,
    warningMessage:
      "Magnesium may cause GI upset on empty stomach. Consider taking with food.",
    mechanism:
      "Food buffers gastric acidity and slows transit time for better absorption.",
  },
  {
    match: "Zinc",
    required: false,
    optimalContexts: ["with_meal"],
    optimalMultiplier: 1.1,
    warningMessage:
      "Zinc can cause nausea on empty stomach. Take with a light meal (avoid high-phytate foods).",
    mechanism: "Food reduces gastric irritation; phytates reduce absorption.",
  },
  {
    match: "NAC",
    required: false,
    optimalContexts: ["fasted", "post_meal"],
    optimalMultiplier: 1.3,
    warningMessage:
      "NAC is best absorbed away from meals (30 min before or 2h after).",
    mechanism: "Food proteins may bind cysteine and reduce absorption.",
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find bioavailability rule for a supplement
 */
export function getBioavailabilityRule(
  supplementName: string,
  safetyCategory?: string | null,
): BioavailabilityModifier | undefined {
  const allRules = [
    ...FAT_SOLUBLE_COMPOUNDS,
    ...FASTED_COMPOUNDS,
    ...MEAL_TIMING_COMPOUNDS,
  ];

  // Check by name first (case-insensitive partial match)
  const nameMatch = allRules.find(
    (rule) =>
      supplementName.toLowerCase().includes(rule.match.toLowerCase()) ||
      rule.match.toLowerCase().includes(supplementName.toLowerCase()),
  );

  if (nameMatch) return nameMatch;

  // Check by safety category
  if (safetyCategory) {
    return allRules.find(
      (rule) => rule.match.toLowerCase() === safetyCategory.toLowerCase(),
    );
  }

  return undefined;
}

/**
 * Check if meal context is optimal for a supplement
 */
export function isMealContextOptimal(
  supplementName: string,
  mealContext: MealContext | null | undefined,
  safetyCategory?: string | null,
): { isOptimal: boolean; warning?: string; multiplier: number } {
  const rule = getBioavailabilityRule(supplementName, safetyCategory);

  if (!rule) {
    return { isOptimal: true, multiplier: 1.0 };
  }

  if (!mealContext) {
    // No meal context provided - warn if required
    if (rule.required) {
      return {
        isOptimal: false,
        warning: rule.warningMessage,
        multiplier: 1.0,
      };
    }
    return { isOptimal: true, multiplier: 1.0 };
  }

  const isOptimal = rule.optimalContexts.includes(mealContext);

  return {
    isOptimal,
    warning: isOptimal ? undefined : rule.warningMessage,
    multiplier: isOptimal ? rule.optimalMultiplier : 1.0,
  };
}

/**
 * Get all supplements that require fat for absorption
 */
export function getFatSolubleMatches(): string[] {
  return FAT_SOLUBLE_COMPOUNDS.map((c) => c.match);
}

/**
 * Get all supplements that should be taken fasted
 */
export function getFastedMatches(): string[] {
  return FASTED_COMPOUNDS.map((c) => c.match);
}
