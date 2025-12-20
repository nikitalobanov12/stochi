import { type dosageUnitEnum, type routeEnum } from "~/server/db/schema";
import { type GoalKey } from "~/server/data/goal-recommendations";

type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];
type RouteOfAdministration = (typeof routeEnum.enumValues)[number];

export type StackTemplateItem = {
  supplementName: string;
  dosage: number;
  unit: DosageUnit;
  /** Optional route override (defaults to supplement's default) */
  route?: RouteOfAdministration;
  /** Timing note for this supplement */
  timing?: string;
};

export type StackTemplate = {
  key: string;
  name: string;
  description: string;
  /** Detailed usage instructions */
  usage?: string;
  /** Optional citation/source for authority */
  source?: string;
  /** Link to research or source */
  sourceUrl?: string;
  /** Authority level for sorting */
  authority?: "high" | "medium" | "community";
  /** Goals this stack targets */
  goals?: GoalKey[];
  /** Whether this stack contains research chemicals/peptides */
  isResearchStack?: boolean;
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
    name: "Huberman Sleep Stack",
    description: "Mag Threonate + Theanine + Apigenin for deep, restorative sleep",
    usage: "Take 30-60 minutes before bed. Start with Theanine alone for 2-3 days, then add others.",
    source: "Huberman Lab Podcast",
    sourceUrl: "https://hubermanlab.com/toolkit-for-sleep",
    authority: "high",
    goals: ["sleep"],
    interactions: [{ type: "synergy", count: 2 }],
    supplements: [
      { supplementName: "Magnesium Threonate", dosage: 145, unit: "mg", timing: "30-60 min before bed" },
      { supplementName: "L-Theanine", dosage: 200, unit: "mg", timing: "30-60 min before bed" },
      { supplementName: "Apigenin", dosage: 50, unit: "mg", timing: "30-60 min before bed" },
    ],
  },
  {
    key: "huberman-focus",
    name: "Huberman Focus Stack",
    description: "L-Tyrosine + Alpha-GPC for sustained dopamine-driven focus",
    usage: "Take on empty stomach, 30-45 min before demanding cognitive work. Skip on rest days.",
    source: "Huberman Lab Podcast",
    sourceUrl: "https://hubermanlab.com/the-optimal-morning-routine",
    authority: "high",
    goals: ["focus", "energy"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "L-Tyrosine", dosage: 500, unit: "mg", timing: "Morning, fasted" },
      { supplementName: "Alpha-GPC", dosage: 300, unit: "mg", timing: "Morning, fasted" },
    ],
  },
  {
    key: "attia-longevity",
    name: "Attia Longevity Core",
    description: "Evidence-based longevity foundation with omega-3s and vitamin D",
    usage: "Take with breakfast containing fat. Consistent daily use for benefits.",
    source: "Peter Attia MD",
    sourceUrl: "https://peterattiamd.com/",
    authority: "high",
    goals: ["longevity", "health"],
    interactions: [{ type: "synergy", count: 2 }],
    supplements: [
      { supplementName: "Omega-3 (EPA/DHA)", dosage: 2000, unit: "mg", timing: "With fatty breakfast" },
      { supplementName: "Vitamin D3", dosage: 5000, unit: "IU", timing: "With fatty breakfast" },
      { supplementName: "Vitamin K2 MK-7", dosage: 100, unit: "mcg", timing: "With fatty breakfast" },
      { supplementName: "Magnesium", dosage: 400, unit: "mg", timing: "Evening" },
    ],
  },
  {
    key: "sinclair-longevity",
    name: "Sinclair NMN Protocol",
    description: "NAD+ precursor stack for cellular energy and longevity",
    usage: "Take NMN in morning on empty stomach. Resveratrol with fatty food.",
    source: "David Sinclair PhD",
    sourceUrl: "https://lifespanbook.com/",
    authority: "high",
    goals: ["longevity", "energy"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "NMN", dosage: 1000, unit: "mg", timing: "Morning, fasted" },
      { supplementName: "Resveratrol", dosage: 1000, unit: "mg", timing: "With fatty breakfast" },
    ],
  },
  {
    key: "examine-cognitive",
    name: "Nootropic Foundation",
    description: "Lion's Mane + Bacopa for memory, focus, and neuroprotection",
    usage: "Take daily with food. Benefits accumulate over 4-8 weeks.",
    source: "Examine.com",
    sourceUrl: "https://examine.com/supplements/bacopa-monnieri/",
    authority: "high",
    goals: ["focus", "longevity"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Lion's Mane", dosage: 1000, unit: "mg", timing: "Morning with food" },
      { supplementName: "Bacopa Monnieri", dosage: 300, unit: "mg", timing: "Morning with food" },
    ],
  },

  // ============================================================================
  // Medium-Authority Stacks (Research-Supported)
  // ============================================================================
  {
    key: "daily-essentials",
    name: "Daily Essentials",
    description: "D3 + K2 + Magnesium - the foundational trio most people need",
    usage: "D3/K2 with fatty meal for absorption. Magnesium at night for sleep.",
    source: "Clinical Guidelines",
    authority: "medium",
    goals: ["health"],
    interactions: [{ type: "synergy", count: 2 }],
    supplements: [
      { supplementName: "Vitamin D3", dosage: 5000, unit: "IU", timing: "With fatty breakfast" },
      { supplementName: "Vitamin K2 MK-7", dosage: 100, unit: "mcg", timing: "With fatty breakfast" },
      { supplementName: "Magnesium Glycinate", dosage: 400, unit: "mg", timing: "Before bed" },
    ],
  },
  {
    key: "caffeine-theanine",
    name: "Calm Energy",
    description: "Caffeine + L-Theanine - smooth focus without jitters",
    usage: "2:1 Theanine to Caffeine ratio. Take as morning alternative to plain coffee.",
    source: "Examine.com",
    sourceUrl: "https://examine.com/supplements/theanine/",
    authority: "medium",
    goals: ["focus", "energy"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Caffeine", dosage: 100, unit: "mg", timing: "Morning" },
      { supplementName: "L-Theanine", dosage: 200, unit: "mg", timing: "Morning" },
    ],
  },
  {
    key: "stress-adaptation",
    name: "Stress Resilience",
    description: "Ashwagandha + Rhodiola for cortisol management and stress adaptation",
    usage: "Take with breakfast. Cycle 8 weeks on, 2-4 weeks off.",
    source: "Adaptogen Research",
    authority: "medium",
    goals: ["stress", "energy"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Ashwagandha KSM-66", dosage: 600, unit: "mg", timing: "Morning with food" },
      { supplementName: "Rhodiola Rosea", dosage: 200, unit: "mg", timing: "Morning, before noon" },
    ],
  },
  {
    key: "immune-support",
    name: "Immune Defense",
    description: "Zinc + Vitamin C + Vitamin D for immune system support",
    usage: "Daily during cold season or when feeling run down. Zinc with food to avoid nausea.",
    source: "Clinical Research",
    authority: "medium",
    goals: ["health"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Zinc Picolinate", dosage: 30, unit: "mg", timing: "With lunch" },
      { supplementName: "Vitamin C", dosage: 1000, unit: "mg", timing: "Morning" },
      { supplementName: "Vitamin D3", dosage: 5000, unit: "IU", timing: "With fatty meal" },
    ],
  },
  {
    key: "joint-health",
    name: "Joint Support",
    description: "Collagen + Vitamin C + Omega-3 for joint and connective tissue health",
    usage: "Vitamin C enhances collagen synthesis. Take consistently for 8+ weeks.",
    source: "Sports Medicine Research",
    authority: "medium",
    goals: ["health"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Collagen Peptides", dosage: 10, unit: "g", timing: "Morning, any time" },
      { supplementName: "Vitamin C", dosage: 500, unit: "mg", timing: "With collagen" },
      { supplementName: "Omega-3 (EPA/DHA)", dosage: 2000, unit: "mg", timing: "With food" },
    ],
  },
  {
    key: "workout-performance",
    name: "Pre-Workout Natural",
    description: "Creatine + Beta-Alanine + Citrulline for strength and endurance",
    usage: "Creatine daily (timing doesn't matter). Others 30 min before training.",
    source: "Sports Nutrition Research",
    authority: "medium",
    goals: ["energy", "health"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Creatine Monohydrate", dosage: 5, unit: "g", timing: "Daily, any time" },
      { supplementName: "Beta-Alanine", dosage: 3, unit: "g", timing: "Pre-workout" },
      { supplementName: "L-Citrulline", dosage: 6, unit: "g", timing: "Pre-workout" },
    ],
  },
  {
    key: "gut-repair",
    name: "Gut Repair Protocol",
    description: "L-Glutamine + Zinc Carnosine for gut lining support",
    usage: "Take on empty stomach. 4-8 week protocol for gut healing.",
    source: "Gastroenterology Research",
    authority: "medium",
    goals: ["health"],
    interactions: [],
    supplements: [
      { supplementName: "L-Glutamine", dosage: 5000, unit: "mg", timing: "Morning, fasted" },
      { supplementName: "Zinc Carnosine", dosage: 75, unit: "mg", timing: "Before meals" },
    ],
  },
  {
    key: "mood-support",
    name: "Mood Support",
    description: "Omega-3 + Vitamin D + Magnesium for mood and emotional balance",
    usage: "Consistent daily use. May take 4-8 weeks for full effect.",
    source: "Psychiatry Research",
    authority: "medium",
    goals: ["stress", "health"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Omega-3 (EPA/DHA)", dosage: 2000, unit: "mg", timing: "With food" },
      { supplementName: "Vitamin D3", dosage: 5000, unit: "IU", timing: "With fatty meal" },
      { supplementName: "Magnesium Glycinate", dosage: 400, unit: "mg", timing: "Evening" },
    ],
  },
  {
    key: "mineral-balance",
    name: "Mineral Repletion",
    description: "Magnesium + Zinc + Potassium for common mineral deficiencies",
    usage: "Separate zinc and magnesium by 2+ hours for optimal absorption.",
    source: "Nutritional Medicine",
    authority: "medium",
    goals: ["health"],
    interactions: [{ type: "conflict", count: 1 }],
    supplements: [
      { supplementName: "Magnesium Glycinate", dosage: 400, unit: "mg", timing: "Before bed" },
      { supplementName: "Zinc Picolinate", dosage: 30, unit: "mg", timing: "With lunch" },
      { supplementName: "Potassium Citrate", dosage: 500, unit: "mg", timing: "With food" },
    ],
  },
  {
    key: "eye-health",
    name: "Vision Support",
    description: "Lutein + Zeaxanthin + Omega-3 for macular health and eye strain",
    usage: "Take with fatty meal. Especially useful for heavy screen users.",
    source: "AREDS2 Study",
    sourceUrl: "https://www.nei.nih.gov/research/clinical-trials/age-related-eye-disease-studies-aredsareds2",
    authority: "medium",
    goals: ["health"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Lutein", dosage: 20, unit: "mg", timing: "With fatty meal" },
      { supplementName: "Zeaxanthin", dosage: 4, unit: "mg", timing: "With fatty meal" },
      { supplementName: "Omega-3 (EPA/DHA)", dosage: 1000, unit: "mg", timing: "With fatty meal" },
    ],
  },

  // ============================================================================
  // Community Stacks
  // ============================================================================
  {
    key: "sleep-rescue",
    name: "Sleep Rescue",
    description: "Glycine + Magnesium + Tart Cherry for occasional sleep support",
    usage: "For nights when you need extra sleep support. Not for daily use.",
    authority: "community",
    goals: ["sleep"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Glycine", dosage: 3000, unit: "mg", timing: "30 min before bed" },
      { supplementName: "Magnesium Glycinate", dosage: 400, unit: "mg", timing: "30 min before bed" },
      { supplementName: "Tart Cherry Extract", dosage: 500, unit: "mg", timing: "30 min before bed" },
    ],
  },
  {
    key: "antioxidant-stack",
    name: "Antioxidant Defense",
    description: "NAC + Vitamin C + ALA for cellular protection",
    usage: "NAC on empty stomach. ALA and C with food.",
    authority: "community",
    goals: ["longevity", "health"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "NAC", dosage: 600, unit: "mg", timing: "Morning, fasted" },
      { supplementName: "Vitamin C", dosage: 1000, unit: "mg", timing: "With food" },
      { supplementName: "Alpha Lipoic Acid", dosage: 300, unit: "mg", timing: "With food" },
    ],
  },
  {
    key: "hair-skin-nails",
    name: "Beauty Stack",
    description: "Biotin + Collagen + Silica for hair, skin, and nail health",
    usage: "Consistent daily use for 3+ months to see results.",
    authority: "community",
    goals: ["health"],
    interactions: [],
    supplements: [
      { supplementName: "Biotin", dosage: 5000, unit: "mcg", timing: "Morning" },
      { supplementName: "Collagen Peptides", dosage: 10, unit: "g", timing: "Any time" },
      { supplementName: "Silica", dosage: 10, unit: "mg", timing: "With food" },
    ],
  },

  // ============================================================================
  // Research Chemical / Peptide Stacks (Combos Only)
  // ============================================================================
  {
    key: "healing-peptides",
    name: "Healing Peptide Stack",
    description: "BPC-157 + TB-500 synergistic tissue repair protocol",
    usage: "SubQ injection near injury site. 4-6 week protocol. Store peptides in fridge.",
    source: "Peptide Research",
    authority: "community",
    isResearchStack: true,
    goals: ["health"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "BPC-157", dosage: 250, unit: "mcg", route: "subq_injection", timing: "1-2x daily" },
      { supplementName: "TB-500", dosage: 2, unit: "mg", route: "subq_injection", timing: "2x per week" },
    ],
  },
  {
    key: "cognitive-peptides",
    name: "Cognitive Peptide Stack",
    description: "SEMAX + Selank for focus, memory, and calm clarity",
    usage: "Intranasal spray. SEMAX for focus, Selank for anxiety. Can use together or separately.",
    source: "Russian Peptide Research",
    authority: "community",
    isResearchStack: true,
    goals: ["focus", "stress"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "SEMAX", dosage: 600, unit: "mcg", route: "intranasal", timing: "Morning" },
      { supplementName: "Selank", dosage: 400, unit: "mcg", route: "intranasal", timing: "Morning or as needed" },
    ],
  },
  {
    key: "skin-repair-peptides",
    name: "Skin Regeneration",
    description: "GHK-Cu + BPC-157 for skin healing and anti-aging",
    usage: "GHK-Cu topically or SubQ. BPC-157 SubQ. 4-8 week protocol.",
    source: "Peptide Research",
    authority: "community",
    isResearchStack: true,
    goals: ["longevity", "health"],
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "GHK-Cu", dosage: 1, unit: "mg", route: "subq_injection", timing: "Daily" },
      { supplementName: "BPC-157", dosage: 250, unit: "mcg", route: "subq_injection", timing: "Daily" },
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

/**
 * Get only research chemical / peptide stacks
 */
export function getResearchStacks(): StackTemplate[] {
  return stackTemplates.filter((t) => t.isResearchStack);
}

/**
 * Get only non-research stacks (safe supplements)
 */
export function getSafeStacks(): StackTemplate[] {
  return stackTemplates.filter((t) => !t.isResearchStack);
}

/**
 * Get stacks by goal
 */
export function getStacksByGoal(goal: GoalKey): StackTemplate[] {
  return stackTemplates.filter((t) => t.goals?.includes(goal));
}

/**
 * Get stacks matching any of the provided goals
 */
export function getStacksByGoals(goals: GoalKey[]): StackTemplate[] {
  if (goals.length === 0) return stackTemplates;
  return stackTemplates.filter((t) => 
    t.goals?.some((g) => goals.includes(g))
  );
}
