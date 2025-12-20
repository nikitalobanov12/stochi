import { type cyp450EnzymeEnum, type cyp450EffectEnum } from "~/server/db/schema";

type CYP450Enzyme = (typeof cyp450EnzymeEnum.enumValues)[number];
type CYP450Effect = (typeof cyp450EffectEnum.enumValues)[number];

// ============================================================================
// CYP450 Pathway Data
// ============================================================================

export type CYP450PathwayEntry = {
  /** Supplement name to match */
  supplementName: string;
  /** The CYP450 enzyme involved */
  enzyme: CYP450Enzyme;
  /** Effect on the enzyme */
  effect: CYP450Effect;
  /** Strength of the effect */
  strength: "strong" | "moderate" | "weak";
  /** Clinical significance note */
  clinicalNote?: string;
  /** Research citation */
  researchUrl?: string;
};

/**
 * CYP450 pathway data for common supplements
 * 
 * CYP3A4: Most important enzyme, metabolizes ~50% of drugs
 * CYP1A2: Caffeine, theophylline metabolism
 * CYP2D6: Many medications, codeine activation
 * CYP2C9: Warfarin, NSAIDs
 * CYP2C19: Omeprazole, clopidogrel
 * CYP2E1: Alcohol, acetaminophen
 */
export const CYP450_PATHWAYS: CYP450PathwayEntry[] = [
  // ============================================================================
  // CYP3A4 - The "grapefruit enzyme"
  // ============================================================================
  {
    supplementName: "Grapefruit",
    enzyme: "CYP3A4",
    effect: "inhibitor",
    strength: "strong",
    clinicalNote: "Grapefruit juice can dramatically increase blood levels of CYP3A4 substrates. Effects can last 24-72 hours.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/21270773/",
  },
  {
    supplementName: "Bergamot",
    enzyme: "CYP3A4",
    effect: "inhibitor",
    strength: "strong",
    clinicalNote: "Contains furanocoumarins similar to grapefruit. Avoid with CYP3A4 substrates.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/28431216/",
  },
  {
    supplementName: "St. John's Wort",
    enzyme: "CYP3A4",
    effect: "inducer",
    strength: "strong",
    clinicalNote: "Potent inducer that can reduce efficacy of many medications. Effects persist for 1-2 weeks after stopping.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/10825660/",
  },
  {
    supplementName: "Curcumin",
    enzyme: "CYP3A4",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May increase levels of CYP3A4 substrates. Consider timing separation.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/17190858/",
  },
  {
    supplementName: "Berberine",
    enzyme: "CYP3A4",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May increase bioavailability of CYP3A4 substrates including some statins.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/24135129/",
  },
  {
    supplementName: "Quercetin",
    enzyme: "CYP3A4",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "Flavonoid that inhibits CYP3A4 at high doses.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/12134231/",
  },
  {
    supplementName: "Milk Thistle",
    enzyme: "CYP3A4",
    effect: "inhibitor",
    strength: "weak",
    clinicalNote: "Silymarin has mild CYP3A4 inhibition. Generally considered safe.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/15056709/",
  },
  {
    supplementName: "Resveratrol",
    enzyme: "CYP3A4",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May increase levels of CYP3A4 substrates at high doses.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/24456125/",
  },
  {
    supplementName: "CBD",
    enzyme: "CYP3A4",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "Cannabidiol inhibits CYP3A4. Monitor medications metabolized by this pathway.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/28861505/",
  },
  
  // ============================================================================
  // CYP1A2 - Caffeine metabolism
  // ============================================================================
  {
    supplementName: "Caffeine",
    enzyme: "CYP1A2",
    effect: "substrate",
    strength: "strong",
    clinicalNote: "Primary metabolic pathway for caffeine. CYP1A2 inhibitors will increase caffeine effects.",
  },
  {
    supplementName: "Quercetin",
    enzyme: "CYP1A2",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May slow caffeine metabolism, prolonging stimulant effects.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/12517226/",
  },
  {
    supplementName: "Curcumin",
    enzyme: "CYP1A2",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May increase caffeine half-life when taken together.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/17190858/",
  },
  {
    supplementName: "EGCG",
    enzyme: "CYP1A2",
    effect: "inhibitor",
    strength: "weak",
    clinicalNote: "Green tea catechins have mild CYP1A2 inhibition.",
  },
  {
    supplementName: "Melatonin",
    enzyme: "CYP1A2",
    effect: "substrate",
    strength: "strong",
    clinicalNote: "Melatonin is primarily metabolized by CYP1A2. Fluvoxamine dramatically increases levels.",
  },
  
  // ============================================================================
  // CYP2D6 - Important for many medications
  // ============================================================================
  {
    supplementName: "Berberine",
    enzyme: "CYP2D6",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May affect metabolism of CYP2D6 substrates like some antidepressants.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/24135129/",
  },
  {
    supplementName: "CBD",
    enzyme: "CYP2D6",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "CBD can inhibit CYP2D6, potentially affecting codeine activation.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/28861505/",
  },
  {
    supplementName: "Goldenseal",
    enzyme: "CYP2D6",
    effect: "inhibitor",
    strength: "strong",
    clinicalNote: "Berberine alkaloids strongly inhibit CYP2D6. Significant drug interaction potential.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/18322934/",
  },
  
  // ============================================================================
  // CYP2C9 - Warfarin metabolism
  // ============================================================================
  {
    supplementName: "Vitamin E",
    enzyme: "CYP2C9",
    effect: "substrate",
    strength: "weak",
    clinicalNote: "High-dose vitamin E may have anticoagulant effects via CYP2C9 pathway.",
  },
  {
    supplementName: "Fish Oil",
    enzyme: "CYP2C9",
    effect: "substrate",
    strength: "weak",
    clinicalNote: "Omega-3s may have mild antiplatelet effects. Monitor with warfarin.",
  },
  {
    supplementName: "Berberine",
    enzyme: "CYP2C9",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May increase warfarin levels and bleeding risk.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/24135129/",
  },
  
  // ============================================================================
  // CYP2C19 - Important for PPIs and clopidogrel
  // ============================================================================
  {
    supplementName: "CBD",
    enzyme: "CYP2C19",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May affect metabolism of omeprazole and clopidogrel.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/28861505/",
  },
  {
    supplementName: "Curcumin",
    enzyme: "CYP2C19",
    effect: "inhibitor",
    strength: "weak",
    clinicalNote: "Mild inhibition at typical supplement doses.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/17190858/",
  },
  
  // ============================================================================
  // CYP2E1 - Alcohol and acetaminophen
  // ============================================================================
  {
    supplementName: "NAC",
    enzyme: "CYP2E1",
    effect: "inhibitor",
    strength: "weak",
    clinicalNote: "N-acetylcysteine may provide protection against acetaminophen toxicity by inhibiting CYP2E1.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/15243923/",
  },
  {
    supplementName: "Resveratrol",
    enzyme: "CYP2E1",
    effect: "inhibitor",
    strength: "moderate",
    clinicalNote: "May protect against alcohol-induced liver damage by CYP2E1 inhibition.",
    researchUrl: "https://pubmed.ncbi.nlm.nih.gov/17854241/",
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all CYP450 pathways for a supplement
 */
export function getCYP450Pathways(supplementName: string): CYP450PathwayEntry[] {
  const normalizedName = supplementName.toLowerCase();
  return CYP450_PATHWAYS.filter(
    (entry) => normalizedName.includes(entry.supplementName.toLowerCase()) ||
               entry.supplementName.toLowerCase().includes(normalizedName)
  );
}

/**
 * Get all supplements that affect a specific enzyme
 */
export function getSupplementsByEnzyme(enzyme: CYP450Enzyme): CYP450PathwayEntry[] {
  return CYP450_PATHWAYS.filter((entry) => entry.enzyme === enzyme);
}

/**
 * Get all supplements that are substrates (metabolized by) an enzyme
 */
export function getSubstratesForEnzyme(enzyme: CYP450Enzyme): CYP450PathwayEntry[] {
  return CYP450_PATHWAYS.filter(
    (entry) => entry.enzyme === enzyme && entry.effect === "substrate"
  );
}

/**
 * Get all supplements that inhibit an enzyme
 */
export function getInhibitorsForEnzyme(enzyme: CYP450Enzyme): CYP450PathwayEntry[] {
  return CYP450_PATHWAYS.filter(
    (entry) => entry.enzyme === enzyme && entry.effect === "inhibitor"
  );
}

/**
 * Get all supplements that induce an enzyme
 */
export function getInducersForEnzyme(enzyme: CYP450Enzyme): CYP450PathwayEntry[] {
  return CYP450_PATHWAYS.filter(
    (entry) => entry.enzyme === enzyme && entry.effect === "inducer"
  );
}

/**
 * Check for CYP450 interactions between two supplements
 */
export type CYP450InteractionResult = {
  hasInteraction: boolean;
  enzyme: CYP450Enzyme;
  /** The supplement being affected (substrate) */
  substrate: string;
  /** The supplement causing the effect (inhibitor/inducer) */
  modulator: string;
  /** Effect type */
  effect: "inhibitor" | "inducer";
  /** Strength of the interaction */
  strength: "strong" | "moderate" | "weak";
  /** What this means clinically */
  description: string;
  /** Clinical note */
  clinicalNote?: string;
  /** Research URL */
  researchUrl?: string;
};

export function checkCYP450Interaction(
  supplement1: string,
  supplement2: string,
): CYP450InteractionResult[] {
  const pathways1 = getCYP450Pathways(supplement1);
  const pathways2 = getCYP450Pathways(supplement2);
  
  const interactions: CYP450InteractionResult[] = [];
  
  // Check if supplement1 is a substrate and supplement2 affects that enzyme
  for (const p1 of pathways1) {
    if (p1.effect !== "substrate") continue;
    
    for (const p2 of pathways2) {
      if (p2.enzyme !== p1.enzyme) continue;
      if (p2.effect === "substrate") continue; // Both substrates = competition, handled elsewhere
      
      const effectDescription = p2.effect === "inhibitor"
        ? `${supplement2} inhibits ${p2.enzyme}, which may increase ${supplement1} levels`
        : `${supplement2} induces ${p2.enzyme}, which may decrease ${supplement1} levels`;
      
      interactions.push({
        hasInteraction: true,
        enzyme: p2.enzyme,
        substrate: supplement1,
        modulator: supplement2,
        effect: p2.effect as "inhibitor" | "inducer",
        strength: p2.strength,
        description: effectDescription,
        clinicalNote: p2.clinicalNote,
        researchUrl: p2.researchUrl,
      });
    }
  }
  
  // Check the reverse direction
  for (const p2 of pathways2) {
    if (p2.effect !== "substrate") continue;
    
    for (const p1 of pathways1) {
      if (p1.enzyme !== p2.enzyme) continue;
      if (p1.effect === "substrate") continue;
      
      const effectDescription = p1.effect === "inhibitor"
        ? `${supplement1} inhibits ${p1.enzyme}, which may increase ${supplement2} levels`
        : `${supplement1} induces ${p1.enzyme}, which may decrease ${supplement2} levels`;
      
      interactions.push({
        hasInteraction: true,
        enzyme: p1.enzyme,
        substrate: supplement2,
        modulator: supplement1,
        effect: p1.effect as "inhibitor" | "inducer",
        strength: p1.strength,
        description: effectDescription,
        clinicalNote: p1.clinicalNote,
        researchUrl: p1.researchUrl,
      });
    }
  }
  
  return interactions;
}

/**
 * Check for CYP450 interactions across multiple supplements
 */
export function checkStackCYP450Interactions(
  supplementNames: string[],
): CYP450InteractionResult[] {
  const allInteractions: CYP450InteractionResult[] = [];
  
  // Check all pairs
  for (let i = 0; i < supplementNames.length; i++) {
    for (let j = i + 1; j < supplementNames.length; j++) {
      const supp1 = supplementNames[i];
      const supp2 = supplementNames[j];
      if (!supp1 || !supp2) continue;
      
      const interactions = checkCYP450Interaction(supp1, supp2);
      allInteractions.push(...interactions);
    }
  }
  
  return allInteractions;
}

/**
 * Get enzyme display name and description
 */
export function getEnzymeInfo(enzyme: CYP450Enzyme): {
  name: string;
  description: string;
  commonSubstrates: string;
} {
  const info: Record<CYP450Enzyme, { name: string; description: string; commonSubstrates: string }> = {
    CYP1A2: {
      name: "CYP1A2",
      description: "Caffeine and theophylline metabolism",
      commonSubstrates: "Caffeine, melatonin, theophylline",
    },
    CYP2C9: {
      name: "CYP2C9",
      description: "Warfarin and NSAID metabolism",
      commonSubstrates: "Warfarin, ibuprofen, losartan",
    },
    CYP2C19: {
      name: "CYP2C19",
      description: "PPI and clopidogrel metabolism",
      commonSubstrates: "Omeprazole, clopidogrel, diazepam",
    },
    CYP2D6: {
      name: "CYP2D6",
      description: "Many medications including antidepressants",
      commonSubstrates: "Codeine, metoprolol, fluoxetine",
    },
    CYP3A4: {
      name: "CYP3A4",
      description: "Most important enzyme, ~50% of drugs",
      commonSubstrates: "Statins, calcium channel blockers, many medications",
    },
    CYP2E1: {
      name: "CYP2E1",
      description: "Alcohol and acetaminophen metabolism",
      commonSubstrates: "Ethanol, acetaminophen, isoflurane",
    },
  };
  
  return info[enzyme];
}
