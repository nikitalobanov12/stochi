import { db } from "./index";
import { supplement, interaction, ratioRule, timingRule } from "./schema";

const supplements = [
  // ============================================
  // MAGNESIUM FORMS (4)
  // ============================================
  {
    name: "Magnesium Glycinate",
    form: "Magnesium Bisglycinate",
    elementalWeight: 14.1,
    defaultUnit: "mg" as const,
    aliases: ["mag glycinate", "magnesium bisgly", "mag bisgly", "calm magnesium"],
  },
  {
    name: "Magnesium Citrate",
    form: "Magnesium Citrate",
    elementalWeight: 16.2,
    defaultUnit: "mg" as const,
    aliases: ["mag citrate", "natural calm"],
  },
  {
    name: "Magnesium L-Threonate",
    form: "Magnesium L-Threonate",
    elementalWeight: 8.3,
    defaultUnit: "mg" as const,
    aliases: ["mag threonate", "magtein", "brain magnesium"],
  },
  {
    name: "Magnesium Oxide",
    form: "Magnesium Oxide",
    elementalWeight: 60.3,
    defaultUnit: "mg" as const,
    aliases: ["mag oxide", "magox"],
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
  },
  {
    name: "Zinc Gluconate",
    form: "Zinc Gluconate",
    elementalWeight: 14.3,
    defaultUnit: "mg" as const,
    aliases: ["zinc gluconate", "zn gluconate"],
  },

  // ============================================
  // B-VITAMINS (6) - NEW
  // ============================================
  {
    name: "Vitamin B1",
    form: "Thiamine HCl",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["b1", "thiamine", "vit b1", "thiamin"],
  },
  {
    name: "Vitamin B2",
    form: "Riboflavin-5-Phosphate",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["b2", "riboflavin", "vit b2", "r5p"],
  },
  {
    name: "Vitamin B3",
    form: "Niacinamide",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["b3", "niacin", "niacinamide", "vit b3", "nicotinamide"],
  },
  {
    name: "Vitamin B6",
    form: "Pyridoxal-5-Phosphate",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["b6", "p5p", "pyridoxine", "vit b6", "pyridoxal"],
  },
  {
    name: "Folate",
    form: "Methylfolate (5-MTHF)",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["b9", "folic acid", "methylfolate", "5-mthf", "vit b9"],
  },
  {
    name: "Vitamin B12",
    form: "Methylcobalamin",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["b12", "methylcobalamin", "cobalamin", "vit b12"],
  },

  // ============================================
  // OTHER VITAMINS (3)
  // ============================================
  {
    name: "Vitamin D3",
    form: "Cholecalciferol",
    elementalWeight: 100,
    defaultUnit: "IU" as const,
    aliases: ["d3", "vit d", "vitamin d", "sunshine vitamin", "cholecalciferol"],
  },
  {
    name: "Vitamin K2 MK-7",
    form: "Menaquinone-7",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["k2", "mk7", "mk-7", "vitamin k", "vit k2", "menaquinone"],
  },
  {
    name: "Vitamin C",
    form: "Ascorbic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["vit c", "ascorbic acid", "c"],
  },

  // ============================================
  // MINERALS (8) - EXPANDED
  // ============================================
  {
    name: "Iron Bisglycinate",
    form: "Ferrous Bisglycinate",
    elementalWeight: 27.4,
    defaultUnit: "mg" as const,
    aliases: ["iron", "ferrous", "fe", "gentle iron"],
  },
  {
    name: "Copper Bisglycinate",
    form: "Copper Bisglycinate",
    elementalWeight: 30.0,
    defaultUnit: "mg" as const,
    aliases: ["copper", "cu"],
  },
  {
    name: "Selenium",
    form: "Selenomethionine",
    elementalWeight: 40.3,
    defaultUnit: "mcg" as const,
    aliases: ["se", "selenomethionine"],
  },
  {
    name: "Calcium",
    form: "Calcium Citrate",
    elementalWeight: 24.1,
    defaultUnit: "mg" as const,
    aliases: ["ca", "calcium citrate", "cal"],
  },
  {
    name: "Potassium",
    form: "Potassium Citrate",
    elementalWeight: 38.3,
    defaultUnit: "mg" as const,
    aliases: ["k", "potassium citrate"],
  },
  {
    name: "Boron",
    form: "Boron Glycinate",
    elementalWeight: 4.6,
    defaultUnit: "mg" as const,
    aliases: ["boron glycinate"],
  },
  {
    name: "Iodine",
    form: "Potassium Iodide",
    elementalWeight: 76.5,
    defaultUnit: "mcg" as const,
    aliases: ["iodide", "potassium iodide", "ki"],
  },
  {
    name: "Chromium",
    form: "Chromium Picolinate",
    elementalWeight: 12.4,
    defaultUnit: "mcg" as const,
    aliases: ["chromium picolinate", "cr"],
  },

  // ============================================
  // OMEGA-3 (2)
  // ============================================
  {
    name: "Fish Oil (EPA)",
    form: "Eicosapentaenoic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["epa", "omega 3", "omega-3", "fish oil", "omega3"],
  },
  {
    name: "Fish Oil (DHA)",
    form: "Docosahexaenoic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["dha", "omega 3", "omega-3", "fish oil", "omega3", "brain omega"],
  },

  // ============================================
  // AMINO ACIDS (6) - EXPANDED
  // ============================================
  {
    name: "L-Tyrosine",
    form: "L-Tyrosine",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["tyrosine", "l tyrosine"],
  },
  {
    name: "L-Theanine",
    form: "L-Theanine",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["theanine", "l theanine", "suntheanine"],
  },
  {
    name: "5-HTP",
    form: "5-Hydroxytryptophan",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["5htp", "hydroxytryptophan", "serotonin precursor"],
  },
  {
    name: "GABA",
    form: "Gamma-Aminobutyric Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["gamma-aminobutyric acid", "pharmagaba"],
  },
  {
    name: "Glycine",
    form: "Glycine",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["gly"],
  },
  {
    name: "Taurine",
    form: "Taurine",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["tau"],
  },

  // ============================================
  // ANTIOXIDANTS (5) - NEW
  // ============================================
  {
    name: "CoQ10",
    form: "Ubiquinol",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["coenzyme q10", "ubiquinol", "ubiquinone", "coq"],
  },
  {
    name: "Alpha Lipoic Acid",
    form: "R-Alpha Lipoic Acid",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["ala", "r-ala", "r-lipoic acid", "lipoic acid"],
  },
  {
    name: "NAC",
    form: "N-Acetyl Cysteine",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["n-acetyl cysteine", "n-acetylcysteine", "cysteine"],
  },
  {
    name: "Quercetin",
    form: "Quercetin Dihydrate",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["quercetin dihydrate"],
  },
  {
    name: "Glutathione",
    form: "Reduced Glutathione",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["gsh", "reduced glutathione", "liposomal glutathione"],
  },

  // ============================================
  // NOOTROPICS & ADAPTOGENS (6) - EXPANDED
  // ============================================
  {
    name: "Caffeine",
    form: "Caffeine Anhydrous",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["coffee", "caff"],
  },
  {
    name: "Ashwagandha",
    form: "KSM-66 Extract",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["ash", "ksm-66", "ksm66", "withania", "ashwa"],
  },
  {
    name: "Lion's Mane",
    form: "Hericium erinaceus Extract",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["lions mane", "hericium", "yamabushitake"],
  },
  {
    name: "Rhodiola Rosea",
    form: "Rhodiola Extract (3% Rosavins)",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["rhodiola", "golden root", "arctic root"],
  },
  {
    name: "Bacopa Monnieri",
    form: "Bacopa Extract (50% Bacosides)",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["bacopa", "brahmi", "water hyssop"],
  },
  {
    name: "Berberine",
    form: "Berberine HCl",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["berberine hcl"],
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
  },
  {
    name: "Piperine",
    form: "Black Pepper Extract",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["black pepper", "bioperine"],
  },
  {
    name: "Creatine Monohydrate",
    form: "Creatine Monohydrate",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["creatine", "creapure"],
  },
  {
    name: "Collagen",
    form: "Hydrolyzed Collagen Peptides",
    elementalWeight: 100,
    defaultUnit: "g" as const,
    aliases: ["collagen peptides", "hydrolyzed collagen", "collagen powder"],
  },
  {
    name: "Biotin",
    form: "D-Biotin",
    elementalWeight: 100,
    defaultUnit: "mcg" as const,
    aliases: ["vitamin b7", "b7", "vit b7"],
  },
  {
    name: "Melatonin",
    form: "Melatonin",
    elementalWeight: 100,
    defaultUnit: "mg" as const,
    aliases: ["mel", "sleep hormone"],
  },

  // ============================================
  // ADDITIONAL TO REACH 50
  // ============================================
  {
    name: "Magnesium Malate",
    form: "Magnesium Malate",
    elementalWeight: 15.5,
    defaultUnit: "mg" as const,
    aliases: ["mag malate", "malic acid magnesium"],
  },
  {
    name: "Vitamin E",
    form: "Mixed Tocopherols",
    elementalWeight: 100,
    defaultUnit: "IU" as const,
    aliases: ["vit e", "tocopherol", "e"],
  },
];

async function seed() {
  console.log("Seeding supplements...");

  // Upsert supplements (insert or update on conflict)
  const supplementsToInsert = supplements.map(({ aliases: _aliases, ...rest }) => rest);
  
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
          updatedAt: new Date(),
        },
      })
      .returning();
    if (result.length > 0) insertedCount++;
  }

  console.log(`Upserted ${insertedCount} supplements`);

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
      mechanism: "Metallothionein induction - high zinc induces metallothionein which binds copper",
      severity: "critical" as const,
    },
    {
      sourceId: supplementMap.get("Zinc Gluconate")!,
      targetId: supplementMap.get("Copper Bisglycinate")!,
      type: "competition" as const,
      mechanism: "Metallothionein induction - high zinc induces metallothionein which binds copper",
      severity: "critical" as const,
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
    },
    {
      sourceId: supplementMap.get("Iron Bisglycinate")!,
      targetId: supplementMap.get("Zinc Gluconate")!,
      type: "competition" as const,
      mechanism: "DMT1 transporter competition",
      severity: "medium" as const,
    },

    // ============================================
    // CALCIUM COMPETITION (Medium) - NEW
    // ============================================
    {
      sourceId: supplementMap.get("Calcium")!,
      targetId: supplementMap.get("Iron Bisglycinate")!,
      type: "competition" as const,
      mechanism: "Calcium inhibits both heme and non-heme iron absorption",
      severity: "medium" as const,
    },
    {
      sourceId: supplementMap.get("Calcium")!,
      targetId: supplementMap.get("Zinc Picolinate")!,
      type: "competition" as const,
      mechanism: "Calcium competes for zinc absorption at intestinal level",
      severity: "medium" as const,
    },
    {
      sourceId: supplementMap.get("Calcium")!,
      targetId: supplementMap.get("Zinc Gluconate")!,
      type: "competition" as const,
      mechanism: "Calcium competes for zinc absorption at intestinal level",
      severity: "medium" as const,
    },
    {
      sourceId: supplementMap.get("Calcium")!,
      targetId: supplementMap.get("Magnesium Glycinate")!,
      type: "competition" as const,
      mechanism: "High calcium intake can reduce magnesium absorption",
      severity: "low" as const,
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
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Magnesium Citrate")!,
      type: "inhibition" as const,
      mechanism: "Increases urinary magnesium excretion",
      severity: "medium" as const,
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Creatine Monohydrate")!,
      type: "inhibition" as const,
      mechanism: "Caffeine may reduce creatine absorption and negate ergogenic benefits",
      severity: "medium" as const,
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Iron Bisglycinate")!,
      type: "inhibition" as const,
      mechanism: "Tannins and polyphenols in caffeine sources inhibit iron absorption",
      severity: "medium" as const,
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Zinc Picolinate")!,
      type: "inhibition" as const,
      mechanism: "Caffeine may reduce zinc absorption and increase urinary zinc excretion",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("Caffeine")!,
      targetId: supplementMap.get("Zinc Gluconate")!,
      type: "inhibition" as const,
      mechanism: "Caffeine may reduce zinc absorption and increase urinary zinc excretion",
      severity: "low" as const,
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
    },
    {
      sourceId: supplementMap.get("Vitamin D3")!,
      targetId: supplementMap.get("Vitamin K2 MK-7")!,
      type: "synergy" as const,
      mechanism: "K2 directs calcium mobilized by D3 to bones, prevents arterial calcification",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("L-Theanine")!,
      targetId: supplementMap.get("Caffeine")!,
      type: "synergy" as const,
      mechanism: "L-Theanine smooths caffeine effects, reduces jitters, improves focus",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("Piperine")!,
      targetId: supplementMap.get("Curcumin")!,
      type: "synergy" as const,
      mechanism: "Inhibits glucuronidation, increases curcumin bioavailability by 2000%",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("Piperine")!,
      targetId: supplementMap.get("CoQ10")!,
      type: "synergy" as const,
      mechanism: "Piperine enhances CoQ10 absorption and bioavailability",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("Alpha Lipoic Acid")!,
      targetId: supplementMap.get("CoQ10")!,
      type: "synergy" as const,
      mechanism: "ALA regenerates CoQ10, both work synergistically as antioxidants",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("NAC")!,
      targetId: supplementMap.get("Vitamin C")!,
      type: "synergy" as const,
      mechanism: "NAC and Vitamin C work synergistically to regenerate glutathione",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("NAC")!,
      targetId: supplementMap.get("Glutathione")!,
      type: "synergy" as const,
      mechanism: "NAC is a precursor to glutathione synthesis",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("Vitamin D3")!,
      targetId: supplementMap.get("Magnesium Glycinate")!,
      type: "synergy" as const,
      mechanism: "Magnesium is required for vitamin D activation and metabolism",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("Quercetin")!,
      targetId: supplementMap.get("Vitamin C")!,
      type: "synergy" as const,
      mechanism: "Quercetin enhances vitamin C absorption and both have synergistic antioxidant effects",
      severity: "low" as const,
    },

    // ============================================
    // B-VITAMIN SYNERGIES - NEW
    // ============================================
    {
      sourceId: supplementMap.get("Vitamin B6")!,
      targetId: supplementMap.get("Vitamin B12")!,
      type: "synergy" as const,
      mechanism: "B6 and B12 work together in methylation cycle and homocysteine metabolism",
      severity: "low" as const,
    },
    {
      sourceId: supplementMap.get("Folate")!,
      targetId: supplementMap.get("Vitamin B12")!,
      type: "synergy" as const,
      mechanism: "Folate and B12 are co-dependent in methylation and DNA synthesis",
      severity: "low" as const,
    },

    // ============================================
    // AMINO ACID COMPETITION
    // ============================================
    {
      sourceId: supplementMap.get("L-Tyrosine")!,
      targetId: supplementMap.get("5-HTP")!,
      type: "competition" as const,
      mechanism: "Large Neutral Amino Acid Transporter (LNAAT) competition at BBB",
      severity: "medium" as const,
    },

    // ============================================
    // BERBERINE INTERACTIONS - NEW
    // ============================================
    {
      sourceId: supplementMap.get("Berberine")!,
      targetId: supplementMap.get("Vitamin B6")!,
      type: "inhibition" as const,
      mechanism: "Berberine may reduce B6 levels by increasing its metabolism",
      severity: "medium" as const,
    },
    {
      sourceId: supplementMap.get("Berberine")!,
      targetId: supplementMap.get("CoQ10")!,
      type: "inhibition" as const,
      mechanism: "Berberine inhibits mitochondrial complex I, may increase CoQ10 requirements",
      severity: "medium" as const,
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
    },

    // ============================================
    // MELATONIN INTERACTIONS - NEW
    // ============================================
    {
      sourceId: supplementMap.get("Melatonin")!,
      targetId: supplementMap.get("Caffeine")!,
      type: "competition" as const,
      mechanism: "Caffeine suppresses melatonin production and delays circadian rhythm",
      severity: "medium" as const,
    },
    {
      sourceId: supplementMap.get("Magnesium Glycinate")!,
      targetId: supplementMap.get("Melatonin")!,
      type: "synergy" as const,
      mechanism: "Magnesium enhances melatonin production and supports GABA activity for sleep",
      severity: "low" as const,
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
      warningMessage: "Zn:Cu ratio outside optimal range (8-15:1). High zinc without copper causes copper deficiency.",
      severity: "critical" as const,
    },
    {
      sourceSupplementId: supplementMap.get("Zinc Gluconate")!,
      targetSupplementId: supplementMap.get("Copper Bisglycinate")!,
      minRatio: 8,
      maxRatio: 15,
      optimalRatio: 10,
      warningMessage: "Zn:Cu ratio outside optimal range (8-15:1). High zinc without copper causes copper deficiency.",
      severity: "critical" as const,
    },
    // Calcium:Magnesium ratio (optimal 1-2:1, problems above 2:1)
    // High calcium inhibits magnesium absorption and can cause deficiency
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Magnesium Glycinate")!,
      minRatio: 0.5,
      maxRatio: 2,
      optimalRatio: 1,
      warningMessage: "Ca:Mg ratio outside optimal range (1-2:1). Excess calcium impairs magnesium absorption.",
      severity: "medium" as const,
    },
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Magnesium Citrate")!,
      minRatio: 0.5,
      maxRatio: 2,
      optimalRatio: 1,
      warningMessage: "Ca:Mg ratio outside optimal range (1-2:1). Excess calcium impairs magnesium absorption.",
      severity: "medium" as const,
    },
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Magnesium L-Threonate")!,
      minRatio: 0.5,
      maxRatio: 2,
      optimalRatio: 1,
      warningMessage: "Ca:Mg ratio outside optimal range (1-2:1). Excess calcium impairs magnesium absorption.",
      severity: "medium" as const,
    },
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Magnesium Malate")!,
      minRatio: 0.5,
      maxRatio: 2,
      optimalRatio: 1,
      warningMessage: "Ca:Mg ratio outside optimal range (1-2:1). Excess calcium impairs magnesium absorption.",
      severity: "medium" as const,
    },
    // Iron:Zinc ratio - both compete for DMT1 transporter
    // Avoid excess iron relative to zinc (>3:1 is problematic)
    {
      sourceSupplementId: supplementMap.get("Iron Bisglycinate")!,
      targetSupplementId: supplementMap.get("Zinc Picolinate")!,
      minRatio: 0.5,
      maxRatio: 3,
      optimalRatio: 1,
      warningMessage: "Fe:Zn ratio outside optimal range. Both compete for DMT1 transporter - balance intake.",
      severity: "medium" as const,
    },
    {
      sourceSupplementId: supplementMap.get("Iron Bisglycinate")!,
      targetSupplementId: supplementMap.get("Zinc Gluconate")!,
      minRatio: 0.5,
      maxRatio: 3,
      optimalRatio: 1,
      warningMessage: "Fe:Zn ratio outside optimal range. Both compete for DMT1 transporter - balance intake.",
      severity: "medium" as const,
    },
    // Vitamin D3:K2 ratio - K2 directs calcium from D3
    // Optimal is ~100:1 IU D3 to mcg K2 (e.g., 5000 IU D3 with 50-100mcg K2)
    {
      sourceSupplementId: supplementMap.get("Vitamin D3")!,
      targetSupplementId: supplementMap.get("Vitamin K2 MK-7")!,
      minRatio: 50,
      maxRatio: 200,
      optimalRatio: 100,
      warningMessage: "D3:K2 ratio outside optimal range (50-200:1). K2 helps direct calcium to bones, preventing arterial calcification.",
      severity: "low" as const,
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
  const timingRules = [
    // Tyrosine and 5-HTP compete for LNAAT transporter
    {
      sourceSupplementId: supplementMap.get("L-Tyrosine")!,
      targetSupplementId: supplementMap.get("5-HTP")!,
      minHoursApart: 4,
      reason: "LNAAT transporter saturation - space apart for optimal absorption across BBB",
      severity: "medium" as const,
    },
    // Iron and Zinc compete for DMT1
    {
      sourceSupplementId: supplementMap.get("Iron Bisglycinate")!,
      targetSupplementId: supplementMap.get("Zinc Picolinate")!,
      minHoursApart: 2,
      reason: "DMT1 transporter competition - take at different meals for better absorption",
      severity: "medium" as const,
    },
    // Caffeine and Magnesium
    {
      sourceSupplementId: supplementMap.get("Caffeine")!,
      targetSupplementId: supplementMap.get("Magnesium Glycinate")!,
      minHoursApart: 2,
      reason: "Caffeine increases magnesium excretion - space apart for retention",
      severity: "low" as const,
    },
    // Vitamin B12 at night disrupts sleep
    {
      sourceSupplementId: supplementMap.get("Vitamin B12")!,
      targetSupplementId: supplementMap.get("Magnesium Glycinate")!, // proxy for "evening/sleep supplements"
      minHoursApart: 8,
      reason: "B12 can suppress melatonin - take in morning, not evening",
      severity: "low" as const,
    },
    // NAC timing - take away from meals for better absorption
    {
      sourceSupplementId: supplementMap.get("NAC")!,
      targetSupplementId: supplementMap.get("Zinc Picolinate")!,
      minHoursApart: 2,
      reason: "NAC chelates minerals - take 2 hours away from zinc for optimal absorption of both",
      severity: "medium" as const,
    },
    {
      sourceSupplementId: supplementMap.get("NAC")!,
      targetSupplementId: supplementMap.get("Iron Bisglycinate")!,
      minHoursApart: 2,
      reason: "NAC chelates minerals - take 2 hours away from iron for optimal absorption of both",
      severity: "medium" as const,
    },
    // Berberine timing - take before meals
    {
      sourceSupplementId: supplementMap.get("Berberine")!,
      targetSupplementId: supplementMap.get("Vitamin B6")!,
      minHoursApart: 2,
      reason: "Berberine may interfere with B6 - space apart to reduce interaction",
      severity: "medium" as const,
    },
    // Calcium and Iron timing
    {
      sourceSupplementId: supplementMap.get("Calcium")!,
      targetSupplementId: supplementMap.get("Iron Bisglycinate")!,
      minHoursApart: 2,
      reason: "Calcium significantly inhibits iron absorption - take at separate meals",
      severity: "medium" as const,
    },
    // Caffeine and Melatonin timing
    {
      sourceSupplementId: supplementMap.get("Caffeine")!,
      targetSupplementId: supplementMap.get("Melatonin")!,
      minHoursApart: 6,
      reason: "Caffeine has ~6 hour half-life and suppresses melatonin - avoid caffeine in evening",
      severity: "medium" as const,
    },
    // Caffeine and Creatine timing
    {
      sourceSupplementId: supplementMap.get("Caffeine")!,
      targetSupplementId: supplementMap.get("Creatine Monohydrate")!,
      minHoursApart: 1,
      reason: "Space apart to reduce potential absorption interference",
      severity: "low" as const,
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
  supplements.map((s) => [s.name, s.aliases])
);
