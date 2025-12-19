/**
 * Prompt templates for AI dosage suggestions.
 * These prompts are designed to generate safe, research-grounded explanations.
 */

import { formatSafetyLimitsForPrompt } from "~/server/data/safety-limits";

export type DosagePromptContext = {
  sourceName: string;
  sourceMechanism: string | null;
  sourceDescription: string | null;
  targetName: string;
  targetMechanism: string | null;
  targetDescription: string | null;
  currentRatio: number;
  minRatio: number | null;
  maxRatio: number | null;
  optimalRatio: number | null;
  suggestedSupplement: string;
  suggestedRangeMin: string;
  suggestedRangeMax: string;
  warningMessage: string;
};

/**
 * System prompt that sets the AI's role and constraints.
 * This is critical for safety - it prevents the AI from "prescribing" dosages.
 */
export function buildSystemPrompt(): string {
  const safetyLimits = formatSafetyLimitsForPrompt();

  return `You are a knowledgeable supplement advisor helping biohackers optimize their stacks. You explain WHY supplement ratios matter and what users can expect from adjusting them.

CRITICAL RULES:
1. NEVER prescribe or give medical advice - only describe "common protocols" or "what many people find helpful"
2. ALWAYS frame suggestions as "research suggests" or "many biohackers report"
3. NEVER suggest doses that exceed these upper limits: ${safetyLimits}
4. Keep your response under 50 words - be concise
5. Focus on the MECHANISM and BENEFIT, not the numbers (those are shown separately)
6. Do NOT repeat the dosage range - the user already sees it
7. Be specific to their situation

TONE: Knowledgeable peer, not a doctor. Think "Huberman Lab podcast" style.`;
}

/**
 * Build the user prompt with specific context about the ratio warning.
 */
export function buildUserPrompt(context: DosagePromptContext): string {
  const sourceMechInfo = context.sourceMechanism
    ? `\n- ${context.sourceName} mechanism: ${context.sourceMechanism}`
    : "";
  const targetMechInfo = context.targetMechanism
    ? `\n- ${context.targetName} mechanism: ${context.targetMechanism}`
    : "";

  return `SITUATION:
User is taking ${context.sourceName} and ${context.targetName}.
Current ratio: ${context.currentRatio}:1
Optimal range: ${context.minRatio}-${context.maxRatio}:1
Issue: ${context.warningMessage}

RESEARCH CONTEXT:${sourceMechInfo}${targetMechInfo}

SUGGESTED FIX: Adjust ${context.suggestedSupplement} to ${context.suggestedRangeMin}-${context.suggestedRangeMax}

Explain in 1-2 sentences why this ratio matters and what benefit the user will notice from fixing it. Focus on the biological mechanism and expected outcome.`;
}

/**
 * Fallback explanation when AI is unavailable.
 * Builds a meaningful explanation from database metadata.
 */
export function buildFallbackExplanation(context: DosagePromptContext): string {
  // Build a useful explanation from available mechanism data
  const parts: string[] = [];

  if (context.sourceMechanism) {
    parts.push(`${context.sourceName}: ${context.sourceMechanism}`);
  }
  if (
    context.targetMechanism &&
    context.targetMechanism !== context.sourceMechanism
  ) {
    parts.push(`${context.targetName}: ${context.targetMechanism}`);
  }

  if (parts.length > 0) {
    return parts.join(" • ");
  }

  // Generic fallback if no mechanism data
  return `Maintaining the ${context.minRatio}-${context.maxRatio}:1 ratio between ${context.sourceName} and ${context.targetName} helps ensure optimal absorption and prevents imbalances.`;
}
