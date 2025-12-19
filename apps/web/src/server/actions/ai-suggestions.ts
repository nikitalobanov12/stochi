"use server";

import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { supplement } from "~/server/db/schema";
import { env } from "~/env";
import { logger } from "~/lib/logger";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildFallbackExplanation,
  type DosagePromptContext,
} from "~/lib/ai/prompts";

// ============================================================================
// Types
// ============================================================================

export type DosageExplanationRequest = {
  sourceId: string;
  sourceName: string;
  sourceDosage: number;
  sourceUnit: string;
  targetId: string;
  targetName: string;
  targetDosage: number;
  targetUnit: string;
  currentRatio: number;
  optimalRatio: number | null;
  minRatio: number | null;
  maxRatio: number | null;
  warningMessage: string;
  // Pre-calculated math layer output
  suggestedSupplement: string;
  suggestedRangeMin: string;
  suggestedRangeMax: string;
};

export type DosageExplanationResponse = {
  explanation: string;
  researchSnippet: string | null;
  cached: boolean;
  error?: string;
};

// ============================================================================
// Cache (In-memory, 7-day TTL)
// ============================================================================

type CacheEntry = {
  response: DosageExplanationResponse;
  timestamp: number;
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const explanationCache = new Map<string, CacheEntry>();

function getCacheKey(request: DosageExplanationRequest): string {
  // Cache by supplement pair and ratio (rounded to avoid cache misses for tiny changes)
  const roundedRatio = Math.round(request.currentRatio * 10) / 10;
  return `${request.sourceId}:${request.targetId}:${roundedRatio}`;
}

function getFromCache(key: string): DosageExplanationResponse | null {
  const entry = explanationCache.get(key);
  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    explanationCache.delete(key);
    return null;
  }

  return { ...entry.response, cached: true };
}

function setCache(key: string, response: DosageExplanationResponse): void {
  explanationCache.set(key, {
    response: { ...response, cached: false },
    timestamp: Date.now(),
  });

  // Simple cache eviction: remove oldest entries if cache gets too large
  if (explanationCache.size > 500) {
    const oldestKey = explanationCache.keys().next().value;
    if (oldestKey) {
      explanationCache.delete(oldestKey);
    }
  }
}

// ============================================================================
// HuggingFace API Integration
// ============================================================================

const HF_API_URL =
  "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";
const HF_TIMEOUT_MS = 8000; // 8 seconds

type HFMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type HFResponse = {
  generated_text: string;
};

async function callHuggingFaceAPI(
  messages: HFMessage[],
): Promise<string | null> {
  if (!env.HUGGINGFACE_API_KEY) {
    logger.warn("HUGGINGFACE_API_KEY not configured, skipping AI explanation");
    return null;
  }

  try {
    // Format messages for Zephyr model
    const prompt = formatMessagesForZephyr(messages);

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150, // ~50 words
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
      }),
      signal: AbortSignal.timeout(HF_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`HuggingFace API error: ${response.status} - ${errorText}`);

      // Handle model loading (503)
      if (response.status === 503) {
        logger.info("Model is loading, returning null");
        return null;
      }

      return null;
    }

    const data = (await response.json()) as HFResponse[] | HFResponse;
    const result = Array.isArray(data) ? data[0] : data;

    if (!result?.generated_text) {
      logger.warn("HuggingFace returned empty response");
      return null;
    }

    return cleanGeneratedText(result.generated_text);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        logger.warn("HuggingFace API timeout");
      } else {
        logger.error(`HuggingFace API error: ${error.message}`);
      }
    }
    return null;
  }
}

/**
 * Format messages in Zephyr's expected chat template format
 */
function formatMessagesForZephyr(messages: HFMessage[]): string {
  let prompt = "";

  for (const msg of messages) {
    if (msg.role === "system") {
      prompt += `<|system|>\n${msg.content}</s>\n`;
    } else if (msg.role === "user") {
      prompt += `<|user|>\n${msg.content}</s>\n`;
    } else if (msg.role === "assistant") {
      prompt += `<|assistant|>\n${msg.content}</s>\n`;
    }
  }

  // Add assistant prefix to prompt generation
  prompt += "<|assistant|>\n";

  return prompt;
}

/**
 * Clean up the generated text - remove any trailing special tokens
 */
function cleanGeneratedText(text: string): string {
  return text
    .replace(/<\|.*?\|>/g, "") // Remove special tokens like <|assistant|>
    .replace(/<\/s>/g, "") // Remove end tokens
    .trim();
}

// ============================================================================
// Main Server Action
// ============================================================================

/**
 * Generate an AI-powered explanation for a dosage adjustment suggestion.
 *
 * Architecture:
 * 1. Check cache (7-day TTL)
 * 2. Fetch supplement metadata from DB (mechanism, description)
 * 3. Build prompt with safety constraints
 * 4. Call HuggingFace API
 * 5. Cache and return result
 *
 * Falls back to database mechanism text if AI is unavailable.
 */
export async function generateDosageExplanation(
  request: DosageExplanationRequest,
): Promise<DosageExplanationResponse> {
  // Check cache first
  const cacheKey = getCacheKey(request);
  const cachedResponse = getFromCache(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch supplement metadata for RAG context
  const [sourceData, targetData] = await Promise.all([
    db.query.supplement.findFirst({
      where: eq(supplement.id, request.sourceId),
      columns: {
        mechanism: true,
        description: true,
      },
    }),
    db.query.supplement.findFirst({
      where: eq(supplement.id, request.targetId),
      columns: {
        mechanism: true,
        description: true,
      },
    }),
  ]);

  // Build prompt context
  const promptContext: DosagePromptContext = {
    sourceName: request.sourceName,
    sourceMechanism: sourceData?.mechanism ?? null,
    sourceDescription: sourceData?.description ?? null,
    targetName: request.targetName,
    targetMechanism: targetData?.mechanism ?? null,
    targetDescription: targetData?.description ?? null,
    currentRatio: request.currentRatio,
    minRatio: request.minRatio,
    maxRatio: request.maxRatio,
    optimalRatio: request.optimalRatio,
    suggestedSupplement: request.suggestedSupplement,
    suggestedRangeMin: request.suggestedRangeMin,
    suggestedRangeMax: request.suggestedRangeMax,
    warningMessage: request.warningMessage,
  };

  // Build research snippet from DB metadata
  const researchSnippet =
    sourceData?.mechanism ?? targetData?.mechanism ?? null;

  // Try to get AI explanation
  const messages: HFMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: buildUserPrompt(promptContext) },
  ];

  const aiExplanation = await callHuggingFaceAPI(messages);

  // Build response
  // Only include researchSnippet if we have a real AI explanation
  // (avoids showing the same mechanism text twice when falling back)
  const response: DosageExplanationResponse = {
    explanation: aiExplanation ?? buildFallbackExplanation(promptContext),
    researchSnippet: aiExplanation ? researchSnippet : null,
    cached: false,
  };

  // Cache the response
  setCache(cacheKey, response);

  return response;
}

/**
 * Check if AI suggestions are enabled (API key is configured)
 */
export async function isAISuggestionsEnabled(): Promise<boolean> {
  return !!env.HUGGINGFACE_API_KEY;
}
