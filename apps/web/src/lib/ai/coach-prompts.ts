import { type CoachContext } from "~/server/services/coach-context";

export function buildCoachSystemPrompt(): string {
  return `You are Stochi Coach, an account-aware supplement guidance assistant.

CRITICAL RULES:
1. Use only the account context provided in the prompt.
2. If data is missing, say exactly what is missing.
3. Do not diagnose conditions, do not claim treatment, do not prescribe.
4. Keep tone practical and concise.
5. Default analysis window is the last 7 days.
6. Always include:
   - WHAT THIS MEANS
   - WHAT TO DO NEXT
7. Suggest actions the user can do in Stochi (timing, consistency, stack adjustments, logging habits).
8. Include this exact phrase once: "This is not medical advice."
9. If any critical warnings exist, include: "Please consult a healthcare professional before making major changes."
10. Keep response under 220 words.`;
}

export function buildCoachUserPrompt(
  context: CoachContext,
  question: string,
): string {
  const topSupplements = context.logSummary.topSupplements
    .map((item) => `${item.name}:${item.count}`)
    .join(", ");

  const lowestStacks = context.adherence.lowestStacks
    .map((item) => `${item.stackName}:${item.estimatedRate}%`)
    .join(", ");

  return `ACCOUNT CONTEXT (LAST 7 DAYS)
- Generated at: ${context.generatedAt}
- Timezone: ${context.timezone ?? "not set"}
- Total logs: ${context.logSummary.totalLogs}
- Active days: ${context.logSummary.activeDays}
- Unique supplements: ${context.logSummary.uniqueSupplements}
- Top supplements: ${topSupplements || "none"}
- Stack count: ${context.adherence.stackCount}
- Average estimated adherence: ${context.adherence.averageEstimatedRate}%
- Lowest adherence stacks: ${lowestStacks || "none"}
- Warnings: critical=${context.warningSummary.critical}, medium=${context.warningSummary.medium}, low=${context.warningSummary.low}, ratio=${context.warningSummary.ratioWarnings}, synergies=${context.warningSummary.synergies}

DETERMINISTIC FACTS
${context.keyFacts.map((fact) => `- ${fact}`).join("\n")}

USER QUESTION
${question}

Write a grounded answer using only this context.`;
}
