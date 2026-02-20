"use server";

/**
 * Server Actions for Supplement Learn Section
 *
 * Provides RAG-powered Q&A and pre-generated knowledge retrieval
 * for the Learn section.
 */

import { eq, and, gte } from "drizzle-orm";
import { db } from "~/server/db";
import { supplement, log } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  retrieveRelevantChunks,
  getSupplementKnowledgeByType,
  hasSupplementKnowledge,
  buildContextFromChunks,
} from "~/server/services/rag-retrieval";
import {
  generateCompletion,
  buildRAGSystemPrompt,
  buildRAGUserPrompt,
  buildResearchSummaryPrompt,
  isLlamaEnabled,
} from "~/server/services/llama-client";
import { logger } from "~/lib/logger";

// ============================================================================
// Types
// ============================================================================

export type KnowledgeSection = {
  type: string;
  title: string;
  chunks: {
    id: string;
    title: string | null;
    content: string;
    evidenceRating?: string;
  }[];
};

export type SupplementKnowledgeResult = {
  supplementId: string;
  supplementName: string;
  hasKnowledge: boolean;
  sections: KnowledgeSection[];
  sourceUrl: string | null;
};

export type AskQuestionResult = {
  answer: string;
  sources: {
    supplementName: string;
    chunkType: string;
    title: string | null;
    sourceUrl: string | null;
  }[];
  query: {
    originalQuery: string;
    rewrittenQuery: string;
  };
  error?: string;
};

export type ResearchSummaryResult = {
  summary: string | null;
  generatedAt: Date | null;
  isAIGenerated: boolean;
  error?: string;
};

// ============================================================================
// Section Display Configuration
// ============================================================================

const SECTION_CONFIG: Record<string, { title: string; order: number }> = {
  overview: { title: "Overview", order: 1 },
  benefits: { title: "Benefits & Effects", order: 2 },
  mechanism: { title: "How It Works", order: 3 },
  dosing: { title: "Dosage", order: 4 },
  timing: { title: "When to Take", order: 5 },
  risks: { title: "Safety & Side Effects", order: 6 },
  interactions: { title: "Interactions", order: 7 },
  faq: { title: "FAQ", order: 8 },
};

// ============================================================================
// Cache (In-memory, 1-hour TTL)
// ============================================================================

type CacheEntry = {
  result: AskQuestionResult;
  timestamp: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const answerCache = new Map<string, CacheEntry>();

function getCacheKey(supplementId: string, question: string): string {
  // Normalize question for caching
  const normalizedQuestion = question.toLowerCase().trim().slice(0, 200);
  return `${supplementId}:${normalizedQuestion}`;
}

function getFromCache(key: string): AskQuestionResult | null {
  const entry = answerCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    answerCache.delete(key);
    return null;
  }

  return entry.result;
}

function setCache(key: string, result: AskQuestionResult): void {
  answerCache.set(key, { result, timestamp: Date.now() });

  // Evict old entries if cache is too large
  if (answerCache.size > 500) {
    const oldestKey = answerCache.keys().next().value;
    if (oldestKey) {
      answerCache.delete(oldestKey);
    }
  }
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get pre-generated knowledge for a supplement.
 * Used to display the Learn section with organized content.
 */
export async function getSupplementKnowledge(
  supplementId: string,
): Promise<SupplementKnowledgeResult> {
  // Get supplement info
  const supplementData = await db.query.supplement.findFirst({
    where: eq(supplement.id, supplementId),
    columns: {
      id: true,
      name: true,
      researchUrl: true,
    },
  });

  if (!supplementData) {
    return {
      supplementId,
      supplementName: "Unknown",
      hasKnowledge: false,
      sections: [],
      sourceUrl: null,
    };
  }

  // Check if we have knowledge for this supplement
  const hasData = await hasSupplementKnowledge(supplementId);

  if (!hasData) {
    return {
      supplementId,
      supplementName: supplementData.name,
      hasKnowledge: false,
      sections: [],
      sourceUrl: supplementData.researchUrl,
    };
  }

  // Get knowledge organized by type
  const knowledgeByType = await getSupplementKnowledgeByType(supplementId);

  // Convert to sections with proper ordering
  const sections: KnowledgeSection[] = [];

  for (const [type, chunks] of knowledgeByType) {
    const config = SECTION_CONFIG[type] ?? { title: type, order: 99 };

    sections.push({
      type,
      title: config.title,
      chunks: chunks.map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        content: chunk.content,
        evidenceRating: chunk.metadata.evidenceRating,
      })),
    });
  }

  // Sort by configured order
  sections.sort((a, b) => {
    const orderA = SECTION_CONFIG[a.type]?.order ?? 99;
    const orderB = SECTION_CONFIG[b.type]?.order ?? 99;
    return orderA - orderB;
  });

  return {
    supplementId,
    supplementName: supplementData.name,
    hasKnowledge: true,
    sections,
    sourceUrl:
      knowledgeByType.values().next().value?.[0]?.sourceUrl ??
      supplementData.researchUrl,
  };
}

/**
 * Ask a question about a supplement using RAG.
 * Returns an AI-generated answer grounded in the knowledge base.
 */
export async function askSupplementQuestion(
  supplementId: string,
  question: string,
): Promise<AskQuestionResult> {
  // Validate input
  if (!question || question.trim().length < 3) {
    return {
      answer: "",
      sources: [],
      query: { originalQuery: question, rewrittenQuery: question },
      error: "Please enter a valid question.",
    };
  }

  // Check cache first
  const cacheKey = getCacheKey(supplementId, question);
  const cachedResult = getFromCache(cacheKey);
  if (cachedResult) {
    logger.info(`Cache hit for question: "${question.slice(0, 50)}..."`);
    return cachedResult;
  }

  // Check if LLM is enabled
  if (!isLlamaEnabled()) {
    return {
      answer: "",
      sources: [],
      query: { originalQuery: question, rewrittenQuery: question },
      error:
        "AI features are not configured. Please set up the HuggingFace API key.",
    };
  }

  // Get supplement info
  const supplementData = await db.query.supplement.findFirst({
    where: eq(supplement.id, supplementId),
    columns: {
      id: true,
      name: true,
    },
  });

  if (!supplementData) {
    return {
      answer: "",
      sources: [],
      query: { originalQuery: question, rewrittenQuery: question },
      error: "Supplement not found.",
    };
  }

  // Get user's current stack for context
  const userStack = await getUserCurrentStack();

  // Retrieve relevant chunks
  const retrievalResult = await retrieveRelevantChunks(
    question,
    supplementId,
    supplementData.name,
    userStack,
    {
      limit: 5,
      includeCoFactors: true,
    },
  );

  if (retrievalResult.chunks.length === 0) {
    return {
      answer:
        "I don't have enough research data to answer that question about this supplement.",
      sources: [],
      query: {
        originalQuery: retrievalResult.query.originalQuery,
        rewrittenQuery: retrievalResult.query.rewrittenQuery,
      },
    };
  }

  // Build context from chunks
  const context = buildContextFromChunks(retrievalResult.chunks);

  // Generate answer using Llama
  const systemPrompt = buildRAGSystemPrompt(userStack);
  const userPrompt = buildRAGUserPrompt(question, context);

  const completion = await generateCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      maxTokens: 400,
      temperature: 0.7,
      timeoutMs: 30000,
    },
  );

  if (completion.finishReason === "error") {
    return {
      answer: "",
      sources: [],
      query: {
        originalQuery: retrievalResult.query.originalQuery,
        rewrittenQuery: retrievalResult.query.rewrittenQuery,
      },
      error: completion.error ?? "Failed to generate answer.",
    };
  }

  // Build result
  const result: AskQuestionResult = {
    answer: completion.content,
    sources: retrievalResult.chunks.slice(0, 3).map((chunk) => ({
      supplementName: chunk.supplementName,
      chunkType: chunk.chunkType,
      title: chunk.title,
      sourceUrl: chunk.sourceUrl,
    })),
    query: {
      originalQuery: retrievalResult.query.originalQuery,
      rewrittenQuery: retrievalResult.query.rewrittenQuery,
    },
  };

  // Cache the result
  setCache(cacheKey, result);

  return result;
}

// ============================================================================
// Research Summary Cache Configuration
// ============================================================================

const RESEARCH_SUMMARY_STALE_DAYS = 30; // Regenerate after 30 days

/**
 * Get or generate an AI research summary for a supplement.
 * Uses cached summary if available and fresh, otherwise generates on-demand.
 *
 * Returns fallback content (description + mechanism) if:
 * - AI is not enabled
 * - No knowledge chunks available
 * - Generation fails
 */
export async function getOrGenerateResearchSummary(
  supplementId: string,
): Promise<ResearchSummaryResult> {
  // Get supplement data including existing summary
  const supplementData = await db.query.supplement.findFirst({
    where: eq(supplement.id, supplementId),
    columns: {
      id: true,
      name: true,
      description: true,
      mechanism: true,
      researchSummary: true,
      researchSummaryGeneratedAt: true,
    },
  });

  if (!supplementData) {
    return {
      summary: null,
      generatedAt: null,
      isAIGenerated: false,
      error: "Supplement not found",
    };
  }

  // Check if we have a fresh cached summary
  if (
    supplementData.researchSummary &&
    supplementData.researchSummaryGeneratedAt
  ) {
    const ageInDays =
      (Date.now() - supplementData.researchSummaryGeneratedAt.getTime()) /
      (1000 * 60 * 60 * 24);

    if (ageInDays < RESEARCH_SUMMARY_STALE_DAYS) {
      logger.info(`Using cached research summary for ${supplementData.name}`);
      return {
        summary: supplementData.researchSummary,
        generatedAt: supplementData.researchSummaryGeneratedAt,
        isAIGenerated: true,
      };
    }
    logger.info(
      `Cached summary for ${supplementData.name} is stale (${Math.floor(ageInDays)} days old)`,
    );
  }

  // Build fallback content from description + mechanism
  const fallbackSummary = buildFallbackSummary(
    supplementData.description,
    supplementData.mechanism,
  );

  // Check if AI is enabled
  if (!isLlamaEnabled()) {
    logger.info("AI not enabled, using fallback summary");
    return {
      summary: fallbackSummary,
      generatedAt: null,
      isAIGenerated: false,
    };
  }

  // Check if we have knowledge chunks to build context
  const hasKnowledge = await hasSupplementKnowledge(supplementId);
  if (!hasKnowledge) {
    logger.info(
      `No knowledge chunks for ${supplementData.name}, using fallback`,
    );
    return {
      summary: fallbackSummary,
      generatedAt: null,
      isAIGenerated: false,
    };
  }

  // Fetch knowledge chunks and build context
  const knowledgeByType = await getSupplementKnowledgeByType(supplementId);

  // Build context prioritizing overview, mechanism, benefits
  const priorityTypes = [
    "overview",
    "mechanism",
    "benefits",
    "dosing",
    "timing",
  ];
  const contextChunks: string[] = [];

  for (const type of priorityTypes) {
    const chunks = knowledgeByType.get(type);
    if (chunks) {
      for (const chunk of chunks) {
        contextChunks.push(`[${type.toUpperCase()}]\n${chunk.content}`);
      }
    }
  }

  if (contextChunks.length === 0) {
    logger.info(`No relevant knowledge chunks for ${supplementData.name}`);
    return {
      summary: fallbackSummary,
      generatedAt: null,
      isAIGenerated: false,
    };
  }

  const knowledgeContext = contextChunks.slice(0, 5).join("\n\n---\n\n");

  // Generate summary using Llama
  const { system, user } = buildResearchSummaryPrompt(
    supplementData.name,
    knowledgeContext,
  );

  logger.info(`Generating research summary for ${supplementData.name}`);

  const completion = await generateCompletion(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    {
      maxTokens: 600,
      temperature: 0.6, // Slightly lower for more factual output
      timeoutMs: 45000, // Longer timeout for summary generation
    },
  );

  if (completion.finishReason === "error") {
    logger.error(
      `Failed to generate summary for ${supplementData.name}: ${completion.error}`,
    );
    return {
      summary: fallbackSummary,
      generatedAt: null,
      isAIGenerated: false,
      error: completion.error,
    };
  }

  // Save the generated summary to database
  const now = new Date();
  await db
    .update(supplement)
    .set({
      researchSummary: completion.content,
      researchSummaryGeneratedAt: now,
      updatedAt: now,
    })
    .where(eq(supplement.id, supplementId));

  logger.info(`Saved research summary for ${supplementData.name}`);

  return {
    summary: completion.content,
    generatedAt: now,
    isAIGenerated: true,
  };
}

/**
 * Build a fallback summary from description and mechanism.
 */
function buildFallbackSummary(
  description: string | null,
  mechanism: string | null,
): string | null {
  const parts: string[] = [];

  if (mechanism) {
    parts.push(mechanism);
  }
  if (description) {
    parts.push(description);
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}

/**
 * Get a supplement by its URL slug (name lowercased and hyphenated).
 */
export async function getSupplementBySlug(slug: string): Promise<{
  id: string;
  name: string;
  form: string | null;
  category: string | null;
  researchUrl: string | null;
  description: string | null;
  mechanism: string | null;
} | null> {
  // Convert slug back to potential name formats
  // e.g., "vitamin-d3" -> "Vitamin D3", "magnesium-glycinate" -> "Magnesium Glycinate"
  const supplements = await db.query.supplement.findMany({
    columns: {
      id: true,
      name: true,
      form: true,
      category: true,
      researchUrl: true,
      description: true,
      mechanism: true,
    },
  });

  // Find matching supplement by comparing slugified names
  const match = supplements.find((s) => slugify(s.name) === slug);

  return match ?? null;
}

/**
 * Check if the Learn feature is available (required services configured).
 */
export async function isLearnFeatureEnabled(): Promise<{
  enabled: boolean;
  missingConfig: string[];
}> {
  const missingConfig: string[] = [];

  if (!isLlamaEnabled()) {
    missingConfig.push("HUGGINGFACE_API_KEY");
  }

  // Note: Embeddings require OPENAI_API_KEY but that's only for seeding
  // The Learn section can still show pre-generated content without it

  return {
    enabled: missingConfig.length === 0,
    missingConfig,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the user's current supplement stack from recent logs.
 */
async function getUserCurrentStack(): Promise<string[]> {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  // Get supplements logged in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentLogs = await db
    .select({
      supplementName: supplement.name,
    })
    .from(log)
    .innerJoin(supplement, eq(log.supplementId, supplement.id))
    .where(and(eq(log.userId, session.user.id), gte(log.loggedAt, oneDayAgo)))
    .groupBy(supplement.name);

  return recentLogs.map((l) => l.supplementName);
}

/**
 * Convert a supplement name to a URL slug.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
