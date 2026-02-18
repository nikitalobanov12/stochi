"use server";

import { getUserPreferences } from "~/server/actions/preferences";
import { getSession } from "~/server/better-auth/server";
import { logger } from "~/lib/logger";
import {
  buildCoachSystemPrompt,
  buildCoachUserPrompt,
} from "~/lib/ai/coach-prompts";
import {
  generateCompletion,
  isLlamaEnabled,
} from "~/server/services/llama-client";
import {
  generateGeminiCompletion,
  isGeminiEnabled,
} from "~/server/services/gemini-client";
import { getCoachContext } from "~/server/services/coach-context";

export type CoachChatResult = {
  answer: string;
  highlights: string[];
  usedWindowDays: 7;
  error?: string;
};

type CoachCacheEntry = {
  timestamp: number;
  result: CoachChatResult;
};

const COACH_CACHE_TTL_MS = 30 * 60 * 1000;
const coachCache = new Map<string, CoachCacheEntry>();

function getCacheKey(userId: string, question: string): string {
  const normalized = question.toLowerCase().trim().slice(0, 200);
  return `${userId}:${normalized}`;
}

function getCachedResult(cacheKey: string): CoachChatResult | null {
  const entry = coachCache.get(cacheKey);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > COACH_CACHE_TTL_MS) {
    coachCache.delete(cacheKey);
    return null;
  }

  return entry.result;
}

function setCachedResult(cacheKey: string, result: CoachChatResult): void {
  coachCache.set(cacheKey, {
    timestamp: Date.now(),
    result,
  });

  if (coachCache.size > 500) {
    const oldestKey = coachCache.keys().next().value;
    if (oldestKey) {
      coachCache.delete(oldestKey);
    }
  }
}

function extractHighlights(answer: string): string[] {
  const bulletMatches = answer
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || /^\d+\./.test(line))
    .map((line) => line.replace(/^[-\d.\s]+/, "").trim())
    .filter((line) => line.length > 0);

  return bulletMatches.slice(0, 4);
}

function validateCoachResponse(answer: string): boolean {
  const lower = answer.toLowerCase();
  const bannedPatterns = [
    "you have",
    "diagnosis",
    "i diagnose",
    "cure",
    "prescription",
  ];

  if (bannedPatterns.some((pattern) => lower.includes(pattern))) {
    return false;
  }

  if (!lower.includes("what this means") || !lower.includes("what to do next")) {
    return false;
  }

  if (!lower.includes("not medical advice")) {
    return false;
  }

  return true;
}

function buildFallbackAnswer(
  question: string,
  context: Awaited<ReturnType<typeof getCoachContext>>,
): string {
  const criticalLine =
    context.warningSummary.critical > 0
      ? "Please consult a healthcare professional before making major changes."
      : "";

  const topActions: string[] = [];

  if (context.adherence.averageEstimatedRate < 70) {
    topActions.push(
      "Prioritize consistency on one stack first, then scale up once daily logging feels automatic.",
    );
  }

  if (context.warningSummary.ratioWarnings > 0) {
    topActions.push(
      "Open ratio warning cards and adjust toward the suggested ranges before adding new supplements.",
    );
  }

  if (context.warningSummary.medium + context.warningSummary.critical > 0) {
    topActions.push(
      "Use timing spacing recommendations to separate conflict pairs and reduce avoidable interactions.",
    );
  }

  if (topActions.length === 0) {
    topActions.push(
      "Keep your current routine stable for another week and focus on hitting all planned logs each day.",
    );
  }

  return `WHAT THIS MEANS\nYour recent pattern shows ${context.logSummary.totalLogs} logs across ${context.logSummary.activeDays} active days in the last 7 days. ${context.keyFacts[3] ?? "Your warning profile is currently stable."} I answered your question ("${question}") using only your account data. This is not medical advice.\n\nWHAT TO DO NEXT\n- ${topActions.slice(0, 3).join("\n- ")}\n${criticalLine}`.trim();
}

export async function askCoachQuestion(question: string): Promise<CoachChatResult> {
  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length < 3) {
    return {
      answer: "Please ask a longer question so I can help.",
      highlights: [],
      usedWindowDays: 7,
      error: "Question is too short.",
    };
  }

  const session = await getSession();
  if (!session?.user?.id) {
    return {
      answer: "Please sign in to use Coach.",
      highlights: [],
      usedWindowDays: 7,
      error: "Not authenticated.",
    };
  }

  const cacheKey = getCacheKey(session.user.id, trimmedQuestion);
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  const preferences = await getUserPreferences();
  const context = await getCoachContext(session.user.id, preferences.timezone);

  let answer = buildFallbackAnswer(trimmedQuestion, context);

  const modelMessages = [
    { role: "system" as const, content: buildCoachSystemPrompt() },
    {
      role: "user" as const,
      content: buildCoachUserPrompt(context, trimmedQuestion),
    },
  ];

  let hasValidModelAnswer = false;

  if (isGeminiEnabled()) {
    const completion = await generateGeminiCompletion(
      modelMessages,
      {
        maxTokens: 400,
        temperature: 0.4,
        topP: 0.9,
        timeoutMs: 25000,
      },
    );

    if (completion.finishReason === "error") {
      logger.warn("Coach Gemini generation failed, falling back", {
        data: completion.error,
      });
    } else if (validateCoachResponse(completion.content)) {
      answer = completion.content;
      hasValidModelAnswer = true;
    } else {
      logger.warn("Coach Gemini response validation failed, using fallback");
    }
  }

  if (!hasValidModelAnswer && isLlamaEnabled()) {
    const completion = await generateCompletion(modelMessages, {
      maxTokens: 400,
      temperature: 0.4,
      topP: 0.9,
      timeoutMs: 25000,
    });

    if (completion.finishReason === "error") {
      logger.warn("Coach Llama generation failed, using fallback", {
        data: completion.error,
      });
    } else if (validateCoachResponse(completion.content)) {
      answer = completion.content;
      hasValidModelAnswer = true;
    } else {
      logger.warn("Coach Llama response validation failed, using fallback");
    }
  }

  if (
    context.warningSummary.critical > 0 &&
    !answer
      .toLowerCase()
      .includes("please consult a healthcare professional before making major changes")
  ) {
    answer = `${answer}\n\nPlease consult a healthcare professional before making major changes.`;
  }

  const result: CoachChatResult = {
    answer,
    highlights: extractHighlights(answer),
    usedWindowDays: 7,
  };

  setCachedResult(cacheKey, result);
  return result;
}
