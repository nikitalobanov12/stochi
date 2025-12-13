// Supplement aliases for fuzzy search
// Maps supplement name to common aliases/abbreviations

export const supplementAliases: Record<string, string[]> = {
  // Magnesium forms
  "Magnesium Glycinate": ["mag glycinate", "magnesium bisgly", "mag bisgly", "calm magnesium", "mag", "magnesium"],
  "Magnesium Citrate": ["mag citrate", "natural calm", "mag", "magnesium"],
  "Magnesium L-Threonate": ["mag threonate", "magtein", "brain magnesium", "mag", "magnesium"],
  "Magnesium Oxide": ["mag oxide", "magox", "mag", "magnesium"],

  // Zinc forms
  "Zinc Picolinate": ["zinc", "zn picolinate", "zn"],
  "Zinc Gluconate": ["zinc gluconate", "zn gluconate", "zinc", "zn"],

  // Vitamins
  "Vitamin D3": ["d3", "vit d", "vitamin d", "sunshine vitamin", "cholecalciferol"],
  "Vitamin K2 MK-7": ["k2", "mk7", "mk-7", "vitamin k", "vit k2", "menaquinone", "k2 mk7"],
  "Vitamin C": ["vit c", "ascorbic acid", "c"],
  "Vitamin B12": ["b12", "methylcobalamin", "cobalamin", "vit b12"],

  // Minerals
  "Iron Bisglycinate": ["iron", "ferrous", "fe", "gentle iron"],
  "Copper Bisglycinate": ["copper", "cu"],
  "Selenium": ["se", "selenomethionine"],

  // Omega-3
  "Fish Oil (EPA)": ["epa", "omega 3", "omega-3", "fish oil", "omega3", "omega"],
  "Fish Oil (DHA)": ["dha", "omega 3", "omega-3", "fish oil", "omega3", "brain omega", "omega"],

  // Amino Acids
  "L-Tyrosine": ["tyrosine", "l tyrosine"],
  "L-Theanine": ["theanine", "l theanine", "suntheanine"],
  "5-HTP": ["5htp", "hydroxytryptophan", "serotonin precursor"],

  // Other
  "Caffeine": ["coffee", "caff"],
  "Curcumin": ["turmeric", "curcuminoids"],
  "Piperine": ["black pepper", "bioperine"],
  "Ashwagandha": ["ash", "ksm-66", "ksm66", "withania", "ashwa"],
  "Creatine Monohydrate": ["creatine", "creapure"],
};

/**
 * Fuzzy search supplements by name or alias
 * Returns supplements sorted by match quality
 */
export function fuzzySearchSupplements<T extends { id: string; name: string; form: string | null }>(
  supplements: T[],
  query: string
): T[] {
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
        nameWords.some((nw) => nw.startsWith(qw) || nw.includes(qw))
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
