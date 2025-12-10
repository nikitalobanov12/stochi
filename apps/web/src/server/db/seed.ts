import { db } from "./index";
import { supplement, interaction } from "./schema";

const supplements = [
  // Magnesium forms
  {
    name: "Magnesium Glycinate",
    form: "Magnesium Bisglycinate",
    elementalWeight: 14.1,
  },
  {
    name: "Magnesium Citrate",
    form: "Magnesium Citrate",
    elementalWeight: 16.2,
  },
  {
    name: "Magnesium L-Threonate",
    form: "Magnesium L-Threonate",
    elementalWeight: 7.2,
  },
  {
    name: "Magnesium Oxide",
    form: "Magnesium Oxide",
    elementalWeight: 60.3,
  },

  // Zinc forms
  {
    name: "Zinc Picolinate",
    form: "Zinc Picolinate",
    elementalWeight: 21.0,
  },
  {
    name: "Zinc Gluconate",
    form: "Zinc Gluconate",
    elementalWeight: 14.3,
  },

  // Vitamins
  {
    name: "Vitamin D3",
    form: "Cholecalciferol",
    elementalWeight: 100,
  },
  {
    name: "Vitamin K2 MK-7",
    form: "Menaquinone-7",
    elementalWeight: 100,
  },
  {
    name: "Vitamin C",
    form: "Ascorbic Acid",
    elementalWeight: 100,
  },
  {
    name: "Vitamin B12",
    form: "Methylcobalamin",
    elementalWeight: 100,
  },

  // Minerals
  {
    name: "Iron Bisglycinate",
    form: "Ferrous Bisglycinate",
    elementalWeight: 20.0,
  },
  {
    name: "Copper Bisglycinate",
    form: "Copper Bisglycinate",
    elementalWeight: 25.0,
  },
  {
    name: "Selenium",
    form: "Selenomethionine",
    elementalWeight: 100,
  },

  // Omega-3
  {
    name: "Fish Oil (EPA)",
    form: "Eicosapentaenoic Acid",
    elementalWeight: 100,
  },
  {
    name: "Fish Oil (DHA)",
    form: "Docosahexaenoic Acid",
    elementalWeight: 100,
  },

  // Amino Acids
  {
    name: "L-Tyrosine",
    form: "L-Tyrosine",
    elementalWeight: 100,
  },
  {
    name: "L-Theanine",
    form: "L-Theanine",
    elementalWeight: 100,
  },
  {
    name: "5-HTP",
    form: "5-Hydroxytryptophan",
    elementalWeight: 100,
  },

  // Other
  {
    name: "Caffeine",
    form: "Caffeine Anhydrous",
    elementalWeight: 100,
  },
  {
    name: "Curcumin",
    form: "Curcuminoids",
    elementalWeight: 100,
  },
  {
    name: "Piperine",
    form: "Black Pepper Extract",
    elementalWeight: 100,
  },
  {
    name: "Ashwagandha",
    form: "KSM-66 Extract",
    elementalWeight: 100,
  },
  {
    name: "Creatine Monohydrate",
    form: "Creatine Monohydrate",
    elementalWeight: 100,
  },
];

async function seed() {
  console.log("Seeding supplements...");

  const insertedSupplements = await db
    .insert(supplement)
    .values(supplements)
    .returning();

  console.log(`Inserted ${insertedSupplements.length} supplements`);

  const supplementMap = new Map(
    insertedSupplements.map((s) => [s.name, s.id]),
  );

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

  const insertedInteractions = await db
    .insert(interaction)
    .values(interactions)
    .returning();

  console.log(`Inserted ${insertedInteractions.length} interactions`);

  console.log("Seed completed!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
