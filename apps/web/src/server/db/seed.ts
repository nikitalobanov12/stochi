import { db } from "./index";
import { supplement, interaction, ratioRule, timingRule } from "./schema";

const supplements = [
  // Magnesium forms
  {
    name: "Magnesium Glycinate",
    form: "Magnesium Bisglycinate",
    elementalWeight: 14.1,
    aliases: ["mag glycinate", "magnesium bisgly", "mag bisgly", "calm magnesium"],
  },
  {
    name: "Magnesium Citrate",
    form: "Magnesium Citrate",
    elementalWeight: 16.2,
    aliases: ["mag citrate", "natural calm"],
  },
  {
    name: "Magnesium L-Threonate",
    form: "Magnesium L-Threonate",
    elementalWeight: 7.2,
    aliases: ["mag threonate", "magtein", "brain magnesium"],
  },
  {
    name: "Magnesium Oxide",
    form: "Magnesium Oxide",
    elementalWeight: 60.3,
    aliases: ["mag oxide", "magox"],
  },

  // Zinc forms
  {
    name: "Zinc Picolinate",
    form: "Zinc Picolinate",
    elementalWeight: 21.0,
    aliases: ["zinc", "zn picolinate"],
  },
  {
    name: "Zinc Gluconate",
    form: "Zinc Gluconate",
    elementalWeight: 14.3,
    aliases: ["zinc gluconate", "zn gluconate"],
  },

  // Vitamins
  {
    name: "Vitamin D3",
    form: "Cholecalciferol",
    elementalWeight: 100,
    aliases: ["d3", "vit d", "vitamin d", "sunshine vitamin", "cholecalciferol"],
  },
  {
    name: "Vitamin K2 MK-7",
    form: "Menaquinone-7",
    elementalWeight: 100,
    aliases: ["k2", "mk7", "mk-7", "vitamin k", "vit k2", "menaquinone"],
  },
  {
    name: "Vitamin C",
    form: "Ascorbic Acid",
    elementalWeight: 100,
    aliases: ["vit c", "ascorbic acid", "c"],
  },
  {
    name: "Vitamin B12",
    form: "Methylcobalamin",
    elementalWeight: 100,
    aliases: ["b12", "methylcobalamin", "cobalamin", "vit b12"],
  },

  // Minerals
  {
    name: "Iron Bisglycinate",
    form: "Ferrous Bisglycinate",
    elementalWeight: 20.0,
    aliases: ["iron", "ferrous", "fe", "gentle iron"],
  },
  {
    name: "Copper Bisglycinate",
    form: "Copper Bisglycinate",
    elementalWeight: 25.0,
    aliases: ["copper", "cu"],
  },
  {
    name: "Selenium",
    form: "Selenomethionine",
    elementalWeight: 100,
    aliases: ["se", "selenomethionine"],
  },

  // Omega-3
  {
    name: "Fish Oil (EPA)",
    form: "Eicosapentaenoic Acid",
    elementalWeight: 100,
    aliases: ["epa", "omega 3", "omega-3", "fish oil", "omega3"],
  },
  {
    name: "Fish Oil (DHA)",
    form: "Docosahexaenoic Acid",
    elementalWeight: 100,
    aliases: ["dha", "omega 3", "omega-3", "fish oil", "omega3", "brain omega"],
  },

  // Amino Acids
  {
    name: "L-Tyrosine",
    form: "L-Tyrosine",
    elementalWeight: 100,
    aliases: ["tyrosine", "l tyrosine"],
  },
  {
    name: "L-Theanine",
    form: "L-Theanine",
    elementalWeight: 100,
    aliases: ["theanine", "l theanine", "suntheanine"],
  },
  {
    name: "5-HTP",
    form: "5-Hydroxytryptophan",
    elementalWeight: 100,
    aliases: ["5htp", "hydroxytryptophan", "serotonin precursor"],
  },

  // Other
  {
    name: "Caffeine",
    form: "Caffeine Anhydrous",
    elementalWeight: 100,
    aliases: ["coffee", "caff"],
  },
  {
    name: "Curcumin",
    form: "Curcuminoids",
    elementalWeight: 100,
    aliases: ["turmeric", "curcuminoids"],
  },
  {
    name: "Piperine",
    form: "Black Pepper Extract",
    elementalWeight: 100,
    aliases: ["black pepper", "bioperine"],
  },
  {
    name: "Ashwagandha",
    form: "KSM-66 Extract",
    elementalWeight: 100,
    aliases: ["ash", "ksm-66", "ksm66", "withania", "ashwa"],
  },
  {
    name: "Creatine Monohydrate",
    form: "Creatine Monohydrate",
    elementalWeight: 100,
    aliases: ["creatine", "creapure"],
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
    // Zinc-Copper competition (critical for biohackers)
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

    // Iron-Zinc competition
    {
      sourceId: supplementMap.get("Iron Bisglycinate")!,
      targetId: supplementMap.get("Zinc Picolinate")!,
      type: "competition" as const,
      mechanism: "DMT1 transporter competition",
      severity: "medium" as const,
    },

    // Vitamin C enhances Iron absorption
    {
      sourceId: supplementMap.get("Vitamin C")!,
      targetId: supplementMap.get("Iron Bisglycinate")!,
      type: "synergy" as const,
      mechanism: "Reduces ferric iron to ferrous form, enhances absorption",
      severity: "low" as const,
    },

    // Vitamin D3 and K2 synergy
    {
      sourceId: supplementMap.get("Vitamin D3")!,
      targetId: supplementMap.get("Vitamin K2 MK-7")!,
      type: "synergy" as const,
      mechanism: "K2 directs calcium mobilized by D3 to bones, prevents arterial calcification",
      severity: "low" as const,
    },

    // Caffeine depletes Magnesium
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

    // L-Theanine + Caffeine synergy
    {
      sourceId: supplementMap.get("L-Theanine")!,
      targetId: supplementMap.get("Caffeine")!,
      type: "synergy" as const,
      mechanism: "L-Theanine smooths caffeine effects, reduces jitters",
      severity: "low" as const,
    },

    // Tyrosine and 5-HTP competition (LNAAT transporter)
    {
      sourceId: supplementMap.get("L-Tyrosine")!,
      targetId: supplementMap.get("5-HTP")!,
      type: "competition" as const,
      mechanism: "Large Neutral Amino Acid Transporter (LNAAT) competition at BBB",
      severity: "medium" as const,
    },

    // Piperine enhances Curcumin
    {
      sourceId: supplementMap.get("Piperine")!,
      targetId: supplementMap.get("Curcumin")!,
      type: "synergy" as const,
      mechanism: "Inhibits glucuronidation, increases curcumin bioavailability by 2000%",
      severity: "low" as const,
    },

    // Piperine inhibits CYP3A4 (affects many drugs)
    {
      sourceId: supplementMap.get("Piperine")!,
      targetId: supplementMap.get("Caffeine")!,
      type: "inhibition" as const,
      mechanism: "CYP3A4 inhibition increases caffeine half-life",
      severity: "medium" as const,
    },

    // Calcium and Magnesium competition
    {
      sourceId: supplementMap.get("Magnesium Glycinate")!,
      targetId: supplementMap.get("Iron Bisglycinate")!,
      type: "competition" as const,
      mechanism: "Compete for absorption in small intestine",
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
