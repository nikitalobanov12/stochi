// Supplement aliases for fuzzy search
// Maps supplement name to common aliases/abbreviations

export const supplementAliases: Record<string, string[]> = {
  // ============================================
  // MAGNESIUM FORMS
  // ============================================
  "Magnesium Glycinate": [
    "mag glycinate",
    "magnesium bisgly",
    "mag bisgly",
    "calm magnesium",
    "mag",
    "magnesium",
  ],
  "Magnesium Citrate": ["mag citrate", "natural calm", "mag", "magnesium"],
  "Magnesium L-Threonate": [
    "mag threonate",
    "magtein",
    "brain magnesium",
    "mag",
    "magnesium",
  ],
  "Magnesium Oxide": ["mag oxide", "magox", "mag", "magnesium"],
  "Magnesium Malate": [
    "mag malate",
    "malic acid magnesium",
    "mag",
    "magnesium",
  ],

  // ============================================
  // ZINC FORMS
  // ============================================
  "Zinc Picolinate": ["zinc", "zn picolinate", "zn"],
  "Zinc Gluconate": ["zinc gluconate", "zn gluconate", "zinc", "zn"],

  // ============================================
  // B-VITAMINS
  // ============================================
  "Vitamin B1": ["b1", "thiamine", "vit b1", "thiamin"],
  "Vitamin B2": ["b2", "riboflavin", "vit b2", "r5p"],
  "Vitamin B3": ["b3", "niacin", "niacinamide", "vit b3", "nicotinamide"],
  "Vitamin B6": ["b6", "p5p", "pyridoxine", "vit b6", "pyridoxal"],
  Folate: ["b9", "folic acid", "methylfolate", "5-mthf", "vit b9", "folate"],
  "Vitamin B12": ["b12", "methylcobalamin", "cobalamin", "vit b12"],
  Biotin: ["vitamin b7", "b7", "vit b7", "biotin"],

  // ============================================
  // OTHER VITAMINS
  // ============================================
  "Vitamin D3": [
    "d3",
    "vit d",
    "vitamin d",
    "sunshine vitamin",
    "cholecalciferol",
  ],
  "Vitamin K2 MK-7": [
    "k2",
    "mk7",
    "mk-7",
    "vitamin k",
    "vit k2",
    "menaquinone",
    "k2 mk7",
  ],
  "Vitamin C": ["vit c", "ascorbic acid", "c"],
  "Vitamin E": ["vit e", "tocopherol", "e", "mixed tocopherols"],

  // ============================================
  // MINERALS
  // ============================================
  "Iron Bisglycinate": ["iron", "ferrous", "fe", "gentle iron"],
  "Copper Bisglycinate": ["copper", "cu"],
  Selenium: ["se", "selenomethionine"],
  Calcium: ["ca", "calcium citrate", "cal"],
  Potassium: ["k", "potassium citrate"],
  Boron: ["boron glycinate"],
  Iodine: ["iodide", "potassium iodide", "ki"],
  Chromium: ["chromium picolinate", "cr"],

  // ============================================
  // OMEGA-3
  // ============================================
  "Fish Oil (EPA)": [
    "epa",
    "omega 3",
    "omega-3",
    "fish oil",
    "omega3",
    "omega",
  ],
  "Fish Oil (DHA)": [
    "dha",
    "omega 3",
    "omega-3",
    "fish oil",
    "omega3",
    "brain omega",
    "omega",
  ],

  // ============================================
  // AMINO ACIDS
  // ============================================
  "L-Tyrosine": ["tyrosine", "l tyrosine"],
  "L-Theanine": ["theanine", "l theanine", "suntheanine"],
  "5-HTP": ["5htp", "hydroxytryptophan", "serotonin precursor"],
  GABA: ["gamma-aminobutyric acid", "pharmagaba", "gaba"],
  Glycine: ["gly", "glycine"],
  Taurine: ["tau", "taurine"],

  // ============================================
  // ANTIOXIDANTS
  // ============================================
  CoQ10: ["coenzyme q10", "ubiquinol", "ubiquinone", "coq"],
  "Alpha Lipoic Acid": ["ala", "r-ala", "r-lipoic acid", "lipoic acid"],
  NAC: ["n-acetyl cysteine", "n-acetylcysteine", "cysteine", "nac"],
  Quercetin: ["quercetin dihydrate"],
  Glutathione: ["gsh", "reduced glutathione", "liposomal glutathione"],

  // ============================================
  // NOOTROPICS & ADAPTOGENS
  // ============================================
  Caffeine: ["coffee", "caff"],
  Ashwagandha: ["ash", "ksm-66", "ksm66", "withania", "ashwa"],
  "Lion's Mane": ["lions mane", "hericium", "yamabushitake"],
  "Rhodiola Rosea": ["rhodiola", "golden root", "arctic root"],
  "Bacopa Monnieri": ["bacopa", "brahmi", "water hyssop"],
  Berberine: ["berberine hcl"],

  // ============================================
  // OTHER
  // ============================================
  Curcumin: ["turmeric", "curcuminoids"],
  Piperine: ["black pepper", "bioperine"],
  "Creatine Monohydrate": ["creatine", "creapure"],
  Collagen: ["collagen peptides", "hydrolyzed collagen", "collagen powder"],
  Melatonin: ["mel", "sleep hormone"],

  // ============================================
  // PEPTIDES & RESEARCH COMPOUNDS
  // ============================================
  "BPC-157": ["bpc", "bpc157", "body protection compound", "bpc 157"],
  "TB-500": ["tb500", "tb 500", "thymosin beta-4", "thymosin", "tb4"],
  Semaglutide: ["sema", "ozempic", "wegovy", "glp-1", "glp1"],
  "GHK-Cu": ["ghk", "ghk copper", "copper peptide", "ghkcu"],
  Ipamorelin: ["ipam", "ipa", "ipamorelin acetate"],
  "CJC-1295": ["cjc", "cjc1295", "mod grf", "mod grf 1-29", "cjc 1295"],

  // ============================================
  // RUSSIAN NOOTROPICS
  // ============================================
  Semax: ["semax nasal", "n-acetyl semax", "acth 4-10"],
  Selank: ["selank nasal", "tp-7", "tuftsin analog"],
  Noopept: [
    "noopept powder",
    "omberacetam",
    "gvs-111",
    "n-phenylacetyl-l-prolylglycine",
  ],
  Bromantane: ["ladasten", "bromantan", "adamantylbromphenylamine"],
  Phenylpiracetam: [
    "phenotropil",
    "carphedon",
    "fonturacetam",
    "phenyl piracetam",
  ],
};

/**
 * Fuzzy search supplements by name or alias
 * Returns supplements sorted by match quality
 */
export function fuzzySearchSupplements<
  T extends { id: string; name: string; form: string | null },
>(supplements: T[], query: string): T[] {
  if (!query.trim()) {
    return supplements;
  }

  const normalizedQuery = query.toLowerCase().trim();

  type ScoredSupplement = { supplement: T; score: number };

  const scored: ScoredSupplement[] = supplements.map((supplement) => {
    const name = supplement.name.toLowerCase();
    const form = supplement.form?.toLowerCase() ?? "";
    const aliases = supplementAliases[supplement.name] ?? [];

    let score = 0;

    // Exact name match (highest priority)
    if (name === normalizedQuery) {
      score = 100;
    }
    // Name starts with query
    else if (name.startsWith(normalizedQuery)) {
      score = 80;
    }
    // Name contains query
    else if (name.includes(normalizedQuery)) {
      score = 60;
    }
    // Form matches
    else if (form.includes(normalizedQuery)) {
      score = 50;
    }
    // Exact alias match
    else if (aliases.some((alias) => alias === normalizedQuery)) {
      score = 90;
    }
    // Alias starts with query
    else if (aliases.some((alias) => alias.startsWith(normalizedQuery))) {
      score = 70;
    }
    // Alias contains query
    else if (aliases.some((alias) => alias.includes(normalizedQuery))) {
      score = 55;
    }
    // Query words match parts of name (e.g., "vitamin k" matches "Vitamin K2 MK-7")
    else {
      const queryWords = normalizedQuery.split(/\s+/);
      const nameWords = name.split(/\s+/);
      const matchedWords = queryWords.filter((qw) =>
        nameWords.some((nw) => nw.startsWith(qw) || nw.includes(qw)),
      );
      if (matchedWords.length === queryWords.length) {
        score = 65;
      } else if (matchedWords.length > 0) {
        score = 40 * (matchedWords.length / queryWords.length);
      }
    }

    return { supplement, score };
  });

  // Filter to only matches and sort by score descending
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.supplement);
}
