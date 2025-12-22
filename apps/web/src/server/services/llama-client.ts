/**
 * Llama 3.1 8B Client
 *
 * Interfaces with HuggingFace Inference API to run Llama 3.1 8B Instruct
 * for RAG-grounded supplement Q&A.
 */

import { env } from "~/env";
import { logger } from "~/lib/logger";

// ============================================================================
// Types
// ============================================================================

export type LlamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlamaCompletionOptions = {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeoutMs?: number;
};

export type LlamaCompletionResult = {
  content: string;
  finishReason: "stop" | "length" | "error";
  error?: string;
};

// ============================================================================
// Configuration
// ============================================================================

const HF_API_URL =
  "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-8B-Instruct";
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TOP_P = 0.9;

// ============================================================================
// HuggingFace API Types
// ============================================================================

type HFResponse = {
  generated_text: string;
};

type HFErrorResponse = {
  error: string;
  estimated_time?: number;
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if Llama is enabled (HuggingFace API key is configured)
 */
export function isLlamaEnabled(): boolean {
  return !!env.HUGGINGFACE_API_KEY;
}

/**
 * Generate a completion using Llama 3.1 8B.
 *
 * @param messages - Array of conversation messages
 * @param options - Generation options
 * @returns The model's response
 */
export async function generateCompletion(
  messages: LlamaMessage[],
  options: LlamaCompletionOptions = {},
): Promise<LlamaCompletionResult> {
  if (!env.HUGGINGFACE_API_KEY) {
    return {
      content: "",
      finishReason: "error",
      error: "HUGGINGFACE_API_KEY is not configured",
    };
  }

  const {
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    topP = DEFAULT_TOP_P,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  try {
    const prompt = formatMessagesForLlama(messages);

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature,
          top_p: topP,
          do_sample: true,
          return_full_text: false,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as HFErrorResponse;
      logger.error(`Llama API error: ${response.status} - ${errorData.error}`);

      // Handle model loading (503)
      if (response.status === 503) {
        const waitTime = errorData.estimated_time ?? 20;
        logger.info(`Model is loading, estimated wait: ${waitTime}s`);
        return {
          content: "",
          finishReason: "error",
          error: `Model is loading. Please try again in ${Math.ceil(waitTime)} seconds.`,
        };
      }

      return {
        content: "",
        finishReason: "error",
        error: errorData.error ?? `HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as HFResponse[] | HFResponse;
    const result = Array.isArray(data) ? data[0] : data;

    if (!result?.generated_text) {
      logger.warn("Llama returned empty response");
      return {
        content: "",
        finishReason: "error",
        error: "Model returned empty response",
      };
    }

    const cleanedText = cleanGeneratedText(result.generated_text);

    return {
      content: cleanedText,
      finishReason: "stop",
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        logger.warn("Llama API timeout");
        return {
          content: "",
          finishReason: "error",
          error: "Request timed out. The model may be under heavy load.",
        };
      }
      logger.error(`Llama API error: ${error.message}`);
      return {
        content: "",
        finishReason: "error",
        error: error.message,
      };
    }
    return {
      content: "",
      finishReason: "error",
      error: "Unknown error occurred",
    };
  }
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Format messages in Llama 3.1's expected chat template format.
 *
 * Llama 3.1 uses a specific format:
 * <|begin_of_text|><|start_header_id|>system<|end_header_id|>
 * {system_message}<|eot_id|>
 * <|start_header_id|>user<|end_header_id|>
 * {user_message}<|eot_id|>
 * <|start_header_id|>assistant<|end_header_id|>
 */
function formatMessagesForLlama(messages: LlamaMessage[]): string {
  let prompt = "<|begin_of_text|>";

  for (const msg of messages) {
    prompt += `<|start_header_id|>${msg.role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
  }

  // Add assistant prefix to prompt generation
  prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n";

  return prompt;
}

/**
 * Clean up the generated text - remove any trailing special tokens.
 */
function cleanGeneratedText(text: string): string {
  return text
    .replace(/<\|.*?\|>/g, "") // Remove special tokens
    .replace(/<\|eot_id\|>/g, "") // Remove end of turn tokens
    .replace(/<\|end_of_text\|>/g, "") // Remove end of text tokens
    .trim();
}

// ============================================================================
// RAG-Specific Prompts
// ============================================================================

/**
 * Build a system prompt for RAG-grounded supplement Q&A.
 */
export function buildRAGSystemPrompt(userStack: string[]): string {
  const stackContext =
    userStack.length > 0
      ? `\n\nUSER'S CURRENT STACK: ${userStack.join(", ")}`
      : "";

  return `You are a knowledgeable supplement advisor. Your role is to answer questions about supplements using ONLY the research context provided below.

CRITICAL RULES:
1. ONLY use information from the CONTEXT provided - NEVER use your training data
2. If the context doesn't contain enough information, say "I don't have enough research data to answer that question."
3. Use phrases like "research suggests" or "studies indicate" - NEVER prescribe or give medical advice
4. When answering about side effects, check if a CO-FACTOR might be missing (e.g., Vitamin D issues often relate to insufficient K2 or Magnesium)
5. If you identify a potential co-factor issue, mention it explicitly
6. Keep answers concise (2-4 sentences) unless asked for more detail
7. Cite which section your information comes from when relevant${stackContext}

TONE: Knowledgeable peer explaining research, not a doctor prescribing treatment.`;
}

/**
 * Build a user prompt with retrieved context for RAG.
 */
export function buildRAGUserPrompt(question: string, context: string): string {
  return `RESEARCH CONTEXT:
${context}

USER QUESTION:
${question}

Answer the question using only the research context above. If the context doesn't contain relevant information, say so.`;
}

/**
 * Build a prompt for query rewriting.
 */
export function buildQueryRewritePrompt(
  question: string,
  supplementName: string,
  userStack: string[],
): string {
  const stackContext =
    userStack.length > 0
      ? `User's current stack: ${userStack.join(", ")}`
      : "No other supplements in stack";

  return `You are a search query optimizer for a supplement knowledge base.

Given a user's question about ${supplementName}, rewrite it to improve semantic search results.

Include:
1. Medical/scientific terminology related to the question
2. Related symptoms, mechanisms, or pathways
3. Potential co-factors or interactions if relevant
4. The supplement name

${stackContext}

Original question: "${question}"

Output ONLY the optimized search query (no explanation, no quotes):`;
}
