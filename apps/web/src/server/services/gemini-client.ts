import { env } from "~/env";
import { logger } from "~/lib/logger";
import {
  type LlamaCompletionOptions,
  type LlamaCompletionResult,
  type LlamaMessage,
} from "~/server/services/llama-client";

const GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TOP_P = 0.9;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
};

type GeminiErrorResponse = {
  error?: {
    message?: string;
  };
};

export function isGeminiEnabled(): boolean {
  return !!env.GEMINI_API_KEY;
}

export function getGeminiModelName(modelFromEnv?: string | null): string {
  const trimmedModel = modelFromEnv?.trim();
  return trimmedModel && trimmedModel.length > 0
    ? trimmedModel
    : DEFAULT_GEMINI_MODEL;
}

export function extractTextFromGeminiResponse(
  response: GeminiResponse,
): string | null {
  const firstCandidate = response.candidates?.[0];
  if (!firstCandidate?.content?.parts) {
    return null;
  }

  const text = firstCandidate.content.parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

export async function generateGeminiCompletion(
  messages: LlamaMessage[],
  options: LlamaCompletionOptions = {},
): Promise<LlamaCompletionResult> {
  if (!env.GEMINI_API_KEY) {
    return {
      content: "",
      finishReason: "error",
      error: "GEMINI_API_KEY is not configured",
    };
  }

  const {
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    topP = DEFAULT_TOP_P,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const systemText = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n")
    .trim();

  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  if (contents.length === 0) {
    return {
      content: "",
      finishReason: "error",
      error: "No user/assistant messages provided",
    };
  }

  const model = getGeminiModelName(env.GEMINI_MODEL);

  try {
    const response = await fetch(
      `${GEMINI_API_BASE_URL}/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
            topP,
          },
          ...(systemText
            ? {
                systemInstruction: {
                  parts: [{ text: systemText }],
                },
              }
            : {}),
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );

    if (!response.ok) {
      const errorData = (await response.json()) as GeminiErrorResponse;
      const errorMessage =
        errorData.error?.message ?? `Gemini API error ${response.status}`;
      logger.error(`Gemini API error: ${errorMessage}`);
      return {
        content: "",
        finishReason: "error",
        error: errorMessage,
      };
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractTextFromGeminiResponse(data);
    if (!text) {
      return {
        content: "",
        finishReason: "error",
        error: "Gemini returned empty response",
      };
    }

    const finishReasonRaw = data.candidates?.[0]?.finishReason;
    const finishReason =
      finishReasonRaw === "MAX_TOKENS"
        ? "length"
        : finishReasonRaw === "STOP"
          ? "stop"
          : "stop";

    return {
      content: text,
      finishReason,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        return {
          content: "",
          finishReason: "error",
          error: "Gemini request timed out",
        };
      }

      return {
        content: "",
        finishReason: "error",
        error: error.message,
      };
    }

    return {
      content: "",
      finishReason: "error",
      error: "Unknown Gemini error",
    };
  }
}
