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
  interactions: Array<{
    type: "synergy" | "conflict";
    count: number;
  }>;
  supplements: StackTemplateItem[];
};

export const stackTemplates: StackTemplate[] = [
  {
    key: "focus",
    name: "Focus Protocol",
    description: "Caffeine + L-Theanine + L-Tyrosine",
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
    interactions: [{ type: "synergy", count: 1 }],
    supplements: [
      { supplementName: "Vitamin D3", dosage: 5000, unit: "IU" },
      { supplementName: "Vitamin K2 MK-7", dosage: 100, unit: "mcg" },
      { supplementName: "Magnesium Glycinate", dosage: 400, unit: "mg" },
    ],
  },
];

// Template names for detection
export const templateNames = stackTemplates.map((t) => t.name);

export function isTemplateStack(stackName: string): boolean {
  return templateNames.includes(stackName);
}

export function getTemplateByName(stackName: string): StackTemplate | undefined {
  return stackTemplates.find((t) => t.name === stackName);
}

export function getTemplateByKey(key: string): StackTemplate | undefined {
  return stackTemplates.find((t) => t.key === key);
}
