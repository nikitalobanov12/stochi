/**
 * Seed script to update supplements with suggestedFrequency and frequencyNotes
 * based on research from Examine.com and clinical guidelines.
 *
 * Run with: cd apps/web && bun run tsx scripts/seed-frequency.ts
 */

import { db } from "../src/server/db";
import { supplement } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

type FrequencyData = {
  name: string;
  suggestedFrequency: "daily" | "specific_days" | "as_needed";
  frequencyNotes: string;
};

/**
 * Supplements that benefit from cycling or have specific frequency recommendations.
 * Based on Examine.com research and clinical guidelines.
 */
const FREQUENCY_DATA: FrequencyData[] = [
  // === Adaptogens (cycling recommended to prevent tolerance) ===
  {
    name: "Ashwagandha",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Cycle 8 weeks on, 2-4 weeks off. Continuous use may reduce effectiveness due to receptor adaptation. Some protocols use 5 days on, 2 days off.",
  },
  {
    name: "Rhodiola Rosea",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Best used cyclically or as-needed for acute stress/fatigue. Cycle 3-4 weeks on, 1 week off. May lose effectiveness with continuous daily use.",
  },

  // === NAC (cycling recommended for antioxidant balance) ===
  {
    name: "N-Acetyl Cysteine (NAC)",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Cycle 4-8 weeks on, 2-4 weeks off. Long-term continuous use may disrupt redox balance. Some use 5 days on, 2 days off. Take on empty stomach.",
  },

  // === Stimulants (tolerance builds quickly) ===
  {
    name: "Caffeine",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Tolerance develops within 1-2 weeks of daily use. Consider cycling (5 days on, 2 off) or periodic 1-2 week breaks to restore sensitivity.",
  },

  // === Nootropics (cycling often recommended) ===
  {
    name: "Alpha-GPC",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Some evidence suggests cycling may help maintain effectiveness. Consider 5 days on, 2 days off, or use as-needed before cognitive tasks.",
  },
  {
    name: "Phenylpiracetam",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Tolerance develops rapidly with daily use. Best used 2-3x per week maximum or reserved for demanding cognitive tasks. Cycle 2 weeks on, 2 weeks off.",
  },
  {
    name: "Modafinil",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Not for daily use due to tolerance. Use 1-3x per week maximum. Extended use may reduce effectiveness and disrupt sleep architecture.",
  },

  // === Melatonin (as-needed preferred) ===
  {
    name: "Melatonin",
    suggestedFrequency: "as_needed",
    frequencyNotes:
      "Best used as-needed for jet lag, shift work, or occasional sleep issues. Daily long-term use may suppress natural production. Start with 0.3-0.5mg.",
  },

  // === Pre-workout compounds (tolerance/cycling) ===
  {
    name: "Beta-Alanine",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily dosing required to saturate muscle carnosine levels (takes 2-4 weeks). Can cycle 8-12 weeks on, 4 weeks off, though continuous use is also acceptable.",
  },
  {
    name: "Citrulline",
    suggestedFrequency: "daily",
    frequencyNotes:
      "No tolerance develops. Safe for daily use. Can also be used as-needed pre-workout. Benefits accumulate with consistent use.",
  },
  {
    name: "L-Citrulline",
    suggestedFrequency: "daily",
    frequencyNotes:
      "No tolerance develops. Safe for daily use. Can also be used as-needed pre-workout. Benefits accumulate with consistent use.",
  },

  // === Herbal extracts (cycling often beneficial) ===
  {
    name: "Bacopa Monnieri",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Requires 8-12 weeks of daily use for cognitive benefits. Some cycle 12 weeks on, 4 weeks off. Fat-soluble - take with meals.",
  },
  {
    name: "Lion's Mane",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use for NGF benefits. Some protocols suggest cycling 4 weeks on, 1 week off, though continuous use appears safe.",
  },
  {
    name: "Tongkat Ali",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Cycle 5 days on, 2 days off, or 3 weeks on, 1 week off. Cycling helps maintain hormonal sensitivity and effectiveness.",
  },
  {
    name: "Fadogia Agrestis",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Limited safety data for long-term use. Cycle 8 weeks on, 2-4 weeks off. Monitor for any testicular discomfort.",
  },
  {
    name: "Shilajit",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Traditional use suggests cycling. Consider 6-8 weeks on, 2 weeks off. Quality varies significantly between products.",
  },

  // === Sleep aids (as-needed to prevent dependence) ===
  {
    name: "GABA",
    suggestedFrequency: "as_needed",
    frequencyNotes:
      "Use as-needed for acute stress or sleep. Daily use may lead to tolerance. Poor oral bioavailability - sublingual may work better.",
  },
  {
    name: "L-Theanine",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Safe for daily use with no tolerance development. Can also be used as-needed for acute stress or with caffeine.",
  },
  {
    name: "Valerian Root",
    suggestedFrequency: "as_needed",
    frequencyNotes:
      "Best used as-needed or for short periods (2-4 weeks). Long-term daily use may reduce effectiveness. Takes 2-4 weeks for full effect.",
  },

  // === Minerals (daily, but some considerations) ===
  {
    name: "Zinc",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use safe at proper doses (15-30mg). Long-term high doses (>40mg) can deplete copper. Consider cycling high doses.",
  },
  {
    name: "Zinc Picolinate",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use safe at proper doses. High absorption form. Long-term use >30mg may require copper supplementation.",
  },

  // === Vitamins (mostly daily) ===
  {
    name: "Vitamin D3",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily dosing preferred for stable blood levels. Weekly mega-doses are less effective. Test levels after 3 months. Take with fat.",
  },
  {
    name: "Vitamin K2",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended, especially if supplementing D3. MK-7 form has longer half-life and can be taken once daily.",
  },

  // === Omega-3s (daily) ===
  {
    name: "Fish Oil",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended for consistent omega-3 levels. Benefits accumulate over weeks. Take with meals to reduce fishy burps.",
  },
  {
    name: "Omega-3",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended. EPA for mood/inflammation, DHA for brain. Split doses if taking >2g. Store in fridge.",
  },
  {
    name: "Krill Oil",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended. Better absorbed than fish oil. Contains astaxanthin. More expensive per EPA/DHA.",
  },

  // === Creatine (daily, loading optional) ===
  {
    name: "Creatine Monohydrate",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use (3-5g) for muscle saturation. No cycling needed - safe for long-term daily use. Stay hydrated.",
  },
  {
    name: "Creatine",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use (3-5g) recommended. No cycling needed. Loading phase optional (20g/day for 5-7 days). Take any time of day.",
  },

  // === Magnesium (daily) ===
  {
    name: "Magnesium Glycinate",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended. Well-absorbed and gentle on stomach. Evening dosing may support sleep. Safe long-term.",
  },
  {
    name: "Magnesium L-Threonate",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use for cognitive benefits. Crosses blood-brain barrier. Often split into 2-3 doses. More expensive.",
  },
  {
    name: "Magnesium Citrate",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended. Good absorption. May have mild laxative effect at higher doses. Take with food.",
  },
  {
    name: "Magnesium",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended - most people are deficient. Different forms for different goals. Take consistently.",
  },

  // === Iron (specific considerations) ===
  {
    name: "Iron",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Take every other day for better absorption (research shows alternate-day dosing is more effective). Test ferritin levels before supplementing.",
  },
  {
    name: "Iron Bisglycinate",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Alternate-day dosing improves absorption. Gentle form with fewer GI side effects. Take away from calcium, coffee, tea.",
  },

  // === Probiotics (daily or cycling) ===
  {
    name: "Probiotics",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended for gut health. Some rotate strains monthly. Take consistently for 4+ weeks to assess benefits.",
  },

  // === Collagen (daily) ===
  {
    name: "Collagen Peptides",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use for skin/joint benefits. Effects take 8-12 weeks. Can be taken any time. Vitamin C enhances synthesis.",
  },
  {
    name: "Collagen",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended. Benefits accumulate over 2-3 months. Type I/III for skin, Type II for joints.",
  },

  // === Glutathione/antioxidants ===
  {
    name: "Glutathione",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use if supplementing. Liposomal or reduced forms better absorbed. NAC is a more cost-effective precursor.",
  },

  // === CoQ10 (daily) ===
  {
    name: "CoQ10",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended. Ubiquinol form better for those over 40. Take with fat-containing meal. Essential if on statins.",
  },
  {
    name: "Ubiquinol",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended. Active form of CoQ10, better absorbed. Take with meals containing fat.",
  },

  // === B Vitamins (daily) ===
  {
    name: "Vitamin B12",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use safe - excess excreted. Methylcobalamin preferred. Essential for vegans/vegetarians. Sublingual well-absorbed.",
  },
  {
    name: "B-Complex",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use recommended. Take in morning as B vitamins can be energizing. Look for methylated forms (methylfolate, methylcobalamin).",
  },

  // === Berberine (cycling recommended) ===
  {
    name: "Berberine",
    suggestedFrequency: "specific_days",
    frequencyNotes:
      "Cycle 8-12 weeks on, 4 weeks off. Long-term continuous use may affect gut bacteria. Take with meals, split doses.",
  },

  // === Quercetin ===
  {
    name: "Quercetin",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use during allergy season or for ongoing inflammation. Can cycle during low-symptom periods. Take with bromelain for absorption.",
  },

  // === Curcumin/Turmeric ===
  {
    name: "Curcumin",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use for anti-inflammatory benefits. Requires piperine or lipid formulation for absorption. Safe long-term.",
  },
  {
    name: "Turmeric",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily use safe. Whole turmeric less potent than curcumin extracts. Black pepper dramatically increases absorption.",
  },

  // === Electrolytes ===
  {
    name: "Electrolytes",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily if active, fasting, or low-carb. Adjust based on sweat loss and diet. More important than most realize.",
  },
  {
    name: "Potassium",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily if diet is low in potassium-rich foods. Don't exceed 99mg in supplements without medical supervision.",
  },
  {
    name: "Sodium",
    suggestedFrequency: "daily",
    frequencyNotes:
      "Daily if active, sweating heavily, or on low-carb diet. Most get enough from food. Athletes may need 2-3g extra.",
  },
];

async function seedFrequencyData() {
  console.log("Starting frequency data seed...\n");

  let updated = 0;
  let notFound = 0;

  for (const data of FREQUENCY_DATA) {
    // Find supplement by name (case-insensitive)
    const existing = await db.query.supplement.findFirst({
      where: (s, { ilike }) => ilike(s.name, data.name),
      columns: { id: true, name: true },
    });

    if (!existing) {
      console.log(`⚠️  Not found: ${data.name}`);
      notFound++;
      continue;
    }

    await db
      .update(supplement)
      .set({
        suggestedFrequency: data.suggestedFrequency,
        frequencyNotes: data.frequencyNotes,
      })
      .where(eq(supplement.id, existing.id));

    console.log(`✓ Updated: ${existing.name} → ${data.suggestedFrequency}`);
    updated++;
  }

  console.log(`\n✅ Done! Updated ${updated} supplements, ${notFound} not found.`);
}

seedFrequencyData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
