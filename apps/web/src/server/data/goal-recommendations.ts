import { type dosageUnitEnum } from "~/server/db/schema";

type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];

export type GoalKey = "focus" | "sleep" | "energy" | "stress" | "health" | "longevity";

export type GoalSupplement = {
  name: string;
  reason: string;
  dosage: number;
  unit: DosageUnit;
};

export type Goal = {
  key: GoalKey;
  name: string;
  icon: string;
  description: string;
  supplements: GoalSupplement[];
  synergies: string[];
};

export const goals: Goal[] = [
  {
    key: "focus",
    name: "Focus & Productivity",
    icon: "🎯",
    description: "Enhance mental clarity and concentration",
    supplements: [
      {
        name: "L-Tyrosine",
        reason: "Dopamine precursor for mental clarity",
        dosage: 500,
        unit: "mg",
      },
      {
        name: "Caffeine",
        reason: "Alertness and concentration",
        dosage: 100,
        unit: "mg",
      },
      {
        name: "L-Theanine",
        reason: "Smooth focus without jitters",
        dosage: 200,
        unit: "mg",
      },
    ],
    synergies: ["Caffeine + L-Theanine reduces jitters while maintaining alertness"],
  },
  {
    key: "sleep",
    name: "Sleep & Recovery",
    icon: "😴",
    description: "Improve sleep quality and recovery",
    supplements: [
      {
        name: "Magnesium Glycinate",
        reason: "Promotes relaxation and sleep quality",
        dosage: 400,
        unit: "mg",
      },
      {
        name: "L-Theanine",
        reason: "Calming without sedation",
        dosage: 200,
        unit: "mg",
      },
      {
        name: "Glycine",
        reason: "Lowers core body temperature for sleep onset",
        dosage: 3,
        unit: "g",
      },
    ],
    synergies: ["Magnesium + Glycine work synergistically for deeper sleep"],
  },
  {
    key: "energy",
    name: "Energy & Performance",
    icon: "⚡",
    description: "Boost physical energy and endurance",
    supplements: [
      {
        name: "Creatine Monohydrate",
        reason: "ATP regeneration for strength",
        dosage: 5,
        unit: "g",
      },
      {
        name: "Caffeine",
        reason: "Pre-workout energy",
        dosage: 200,
        unit: "mg",
      },
      {
        name: "Vitamin B12",
        reason: "Energy metabolism",
        dosage: 1000,
        unit: "mcg",
      },
    ],
    synergies: [],
  },
  {
    key: "stress",
    name: "Stress & Mood",
    icon: "🧘",
    description: "Support stress resilience and balanced mood",
    supplements: [
      {
        name: "Ashwagandha",
        reason: "Adaptogen for stress resilience",
        dosage: 600,
        unit: "mg",
      },
      {
        name: "Magnesium Glycinate",
        reason: "Calms nervous system",
        dosage: 400,
        unit: "mg",
      },
      {
        name: "L-Theanine",
        reason: "Promotes calm alertness",
        dosage: 200,
        unit: "mg",
      },
    ],
    synergies: [],
  },
  {
    key: "health",
    name: "General Health",
    icon: "💪",
    description: "Foundation supplements for overall wellness",
    supplements: [
      {
        name: "Vitamin D3",
        reason: "Immune function, bone health",
        dosage: 5000,
        unit: "IU",
      },
      {
        name: "Vitamin K2 MK-7",
        reason: "Works with D3 for calcium metabolism",
        dosage: 100,
        unit: "mcg",
      },
      {
        name: "Magnesium Glycinate",
        reason: "Supports 300+ enzymatic reactions",
        dosage: 400,
        unit: "mg",
      },
      {
        name: "Fish Oil (EPA)",
        reason: "Omega-3 for inflammation",
        dosage: 1000,
        unit: "mg",
      },
    ],
    synergies: ["Vitamin D3 + K2 directs calcium to bones, not arteries"],
  },
  {
    key: "longevity",
    name: "Longevity & Aging",
    icon: "🧬",
    description: "Support cellular health and healthy aging",
    supplements: [
      {
        name: "NAC",
        reason: "Glutathione precursor, cellular protection",
        dosage: 600,
        unit: "mg",
      },
      {
        name: "CoQ10",
        reason: "Mitochondrial energy production",
        dosage: 100,
        unit: "mg",
      },
      {
        name: "Vitamin D3",
        reason: "Immune and metabolic regulation",
        dosage: 5000,
        unit: "IU",
      },
      {
        name: "Fish Oil (EPA)",
        reason: "Anti-inflammatory, cardiovascular support",
        dosage: 1000,
        unit: "mg",
      },
    ],
    synergies: ["NAC + Vitamin C regenerates glutathione for cellular defense"],
  },
];

export function getGoalByKey(key: GoalKey): Goal | undefined {
  return goals.find((g) => g.key === key);
}

export function getGoalSupplements(key: GoalKey): GoalSupplement[] {
  return getGoalByKey(key)?.supplements ?? [];
}

export const goalKeys: GoalKey[] = ["focus", "sleep", "energy", "stress", "health", "longevity"];
