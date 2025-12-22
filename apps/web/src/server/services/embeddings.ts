/**
 * OpenAI Embeddings Service
 *
 * Generates embeddings using OpenAI's text-embedding-3-small model (1536 dimensions).
 * Used for RAG retrieval in the Learn section.
 */

import { env } from "~/env";
import { logger } from "~/lib/logger";

// ============================================================================
// Types
// ============================================================================

export type EmbeddingResult = {
  embedding: number[];
  tokenCount: number;
};

export type BatchEmbeddingResult = {
  embeddings: number[][];
  totalTokens: number;
};

// ============================================================================
// Configuration
// ============================================================================

const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_BATCH_SIZE = 100; // OpenAI's limit per request
const TIMEOUT_MS = 30000; // 30 seconds

// ============================================================================
// API Types
// ============================================================================

type OpenAIEmbeddingResponse = {
  object: "list";
  data: Array<{
    object: "embedding";
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
};

type OpenAIErrorResponse = {
  error: {
    message: string;
    type: string;
    code: string | null;
  };
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if embeddings are enabled (OpenAI API key is configured)
 */
export function isEmbeddingsEnabled(): boolean {
  return !!env.OPENAI_API_KEY;
}

/**
 * Generate an embedding for a single text.
 *
 * @param text - The text to embed
 * @returns The embedding vector and token count
 * @throws Error if API call fails or API key is not configured
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const result = await generateEmbeddings([text]);
  return {
    embedding: result.embeddings[0]!,
    tokenCount: result.totalTokens,
  };
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * Handles batching automatically if more than 100 texts are provided.
 *
 * @param texts - Array of texts to embed
 * @returns Array of embeddings and total token count
 * @throws Error if API call fails or API key is not configured
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<BatchEmbeddingResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Cannot generate embeddings.",
    );
  }

  if (texts.length === 0) {
    return { embeddings: [], totalTokens: 0 };
  }

  // Handle batching for large requests
  if (texts.length > MAX_BATCH_SIZE) {
    return batchGenerateEmbeddings(texts);
  }

  return callOpenAIEmbeddingAPI(texts);
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Make a single API call to OpenAI's embedding endpoint.
 */
async function callOpenAIEmbeddingAPI(
  texts: string[],
): Promise<BatchEmbeddingResult> {
  try {
    const response = await fetch(OPENAI_EMBEDDING_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as OpenAIErrorResponse;
      logger.error(
        `OpenAI Embedding API error: ${response.status} - ${errorData.error?.message}`,
      );
      throw new Error(
        `OpenAI API error: ${errorData.error?.message ?? response.statusText}`,
      );
    }

    const data = (await response.json()) as OpenAIEmbeddingResponse;

    // Sort by index to ensure correct ordering
    const sortedEmbeddings = data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    return {
      embeddings: sortedEmbeddings,
      totalTokens: data.usage.total_tokens,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        logger.error("OpenAI Embedding API timeout");
        throw new Error("OpenAI API request timed out");
      }
      throw error;
    }
    throw new Error("Unknown error during embedding generation");
  }
}

/**
 * Handle large batches by splitting into multiple API calls.
 * Uses sequential calls with small delays to respect rate limits.
 */
async function batchGenerateEmbeddings(
  texts: string[],
): Promise<BatchEmbeddingResult> {
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    batches.push(texts.slice(i, i + MAX_BATCH_SIZE));
  }

  logger.info(
    `Generating embeddings for ${texts.length} texts in ${batches.length} batches`,
  );

  const allEmbeddings: number[][] = [];
  let totalTokens = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;

    // Add a small delay between batches to respect rate limits
    if (i > 0) {
      await sleep(100);
    }

    const result = await callOpenAIEmbeddingAPI(batch);
    allEmbeddings.push(...result.embeddings);
    totalTokens += result.totalTokens;

    logger.info(
      `Completed batch ${i + 1}/${batches.length} (${result.embeddings.length} embeddings)`,
    );
  }

  return {
    embeddings: allEmbeddings,
    totalTokens,
  };
}

/**
 * Simple sleep utility for rate limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate cosine similarity between two embedding vectors.
 * Returns a value between -1 and 1, where 1 means identical.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get the expected embedding dimensions for validation.
 */
export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}
