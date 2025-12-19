import { type dosageUnitEnum } from "~/server/db/schema";

type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];

export type StackTemplateItem = {
  supplementName: string;
  dosage: number;
  unit: DosageUnit;
};

export type StackTemplate = {
  key: string;
  name: string;
  description: string;
  /** Optional citation/source for authority */
  source?: string;
  /** Authority level for sorting */
  authority?: "high" | "medium" | "community";
  interactions: Array<{
    type: "synergy" | "conflict";
    count: number;
  }>;
  supplements: StackTemplateItem[];
};

export const stackTemplates: StackTemplate[] = [
  // ============================================================================
  // High-Authority Stacks (Celebrity/Research-Backed)
  // ============================================================================
  {
    key: "huberman-sleep",
    name: "Sleep Cocktail",
    description: "Mag, Theanine, Apigenin - promotes deep sleep",
    source: "Huberman Lab Podcast",
    authority: "high",
    interactions: [{ type: "synergy", count: 2 }],
    supplements: [
      { supplementName: "Magnesium Threonate", dosage: 145, unit: "mg" },
      { supplementName: "L-Theanine", dosage: 200, unit: "mg" },
      { supplementName: "Apigenin", dosage: 50, unit: "mg" },
    ],
  },
  {
    key: "huberman-focus",
    name: "Dopamine Focus Stack",
    description: "L-Tyrosine-based focus enhancement",
    source: "Huberman Lab Podcast",
    authority: "high",
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "L-Tyrosine", dosage: 500, unit: "mg" },
      { supplementName: "Alpha-GPC", dosage: 300, unit: "mg" },
      { supplementName: "Caffeine", dosage: 100, unit: "mg" },
    ],
  },
  {
    key: "longevity-core",
    name: "Longevity Core",
    description: "NAD+ precursor + polyphenol foundation",
    source: "David Sinclair / Attia",
    authority: "high",
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "NMN", dosage: 500, unit: "mg" },
      { supplementName: "Resveratrol", dosage: 500, unit: "mg" },
      { supplementName: "Quercetin", dosage: 500, unit: "mg" },
    ],
  },
  {
    key: "cognitive-stack",
    name: "Cognitive Enhancement",
    description: "Racetam-free nootropic foundation",
    source: "Examine.com",
    authority: "high",
    interactions: [{ type: "synergy", count: 2 }],
    supplements: [
      { supplementName: "Lion's Mane", dosage: 500, unit: "mg" },
      { supplementName: "Bacopa Monnieri", dosage: 300, unit: "mg" },
      { supplementName: "Phosphatidylserine", dosage: 100, unit: "mg" },
    ],
  },

  // ============================================================================
  // Medium-Authority Stacks (Research-Supported)
  // ============================================================================
  {
    key: "focus",
    name: "Focus Protocol",
    description: "Caffeine + L-Theanine + L-Tyrosine",
    authority: "medium",
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Caffeine", dosage: 100, unit: "mg" },
      { supplementName: "L-Theanine", dosage: 200, unit: "mg" },
      { supplementName: "L-Tyrosine", dosage: 500, unit: "mg" },
    ],
  },
  {
    key: "mineral",
    name: "Mineral Balance",
    description: "Magnesium + Zinc + Iron",
    authority: "medium",
    interactions: [{ type: "conflict", count: 2 }],
    supplements: [
      { supplementName: "Magnesium Glycinate", dosage: 400, unit: "mg" },
      { supplementName: "Zinc Picolinate", dosage: 30, unit: "mg" },
      { supplementName: "Iron Bisglycinate", dosage: 18, unit: "mg" },
    ],
  },
  {
    key: "essentials",
    name: "Daily Essentials",
    description: "Vitamin D3 + K2 + Magnesium",
    authority: "medium",
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Vitamin D3", dosage: 5000, unit: "IU" },
      { supplementName: "Vitamin K2 MK-7", dosage: 100, unit: "mcg" },
      { supplementName: "Magnesium Glycinate", dosage: 400, unit: "mg" },
    ],
  },
  {
    key: "stress-adaptation",
    name: "Stress Adaptation",
    description: "Adaptogenic stress support",
    authority: "medium",
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Ashwagandha KSM-66", dosage: 600, unit: "mg" },
      { supplementName: "Rhodiola Rosea", dosage: 200, unit: "mg" },
      { supplementName: "Magnesium Glycinate", dosage: 200, unit: "mg" },
    ],
  },

  // ============================================================================
  // Community Stacks
  // ============================================================================
  {
    key: "omega-foundation",
    name: "Omega Foundation",
    description: "EPA/DHA with absorption enhancer",
    authority: "community",
    interactions: [],
    supplements: [
      { supplementName: "Fish Oil (EPA)", dosage: 1000, unit: "mg" },
      { supplementName: "Fish Oil (DHA)", dosage: 500, unit: "mg" },
      { supplementName: "Vitamin E", dosage: 400, unit: "IU" },
    ],
  },
  {
    key: "gut-health",
    name: "Gut Health",
    description: "Digestive support stack",
    authority: "community",
    interactions: [],
    supplements: [
      { supplementName: "L-Glutamine", dosage: 5000, unit: "mg" },
      { supplementName: "Zinc Carnosine", dosage: 75, unit: "mg" },
    ],
  },
];

// Template names for detection
export const templateNames = stackTemplates.map((t) => t.name);

export function isTemplateStack(stackName: string): boolean {
  return templateNames.includes(stackName);
}

export function getTemplateByName(
  stackName: string,
): StackTemplate | undefined {
  return stackTemplates.find((t) => t.name === stackName);
}

export function getTemplateByKey(key: string): StackTemplate | undefined {
  return stackTemplates.find((t) => t.key === key);
}

/**
 * Get templates sorted by authority level
 */
export function getTemplatesByAuthority(): StackTemplate[] {
  const authorityOrder = { high: 0, medium: 1, community: 2 };
  return [...stackTemplates].sort((a, b) => {
    const aOrder = authorityOrder[a.authority ?? "community"];
    const bOrder = authorityOrder[b.authority ?? "community"];
    return aOrder - bOrder;
  });
}
