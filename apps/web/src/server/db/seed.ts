import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  supplement,
  interaction,
  ratioRule,
  timingRule,
  user,
  stack,
  stackItem,
} from "./schema";

// System user ID for public protocol stacks
const SYSTEM_USER_ID = "system";

type SupplementCategory =
  | "mineral"
  | "vitamin"
  | "amino-acid"
  | "adaptogen"
  | "nootropic"
  | "antioxidant"
  | "omega"
  | "peptide"
  | "other";

type KineticsType = "first_order" | "michaelis_menten";

type RouteOfAdministration =
  | "oral"
  | "subq_injection"
  | "im_injection"
  | "intranasal"
  | "transdermal"
  | "topical";

// Safety categories map to SAFETY_UPPER_LIMITS keys in safety-limits.ts
// null = no UL (no safety check needed)
type SafetyCategoryKey =
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
  | "vitamin-a"
  | "semaglutide"
  | null;

const supplements = [
  // ============================================
  // MAGNESIUM FORMS (5)
  // Pharmacokinetic data from Examine.com & PubMed
  // Magnesium uses Michaelis-Menten kinetics due to saturable TRPM6/7 transporters
  // ============================================
  {
    name: "Magnesium Glycinate",
    form: "Magnesium Bisglycinate",
    elementalWeight: 14.1,
    defaultUnit: "mg" as const,
    aliases: [
      "mag glycinate",
      "magnesium bisgly",
      "mag bisgly",
      "calm magnesium",
    ],
    description:
      "Highly bioavailable magnesium form that promotes relaxation and quality sleep",
    mechanism:
      "Glycine chelation enhances absorption; glycine itself acts as inhibitory neurotransmitter",
    researchUrl: "https://examine.com/supplements/magnesium/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["sleep", "stress", "health"],
    safetyCategory: "magnesium" as SafetyCategoryKey,
    // PK: High bioavailability chelated form
    peakMinutes: 120,
    halfLifeMinutes: 720, // 12h - tissue distribution
    absorptionWindowMinutes: 240,
    bioavailabilityPercent: 25,
    // Michaelis-Menten kinetics (saturable TRPM6/7 transporters)
    kineticsType: "michaelis_menten" as KineticsType,
    vmax: 1.8, // mg/min - Maximum absorption velocity
    km: 150, // mg - Dose at which absorption is half-maximal
    absorptionSaturationDose: 200, // mg - Doses above this see diminishing returns
    rdaAmount: 420, // mg - RDA for adult males (320mg females)
  },
  {
    name: "Magnesium Citrate",
    form: "Magnesium Citrate",
    elementalWeight: 16.2,
    defaultUnit: "mg" as const,
    aliases: ["mag citrate", "natural calm"],
    description:
      "Well-absorbed magnesium form with mild laxative effect at higher doses",
    mechanism: "Citric acid enhances solubility and absorption in the gut",
    researchUrl: "https://examine.com/supplements/magnesium/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["stress", "health"],
    safetyCategory: "magnesium" as SafetyCategoryKey,
    // PK: Good bioavailability, faster absorption
    peakMinutes: 90,
    halfLifeMinutes: 720,
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 20,
    // Michaelis-Menten kinetics
    kineticsType: "michaelis_menten" as KineticsType,
    vmax: 1.8,
    km: 150,
    absorptionSaturationDose: 200,
    rdaAmount: 420,
  },
  {
    name: "Magnesium L-Threonate",
    form: "Magnesium L-Threonate",
    elementalWeight: 8.3,
    defaultUnit: "mg" as const,
    aliases: ["mag threonate", "magtein", "brain magnesium"],
    description:
      "Patented form specifically designed to cross the blood-brain barrier for cognitive support",
    mechanism:
      "L-threonate enhances magnesium transport across BBB, increasing brain magnesium levels",
    researchUrl: "https://examine.com/supplements/magnesium-l-threonate/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["focus", "sleep", "longevity"],
    safetyCategory: "magnesium" as SafetyCategoryKey,
    // PK: Designed for CNS penetration
    peakMinutes: 90,
    halfLifeMinutes: 480, // 8h - faster CNS clearance
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 15,
    // Michaelis-Menten kinetics
    kineticsType: "michaelis_menten" as KineticsType,
    vmax: 1.8,
    km: 150,
    absorptionSaturationDose: 200,
    rdaAmount: 420,
  },
  {
    name: "Magnesium Oxide",
    form: "Magnesium Oxide",
    elementalWeight: 60.3,
    defaultUnit: "mg" as const,
    aliases: ["mag oxide", "magox"],
    description:
      "High elemental magnesium content but lower bioavailability; best for correcting deficiency",
    mechanism:
      "Simple salt form with 60% elemental magnesium but ~4% absorption rate",
    researchUrl: "https://examine.com/supplements/magnesium/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: "magnesium" as SafetyCategoryKey,
    // PK: Poor bioavailability
    peakMinutes: 180,
    halfLifeMinutes: 720,
    absorptionWindowMinutes: 240,
    bioavailabilityPercent: 4,
    // Michaelis-Menten kinetics (even worse absorption at high doses)
    kineticsType: "michaelis_menten" as KineticsType,
    vmax: 0.8, // Lower Vmax due to poor solubility
    km: 150,
    absorptionSaturationDose: 150,
    rdaAmount: 420,
  },
  {
    name: "Magnesium Malate",
    form: "Magnesium Malate",
    elementalWeight: 15.5,
    defaultUnit: "mg" as const,
    aliases: ["mag malate", "malic acid magnesium"],
    description:
      "Magnesium bound to malic acid; may support energy production and reduce muscle fatigue",
    mechanism:
      "Malic acid participates in Krebs cycle; combination may enhance ATP production",
    researchUrl: "https://examine.com/supplements/magnesium/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["energy", "health"],
    safetyCategory: "magnesium" as SafetyCategoryKey,
    // PK: Good absorption, energy-focused
    peakMinutes: 120,
    halfLifeMinutes: 720,
    absorptionWindowMinutes: 240,
    bioavailabilityPercent: 18,
    // Michaelis-Menten kinetics
    kineticsType: "michaelis_menten" as KineticsType,
    vmax: 1.8,
    km: 150,
    absorptionSaturationDose: 200,
    rdaAmount: 420,
  },

  // ============================================
  // ZINC FORMS (2)
  // ============================================
  {
    name: "Zinc Picolinate",
    form: "Zinc Picolinate",
    elementalWeight: 21.0,
    defaultUnit: "mg" as const,
    aliases: ["zinc", "zn picolinate"],
    description:
      "Highly bioavailable zinc form essential for immune function and testosterone synthesis",
    mechanism:
      "Picolinic acid chelation enhances intestinal absorption via amino acid transporters",
    researchUrl: "https://examine.com/supplements/zinc/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health", "energy"],
    safetyCategory: "zinc" as SafetyCategoryKey,
    // PK: Superior absorption form
    peakMinutes: 150,
    halfLifeMinutes: 300, // 5h plasma half-life
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 60,
  },
  {
    name: "Zinc Gluconate",
    form: "Zinc Gluconate",
    elementalWeight: 14.3,
    defaultUnit: "mg" as const,
    aliases: ["zinc gluconate", "zn gluconate"],
    description: "Common zinc form found in lozenges; supports immune function",
    mechanism: "Gluconic acid chelation provides moderate bioavailability",
    researchUrl: "https://examine.com/supplements/zinc/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: "zinc" as SafetyCategoryKey,
    // PK: Moderate absorption
    peakMinutes: 180,
    halfLifeMinutes: 300,
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 40,
  },

  // ============================================
  // B-VITAMINS (6)
  // PK data from clinical studies
  // ============================================
  {
    name: "Vitamin B1",
    form: "Thiamine HCl",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["b1", "thiamine", "vit b1", "thiamin"],
    description:
      "Essential for carbohydrate metabolism and nervous system function",
    mechanism:
      "Cofactor for pyruvate dehydrogenase and alpha-ketoglutarate dehydrogenase in energy metabolism",
    researchUrl: "https://examine.com/supplements/vitamin-b1/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["energy", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Water-soluble, rapid absorption
    peakMinutes: 60,
    halfLifeMinutes: 60, // Short plasma t½
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 35,
  },
  {
    name: "Vitamin B2",
    form: "Riboflavin-5-Phosphate",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["b2", "riboflavin", "vit b2", "r5p"],
    description:
      "Active form of riboflavin; critical for FAD-dependent enzymes and energy production",
    mechanism:
      "Precursor to FAD and FMN cofactors required for electron transport chain",
    researchUrl: "https://examine.com/supplements/vitamin-b2/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["energy", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Active form, rapid utilization
    peakMinutes: 90,
    halfLifeMinutes: 66, // ~1.1h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 60,
  },
  {
    name: "Vitamin B3",
    form: "Niacinamide",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["b3", "niacin", "niacinamide", "vit b3", "nicotinamide"],
    description:
      "NAD+ precursor supporting cellular energy and DNA repair without flushing",
    mechanism:
      "Converts to NAD+ which is essential for sirtuins and PARP enzymes",
    researchUrl: "https://examine.com/supplements/vitamin-b3/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["energy", "longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid absorption, no flush form
    peakMinutes: 60,
    halfLifeMinutes: 45, // Short t½
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 85,
  },
  {
    name: "Vitamin B6",
    form: "Pyridoxal-5-Phosphate",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["b6", "p5p", "pyridoxine", "vit b6", "pyridoxal"],
    description:
      "Active form critical for neurotransmitter synthesis and amino acid metabolism",
    mechanism:
      "Cofactor for over 100 enzymes including those synthesizing dopamine and serotonin",
    researchUrl: "https://examine.com/supplements/vitamin-b6/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["focus", "stress", "health"],
    safetyCategory: "vitamin-b6" as SafetyCategoryKey,
    // PK: Active form, longer retention
    peakMinutes: 120,
    halfLifeMinutes: 1200, // ~20h tissue half-life
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 75,
  },
  {
    name: "Folate",
    form: "Methylfolate (5-MTHF)",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["b9", "folic acid", "methylfolate", "5-mthf", "vit b9"],
    description:
      "Bioactive folate form bypassing MTHFR gene variants; essential for methylation",
    mechanism:
      "Directly enters folate cycle as methyl donor for homocysteine conversion and DNA synthesis",
    researchUrl: "https://examine.com/supplements/folate/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Active form, immediate utilization
    peakMinutes: 90,
    halfLifeMinutes: 180, // 3h plasma
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 98,
  },
  {
    name: "Vitamin B12",
    form: "Methylcobalamin",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["b12", "methylcobalamin", "cobalamin", "vit b12"],
    description:
      "Active B12 form supporting methylation, energy, and neurological function",
    mechanism:
      "Cofactor for methionine synthase in methylation and mitochondrial function",
    researchUrl: "https://examine.com/supplements/vitamin-b12/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["energy", "focus", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Long tissue retention
    peakMinutes: 180,
    halfLifeMinutes: 8640, // ~6 days tissue t½
    absorptionWindowMinutes: 240,
    bioavailabilityPercent: 2, // Oral absorption is very low
  },

  // ============================================
  // OTHER VITAMINS (4)
  // PK data from Examine.com & clinical studies
  // ============================================
  {
    name: "Vitamin D3",
    form: "Cholecalciferol",
    elementalWeight: 100,
    defaultUnit: "IU" as const,
    aliases: [
      "d3",
      "vit d",
      "vitamin d",
      "sunshine vitamin",
      "cholecalciferol",
    ],
    description:
      "Secosteroid hormone regulating calcium, immune function, and gene expression",
    mechanism:
      "Converts to calcitriol which binds VDR receptors affecting 1000+ genes",
    researchUrl: "https://examine.com/supplements/vitamin-d/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["health", "longevity", "energy"],
    safetyCategory: "vitamin-d3" as SafetyCategoryKey,
    // PK: Fat-soluble, very long half-life
    peakMinutes: 720, // 12h to peak
    halfLifeMinutes: 20160, // 14 days tissue t½
    absorptionWindowMinutes: 1440, // 24h absorption window
    bioavailabilityPercent: 80,
  },
  {
    name: "Vitamin K2 MK-7",
    form: "Menaquinone-7",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["k2", "mk7", "mk-7", "vitamin k", "vit k2", "menaquinone"],
    description:
      "Long-acting K2 form that directs calcium to bones and away from arteries",
    mechanism:
      "Activates osteocalcin and matrix GLA protein for calcium trafficking",
    researchUrl: "https://examine.com/supplements/vitamin-k/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: MK-7 has longest half-life of K2 forms
    peakMinutes: 360, // 6h
    halfLifeMinutes: 4320, // 3 days
    absorptionWindowMinutes: 480,
    bioavailabilityPercent: 70,
  },
  {
    name: "Vitamin C",
    form: "Ascorbic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["vit c", "ascorbic acid", "c"],
    description:
      "Potent antioxidant essential for collagen synthesis and immune function",
    mechanism:
      "Electron donor for enzymatic reactions; regenerates vitamin E and glutathione",
    researchUrl: "https://examine.com/supplements/vitamin-c/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: "vitamin-c" as SafetyCategoryKey,
    // PK: Water-soluble, dose-dependent absorption via SVCT1/2 transporters
    peakMinutes: 120,
    halfLifeMinutes: 180, // 3h plasma
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 70, // Decreases at higher doses
    // Michaelis-Menten kinetics (saturable SVCT1 intestinal transporter)
    // CRITICAL: Absorption efficiency drops dramatically above 200mg single dose
    // 200mg: ~90% absorbed, 500mg: ~60%, 1000mg: ~50%, 2000mg: ~33%
    kineticsType: "michaelis_menten" as KineticsType,
    vmax: 2.5, // mg/min - Maximum absorption velocity
    km: 200, // mg - Dose at which absorption is half-maximal
    absorptionSaturationDose: 180, // mg - Single doses above this see diminishing returns
    rdaAmount: 90, // mg - RDA (75mg females, 90mg males)
  },
  {
    name: "Vitamin E",
    form: "Mixed Tocopherols",
    elementalWeight: 100,
    defaultUnit: "IU" as const,
    aliases: ["vit e", "tocopherol", "e"],
    description:
      "Fat-soluble antioxidant protecting cell membranes from oxidative damage",
    mechanism:
      "Chain-breaking antioxidant that neutralizes lipid peroxyl radicals",
    researchUrl: "https://examine.com/supplements/vitamin-e/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: "vitamin-e" as SafetyCategoryKey,
    // PK: Fat-soluble, slow absorption
    peakMinutes: 480, // 8h
    halfLifeMinutes: 2880, // 48h
    absorptionWindowMinutes: 480,
    bioavailabilityPercent: 40,
  },

  // ============================================
  // MINERALS (8)
  // PK data from clinical pharmacology literature
  // ============================================
  {
    name: "Iron Bisglycinate",
    form: "Ferrous Bisglycinate",
    elementalWeight: 27.4,
    defaultUnit: "mg" as const,
    aliases: ["iron", "ferrous", "fe", "gentle iron"],
    description:
      "Chelated iron form with superior absorption and minimal GI side effects",
    mechanism:
      "Glycine chelation allows absorption via amino acid transporters, bypassing hepcidin regulation",
    researchUrl: "https://examine.com/supplements/iron/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["energy", "health"],
    safetyCategory: "iron" as SafetyCategoryKey,
    // PK: Well-absorbed chelate, but still subject to DMT1 saturation
    peakMinutes: 120,
    halfLifeMinutes: 360, // 6h plasma
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 20,
    // Michaelis-Menten kinetics (saturable DMT1 transporter)
    // Iron absorption is highly regulated by hepcidin and DMT1 expression
    // Absorption efficiency: 10-25mg optimal, >45mg sees significant decrease
    kineticsType: "michaelis_menten" as KineticsType,
    vmax: 0.8, // mg/min - Iron has relatively low Vmax due to tight regulation
    km: 30, // mg - Relatively low Km reflects tight control of iron absorption
    absorptionSaturationDose: 45, // mg - Doses above 45mg have poor marginal absorption
    rdaAmount: 18, // mg - RDA (8mg males, 18mg females)
  },
  {
    name: "Copper Bisglycinate",
    form: "Copper Bisglycinate",
    elementalWeight: 30.0,
    defaultUnit: "mg" as const,
    aliases: ["copper", "cu"],
    description:
      "Essential trace mineral for iron metabolism, connective tissue, and antioxidant enzymes",
    mechanism:
      "Cofactor for ceruloplasmin, cytochrome c oxidase, and superoxide dismutase",
    researchUrl: "https://examine.com/supplements/copper/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: "copper" as SafetyCategoryKey,
    // PK: Rapid tissue distribution
    peakMinutes: 120,
    halfLifeMinutes: 1440, // 24h
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 50,
  },
  {
    name: "Selenium",
    form: "Selenomethionine",
    elementalWeight: 40.3,
    defaultUnit: "mcg" as const,
    aliases: ["se", "selenomethionine"],
    description:
      "Essential for thyroid function and glutathione peroxidase antioxidant system",
    mechanism:
      "Incorporated into selenoproteins including glutathione peroxidases and deiodinases",
    researchUrl: "https://examine.com/supplements/selenium/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: "selenium" as SafetyCategoryKey,
    // PK: Organic form, good retention
    peakMinutes: 480,
    halfLifeMinutes: 7200, // 5 days tissue
    absorptionWindowMinutes: 360,
    bioavailabilityPercent: 90,
  },
  {
    name: "Calcium",
    form: "Calcium Citrate",
    elementalWeight: 24.1,
    defaultUnit: "mg" as const,
    aliases: ["ca", "calcium citrate", "cal"],
    description:
      "Essential mineral for bone health, muscle contraction, and nerve signaling",
    mechanism:
      "Structural component of hydroxyapatite in bones; second messenger in cell signaling",
    researchUrl: "https://examine.com/supplements/calcium/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: "calcium" as SafetyCategoryKey,
    // PK: Better absorbed than carbonate
    peakMinutes: 240,
    halfLifeMinutes: 480, // 8h plasma
    absorptionWindowMinutes: 240,
    bioavailabilityPercent: 25,
  },
  {
    name: "Potassium",
    form: "Potassium Citrate",
    elementalWeight: 38.3,
    defaultUnit: "mg" as const,
    aliases: ["k", "potassium citrate"],
    description:
      "Critical electrolyte for blood pressure regulation and muscle/nerve function",
    mechanism: "Maintains cell membrane potential via Na+/K+-ATPase pump",
    researchUrl: "https://examine.com/supplements/potassium/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid electrolyte dynamics
    peakMinutes: 60,
    halfLifeMinutes: 120, // 2h
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 85,
  },
  {
    name: "Boron",
    form: "Boron Glycinate",
    elementalWeight: 4.6,
    defaultUnit: "mg" as const,
    aliases: ["boron glycinate"],
    description:
      "Trace mineral supporting bone health, testosterone, and cognitive function",
    mechanism:
      "Influences steroid hormone metabolism and calcium/magnesium utilization",
    researchUrl: "https://examine.com/supplements/boron/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Limited data, estimated
    peakMinutes: 120,
    halfLifeMinutes: 1320, // ~22h
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 85,
  },
  {
    name: "Iodine",
    form: "Potassium Iodide",
    elementalWeight: 76.5,
    defaultUnit: "mcg" as const,
    aliases: ["iodide", "potassium iodide", "ki"],
    description:
      "Essential for thyroid hormone synthesis regulating metabolism",
    mechanism:
      "Incorporated into T3 and T4 thyroid hormones via thyroid peroxidase",
    researchUrl: "https://examine.com/supplements/iodine/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid thyroid uptake
    peakMinutes: 120,
    halfLifeMinutes: 480, // 8h plasma
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 95,
  },
  {
    name: "Chromium",
    form: "Chromium Picolinate",
    elementalWeight: 12.4,
    defaultUnit: "mcg" as const,
    aliases: ["chromium picolinate", "cr"],
    description:
      "Trace mineral that may enhance insulin sensitivity and glucose metabolism",
    mechanism: "Potentiates insulin signaling via chromodulin oligopeptide",
    researchUrl: "https://examine.com/supplements/chromium/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Picolinate form enhances absorption
    peakMinutes: 120,
    halfLifeMinutes: 2400, // ~40h
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 2.5, // Very low
  },

  // ============================================
  // OMEGA-3 (2)
  // PK from clinical studies
  // ============================================
  {
    name: "Fish Oil (EPA)",
    form: "Eicosapentaenoic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["epa", "omega 3", "omega-3", "fish oil", "omega3"],
    description:
      "Anti-inflammatory omega-3 supporting cardiovascular and mental health",
    mechanism:
      "Competes with arachidonic acid; precursor to anti-inflammatory resolvins",
    researchUrl: "https://examine.com/supplements/fish-oil/",
    category: "omega" as SupplementCategory,
    commonGoals: ["health", "longevity", "stress"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Fat-soluble, slow incorporation
    peakMinutes: 300, // 5h
    halfLifeMinutes: 2880, // 48h plasma
    absorptionWindowMinutes: 360,
    bioavailabilityPercent: 25,
  },
  {
    name: "Fish Oil (DHA)",
    form: "Docosahexaenoic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["dha", "omega 3", "omega-3", "fish oil", "omega3", "brain omega"],
    description:
      "Structural omega-3 essential for brain development and neuronal membrane fluidity",
    mechanism:
      "Major component of neuronal membranes; precursor to neuroprotectin D1",
    researchUrl: "https://examine.com/supplements/fish-oil/",
    category: "omega" as SupplementCategory,
    commonGoals: ["focus", "health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Slower incorporation into tissues
    peakMinutes: 360, // 6h
    halfLifeMinutes: 2880, // 48h
    absorptionWindowMinutes: 360,
    bioavailabilityPercent: 25,
  },

  // ============================================
  // AMINO ACIDS (6)
  // PK from pharmacological literature
  // ============================================
  {
    name: "L-Tyrosine",
    form: "L-Tyrosine",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["tyrosine", "l tyrosine"],
    description:
      "Dopamine and norepinephrine precursor enhancing focus under stress",
    mechanism:
      "Rate-limited conversion to L-DOPA then dopamine via tyrosine hydroxylase",
    researchUrl: "https://examine.com/supplements/l-tyrosine/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["focus", "stress", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid absorption, competes at BBB
    peakMinutes: 120,
    halfLifeMinutes: 180, // 3h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 90,
  },
  {
    name: "L-Theanine",
    form: "L-Theanine",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["theanine", "l theanine", "suntheanine"],
    description:
      "Calming amino acid from tea that promotes alpha brain waves without sedation",
    mechanism:
      "Crosses BBB; increases GABA, serotonin, dopamine; promotes alpha wave activity",
    researchUrl: "https://examine.com/supplements/theanine/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["focus", "sleep", "stress"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid BBB penetration
    peakMinutes: 60,
    halfLifeMinutes: 180, // 3h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 90,
  },
  {
    name: "5-HTP",
    form: "5-Hydroxytryptophan",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["5htp", "hydroxytryptophan", "serotonin precursor"],
    description:
      "Direct serotonin precursor supporting mood and sleep; use with caution",
    mechanism:
      "Bypasses rate-limiting tryptophan hydroxylase; converts directly to serotonin",
    researchUrl: "https://examine.com/supplements/5-htp/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["sleep", "stress"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid serotonin conversion
    peakMinutes: 90,
    halfLifeMinutes: 300, // 5h
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 70,
  },
  {
    name: "GABA",
    form: "Gamma-Aminobutyric Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["gamma-aminobutyric acid", "pharmagaba"],
    description:
      "Primary inhibitory neurotransmitter; oral form may reduce anxiety via gut-brain axis",
    mechanism:
      "Limited BBB penetration; likely acts via enteric nervous system and vagus nerve",
    researchUrl: "https://examine.com/supplements/gaba/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["sleep", "stress"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Poor BBB penetration
    peakMinutes: 60,
    halfLifeMinutes: 30, // Very short
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 5,
  },
  {
    name: "Glycine",
    form: "Glycine",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["gly"],
    description:
      "Inhibitory amino acid improving sleep quality and collagen synthesis",
    mechanism:
      "NMDA receptor co-agonist; lowers core body temperature promoting sleep onset",
    researchUrl: "https://examine.com/supplements/glycine/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["sleep", "health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid absorption
    peakMinutes: 30,
    halfLifeMinutes: 45, // ~45min
    absorptionWindowMinutes: 30,
    bioavailabilityPercent: 95,
  },
  {
    name: "Taurine",
    form: "Taurine",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["tau"],
    description:
      "Conditionally essential amino acid supporting cardiovascular and neurological function",
    mechanism:
      "Osmoregulator and membrane stabilizer; modulates calcium signaling and bile acid conjugation",
    researchUrl: "https://examine.com/supplements/taurine/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["health", "longevity", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Good absorption, long tissue retention
    peakMinutes: 90,
    halfLifeMinutes: 60, // 1h plasma
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 90,
  },

  // ============================================
  // ANTIOXIDANTS (5)
  // PK from clinical pharmacology literature
  // ============================================
  {
    name: "CoQ10",
    form: "Ubiquinol",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["coenzyme q10", "ubiquinol", "ubiquinone", "coq"],
    description:
      "Mitochondrial electron carrier essential for ATP production; declines with age",
    mechanism:
      "Shuttles electrons in Complex I-III of electron transport chain; potent lipid antioxidant",
    researchUrl: "https://examine.com/supplements/coq10/",
    category: "antioxidant" as SupplementCategory,
    commonGoals: ["energy", "longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Fat-soluble, slow absorption
    peakMinutes: 360, // 6h
    halfLifeMinutes: 2040, // 34h
    absorptionWindowMinutes: 480,
    bioavailabilityPercent: 8, // Ubiquinone; ubiquinol is higher
  },
  {
    name: "Alpha Lipoic Acid",
    form: "R-Alpha Lipoic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["ala", "r-ala", "r-lipoic acid", "lipoic acid"],
    description:
      "Universal antioxidant that regenerates other antioxidants and supports glucose metabolism",
    mechanism:
      "Cofactor for mitochondrial enzymes; regenerates vitamins C, E, and glutathione",
    researchUrl: "https://examine.com/supplements/alpha-lipoic-acid/",
    category: "antioxidant" as SupplementCategory,
    commonGoals: ["longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid absorption, short half-life
    peakMinutes: 60,
    halfLifeMinutes: 30, // Very short t½
    absorptionWindowMinutes: 45,
    bioavailabilityPercent: 30,
  },
  {
    name: "NAC",
    form: "N-Acetyl Cysteine",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["n-acetyl cysteine", "n-acetylcysteine", "cysteine"],
    description:
      "Glutathione precursor supporting detoxification, liver health, and mucolytic action",
    mechanism:
      "Rate-limiting cysteine donor for glutathione synthesis; direct antioxidant",
    researchUrl: "https://examine.com/supplements/n-acetylcysteine/",
    category: "antioxidant" as SupplementCategory,
    commonGoals: ["longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Good absorption, moderate half-life
    peakMinutes: 60,
    halfLifeMinutes: 330, // 5.5h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 10,
  },
  {
    name: "Quercetin",
    form: "Quercetin Dihydrate",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["quercetin dihydrate"],
    description:
      "Plant flavonoid with senolytic and anti-inflammatory properties",
    mechanism:
      "Inhibits senescent cell survival pathways; modulates NF-kB and mast cell degranulation",
    researchUrl: "https://examine.com/supplements/quercetin/",
    category: "antioxidant" as SupplementCategory,
    commonGoals: ["longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Poor bioavailability
    peakMinutes: 420, // 7h
    halfLifeMinutes: 660, // 11h
    absorptionWindowMinutes: 360,
    bioavailabilityPercent: 2,
  },
  {
    name: "Glutathione",
    form: "Reduced Glutathione",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["gsh", "reduced glutathione", "liposomal glutathione"],
    description:
      "Master antioxidant and detoxifier; liposomal form improves oral bioavailability",
    mechanism:
      "Tripeptide that neutralizes ROS, conjugates toxins, and recycles other antioxidants",
    researchUrl: "https://examine.com/supplements/glutathione/",
    category: "antioxidant" as SupplementCategory,
    commonGoals: ["longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Poor oral bioavailability (unless liposomal)
    peakMinutes: 90,
    halfLifeMinutes: 90, // 1.5h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 3, // Standard oral; liposomal ~15%
  },

  // ============================================
  // NOOTROPICS & ADAPTOGENS (6)
  // ============================================
  {
    name: "Caffeine",
    form: "Caffeine Anhydrous",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["coffee", "caff"],
    description:
      "Adenosine antagonist that enhances alertness, focus, and physical performance",
    mechanism:
      "Blocks A1 and A2A adenosine receptors; increases dopamine and norepinephrine",
    researchUrl: "https://examine.com/supplements/caffeine/",
    category: "nootropic" as SupplementCategory,
    commonGoals: ["focus", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Well-characterized, rapid oral absorption
    peakMinutes: 45, // 30-60min Tmax
    halfLifeMinutes: 300, // 5h average (3-7h range)
    absorptionWindowMinutes: 45,
    bioavailabilityPercent: 99,
  },
  {
    name: "Ashwagandha",
    form: "KSM-66 Extract",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["ash", "ksm-66", "ksm66", "withania", "ashwa"],
    description:
      "Premier adaptogen reducing cortisol, anxiety, and supporting testosterone",
    mechanism:
      "Modulates HPA axis; withanolides mimic GABA and influence thyroid hormones",
    researchUrl: "https://examine.com/supplements/ashwagandha/",
    category: "adaptogen" as SupplementCategory,
    commonGoals: ["stress", "sleep", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Withanolides have moderate absorption
    peakMinutes: 180, // 2-3h for withanolides
    halfLifeMinutes: 720, // ~12h for active withanolides
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 35,
  },
  {
    name: "Lion's Mane",
    form: "Hericium erinaceus Extract",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["lions mane", "hericium", "yamabushitake"],
    description:
      "Medicinal mushroom promoting nerve growth factor and cognitive function",
    mechanism:
      "Hericenones and erinacines stimulate NGF synthesis; supports neuroplasticity",
    researchUrl: "https://examine.com/supplements/lions-mane/",
    category: "adaptogen" as SupplementCategory,
    commonGoals: ["focus", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Fungal polysaccharides, slow effect onset
    peakMinutes: 120, // 2h for beta-glucans
    halfLifeMinutes: 480, // ~8h estimated
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 20,
  },
  {
    name: "Rhodiola Rosea",
    form: "Rhodiola Extract (3% Rosavins)",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["rhodiola", "golden root", "arctic root"],
    description:
      "Adaptogen enhancing stress resilience, endurance, and mental performance",
    mechanism:
      "Modulates cortisol and activates AMPK; influences serotonin and dopamine",
    researchUrl: "https://examine.com/supplements/rhodiola-rosea/",
    category: "adaptogen" as SupplementCategory,
    commonGoals: ["stress", "energy", "focus"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rosavins and salidroside absorption
    peakMinutes: 60, // ~1h for salidroside
    halfLifeMinutes: 240, // ~4h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 30,
  },
  {
    name: "Bacopa Monnieri",
    form: "Bacopa Extract (50% Bacosides)",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["bacopa", "brahmi", "water hyssop"],
    description:
      "Ayurvedic herb enhancing memory formation and reducing anxiety over time",
    mechanism:
      "Bacosides enhance synaptic communication and upregulate serotonin/dopamine",
    researchUrl: "https://examine.com/supplements/bacopa-monnieri/",
    category: "adaptogen" as SupplementCategory,
    commonGoals: ["focus", "stress"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Bacosides A and B kinetics
    peakMinutes: 120, // 1-3h
    halfLifeMinutes: 360, // ~6h
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 15,
  },
  {
    name: "Berberine",
    form: "Berberine HCl",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["berberine hcl"],
    description:
      "Plant alkaloid rivaling metformin for blood sugar control and AMPK activation",
    mechanism:
      "Activates AMPK; inhibits Complex I; modulates gut microbiome composition",
    researchUrl: "https://examine.com/supplements/berberine/",
    category: "other" as SupplementCategory,
    commonGoals: ["longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Poor bioavailability, gut-first-pass
    peakMinutes: 240, // 4h
    halfLifeMinutes: 300, // ~5h plasma
    absorptionWindowMinutes: 240,
    bioavailabilityPercent: 5, // Very low oral bioavailability
  },

  // ============================================
  // OTHER SUPPLEMENTS (6)
  // ============================================
  {
    name: "Curcumin",
    form: "Curcuminoids",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["turmeric", "curcuminoids"],
    description:
      "Potent anti-inflammatory from turmeric; requires piperine for absorption",
    mechanism: "Inhibits NF-kB, COX-2, and multiple inflammatory pathways",
    researchUrl: "https://examine.com/supplements/curcumin/",
    category: "other" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Very poor bioavailability without enhancers
    peakMinutes: 120, // 1-2h
    halfLifeMinutes: 420, // ~7h
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 1, // Extremely low; piperine increases 20x
  },
  {
    name: "Piperine",
    form: "Black Pepper Extract",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["black pepper", "bioperine"],
    description:
      "Bioavailability enhancer that inhibits drug metabolism enzymes",
    mechanism:
      "Inhibits CYP3A4 and P-glycoprotein; increases absorption of many compounds by 2000%",
    researchUrl: "https://examine.com/supplements/black-pepper/",
    category: "other" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid absorption, enzyme inhibition lasts hours
    peakMinutes: 60, // ~1h
    halfLifeMinutes: 360, // 6h (enzyme inhibition duration)
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 90,
  },
  {
    name: "Creatine Monohydrate",
    form: "Creatine Monohydrate",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["creatine", "creapure"],
    description:
      "Most researched ergogenic aid; enhances strength, power, and cognitive function",
    mechanism:
      "Regenerates ATP via phosphocreatine system; buffers cellular energy demands",
    researchUrl: "https://examine.com/supplements/creatine/",
    category: "other" as SupplementCategory,
    commonGoals: ["energy", "focus", "health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Tissue saturation model, not acute plasma kinetics
    peakMinutes: 90, // Plasma peak ~1.5h
    halfLifeMinutes: 180, // 3h plasma (but tissue retention is weeks)
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 99,
  },
  {
    name: "Collagen",
    form: "Hydrolyzed Collagen Peptides",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["collagen peptides", "hydrolyzed collagen", "collagen powder"],
    description:
      "Structural protein supporting skin elasticity, joint health, and gut integrity",
    mechanism:
      "Peptides stimulate fibroblast collagen synthesis; provides glycine and proline",
    researchUrl: "https://examine.com/supplements/collagen/",
    category: "other" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Peptide absorption, tissue incorporation
    peakMinutes: 60, // Dipeptides peak ~1h
    halfLifeMinutes: 240, // ~4h for collagen dipeptides
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 90,
  },
  {
    name: "Biotin",
    form: "D-Biotin",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["vitamin b7", "b7", "vit b7"],
    description:
      "B-vitamin essential for fatty acid synthesis, gluconeogenesis, and hair/nail health",
    mechanism:
      "Cofactor for carboxylase enzymes in lipid and carbohydrate metabolism",
    researchUrl: "https://examine.com/supplements/biotin/",
    category: "vitamin" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Water-soluble B-vitamin
    peakMinutes: 90, // ~1.5h
    halfLifeMinutes: 120, // ~2h plasma
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 100, // Nearly complete absorption
  },
  {
    name: "Melatonin",
    form: "Melatonin",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["mel", "sleep hormone"],
    description:
      "Sleep-regulating hormone that resets circadian rhythm; potent antioxidant",
    mechanism:
      "Binds MT1/MT2 receptors in SCN; lowers core body temperature; scavenges free radicals",
    researchUrl: "https://examine.com/supplements/melatonin/",
    category: "other" as SupplementCategory,
    commonGoals: ["sleep"],
    safetyCategory: null as SafetyCategoryKey,
    // PK: Rapid absorption, short half-life
    peakMinutes: 50, // 20-90min depending on formulation
    halfLifeMinutes: 45, // 35-50min
    absorptionWindowMinutes: 30,
    bioavailabilityPercent: 15, // Low due to first-pass metabolism
  },

  // ============================================
  // PEPTIDES & RESEARCH COMPOUNDS (6)
  // ============================================
  {
    name: "BPC-157",
    form: "Acetate",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["bpc", "bpc157", "body protection compound"],
    description:
      "Gastric pentadecapeptide promoting systemic tissue repair and healing",
    mechanism:
      "Upregulates growth hormone receptors, promotes angiogenesis, and modulates nitric oxide system",
    researchUrl: "https://examine.com/supplements/bpc-157/",
    category: "peptide" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "subq_injection" as RouteOfAdministration,
    storageInstructions:
      "Keep refrigerated (2-8°C). Reconstituted peptide stable for 30 days.",
    // PK: SubQ peptide kinetics
    peakMinutes: 30, // Rapid subQ absorption
    halfLifeMinutes: 240, // ~4h estimated
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 90, // SubQ injection
  },
  {
    name: "TB-500",
    form: null,
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["tb500", "tb 500", "thymosin beta-4", "thymosin"],
    description:
      "Synthetic thymosin beta-4 fragment promoting tissue repair and reducing inflammation",
    mechanism:
      "Regulates actin polymerization, promotes cell migration, and reduces inflammatory cytokines",
    researchUrl: null,
    category: "peptide" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "subq_injection" as RouteOfAdministration,
    storageInstructions:
      "Keep refrigerated (2-8°C). Reconstituted peptide stable for 30 days.",
    // PK: Larger peptide, slower distribution
    peakMinutes: 60, // ~1h subQ
    halfLifeMinutes: 480, // ~8h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 85,
  },
  {
    name: "Semaglutide",
    form: null,
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["sema", "ozempic", "wegovy"],
    description:
      "FDA-approved GLP-1 receptor agonist for weight management and glycemic control",
    mechanism:
      "Mimics GLP-1 hormone, enhancing insulin secretion, reducing appetite, and slowing gastric emptying",
    researchUrl: "https://examine.com/supplements/semaglutide/",
    category: "peptide" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: "semaglutide" as SafetyCategoryKey,
    isResearchChemical: false, // FDA approved
    route: "subq_injection" as RouteOfAdministration,
    storageInstructions:
      "Keep refrigerated (2-8°C). Protect from light. Do not freeze.",
    // PK: Engineered for long half-life (weekly dosing)
    peakMinutes: 1440, // 1-3 days to Cmax
    halfLifeMinutes: 10080, // ~7 days (168h)
    absorptionWindowMinutes: 2880, // Slow subQ release
    bioavailabilityPercent: 89,
  },
  {
    name: "GHK-Cu",
    form: null,
    elementalWeight: 100,
    defaultUnit: "ml" as const,
    aliases: ["ghk", "ghk copper", "copper peptide"],
    description:
      "Copper-binding tripeptide promoting skin remodeling and wound healing",
    mechanism:
      "Stimulates collagen and glycosaminoglycan synthesis, recruits immune cells to injury sites",
    researchUrl: null,
    category: "peptide" as SupplementCategory,
    commonGoals: ["health", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "topical" as RouteOfAdministration,
    storageInstructions:
      "Keep refrigerated (2-8°C). Topical solutions stable for 60 days.",
    // PK: Topical - local tissue retention
    peakMinutes: 60, // Local dermal peak
    halfLifeMinutes: 180, // ~3h in skin tissue
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 10, // Local topical delivery
  },
  {
    name: "Ipamorelin",
    form: null,
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["ipam", "ipa"],
    description:
      "Selective growth hormone secretagogue with minimal impact on cortisol or prolactin",
    mechanism:
      "Binds ghrelin receptors in pituitary, triggering pulsatile GH release without appetite stimulation",
    researchUrl: null,
    category: "peptide" as SupplementCategory,
    commonGoals: ["longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "subq_injection" as RouteOfAdministration,
    storageInstructions:
      "Keep refrigerated (2-8°C). Administer fasted for optimal GH response.",
    // PK: Short-acting GHRP
    peakMinutes: 30, // Rapid GH pulse
    halfLifeMinutes: 120, // ~2h
    absorptionWindowMinutes: 30,
    bioavailabilityPercent: 95,
  },
  {
    name: "CJC-1295",
    form: "No DAC",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["cjc", "cjc1295", "mod grf", "mod grf 1-29"],
    description:
      "Growth hormone releasing hormone analog; pairs with Ipamorelin for synergistic GH release",
    mechanism:
      "Stimulates GHRH receptors, amplifying natural GH pulses without desensitization",
    researchUrl: null,
    category: "peptide" as SupplementCategory,
    commonGoals: ["longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "subq_injection" as RouteOfAdministration,
    storageInstructions:
      "Keep refrigerated (2-8°C). Administer fasted, typically with Ipamorelin.",
    // PK: No DAC = shorter duration than DAC version
    peakMinutes: 30, // Rapid onset
    halfLifeMinutes: 30, // ~30min (No DAC version)
    absorptionWindowMinutes: 30,
    bioavailabilityPercent: 95,
  },

  // ============================================
  // RUSSIAN NOOTROPICS (5)
  // ============================================
  {
    name: "Semax",
    form: "0.1% Drops",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["semax nasal", "n-acetyl semax"],
    description:
      "Heptapeptide analog of ACTH (4-10). Cognitive enhancer and neuroprotectant developed in Russia",
    mechanism:
      "Modulates BDNF and NGF expression in hippocampus; enhances attention and memory formation",
    researchUrl: null,
    category: "peptide" as SupplementCategory,
    commonGoals: ["focus", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "intranasal" as RouteOfAdministration,
    storageInstructions:
      "Keep refrigerated (2-8°C). Fragile peptide - handle with care.",
    // PK: Intranasal peptide - rapid CNS entry
    peakMinutes: 10, // Rapid nasal absorption
    halfLifeMinutes: 180, // ~3h
    absorptionWindowMinutes: 15,
    bioavailabilityPercent: 60, // Intranasal bypasses first-pass
  },
  {
    name: "Selank",
    form: "0.15% Drops",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["selank nasal", "tp-7"],
    description:
      "Synthetic analog of tuftsin with anxiolytic and nootropic properties. Russian pharma",
    mechanism:
      "Modulates GABA, dopamine, and serotonin metabolism; increases BDNF expression",
    researchUrl: null,
    category: "peptide" as SupplementCategory,
    commonGoals: ["stress", "focus"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "intranasal" as RouteOfAdministration,
    storageInstructions:
      "Keep refrigerated (2-8°C). Use within 30 days of opening.",
    // PK: Intranasal anxiolytic peptide
    peakMinutes: 15, // Rapid nasal absorption
    halfLifeMinutes: 60, // ~1h (short-acting)
    absorptionWindowMinutes: 15,
    bioavailabilityPercent: 65,
  },
  {
    name: "Noopept",
    form: "Powder",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["noopept powder", "omberacetam", "gvs-111"],
    description:
      "Potent peptide-derived nootropic (N-phenylacetyl-L-prolylglycine ethyl ester). 1000x more potent than piracetam by weight",
    mechanism:
      "Cycloprolylglycine prodrug; enhances AMPA and NMDA receptor signaling; increases NGF and BDNF",
    researchUrl: "https://examine.com/supplements/noopept/",
    category: "nootropic" as SupplementCategory,
    commonGoals: ["focus", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "oral" as RouteOfAdministration,
    storageInstructions:
      "Store in cool, dry place. Sublingual administration common for faster onset.",
    // PK: Rapid oral/sublingual absorption
    peakMinutes: 20, // 15-20min (sublingual faster)
    halfLifeMinutes: 60, // ~1h (but metabolite cycloprolylglycine longer)
    absorptionWindowMinutes: 30,
    bioavailabilityPercent: 10, // Low oral, sublingual ~40%
  },
  {
    name: "Bromantane",
    form: "Powder",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["ladasten", "bromantan"],
    description:
      "Atypical psychostimulant and anxiolytic. Developed for Soviet military as actoprotector",
    mechanism:
      "Upregulates tyrosine hydroxylase and aromatic L-amino acid decarboxylase, increasing dopamine synthesis capacity",
    researchUrl: null,
    category: "nootropic" as SupplementCategory,
    commonGoals: ["focus", "energy", "stress"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "oral" as RouteOfAdministration,
    storageInstructions:
      "Store away from light and moisture. Sublingual option available.",
    // PK: Lipophilic actoprotector
    peakMinutes: 180, // 2-4h (slow due to lipophilicity)
    halfLifeMinutes: 690, // ~11.5h
    absorptionWindowMinutes: 240,
    bioavailabilityPercent: 40,
  },
  {
    name: "Phenylpiracetam",
    form: "Powder",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["phenotropil", "carphedon", "fonturacetam"],
    description:
      "Phenylated piracetam derivative with stimulant properties. Banned by WADA for performance enhancement",
    mechanism:
      "Modulates AMPA receptors; increases dopamine and norepinephrine; enhances cold tolerance",
    researchUrl: "https://examine.com/supplements/phenylpiracetam/",
    category: "nootropic" as SupplementCategory,
    commonGoals: ["focus", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    isResearchChemical: true,
    route: "oral" as RouteOfAdministration,
    storageInstructions:
      "Store in cool, dry place. Tolerance builds rapidly - cycle 2-3 days on, 2-3 days off.",
    // PK: Racetam with stimulant kinetics
    peakMinutes: 60, // ~1h
    halfLifeMinutes: 210, // 3-5h
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 100, // Well-absorbed racetam
  },

  // ============================================
  // ADDITIONAL SUPPLEMENTS FOR STACK TEMPLATES
  // ============================================
  {
    name: "Apigenin",
    form: "Apigenin",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["chamomile extract", "apigenin extract"],
    description:
      "Flavonoid from chamomile with anxiolytic and sleep-promoting properties",
    mechanism:
      "Binds GABA-A receptors as positive allosteric modulator; inhibits CD38 preserving NAD+",
    researchUrl: "https://examine.com/supplements/apigenin/",
    category: "other" as SupplementCategory,
    commonGoals: ["sleep", "stress", "longevity"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 60,
    halfLifeMinutes: 720, // ~12h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 30,
  },
  {
    name: "Alpha-GPC",
    form: "L-Alpha Glycerylphosphorylcholine",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["alpha gpc", "choline alfoscerate", "agpc"],
    description:
      "Highly bioavailable choline source supporting acetylcholine synthesis and cognitive function",
    mechanism:
      "Crosses BBB efficiently; provides choline for acetylcholine and phosphatidylcholine synthesis",
    researchUrl: "https://examine.com/supplements/alpha-gpc/",
    category: "nootropic" as SupplementCategory,
    commonGoals: ["focus", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 60,
    halfLifeMinutes: 240, // ~4h
    absorptionWindowMinutes: 90,
    bioavailabilityPercent: 90,
  },
  {
    name: "NMN",
    form: "Nicotinamide Mononucleotide",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["nmn", "nicotinamide mononucleotide"],
    description:
      "Direct NAD+ precursor supporting cellular energy and longevity pathways",
    mechanism:
      "Converted to NAD+ via NMNAT enzymes; supports sirtuins and PARP activity",
    researchUrl: "https://examine.com/supplements/nmn/",
    category: "other" as SupplementCategory,
    commonGoals: ["longevity", "energy"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 60,
    halfLifeMinutes: 180, // ~3h plasma
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 30, // Sublingual higher
  },
  {
    name: "Resveratrol",
    form: "Trans-Resveratrol",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["trans-resveratrol", "grape extract"],
    description:
      "Polyphenol activating sirtuins and providing cardiovascular protection",
    mechanism:
      "SIRT1 activator; enhances mitochondrial biogenesis via PGC-1α pathway",
    researchUrl: "https://examine.com/supplements/resveratrol/",
    category: "antioxidant" as SupplementCategory,
    commonGoals: ["longevity", "health"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 90,
    halfLifeMinutes: 60, // Very short t½, rapid metabolism
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 1, // Very low; take with fat
  },
  {
    name: "Omega-3 Fish Oil",
    form: "EPA/DHA Concentrate",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["omega-3", "omega 3", "fish oil", "epa dha", "epa/dha"],
    description:
      "Combined EPA and DHA omega-3 fatty acids for cardiovascular and brain health",
    mechanism:
      "EPA reduces inflammation via resolvins; DHA supports neuronal membrane fluidity",
    researchUrl: "https://examine.com/supplements/fish-oil/",
    category: "omega" as SupplementCategory,
    commonGoals: ["health", "longevity", "focus"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 300, // ~5h
    halfLifeMinutes: 2880, // 48h
    absorptionWindowMinutes: 360,
    bioavailabilityPercent: 25,
  },
  {
    name: "Beta-Alanine",
    form: "Beta-Alanine",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["beta alanine", "ba"],
    description:
      "Amino acid increasing muscle carnosine for enhanced exercise capacity and endurance",
    mechanism:
      "Rate-limiting precursor for carnosine synthesis; buffers intramuscular pH during high-intensity exercise",
    researchUrl: "https://examine.com/supplements/beta-alanine/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["energy", "health"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 45,
    halfLifeMinutes: 180, // ~3h
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 90,
  },
  {
    name: "L-Citrulline",
    form: "L-Citrulline",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["citrulline", "l citrulline"],
    description:
      "Amino acid boosting nitric oxide production for blood flow and exercise performance",
    mechanism:
      "Converted to L-arginine in kidneys; substrate for nitric oxide synthase",
    researchUrl: "https://examine.com/supplements/citrulline/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["energy", "health"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 60,
    halfLifeMinutes: 60, // ~1h
    absorptionWindowMinutes: 60,
    bioavailabilityPercent: 80,
  },
  {
    name: "L-Glutamine",
    form: "L-Glutamine",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["glutamine", "l glutamine"],
    description:
      "Conditionally essential amino acid supporting gut integrity and immune function",
    mechanism:
      "Primary fuel for enterocytes and immune cells; maintains intestinal barrier function",
    researchUrl: "https://examine.com/supplements/glutamine/",
    category: "amino-acid" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 30,
    halfLifeMinutes: 60, // ~1h
    absorptionWindowMinutes: 30,
    bioavailabilityPercent: 70,
  },
  {
    name: "Zinc Carnosine",
    form: "Zinc L-Carnosine",
    elementalWeight: 23,
    defaultUnit: "mg" as const,
    aliases: ["zinc carnosine", "pepzin gi", "polaprezinc"],
    description:
      "Chelated zinc-carnosine complex specifically for gastric and intestinal healing",
    mechanism:
      "Adheres to ulcer sites; stimulates mucus secretion and tissue repair; antioxidant in GI tract",
    researchUrl: "https://examine.com/supplements/zinc-carnosine/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: "zinc" as SafetyCategoryKey,
    peakMinutes: 120,
    halfLifeMinutes: 300, // ~5h
    absorptionWindowMinutes: 180,
    bioavailabilityPercent: 40,
  },
  {
    name: "Tart Cherry Extract",
    form: "Prunus cerasus Extract",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["tart cherry", "montmorency cherry", "sour cherry"],
    description:
      "Natural source of melatonin and anthocyanins supporting sleep and recovery",
    mechanism:
      "Contains natural melatonin; anthocyanins reduce oxidative stress and inflammation",
    researchUrl: "https://examine.com/supplements/tart-cherry/",
    category: "other" as SupplementCategory,
    commonGoals: ["sleep", "health"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 90,
    halfLifeMinutes: 240, // ~4h for anthocyanins
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 15,
  },
  {
    name: "Lutein",
    form: "Lutein",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["lutein", "marigold extract"],
    description:
      "Carotenoid concentrated in the macula supporting eye health and blue light protection",
    mechanism:
      "Filters high-energy blue light; antioxidant protecting retinal photoreceptors from oxidative damage",
    researchUrl: "https://examine.com/supplements/lutein/",
    category: "antioxidant" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 960, // ~16h
    halfLifeMinutes: 11520, // ~8 days tissue
    absorptionWindowMinutes: 480,
    bioavailabilityPercent: 20, // Needs fat
  },
  {
    name: "Zeaxanthin",
    form: "Zeaxanthin",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["zeaxanthin", "meso-zeaxanthin"],
    description:
      "Macular carotenoid working synergistically with lutein for retinal protection",
    mechanism:
      "Concentrated in fovea; filters blue light and neutralizes reactive oxygen species in retina",
    researchUrl: "https://examine.com/supplements/lutein/",
    category: "antioxidant" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 960,
    halfLifeMinutes: 11520, // Similar to lutein
    absorptionWindowMinutes: 480,
    bioavailabilityPercent: 20,
  },
  {
    name: "Silica",
    form: "Orthosilicic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["silicon", "orthosilicic acid", "bamboo extract"],
    description:
      "Trace mineral supporting collagen formation and connective tissue strength",
    mechanism:
      "Cofactor for prolyl hydroxylase in collagen synthesis; supports bone mineralization",
    researchUrl: "https://examine.com/supplements/silicon/",
    category: "mineral" as SupplementCategory,
    commonGoals: ["health"],
    safetyCategory: null as SafetyCategoryKey,
    peakMinutes: 120,
    halfLifeMinutes: 240, // ~4h
    absorptionWindowMinutes: 120,
    bioavailabilityPercent: 50, // Orthosilicic acid form
  },
];

async function seed() {
  console.log("Seeding supplements with enriched metadata...");

  // Upsert supplements (insert or update on conflict)
  const supplementsToInsert = supplements.map(
    ({ aliases: _aliases, ...rest }) => rest,
  );

  let insertedCount = 0;
  for (const supp of supplementsToInsert) {
    const result = await db
      .insert(supplement)
      .values(supp)
      .onConflictDoUpdate({
        target: supplement.name,
        set: {
          form: supp.form,
          elementalWeight: supp.elementalWeight,
          defaultUnit: supp.defaultUnit,
          description: supp.description,
          mechanism: supp.mechanism,
          researchUrl: supp.researchUrl,
          category: supp.category,
          commonGoals: supp.commonGoals,
          safetyCategory: supp.safetyCategory,
          isResearchChemical: supp.isResearchChemical ?? false,
          route: supp.route ?? "oral",
          storageInstructions: supp.storageInstructions ?? null,
          // Pharmacokinetic data
          peakMinutes: supp.peakMinutes ?? null,
          halfLifeMinutes: supp.halfLifeMinutes ?? null,
          absorptionWindowMinutes: supp.absorptionWindowMinutes ?? null,
          bioavailabilityPercent: supp.bioavailabilityPercent ?? null,
          // Michaelis-Menten kinetics (for saturable transporters)
          kineticsType: supp.kineticsType ?? "first_order",
          vmax: supp.vmax ?? null,
          km: supp.km ?? null,
          absorptionSaturationDose: supp.absorptionSaturationDose ?? null,
          rdaAmount: supp.rdaAmount ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (result.length > 0) insertedCount++;
  }

  console.log(`Upserted ${insertedCount} supplements with metadata`);

  // Get all supplements to build the map
  const allSupplements = await db.query.supplement.findMany();
  const supplementMap = new Map(allSupplements.map((s) => [s.name, s.id]));

  const interactions = [
    // ============================================
    // ZINC-COPPER COMPETITION (Critical)
    // ============================================
    {
      sourceId: supplementMap.get("Zinc Picolinate")!,
      targetId: supplementMap.get("Copper Bisglycinate")!,
      type: "competition" as const,
      mechanism:
        "Metallothionein induction - high zinc induces metallothionein which binds copper",
      severity: "critical" as const,
      researchUrl:
        "https://examine.com/supplements/zinc/#interactions-with-other-nutrients_copper",
      suggestion:
        "Take zinc and copper at separate meals (2+ hours apart), or ensure 10:1 zinc:copper ratio",
    },
    {
      sourceId: supplementMap.get("Zinc Gluconate")!,
      targetId: supplementMap.get("Copper Bisglycinate")!,
      type: "competition" as const,
      mechanism:
        "Metallothionein induction - high zinc induces metallothionein which binds copper",
      severity: "critical" as const,
      researchUrl:
        "https://examine.com/supplements/zinc/#interactions-with-other-nutrients_copper",
      suggestion:
        "Take zinc and copper at separate meals (2+ hours apart), or ensure 10:1 zinc:copper ratio",
    },

    // ============================================
    // IRON COMPETITION (Medium)
    // ============================================
    {
      sourceId: supplementMap.get("Iron Bisglycinate")!,
      targetId: supplementMap.get("Zinc Picolinate")!,
      type: "competition" as const,
      mechanism: "DMT1 transporter competition",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/iron/#interactions-with-other-nutrients_zinc",
      suggestion:
        "Take iron and zinc at different meals - iron in morning, zinc with dinner",
    },
    {
      sourceId: supplementMap.get("Iron Bisglycinate")!,
      targetId: supplementMap.get("Zinc Gluconate")!,
      type: "competition" as const,
      mechanism: "DMT1 transporter competition",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/iron/#interactions-with-other-nutrients_zinc",
      suggestion:
        "Take iron and zinc at different meals - iron in morning, zinc with dinner",
    },

    // ============================================
    // CALCIUM COMPETITION (Medium)
    // ============================================
    {
      sourceId: supplementMap.get("Calcium")!,
      targetId: supplementMap.get("Iron Bisglycinate")!,
      type: "competition" as const,
      mechanism: "Calcium inhibits both heme and non-heme iron absorption",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/calcium/#interactions-with-other-nutrients_iron",
      suggestion:
        "Take calcium and iron 2+ hours apart - iron with breakfast, calcium with dinner",
    },
    {
      sourceId: supplementMap.get("Calcium")!,
      targetId: supplementMap.get("Zinc Picolinate")!,
      type: "competition" as const,
      mechanism: "Calcium competes for zinc absorption at intestinal level",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/calcium/#interactions-with-other-nutrients_zinc",
      suggestion:
        "Take calcium and zinc at separate meals for optimal absorption of both",
    },
    {
      sourceId: supplementMap.get("Calcium")!,
      targetId: supplementMap.get("Zinc Gluconate")!,
      type: "competition" as const,
      mechanism: "Calcium competes for zinc absorption at intestinal level",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/calcium/#interactions-with-other-nutrients_zinc",
      suggestion:
        "Take calcium and zinc at separate meals for optimal absorption of both",
    },
    {
      sourceId: supplementMap.get("Calcium")!,
      targetId: supplementMap.get("Magnesium Glycinate")!,
      type: "competition" as const,
      mechanism: "High calcium intake can reduce magnesium absorption",
      severity: "low" as const,
      researchUrl:
        "https://examine.com/supplements/calcium/#interactions-with-other-nutrients_magnesium",
      suggestion:
        "Maintain ~2:1 calcium:magnesium ratio. Consider taking at different times if doses are high",
    },

    // ============================================
    // CAFFEINE INTERACTIONS
    // ============================================
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Magnesium Glycinate")!,
      type: "inhibition" as const,
      mechanism: "Increases urinary magnesium excretion",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/caffeine/#interactions-with-other-nutrients_magnesium",
      suggestion:
        "Take magnesium 2+ hours after caffeine, or take magnesium before bed when caffeine has cleared",
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Magnesium Citrate")!,
      type: "inhibition" as const,
      mechanism: "Increases urinary magnesium excretion",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/caffeine/#interactions-with-other-nutrients_magnesium",
      suggestion:
        "Take magnesium 2+ hours after caffeine, or take magnesium before bed when caffeine has cleared",
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Creatine Monohydrate")!,
      type: "inhibition" as const,
      mechanism:
        "Caffeine may reduce creatine absorption and negate ergogenic benefits",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/creatine/#interactions-with-other-nutrients_caffeine",
      suggestion:
        "Take creatine at a different time from caffeine - creatine works well post-workout",
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Iron Bisglycinate")!,
      type: "inhibition" as const,
      mechanism:
        "Tannins and polyphenols in caffeine sources inhibit iron absorption",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/iron/#interactions-with-other-nutrients_caffeine",
      suggestion:
        "Take iron 1-2 hours before coffee/tea, or take iron at bedtime away from caffeine",
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Zinc Picolinate")!,
      type: "inhibition" as const,
      mechanism:
        "Caffeine may reduce zinc absorption and increase urinary zinc excretion",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/zinc/",
      suggestion:
        "Minor interaction - take zinc with a meal separate from your morning coffee",
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Zinc Gluconate")!,
      type: "inhibition" as const,
      mechanism:
        "Caffeine may reduce zinc absorption and increase urinary zinc excretion",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/zinc/",
      suggestion:
        "Minor interaction - take zinc with a meal separate from your morning coffee",
    },

    // ============================================
    // SYNERGIES
    // ============================================
    {
      sourceId: supplementMap.get("Vitamin C")!,
      targetId: supplementMap.get("Iron Bisglycinate")!,
      type: "synergy" as const,
      mechanism: "Reduces ferric iron to ferrous form, enhances absorption",
      severity: "low" as const,
      researchUrl:
        "https://examine.com/supplements/iron/#interactions-with-other-nutrients_vitamin-c",
      suggestion:
        "Take together! 100mg vitamin C can boost iron absorption 2-3x. Great combo.",
    },
    {
      sourceId: supplementMap.get("Vitamin D3")!,
      targetId: supplementMap.get("Vitamin K2 MK-7")!,
      type: "synergy" as const,
      mechanism:
        "K2 directs calcium mobilized by D3 to bones, prevents arterial calcification",
      severity: "low" as const,
      researchUrl:
        "https://examine.com/supplements/vitamin-k/#interactions-with-other-nutrients_vitamin-d",
      suggestion:
        "Take together! Essential pairing - K2 ensures D3-mobilized calcium goes to bones, not arteries",
    },
    {
      sourceId: supplementMap.get("L-Theanine")!,
      targetId: supplementMap.get("Caffeine")!,
      type: "synergy" as const,
      mechanism:
        "L-Theanine smooths caffeine effects, reduces jitters, improves focus",
      severity: "low" as const,
      researchUrl:
        "https://examine.com/supplements/theanine/#interactions-with-other-nutrients_caffeine",
      suggestion:
        "Take together! Classic nootropic stack. Try 100-200mg theanine with your coffee for calm focus",
    },
    {
      sourceId: supplementMap.get("Piperine")!,
      targetId: supplementMap.get("Curcumin")!,
      type: "synergy" as const,
      mechanism:
        "Inhibits glucuronidation, increases curcumin bioavailability by 2000%",
      severity: "low" as const,
      researchUrl:
        "https://examine.com/supplements/curcumin/#interactions-with-other-nutrients_piperine",
      suggestion:
        "Take together! Piperine is almost essential for curcumin - 5-20mg piperine per dose",
    },
    {
      sourceId: supplementMap.get("Piperine")!,
      targetId: supplementMap.get("CoQ10")!,
      type: "synergy" as const,
      mechanism: "Piperine enhances CoQ10 absorption and bioavailability",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/coq10/",
      suggestion:
        "Take together! Piperine boosts CoQ10 absorption, especially important for ubiquinone form",
    },
    {
      sourceId: supplementMap.get("Alpha Lipoic Acid")!,
      targetId: supplementMap.get("CoQ10")!,
      type: "synergy" as const,
      mechanism:
        "ALA regenerates CoQ10, both work synergistically as antioxidants",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/alpha-lipoic-acid/",
      suggestion:
        "Take together! ALA recycles CoQ10 - powerful mitochondrial support combo",
    },
    {
      sourceId: supplementMap.get("NAC")!,
      targetId: supplementMap.get("Vitamin C")!,
      type: "synergy" as const,
      mechanism:
        "NAC and Vitamin C work synergistically to regenerate glutathione",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/n-acetylcysteine/",
      suggestion:
        "Take together! Both support glutathione - your body's master antioxidant",
    },
    {
      sourceId: supplementMap.get("NAC")!,
      targetId: supplementMap.get("Glutathione")!,
      type: "synergy" as const,
      mechanism: "NAC is a precursor to glutathione synthesis",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/n-acetylcysteine/",
      suggestion:
        "Good combo but potentially redundant - NAC boosts glutathione production naturally. Choose one or use both for acute support",
    },
    {
      sourceId: supplementMap.get("Vitamin D3")!,
      targetId: supplementMap.get("Magnesium Glycinate")!,
      type: "synergy" as const,
      mechanism:
        "Magnesium is required for vitamin D activation and metabolism",
      severity: "low" as const,
      researchUrl:
        "https://examine.com/supplements/vitamin-d/#interactions-with-other-nutrients_magnesium",
      suggestion:
        "Take together! Magnesium activates vitamin D. Many D3 'non-responders' are actually magnesium deficient",
    },
    {
      sourceId: supplementMap.get("Quercetin")!,
      targetId: supplementMap.get("Vitamin C")!,
      type: "synergy" as const,
      mechanism:
        "Quercetin enhances vitamin C absorption and both have synergistic antioxidant effects",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/quercetin/",
      suggestion:
        "Take together! Quercetin recycles vitamin C and both enhance immune function",
    },

    // ============================================
    // B-VITAMIN SYNERGIES
    // ============================================
    {
      sourceId: supplementMap.get("Vitamin B6")!,
      targetId: supplementMap.get("Vitamin B12")!,
      type: "synergy" as const,
      mechanism:
        "B6 and B12 work together in methylation cycle and homocysteine metabolism",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/vitamin-b12/",
      suggestion:
        "Take together! B-vitamins work as a team. Consider a B-complex or pair B6+B12+Folate",
    },
    {
      sourceId: supplementMap.get("Folate")!,
      targetId: supplementMap.get("Vitamin B12")!,
      type: "synergy" as const,
      mechanism:
        "Folate and B12 are co-dependent in methylation and DNA synthesis",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/folate/",
      suggestion:
        "Take together! Critical pairing for methylation. Never take high-dose folate without B12",
    },

    // ============================================
    // AMINO ACID COMPETITION
    // ============================================
    {
      sourceId: supplementMap.get("L-Tyrosine")!,
      targetId: supplementMap.get("5-HTP")!,
      type: "competition" as const,
      mechanism:
        "Large Neutral Amino Acid Transporter (LNAAT) competition at BBB",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/5-htp/#interactions-with-other-nutrients_amino-acids",
      suggestion:
        "Take 4+ hours apart. Tyrosine in morning for focus, 5-HTP in evening for sleep/mood",
    },

    // ============================================
    // BERBERINE INTERACTIONS
    // ============================================
    {
      sourceId: supplementMap.get("Berberine")!,
      targetId: supplementMap.get("Vitamin B6")!,
      type: "inhibition" as const,
      mechanism: "Berberine may reduce B6 levels by increasing its metabolism",
      severity: "medium" as const,
      researchUrl: "https://examine.com/supplements/berberine/",
      suggestion:
        "Consider increasing B6 intake or taking a B-complex if using berberine long-term",
    },
    {
      sourceId: supplementMap.get("Berberine")!,
      targetId: supplementMap.get("CoQ10")!,
      type: "inhibition" as const,
      mechanism:
        "Berberine inhibits mitochondrial complex I, may increase CoQ10 requirements",
      severity: "medium" as const,
      researchUrl: "https://examine.com/supplements/berberine/",
      suggestion:
        "Supplement CoQ10 (100-200mg) when taking berberine to support mitochondrial function",
    },

    // ============================================
    // PIPERINE INHIBITION
    // ============================================
    {
      sourceId: supplementMap.get("Piperine")!,
      targetId: supplementMap.get("Caffeine")!,
      type: "inhibition" as const,
      mechanism: "CYP3A4 inhibition increases caffeine half-life",
      severity: "medium" as const,
      researchUrl: "https://examine.com/supplements/black-pepper/",
      suggestion:
        "Piperine extends caffeine effects - reduce caffeine dose or avoid piperine if sensitive",
    },

    // ============================================
    // MAGNESIUM-IRON COMPETITION
    // ============================================
    {
      sourceId: supplementMap.get("Magnesium Glycinate")!,
      targetId: supplementMap.get("Iron Bisglycinate")!,
      type: "competition" as const,
      mechanism: "Compete for absorption in small intestine",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/magnesium/",
      suggestion:
        "Minor interaction - take at different times if maximizing absorption is important",
    },

    // ============================================
    // MELATONIN INTERACTIONS
    // ============================================
    {
      sourceId: supplementMap.get("Melatonin")!,
      targetId: supplementMap.get("Caffeine")!,
      type: "competition" as const,
      mechanism:
        "Caffeine suppresses melatonin production and delays circadian rhythm",
      severity: "medium" as const,
      researchUrl: "https://examine.com/supplements/melatonin/",
      suggestion:
        "Avoid caffeine 6+ hours before melatonin. Caffeine has ~6h half-life and blocks melatonin",
    },
    {
      sourceId: supplementMap.get("Magnesium Glycinate")!,
      targetId: supplementMap.get("Melatonin")!,
      type: "synergy" as const,
      mechanism:
        "Magnesium enhances melatonin production and supports GABA activity for sleep",
      severity: "low" as const,
      researchUrl: "https://examine.com/supplements/melatonin/",
      suggestion:
        "Take together before bed! Classic sleep stack - magnesium relaxes muscles, melatonin signals sleep",
    },
  ];

  console.log("Seeding interactions...");

  // Clear existing interactions and re-insert (interactions are based on supplement IDs)
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await db.delete(interaction);
  const insertedInteractions = await db
    .insert(interaction)
    .values(interactions)
    .returning();

  console.log(`Inserted ${insertedInteractions.length} interactions`);

  // Ratio rules for stoichiometric balance
  const ratioRules = [
    // Zinc:Copper ratio (optimal 8-15:1, danger above 15:1)
    {
      sourceSupplementId: supplementMap.get("Zinc Picolinate")!,
      targetSupplementId: supplementMap.get("Copper Bisglycinate")!,
      minRatio: 8,
      maxRatio: 15,
      optimalRatio: 10,
      warningMessage:
        "Zn:Cu ratio outside optimal range (8-15:1). High zinc without copper causes copper deficiency.",
      severity: "critical" as const,
      researchUrl:
        "https://examine.com/supplements/zinc/#interactions-with-other-nutrients_copper",
    },
    {
      sourceSupplementId: supplementMap.get("Zinc Gluconate")!,
      targetSupplementId: supplementMap.get("Copper Bisglycinate")!,
      minRatio: 8,
      maxRatio: 15,
      optimalRatio: 10,
      warningMessage:
        "Zn:Cu ratio outside optimal range (8-15:1). High zinc without copper causes copper deficiency.",
      severity: "critical" as const,
      researchUrl:
        "https://examine.com/supplements/zinc/#interactions-with-other-nutrients_copper",
    },
    // Calcium:Magnesium ratio (optimal 1-2:1, problems above 2:1)
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Magnesium Glycinate")!,
      minRatio: 0.5,
      maxRatio: 2,
      optimalRatio: 1,
      warningMessage:
        "Ca:Mg ratio outside optimal range (1-2:1). Excess calcium impairs magnesium absorption.",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/calcium/#interactions-with-other-nutrients_magnesium",
    },
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Magnesium Citrate")!,
      minRatio: 0.5,
      maxRatio: 2,
      optimalRatio: 1,
      warningMessage:
        "Ca:Mg ratio outside optimal range (1-2:1). Excess calcium impairs magnesium absorption.",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/calcium/#interactions-with-other-nutrients_magnesium",
    },
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Magnesium L-Threonate")!,
      minRatio: 0.5,
      maxRatio: 2,
      optimalRatio: 1,
      warningMessage:
        "Ca:Mg ratio outside optimal range (1-2:1). Excess calcium impairs magnesium absorption.",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/calcium/#interactions-with-other-nutrients_magnesium",
    },
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Magnesium Malate")!,
      minRatio: 0.5,
      maxRatio: 2,
      optimalRatio: 1,
      warningMessage:
        "Ca:Mg ratio outside optimal range (1-2:1). Excess calcium impairs magnesium absorption.",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/calcium/#interactions-with-other-nutrients_magnesium",
    },
    // Iron:Zinc ratio
    {
      sourceSupplementId: supplementMap.get("Iron Bisglycinate")!,
      targetSupplementId: supplementMap.get("Zinc Picolinate")!,
      minRatio: 0.5,
      maxRatio: 3,
      optimalRatio: 1,
      warningMessage:
        "Fe:Zn ratio outside optimal range. Both compete for DMT1 transporter - balance intake.",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/iron/#interactions-with-other-nutrients_zinc",
    },
    {
      sourceSupplementId: supplementMap.get("Iron Bisglycinate")!,
      targetSupplementId: supplementMap.get("Zinc Gluconate")!,
      minRatio: 0.5,
      maxRatio: 3,
      optimalRatio: 1,
      warningMessage:
        "Fe:Zn ratio outside optimal range. Both compete for DMT1 transporter - balance intake.",
      severity: "medium" as const,
      researchUrl:
        "https://examine.com/supplements/iron/#interactions-with-other-nutrients_zinc",
    },
    // Vitamin D3:K2 ratio
    {
      sourceSupplementId: supplementMap.get("Vitamin D3")!,
      targetSupplementId: supplementMap.get("Vitamin K2 MK-7")!,
      minRatio: 40,
      maxRatio: 200,
      optimalRatio: 100,
      warningMessage:
        "D3:K2 ratio outside optimal range (40-200:1). K2 helps direct calcium to bones, preventing arterial calcification.",
      severity: "low" as const,
      researchUrl:
        "https://examine.com/supplements/vitamin-k/#interactions-with-other-nutrients_vitamin-d",
    },
  ];

  console.log("Seeding ratio rules...");
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await db.delete(ratioRule);
  const insertedRatioRules = await db
    .insert(ratioRule)
    .values(ratioRules)
    .returning();
  console.log(`Inserted ${insertedRatioRules.length} ratio rules`);

  // Timing rules for supplement spacing
  // Timing rules for supplement spacing
  const timingRules = [
    {
      sourceSupplementId: supplementMap.get("L-Tyrosine")!,
      targetSupplementId: supplementMap.get("5-HTP")!,
      minHoursApart: 4,
      reason:
        "Large Neutral Amino Acid Transporter (LNAAT/LAT1) saturation at the blood-brain barrier; concurrent ingestion reduces CNS uptake of both precursors by ~35-50%",
      severity: "medium" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/2507878/",
    },
    {
      sourceSupplementId: supplementMap.get("Iron Bisglycinate")!,
      targetSupplementId: supplementMap.get("Zinc Picolinate")!,
      minHoursApart: 2,
      reason:
        "Competitive inhibition at divalent metal transporter 1 (DMT-1/SLC11A2); concurrent intake reduces zinc absorption by ~40% at equimolar doses",
      severity: "medium" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/11880570/",
    },
    {
      sourceSupplementId: supplementMap.get("Caffeine")!,
      targetSupplementId: supplementMap.get("Magnesium Glycinate")!,
      minHoursApart: 2,
      reason:
        "Caffeine-induced diuresis increases renal magnesium excretion via inhibition of sodium reabsorption in the proximal tubule; urinary Mg loss increases ~20% per 150mg caffeine",
      severity: "low" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/19774754/",
    },
    {
      sourceSupplementId: supplementMap.get("Vitamin B12")!,
      targetSupplementId: supplementMap.get("Magnesium Glycinate")!,
      minHoursApart: 8,
      reason:
        "Methylcobalamin suppresses pineal melatonin secretion via methyl group donation pathways; evening dosing may impair sleep onset latency",
      severity: "low" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/8613427/",
    },
    {
      sourceSupplementId: supplementMap.get("NAC")!,
      targetSupplementId: supplementMap.get("Zinc Picolinate")!,
      minHoursApart: 2,
      reason:
        "N-acetylcysteine forms stable chelation complexes with divalent cations (Zn²⁺, Cu²⁺) via thiol group; concurrent administration reduces zinc bioavailability by ~25%",
      severity: "medium" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/9587135/",
    },
    {
      sourceSupplementId: supplementMap.get("NAC")!,
      targetSupplementId: supplementMap.get("Iron Bisglycinate")!,
      minHoursApart: 2,
      reason:
        "NAC chelates ferrous iron (Fe²⁺) via cysteine thiol groups; forms non-absorbable complexes reducing iron bioavailability by ~30%",
      severity: "medium" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/9587135/",
    },
    {
      sourceSupplementId: supplementMap.get("Berberine")!,
      targetSupplementId: supplementMap.get("Vitamin B6")!,
      minHoursApart: 2,
      reason:
        "Berberine inhibits pyridoxal kinase, reducing conversion of pyridoxine to active pyridoxal-5-phosphate (P5P); chronic use may induce functional B6 deficiency",
      severity: "medium" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/31779005/",
    },
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Iron Bisglycinate")!,
      minHoursApart: 2,
      reason:
        "Calcium (>300mg) inhibits both heme and non-heme iron absorption at the enterocyte brush border via competition for DMT-1 and ferroportin; reduces Fe uptake by 40-60%",
      severity: "medium" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/2507517/",
    },
    {
      sourceSupplementId: supplementMap.get("Caffeine")!,
      targetSupplementId: supplementMap.get("Melatonin")!,
      minHoursApart: 6,
      reason:
        "Caffeine competitively antagonizes adenosine A2A receptors in the suprachiasmatic nucleus, suppressing endogenous melatonin synthesis by ~40%; plasma t½ of 5-6h necessitates evening abstinence",
      severity: "medium" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/26378246/",
    },
    {
      sourceSupplementId: supplementMap.get("Caffeine")!,
      targetSupplementId: supplementMap.get("Creatine Monohydrate")!,
      minHoursApart: 1,
      reason:
        "In vitro evidence suggests caffeine-induced Ca²⁺ release from sarcoplasmic reticulum may partially antagonize creatine's phosphocreatine resynthesis benefits; clinical significance debated",
      severity: "low" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/27328852/",
    },
    {
      sourceSupplementId: supplementMap.get("Magnesium Glycinate")!,
      targetSupplementId: supplementMap.get("Zinc Picolinate")!,
      minHoursApart: 2,
      reason:
        "High-dose magnesium (>400mg) competes with zinc for intestinal absorption via shared TRPM6/7 channels; concurrent intake may reduce Zn bioavailability by ~15-20%",
      severity: "low" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/8875519/",
    },
    {
      sourceSupplementId: supplementMap.get("Zinc Picolinate")!,
      targetSupplementId: supplementMap.get("Copper Bisglycinate")!,
      minHoursApart: 4,
      reason:
        "Zinc induces intestinal metallothionein synthesis, which preferentially sequesters copper ions; chronic Zn >40mg/day without Cu supplementation causes hypocupremia within 8-12 weeks",
      severity: "critical" as const,
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/2407097/",
    },
  ];

  console.log("Seeding timing rules...");
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await db.delete(timingRule);
  const insertedTimingRules = await db
    .insert(timingRule)
    .values(timingRules)
    .returning();
  console.log(`Inserted ${insertedTimingRules.length} timing rules`);

  // ============================================
  // SYSTEM USER & PROTOCOL STACKS
  // ============================================
  console.log("Seeding system user and protocol stacks...");

  // Upsert system user
  await db
    .insert(user)
    .values({
      id: SYSTEM_USER_ID,
      name: "Stochi",
      email: "system@stochi.app",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  // Delete existing system stacks (to refresh protocols)
  await db.delete(stack).where(eq(stack.userId, SYSTEM_USER_ID));

  // Protocol 1: Huberman Sleep Cocktail
  const [hubermanStack] = await db
    .insert(stack)
    .values({
      userId: SYSTEM_USER_ID,
      name: "Huberman Sleep Cocktail",
      isPublic: true,
    })
    .returning();

  if (hubermanStack) {
    await db.insert(stackItem).values([
      {
        stackId: hubermanStack.id,
        supplementId: supplementMap.get("Magnesium L-Threonate")!,
        dosage: 145,
        unit: "mg" as const,
      },
      {
        stackId: hubermanStack.id,
        supplementId: supplementMap.get("L-Theanine")!,
        dosage: 200,
        unit: "mg" as const,
      },
      {
        stackId: hubermanStack.id,
        supplementId: supplementMap.get("Glycine")!,
        dosage: 2,
        unit: "g" as const,
      },
    ]);
    console.log("Created Huberman Sleep Cocktail protocol");
  }

  // Protocol 2: Foundational Longevity Stack
  const [longevityStack] = await db
    .insert(stack)
    .values({
      userId: SYSTEM_USER_ID,
      name: "Foundational Longevity",
      isPublic: true,
    })
    .returning();

  if (longevityStack) {
    await db.insert(stackItem).values([
      {
        stackId: longevityStack.id,
        supplementId: supplementMap.get("Vitamin D3")!,
        dosage: 5000,
        unit: "IU" as const,
      },
      {
        stackId: longevityStack.id,
        supplementId: supplementMap.get("Vitamin K2 MK-7")!,
        dosage: 100,
        unit: "mcg" as const,
      },
      {
        stackId: longevityStack.id,
        supplementId: supplementMap.get("Fish Oil (EPA)")!,
        dosage: 1000,
        unit: "mg" as const,
      },
      {
        stackId: longevityStack.id,
        supplementId: supplementMap.get("NAC")!,
        dosage: 600,
        unit: "mg" as const,
      },
    ]);
    console.log("Created Foundational Longevity protocol");
  }

  console.log("Seed completed!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });

// Export aliases for use in fuzzy search
export const supplementAliases: Record<string, string[]> = Object.fromEntries(
  supplements.map((s) => [s.name, s.aliases]),
);
