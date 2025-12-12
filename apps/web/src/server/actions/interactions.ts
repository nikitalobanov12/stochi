"use server";

import { inArray, or } from "drizzle-orm";
import { db } from "~/server/db";
import { interaction } from "~/server/db/schema";

export type InteractionWarning = {
  id: string;
  type: "inhibition" | "synergy" | "competition";
  severity: "low" | "medium" | "critical";
  mechanism: string | null;
  source: {
    id: string;
    name: string;
    form: string | null;
  };
  target: {
    id: string;
    name: string;
    form: string | null;
  };
};

/**
 * Check for interactions between a set of supplements.
 * Returns all interactions where both source and target are in the provided set.
 */
export async function checkInteractions(
  supplementIds: string[],
): Promise<InteractionWarning[]> {
  if (supplementIds.length < 2) {
    return [];
  }

  // Find all interactions where both source and target are in our set
  const interactions = await db.query.interaction.findMany({
    where: or(
      inArray(interaction.sourceId, supplementIds),
      inArray(interaction.targetId, supplementIds),
    ),
    with: {
      source: true,
      target: true,
    },
  });

  // Filter to only include interactions where BOTH supplements are in the set
  const relevantInteractions = interactions.filter(
    (i) =>
      supplementIds.includes(i.sourceId) &&
      supplementIds.includes(i.targetId),
  );

  return relevantInteractions.map((i) => ({
    id: i.id,
    type: i.type,
    severity: i.severity,
    mechanism: i.mechanism,
    source: {
      id: i.source.id,
      name: i.source.name,
      form: i.source.form,
    },
    target: {
      id: i.target.id,
      name: i.target.name,
      form: i.target.form,
    },
  }));
}

/**
 * Get interaction count and severity breakdown for today's logged supplements.
 * Used for the dashboard summary card.
 */
export async function getTodayInteractionSummary(userId: string): Promise<{
  total: number;
  critical: number;
  medium: number;
  low: number;
  synergies: number;
}> {
  const { log } = await import("~/server/db/schema");
  const { eq, gte, and } = await import("drizzle-orm");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's logged supplements
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, today)),
    columns: {
      supplementId: true,
    },
  });

  const uniqueSupplementIds = [...new Set(todayLogs.map((l) => l.supplementId))];

  if (uniqueSupplementIds.length < 2) {
    return { total: 0, critical: 0, medium: 0, low: 0, synergies: 0 };
  }

  const interactions = await checkInteractions(uniqueSupplementIds);

  const warnings = interactions.filter((i) => i.type !== "synergy");
  const synergies = interactions.filter((i) => i.type === "synergy");

  return {
    total: warnings.length,
    critical: warnings.filter((i) => i.severity === "critical").length,
    medium: warnings.filter((i) => i.severity === "medium").length,
    low: warnings.filter((i) => i.severity === "low").length,
    synergies: synergies.length,
  };
}

/**
 * Get all interactions relevant to a user's stacks and recent logs.
 * Used for detailed interaction display.
 */
export async function getUserInteractions(userId: string): Promise<{
  today: InteractionWarning[];
  inStacks: Array<{
    stackId: string;
    stackName: string;
    interactions: InteractionWarning[];
  }>;
}> {
  const { log, stack } = await import("~/server/db/schema");
  const { eq, gte, and } = await import("drizzle-orm");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's logged supplements
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, today)),
    columns: {
      supplementId: true,
    },
  });

  const todaySupplementIds = [...new Set(todayLogs.map((l) => l.supplementId))];
  const todayInteractions = await checkInteractions(todaySupplementIds);

  // Get user's stacks
  const userStacks = await db.query.stack.findMany({
    where: eq(stack.userId, userId),
    with: {
      items: true,
    },
  });

  const stackInteractions = await Promise.all(
    userStacks.map(async (s) => {
      const supplementIds = s.items.map((item) => item.supplementId);
      const interactions = await checkInteractions(supplementIds);
      return {
        stackId: s.id,
        stackName: s.name,
        interactions,
      };
    }),
  );

  return {
    today: todayInteractions,
    inStacks: stackInteractions.filter((s) => s.interactions.length > 0),
  };
}
