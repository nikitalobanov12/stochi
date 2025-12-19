/**
 * Semantic Search Web Worker
 *
 * Runs embedding generation off the main thread using Transformers.js.
 * Uses the quantized all-MiniLM-L6-v2 model (~23MB) for fast similarity search.
 */

import {
  pipeline,
  env,
  type FeatureExtractionPipeline,
  type ProgressInfo,
} from "@huggingface/transformers";

// Configure transformers.js for browser environment
env.allowLocalModels = false;

// Types for worker messages
type WorkerMessage =
  | { type: "init" }
  | { type: "embed"; id: string; text: string }
  | {
      type: "search";
      id: string;
      query: string;
      candidates: SupplementCandidate[];
    }
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

/**
 * Calculate cosine similarity between two vectors
 * (Vectors are already normalized, so dot product = cosine similarity)
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i]! * b[i]!;
  }
  return sum;
}

// Singleton pattern for pipeline
class PipelineSingleton {
  static instance: FeatureExtractionPipeline | null = null;
  static initPromise: Promise<FeatureExtractionPipeline> | null = null;

  static async getInstance(
    progressCallback?: (progress: number) => void,
  ): Promise<FeatureExtractionPipeline> {
    if (this.instance) return this.instance;

    // If already initializing, wait for the existing promise
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        {
          progress_callback: (data: ProgressInfo) => {
            if (
              "progress" in data &&
              data.progress !== undefined &&
              progressCallback
            ) {
              progressCallback(data.progress);
            }
          },
        },
      );
      this.instance = extractor;
      return extractor;
    })();

    return this.initPromise;
  }
}

// Cache for precomputed embeddings
const embeddingCache = new Map<string, Float32Array>();

/**
 * Generate embedding for a text string
 */
async function generateEmbedding(text: string): Promise<Float32Array> {
  const model = await PipelineSingleton.getInstance();
  const output = await model(text, { pooling: "mean", normalize: true });
  return output.data as Float32Array;
}

/**
 * Search for the most similar supplements to a query
 */
async function searchSupplements(
  query: string,
  candidates: SupplementCandidate[],
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

      // Use our cosine similarity function
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
  supplements: SupplementCandidate[],
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
          await PipelineSingleton.getInstance((progress) => {
            self.postMessage({ type: "progress", progress });
          });
          self.postMessage({ type: "ready" });
          break;
        }

        case "embed": {
          const { id, text } = event.data;
          const embedding = await generateEmbedding(text);
          self.postMessage({
            type: "embedding",
            id,
            embedding: Array.from(embedding),
          });
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
