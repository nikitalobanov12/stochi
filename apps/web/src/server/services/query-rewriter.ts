/**
 * Query Rewriter Service
 *
 * Expands user questions with medical/scientific terminology
 * to improve RAG retrieval precision.
 */

import { logger } from "~/lib/logger";
import {
  generateCompletion,
  buildQueryRewritePrompt,
  isLlamaEnabled,
} from "./llama-client";

// ============================================================================
// Types
// ============================================================================

export type QueryRewriteResult = {
  originalQuery: string;
  rewrittenQuery: string;
  wasRewritten: boolean;
};

// ============================================================================
// Configuration
// ============================================================================

// Keywords that suggest the query is already well-formed and doesn't need rewriting
const SCIENTIFIC_KEYWORDS = [
  "mechanism",
  "pharmacokinetic",
  "bioavailability",
  "half-life",
  "absorption",
  "metabolism",
  "cytochrome",
  "cyp450",
  "receptor",
  "transporter",
  "cofactor",
  "enzyme",
  "pathway",
  "synthesis",
  "inhibit",
  "induce",
];

// Symptom-to-mechanism mappings for local expansion (fallback)
const SYMPTOM_EXPANSIONS: Record<string, string[]> = {
  constipation: [
    "GI motility",
    "hypercalcemia",
    "calcium absorption",
    "gut transit",
    "magnesium deficiency",
  ],
  fatigue: [
    "energy metabolism",
    "mitochondria",
    "ATP production",
    "B12 deficiency",
    "iron deficiency",
    "thyroid",
  ],
  insomnia: [
    "sleep quality",
    "GABA",
    "melatonin",
    "cortisol",
    "circadian rhythm",
    "glycine",
  ],
  anxiety: [
    "GABA receptor",
    "HPA axis",
    "cortisol",
    "magnesium",
    "L-theanine",
    "stress response",
  ],
  headache: [
    "migraine",
    "magnesium deficiency",
    "blood flow",
    "vasodilation",
    "dehydration",
  ],
  "brain fog": [
    "cognitive function",
    "acetylcholine",
    "neuroplasticity",
    "inflammation",
    "blood sugar",
  ],
  muscle: [
    "muscle cramps",
    "muscle relaxation",
    "electrolyte balance",
    "potassium",
    "magnesium",
  ],
  nausea: [
    "GI distress",
    "stomach acid",
    "absorption",
    "take with food",
    "dosage timing",
  ],
  diarrhea: [
    "GI motility",
    "osmotic effect",
    "magnesium citrate",
    "dosage",
    "malabsorption",
  ],
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Rewrite a user question to improve semantic search results.
 *
 * Uses Llama 3.1 to expand the query with medical terminology,
 * with a local fallback for common symptom patterns.
 *
 * @param question - The original user question
 * @param supplementName - The supplement being queried
 * @param userStack - User's current supplement stack (for context)
 * @returns The rewritten query result
 */
export async function rewriteQuery(
  question: string,
  supplementName: string,
  userStack: string[] = [],
): Promise<QueryRewriteResult> {
  const originalQuery = question.trim();

  // Skip rewriting if query is already scientific/detailed
  if (isQueryWellFormed(originalQuery)) {
    logger.info("Query is already well-formed, skipping rewrite");
    return {
      originalQuery,
      rewrittenQuery: `${supplementName} ${originalQuery}`,
      wasRewritten: false,
    };
  }

  // Try LLM-based rewriting first
  if (isLlamaEnabled()) {
    try {
      const llmResult = await rewriteWithLlama(
        originalQuery,
        supplementName,
        userStack,
      );
      if (llmResult) {
        return {
          originalQuery,
          rewrittenQuery: llmResult,
          wasRewritten: true,
        };
      }
    } catch (error) {
      logger.warn(
        `LLM query rewrite failed: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      // Fall through to local expansion
    }
  }

  // Fallback to local symptom expansion
  const localExpansion = expandQueryLocally(originalQuery, supplementName);

  return {
    originalQuery,
    rewrittenQuery: localExpansion,
    wasRewritten: localExpansion !== `${supplementName} ${originalQuery}`,
  };
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Check if the query already contains scientific terminology.
 */
function isQueryWellFormed(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Check for scientific keywords
  const hasScientificTerms = SCIENTIFIC_KEYWORDS.some((keyword) =>
    lowerQuery.includes(keyword),
  );

  // Check if query is already detailed (more than 10 words)
  const wordCount = query.split(/\s+/).length;
  const isDetailed = wordCount > 10;

  return hasScientificTerms || isDetailed;
}

/**
 * Use Llama to rewrite the query with medical terminology.
 */
async function rewriteWithLlama(
  question: string,
  supplementName: string,
  userStack: string[],
): Promise<string | null> {
  const prompt = buildQueryRewritePrompt(question, supplementName, userStack);

  const result = await generateCompletion(
    [
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      maxTokens: 100,
      temperature: 0.3, // Lower temperature for more focused output
      timeoutMs: 10000, // Shorter timeout for query rewriting
    },
  );

  if (result.finishReason === "error" || !result.content) {
    return null;
  }

  // Clean up the result
  let rewritten = result.content.trim();

  // Remove any quotes or explanatory text
  rewritten = rewritten.replace(/^["']|["']$/g, "");
  rewritten = rewritten.replace(/^(Query:|Rewritten:|Output:)\s*/i, "");

  // Ensure the supplement name is included
  if (!rewritten.toLowerCase().includes(supplementName.toLowerCase())) {
    rewritten = `${supplementName} ${rewritten}`;
  }

  // Validate the rewritten query isn't too long or nonsensical
  if (rewritten.length > 500 || rewritten.split(/\s+/).length > 50) {
    logger.warn("Rewritten query too long, using fallback");
    return null;
  }

  logger.info(`Query rewritten: "${question}" -> "${rewritten}"`);
  return rewritten;
}

/**
 * Local fallback for query expansion using symptom mappings.
 */
function expandQueryLocally(question: string, supplementName: string): string {
  const lowerQuestion = question.toLowerCase();
  const expansions: string[] = [supplementName];

  // Find matching symptom expansions
  for (const [symptom, terms] of Object.entries(SYMPTOM_EXPANSIONS)) {
    if (lowerQuestion.includes(symptom)) {
      expansions.push(...terms.slice(0, 3)); // Add up to 3 related terms
    }
  }

  // Add common question patterns
  if (lowerQuestion.includes("why")) {
    expansions.push("mechanism", "cause");
  }
  if (lowerQuestion.includes("when") || lowerQuestion.includes("time")) {
    expansions.push("timing", "optimal time", "absorption");
  }
  if (lowerQuestion.includes("how much") || lowerQuestion.includes("dose")) {
    expansions.push("dosage", "recommended dose", "upper limit");
  }
  if (lowerQuestion.includes("safe") || lowerQuestion.includes("risk")) {
    expansions.push("safety", "side effects", "contraindications");
  }
  if (lowerQuestion.includes("interact") || lowerQuestion.includes("with")) {
    expansions.push("interactions", "drug interactions", "contraindications");
  }

  // Combine original question with expansions
  const expanded = `${question} ${expansions.join(" ")}`;

  // Remove duplicates and clean up
  const words = expanded.split(/\s+/);
  const uniqueWords = [...new Set(words.map((w) => w.toLowerCase()))];

  return uniqueWords.join(" ");
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract key terms from a question for hybrid search.
 */
export function extractKeyTerms(question: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "can", "i", "me", "my", "we", "our",
    "you", "your", "he", "she", "it", "they", "them", "this", "that",
    "what", "which", "who", "when", "where", "why", "how", "if", "then",
    "so", "but", "and", "or", "not", "no", "yes", "to", "of", "in", "on",
    "at", "by", "for", "with", "about", "into", "through", "during",
    "before", "after", "above", "below", "from", "up", "down", "out",
  ]);

  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return [...new Set(words)];
}
