/**
 * Safe upper limits for supplements based on NIH, Endocrine Society, and other authoritative sources.
 * These are used to validate AI-generated dosage suggestions and ensure safety.
 *
 * IMPORTANT: These are UPPER limits, not recommended doses.
 * The AI should suggest doses BELOW these limits.
 */

export type SafetyLimit = {
  limit: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
  source: string;
  notes?: string;
};

/**
 * Upper limits keyed by supplement name (matching database names).
 * If a supplement is not listed, the AI will not validate against a limit.
 */
export const SAFETY_UPPER_LIMITS: Record<string, SafetyLimit> = {
  // Vitamins
  "Vitamin D3": {
    limit: 10000,
    unit: "IU",
    source: "Endocrine Society",
    notes: "Some practitioners recommend up to 10,000 IU; NIH UL is 4,000 IU",
  },
  "Vitamin K2 MK-7": {
    limit: 600,
    unit: "mcg",
    source: "No established UL",
    notes: "No toxicity reported at doses up to 600mcg in studies",
  },
  "Vitamin C": {
    limit: 2000,
    unit: "mg",
    source: "NIH",
  },
  "Vitamin B6": {
    limit: 100,
    unit: "mg",
    source: "NIH",
    notes: "Higher doses can cause neuropathy",
  },
  "Vitamin B12": {
    limit: 5000,
    unit: "mcg",
    source: "No established UL",
    notes: "Water-soluble; excess is excreted",
  },
  "Vitamin B1": {
    limit: 100,
    unit: "mg",
    source: "No established UL",
  },
  "Vitamin B2": {
    limit: 100,
    unit: "mg",
    source: "No established UL",
  },
  "Vitamin B3": {
    limit: 35,
    unit: "mg",
    source: "NIH",
    notes: "UL applies to supplemental niacin to avoid flushing",
  },
  Folate: {
    limit: 1000,
    unit: "mcg",
    source: "NIH",
  },
  Biotin: {
    limit: 10000,
    unit: "mcg",
    source: "No established UL",
    notes: "Can interfere with lab tests at high doses",
  },

  // Minerals
  "Zinc Picolinate": {
    limit: 40,
    unit: "mg",
    source: "NIH",
    notes: "Elemental zinc UL; higher doses deplete copper",
  },
  "Zinc Gluconate": {
    limit: 40,
    unit: "mg",
    source: "NIH",
  },
  "Copper Bisglycinate": {
    limit: 10,
    unit: "mg",
    source: "NIH",
  },
  "Iron Bisglycinate": {
    limit: 45,
    unit: "mg",
    source: "NIH",
    notes: "Elemental iron UL; higher doses cause GI distress",
  },
  Calcium: {
    limit: 2500,
    unit: "mg",
    source: "NIH",
    notes: "Includes diet + supplements",
  },
  "Magnesium Glycinate": {
    limit: 350,
    unit: "mg",
    source: "NIH",
    notes: "UL applies to supplemental magnesium only (not dietary)",
  },
  "Magnesium Citrate": {
    limit: 350,
    unit: "mg",
    source: "NIH",
  },
  "Magnesium L-Threonate": {
    limit: 350,
    unit: "mg",
    source: "NIH",
  },
  "Magnesium Oxide": {
    limit: 350,
    unit: "mg",
    source: "NIH",
  },
  "Magnesium Malate": {
    limit: 350,
    unit: "mg",
    source: "NIH",
  },
  Selenium: {
    limit: 400,
    unit: "mcg",
    source: "NIH",
    notes: "Toxicity (selenosis) can occur above this",
  },
  Potassium: {
    limit: 3500,
    unit: "mg",
    source: "NIH",
    notes: "From supplements; dietary potassium has higher targets",
  },
  Boron: {
    limit: 20,
    unit: "mg",
    source: "NIH",
  },
  Iodine: {
    limit: 1100,
    unit: "mcg",
    source: "NIH",
  },
  Chromium: {
    limit: 1000,
    unit: "mcg",
    source: "No established UL",
    notes: "Generally considered safe up to 1000mcg",
  },

  // Amino Acids
  "L-Tyrosine": {
    limit: 12000,
    unit: "mg",
    source: "Clinical studies",
    notes: "Up to 12g/day used in studies without adverse effects",
  },
  "L-Theanine": {
    limit: 400,
    unit: "mg",
    source: "Clinical studies",
    notes: "Up to 400mg commonly used; some studies use higher",
  },
  "5-HTP": {
    limit: 300,
    unit: "mg",
    source: "Clinical studies",
    notes: "Higher doses may cause serotonin syndrome risk",
  },
  GABA: {
    limit: 3000,
    unit: "mg",
    source: "Clinical studies",
  },
  Glycine: {
    limit: 15,
    unit: "g",
    source: "Clinical studies",
    notes: "Up to 15g used in studies for sleep",
  },
  Taurine: {
    limit: 6000,
    unit: "mg",
    source: "EFSA",
    notes: "European Food Safety Authority limit",
  },

  // Antioxidants
  CoQ10: {
    limit: 1200,
    unit: "mg",
    source: "Clinical studies",
    notes: "Up to 1200mg used in Parkinson's studies",
  },
  "Alpha Lipoic Acid": {
    limit: 2400,
    unit: "mg",
    source: "Clinical studies",
  },
  NAC: {
    limit: 1800,
    unit: "mg",
    source: "Clinical studies",
    notes: "Higher doses used clinically under supervision",
  },
  Quercetin: {
    limit: 1000,
    unit: "mg",
    source: "Clinical studies",
  },
  Glutathione: {
    limit: 1000,
    unit: "mg",
    source: "Clinical studies",
  },

  // Omega-3
  "Fish Oil EPA": {
    limit: 3000,
    unit: "mg",
    source: "FDA",
    notes: "Combined EPA+DHA; higher doses may increase bleeding risk",
  },
  "Fish Oil DHA": {
    limit: 3000,
    unit: "mg",
    source: "FDA",
    notes: "Combined EPA+DHA limit",
  },

  // Adaptogens & Nootropics
  Caffeine: {
    limit: 400,
    unit: "mg",
    source: "FDA",
    notes: "For healthy adults; lower for pregnancy/caffeine-sensitive",
  },
  Ashwagandha: {
    limit: 1200,
    unit: "mg",
    source: "Clinical studies",
  },
  "Lion's Mane": {
    limit: 3000,
    unit: "mg",
    source: "Clinical studies",
  },
  "Rhodiola Rosea": {
    limit: 680,
    unit: "mg",
    source: "Clinical studies",
  },
  "Bacopa Monnieri": {
    limit: 600,
    unit: "mg",
    source: "Clinical studies",
  },
  Berberine: {
    limit: 1500,
    unit: "mg",
    source: "Clinical studies",
    notes: "Usually taken in divided doses",
  },

  // Other
  Curcumin: {
    limit: 8000,
    unit: "mg",
    source: "Clinical studies",
    notes: "High bioavailability forms may need lower doses",
  },
  Piperine: {
    limit: 20,
    unit: "mg",
    source: "Clinical studies",
    notes: "5-20mg typically used for bioavailability enhancement",
  },
  "Creatine Monohydrate": {
    limit: 10,
    unit: "g",
    source: "Clinical studies",
    notes: "5g/day is standard maintenance; loading phase may use 20g",
  },
  Collagen: {
    limit: 40,
    unit: "g",
    source: "Clinical studies",
    notes: "10-15g typical; up to 40g used in studies",
  },
  Melatonin: {
    limit: 10,
    unit: "mg",
    source: "Clinical studies",
    notes: "Lower doses (0.5-3mg) often more effective for sleep",
  },
};

/**
 * Get the safety limit for a supplement by name.
 * Returns undefined if no limit is defined.
 */
export function getSafetyLimit(supplementName: string): SafetyLimit | undefined {
  return SAFETY_UPPER_LIMITS[supplementName];
}

/**
 * Check if a suggested dosage exceeds the safety limit.
 * Returns true if the dosage is SAFE (below limit), false if it exceeds.
 * Returns true if no limit is defined (assume safe).
 */
export function isDosageSafe(
  supplementName: string,
  dosage: number,
  unit: string,
): boolean {
  const limit = getSafetyLimit(supplementName);
  if (!limit) return true; // No limit defined, assume safe

  // Units must match for comparison
  if (limit.unit !== unit) {
    // TODO: Add unit conversion for proper comparison
    // For now, if units don't match, we can't validate
    return true;
  }

  return dosage <= limit.limit;
}

/**
 * Format safety limits as a string for inclusion in LLM prompts.
 */
export function formatSafetyLimitsForPrompt(): string {
  const relevantLimits = [
    "Vitamin D3",
    "Zinc Picolinate",
    "Copper Bisglycinate",
    "Iron Bisglycinate",
    "Calcium",
    "Magnesium Glycinate",
  ];

  return relevantLimits
    .map((name) => {
      const limit = SAFETY_UPPER_LIMITS[name];
      if (!limit) return null;
      return `${name}: max ${limit.limit}${limit.unit}`;
    })
    .filter(Boolean)
    .join(", ");
}
