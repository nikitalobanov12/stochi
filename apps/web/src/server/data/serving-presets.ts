/**
 * Serving presets for supplements where exact dosage isn't easily known.
 * Keyed by supplement name (lowercase) for easy lookup.
 */

export type ServingPreset = {
  label: string;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
};

export const SERVING_PRESETS: Record<string, ServingPreset[]> = {
  caffeine: [
    { label: "Cup of coffee", dosage: 95, unit: "mg" },
    { label: "Espresso shot", dosage: 63, unit: "mg" },
    { label: "Double espresso", dosage: 126, unit: "mg" },
    { label: "Cup of black tea", dosage: 47, unit: "mg" },
    { label: "Cup of green tea", dosage: 28, unit: "mg" },
    { label: "Energy drink (250ml)", dosage: 80, unit: "mg" },
  ],
  "l-theanine": [
    { label: "Cup of green tea", dosage: 25, unit: "mg" },
    { label: "Cup of black tea", dosage: 20, unit: "mg" },
  ],
  creatine: [
    { label: "1 scoop (5g)", dosage: 5, unit: "g" },
    { label: "Loading dose", dosage: 20, unit: "g" },
  ],
  "fish oil": [
    { label: "1 softgel", dosage: 1000, unit: "mg" },
    { label: "2 softgels", dosage: 2000, unit: "mg" },
  ],
  "omega-3": [
    { label: "1 softgel", dosage: 1000, unit: "mg" },
    { label: "2 softgels", dosage: 2000, unit: "mg" },
  ],
  "vitamin d": [
    { label: "1 softgel", dosage: 1000, unit: "IU" },
    { label: "High dose", dosage: 5000, unit: "IU" },
  ],
  "vitamin d3": [
    { label: "1 softgel", dosage: 1000, unit: "IU" },
    { label: "High dose", dosage: 5000, unit: "IU" },
  ],
  melatonin: [
    { label: "Low dose", dosage: 0.5, unit: "mg" },
    { label: "Standard dose", dosage: 3, unit: "mg" },
    { label: "High dose", dosage: 5, unit: "mg" },
  ],
  ashwagandha: [
    { label: "1 capsule", dosage: 300, unit: "mg" },
    { label: "2 capsules", dosage: 600, unit: "mg" },
  ],
  "protein powder": [
    { label: "1 scoop", dosage: 25, unit: "g" },
    { label: "2 scoops", dosage: 50, unit: "g" },
  ],
  collagen: [
    { label: "1 scoop", dosage: 10, unit: "g" },
    { label: "2 scoops", dosage: 20, unit: "g" },
  ],
};

/**
 * Get serving presets for a supplement by name.
 * Returns empty array if no presets exist.
 */
export function getServingPresets(supplementName: string): ServingPreset[] {
  const key = supplementName.toLowerCase();
  return SERVING_PRESETS[key] ?? [];
}
