/**
 * Semantic Search Web Worker
 *
 * Runs embedding generation off the main thread using Transformers.js.
 * Uses the quantized all-MiniLM-L6-v2 model (~23MB) for fast similarity search.
 */

import { pipeline, env, type FeatureExtractionPipeline } from "@xenova/transformers";

// Configure transformers.js for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Types for worker messages
type WorkerMessage =
  | { type: "init" }
  | { type: "embed"; id: string; text: string }
  | { type: "search"; id: string; query: string; candidates: SupplementCandidate[] }
  | { type: "precompute"; id: string; supplements: SupplementCandidate[] };

type SupplementCandidate = {
  id: string;
  name: string;
  form: string | null;
  aliases?: string[];
};

type SearchResult = {
  id: string;
  name: string;
  form: string | null;
  score: number;
};

// Singleton for the pipeline
let extractor: FeatureExtractionPipeline | null = null;
let isInitializing = false;

// Cache for precomputed embeddings
const embeddingCache = new Map<string, number[]>();

/**
 * Initialize the feature extraction pipeline
 */
async function initializePipeline(
  progressCallback?: (progress: number) => void
): Promise<FeatureExtractionPipeline> {
  if (extractor) return extractor;
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return extractor!;
  }

  isInitializing = true;

  try {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (data: { progress?: number }) => {
        if (data.progress !== undefined && progressCallback) {
          progressCallback(data.progress);
        }
      },
    });
    return extractor;
  } finally {
    isInitializing = false;
  }
}

/**
 * Generate embedding for a text string
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const model = await initializePipeline();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Calculate cosine similarity between two vectors
 * (Vectors are already normalized, so dot product = cosine similarity)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i]! * b[i]!;
  }
  return sum;
}

/**
 * Search for the most similar supplements to a query
 */
async function searchSupplements(
  query: string,
  candidates: SupplementCandidate[]
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query.toLowerCase());

  const results: SearchResult[] = [];

  for (const candidate of candidates) {
    // Create searchable text from name + form + aliases
    const searchTexts = [
      candidate.name.toLowerCase(),
      candidate.form?.toLowerCase(),
      ...(candidate.aliases ?? []),
    ].filter(Boolean) as string[];

    // Get or generate embeddings for each search text
    let maxScore = 0;
    for (const text of searchTexts) {
      const cacheKey = `${candidate.id}:${text}`;
      let embedding = embeddingCache.get(cacheKey);

      if (!embedding) {
        embedding = await generateEmbedding(text);
        embeddingCache.set(cacheKey, embedding);
      }

      const score = cosineSimilarity(queryEmbedding, embedding);
      maxScore = Math.max(maxScore, score);
    }

    results.push({
      id: candidate.id,
      name: candidate.name,
      form: candidate.form,
      score: maxScore,
    });
  }

  // Sort by score descending and filter low scores
  return results
    .filter((r) => r.score > 0.3) // Threshold for relevance
    .sort((a, b) => b.score - a.score);
}

/**
 * Precompute embeddings for all supplements
 */
async function precomputeEmbeddings(
  supplements: SupplementCandidate[]
): Promise<void> {
  for (const supplement of supplements) {
    const searchTexts = [
      supplement.name.toLowerCase(),
      supplement.form?.toLowerCase(),
      ...(supplement.aliases ?? []),
    ].filter(Boolean) as string[];

    for (const text of searchTexts) {
      const cacheKey = `${supplement.id}:${text}`;
      if (!embeddingCache.has(cacheKey)) {
        const embedding = await generateEmbedding(text);
        embeddingCache.set(cacheKey, embedding);
      }
    }
  }
}

// Worker message handler
self.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data;

  void (async () => {
    try {
      switch (type) {
        case "init": {
          await initializePipeline((progress) => {
            self.postMessage({ type: "progress", progress });
          });
          self.postMessage({ type: "ready" });
          break;
        }

        case "embed": {
          const { id, text } = event.data;
          const embedding = await generateEmbedding(text);
          self.postMessage({ type: "embedding", id, embedding });
          break;
        }

      case "search": {
        const { id, query, candidates } = event.data;
        const results = await searchSupplements(query, candidates);
        self.postMessage({ type: "searchResults", id, results });
        break;
      }

      case "precompute": {
        const { id, supplements } = event.data;
        await precomputeEmbeddings(supplements);
        self.postMessage({ type: "precomputeComplete", id });
        break;
      }
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
  })();
});

// Signal that the worker is loaded
self.postMessage({ type: "loaded" });
