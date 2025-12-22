/**
 * RAG Retrieval Service
 *
 * Handles semantic search for supplement knowledge using pgvector.
 * Retrieves relevant chunks to ground LLM responses.
 */

import { sql, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { supplementKnowledge, supplement } from "~/server/db/schema";
import { generateEmbedding, isEmbeddingsEnabled } from "./embeddings";
import { rewriteQuery } from "./query-rewriter";
import { logger } from "~/lib/logger";

// ============================================================================
// Types
// ============================================================================

export type RetrievedChunk = {
  id: string;
  supplementId: string;
  supplementName: string;
  chunkType: string;
  title: string | null;
  content: string;
  sourceUrl: string | null;
  similarity: number;
  metadata: {
    evidenceRating?: string;
    studyCount?: number;
  };
};

export type RetrievalOptions = {
  limit?: number;
  minSimilarity?: number;
  chunkTypes?: string[];
  includeCoFactors?: boolean;
  coFactorSupplementIds?: string[];
};

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  query: {
    originalQuery: string;
    rewrittenQuery: string;
    wasRewritten: boolean;
  };
};

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_SIMILARITY = 0.3;
const CO_FACTOR_LIMIT = 2; // Max chunks from co-factor supplements

// Known co-factor relationships for multi-supplement logic
const CO_FACTOR_MAP: Record<string, string[]> = {
  // Vitamin D co-factors
  "vitamin d": ["vitamin k2", "magnesium", "calcium"],
  "vitamin d3": ["vitamin k2", "magnesium", "calcium"],
  // Zinc co-factors
  zinc: ["copper"],
  // Iron co-factors
  iron: ["vitamin c"],
  // B vitamins
  "vitamin b12": ["folate", "vitamin b6"],
  folate: ["vitamin b12", "vitamin b6"],
  // Magnesium forms
  magnesium: ["vitamin d", "vitamin b6"],
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Retrieve relevant knowledge chunks for a question.
 *
 * @param question - The user's question
 * @param supplementId - The primary supplement to search
 * @param supplementName - Name of the supplement (for query rewriting)
 * @param userStack - User's current supplement stack
 * @param options - Retrieval options
 * @returns Retrieved chunks with similarity scores
 */
export async function retrieveRelevantChunks(
  question: string,
  supplementId: string,
  supplementName: string,
  userStack: string[] = [],
  options: RetrievalOptions = {},
): Promise<RetrievalResult> {
  const {
    limit = DEFAULT_LIMIT,
    minSimilarity = DEFAULT_MIN_SIMILARITY,
    chunkTypes,
    includeCoFactors = true,
  } = options;

  // Step 1: Rewrite query for better retrieval
  const queryResult = await rewriteQuery(question, supplementName, userStack);
  logger.info(`Searching with query: "${queryResult.rewrittenQuery}"`);

  // Step 2: Generate embedding for the query
  if (!isEmbeddingsEnabled()) {
    logger.warn("Embeddings not enabled, returning empty results");
    return {
      chunks: [],
      query: queryResult,
    };
  }

  const { embedding: queryEmbedding } = await generateEmbedding(
    queryResult.rewrittenQuery,
  );

  // Step 3: Search primary supplement
  const primaryChunks = await searchSupplementKnowledge(
    queryEmbedding,
    supplementId,
    {
      limit,
      minSimilarity,
      chunkTypes,
    },
  );

  // Step 4: Optionally search co-factor supplements
  let coFactorChunks: RetrievedChunk[] = [];

  if (includeCoFactors) {
    const coFactorIds = await findCoFactorSupplementIds(
      supplementName,
      userStack,
      options.coFactorSupplementIds,
    );

    if (coFactorIds.length > 0) {
      coFactorChunks = await searchSupplementKnowledge(
        queryEmbedding,
        coFactorIds,
        {
          limit: CO_FACTOR_LIMIT,
          minSimilarity: minSimilarity + 0.1, // Higher threshold for co-factors
          chunkTypes: ["interactions", "mechanism", "risks"], // Focus on relevant types
        },
      );
    }
  }

  // Combine and deduplicate results
  const allChunks = [...primaryChunks, ...coFactorChunks];
  const uniqueChunks = deduplicateChunks(allChunks);

  // Sort by similarity
  uniqueChunks.sort((a, b) => b.similarity - a.similarity);

  return {
    chunks: uniqueChunks.slice(0, limit + CO_FACTOR_LIMIT),
    query: queryResult,
  };
}

/**
 * Get pre-generated knowledge for a supplement (for Learn section display).
 * Returns chunks organized by type for structured display.
 */
export async function getSupplementKnowledgeByType(
  supplementId: string,
): Promise<Map<string, RetrievedChunk[]>> {
  const chunks = await db
    .select({
      id: supplementKnowledge.id,
      supplementId: supplementKnowledge.supplementId,
      chunkType: supplementKnowledge.chunkType,
      title: supplementKnowledge.title,
      content: supplementKnowledge.content,
      sourceUrl: supplementKnowledge.sourceUrl,
      metadata: supplementKnowledge.metadata,
    })
    .from(supplementKnowledge)
    .where(eq(supplementKnowledge.supplementId, supplementId))
    .orderBy(supplementKnowledge.chunkType, supplementKnowledge.createdAt);

  // Organize by chunk type
  const byType = new Map<string, RetrievedChunk[]>();

  for (const chunk of chunks) {
    const type = chunk.chunkType;
    if (!byType.has(type)) {
      byType.set(type, []);
    }
    byType.get(type)!.push({
      id: chunk.id,
      supplementId: chunk.supplementId,
      supplementName: "", // Will be filled by caller if needed
      chunkType: chunk.chunkType,
      title: chunk.title,
      content: chunk.content,
      sourceUrl: chunk.sourceUrl,
      similarity: 1.0, // Not from search, so full relevance
      metadata: chunk.metadata ?? {},
    });
  }

  return byType;
}

/**
 * Check if a supplement has knowledge in the database.
 */
export async function hasSupplementKnowledge(
  supplementId: string,
): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(supplementKnowledge)
    .where(eq(supplementKnowledge.supplementId, supplementId));

  return (result[0]?.count ?? 0) > 0;
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Search supplement knowledge using vector similarity.
 */
async function searchSupplementKnowledge(
  queryEmbedding: number[],
  supplementIdOrIds: string | string[],
  options: {
    limit: number;
    minSimilarity: number;
    chunkTypes?: string[];
  },
): Promise<RetrievedChunk[]> {
  const { limit, minSimilarity, chunkTypes } = options;

  // Build the embedding vector string for pgvector
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Build conditions
  const supplementIds = Array.isArray(supplementIdOrIds)
    ? supplementIdOrIds
    : [supplementIdOrIds];

  // Use raw SQL for vector similarity search
  // pgvector uses <=> for cosine distance (1 - similarity)
  type ResultRow = {
    id: string;
    supplement_id: string;
    supplement_name: string;
    chunk_type: string;
    title: string | null;
    content: string;
    source_url: string | null;
    metadata: Record<string, unknown>;
    similarity: number;
  };

  const results = await db.execute(sql`
    SELECT 
      sk.id,
      sk.supplement_id,
      s.name as supplement_name,
      sk.chunk_type,
      sk.title,
      sk.content,
      sk.source_url,
      sk.metadata,
      1 - (sk.embedding <=> ${embeddingStr}::vector) as similarity
    FROM supplement_knowledge sk
    JOIN supplement s ON s.id = sk.supplement_id
    WHERE sk.supplement_id = ANY(${supplementIds}::uuid[])
      AND sk.embedding IS NOT NULL
      ${chunkTypes ? sql`AND sk.chunk_type = ANY(${chunkTypes}::chunk_type[])` : sql``}
    ORDER BY sk.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit * 2}
  `);

  // Handle both Neon (rows array) and postgres-js (direct array) return types
  const rows = (
    "rows" in results ? results.rows : results
  ) as unknown as ResultRow[];

  // Filter by minimum similarity and map to result type
  return rows
    .filter((row) => row.similarity >= minSimilarity)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      supplementId: row.supplement_id,
      supplementName: row.supplement_name,
      chunkType: row.chunk_type,
      title: row.title,
      content: row.content,
      sourceUrl: row.source_url,
      similarity: row.similarity,
      metadata: {
        evidenceRating: row.metadata?.evidenceRating as string | undefined,
        studyCount: row.metadata?.studyCount as number | undefined,
      },
    }));
}

/**
 * Find co-factor supplement IDs based on relationships.
 */
async function findCoFactorSupplementIds(
  supplementName: string,
  userStack: string[],
  providedIds?: string[],
): Promise<string[]> {
  // If IDs are provided directly, use those
  if (providedIds && providedIds.length > 0) {
    return providedIds;
  }

  // Find co-factors from the map
  const lowerName = supplementName.toLowerCase();
  const coFactorNames = CO_FACTOR_MAP[lowerName] ?? [];

  if (coFactorNames.length === 0) {
    return [];
  }

  // Check which co-factors are missing from user's stack
  const missingCoFactors = coFactorNames.filter(
    (cf) =>
      !userStack.some((s) => s.toLowerCase().includes(cf.toLowerCase())),
  );

  if (missingCoFactors.length === 0) {
    return []; // User has all co-factors
  }

  // Look up supplement IDs for missing co-factors
  const supplements = await db
    .select({ id: supplement.id, name: supplement.name })
    .from(supplement)
    .where(
      sql`LOWER(${supplement.name}) = ANY(${missingCoFactors.map((n) => n.toLowerCase())}::text[])`,
    );

  return supplements.map((s) => s.id);
}

/**
 * Remove duplicate chunks based on content similarity.
 */
function deduplicateChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();
  const unique: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    // Create a fingerprint from the first 200 chars of content
    const fingerprint = chunk.content.slice(0, 200).toLowerCase();

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(chunk);
    }
  }

  return unique;
}

// ============================================================================
// Context Building
// ============================================================================

/**
 * Build a context string from retrieved chunks for the LLM.
 */
export function buildContextFromChunks(
  chunks: RetrievedChunk[],
  maxTokens: number = 3000,
): string {
  const contextParts: string[] = [];
  let currentTokens = 0;
  const tokensPerChar = 0.25; // Rough estimate

  for (const chunk of chunks) {
    const chunkTokens = Math.ceil(chunk.content.length * tokensPerChar);

    if (currentTokens + chunkTokens > maxTokens) {
      break;
    }

    const header = `[${chunk.supplementName} - ${chunk.chunkType.toUpperCase()}${chunk.title ? `: ${chunk.title}` : ""}]`;
    contextParts.push(`${header}\n${chunk.content}`);
    currentTokens += chunkTokens;
  }

  return contextParts.join("\n\n---\n\n");
}
