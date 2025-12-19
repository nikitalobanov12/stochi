"use server";

import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "~/server/db";
import { userGoal, supplement } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  goals,
  getGoalByKey,
  type GoalKey,
  type Goal,
} from "~/server/data/goal-recommendations";

export type GoalProgress = {
  goal: Goal;
  recommended: string[]; // supplement names from goal-recommendations
  taking: string[]; // supplements user has in any stack
  missing: string[]; // recommended - taking
  coverage: number; // taking.length / recommended.length (0-1)
};

/**
 * Get all goals for the current user, ordered by priority
 */
export async function getUserGoals(): Promise<
  Array<{ id: string; goal: GoalKey; priority: number }>
> {
  const session = await getSession();
  if (!session) return [];

  const userGoals = await db.query.userGoal.findMany({
    where: eq(userGoal.userId, session.user.id),
    orderBy: [asc(userGoal.priority)],
  });

  return userGoals.map((ug) => ({
    id: ug.id,
    goal: ug.goal as GoalKey,
    priority: ug.priority,
  }));
}

/**
 * Set user goals - replaces all existing goals
 * @param goalKeys Array of goal keys in priority order (index 0 = priority 1)
 */
export async function setUserGoals(goalKeys: GoalKey[]): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  // Validate all goal keys
  const validKeys = goals.map((g) => g.key);
  for (const key of goalKeys) {
    if (!validKeys.includes(key)) {
      throw new Error(`Invalid goal key: ${key}`);
    }
  }

  // Limit to 3 goals
  const limitedGoals = goalKeys.slice(0, 3);

  // Delete existing goals
  await db.delete(userGoal).where(eq(userGoal.userId, session.user.id));

  // Insert new goals with priority
  if (limitedGoals.length > 0) {
    await db.insert(userGoal).values(
      limitedGoals.map((key, index) => ({
        userId: session.user.id,
        goal: key,
        priority: index + 1,
        createdAt: new Date(),
      })),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

/**
 * Add a single goal (appends to existing, respects max 3)
 */
export async function addUserGoal(goalKey: GoalKey): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const existingGoals = await getUserGoals();

  // Check if already have this goal
  if (existingGoals.some((g) => g.goal === goalKey)) {
    return; // Already have it
  }

  // Check max 3
  if (existingGoals.length >= 3) {
    throw new Error("Maximum 3 goals allowed");
  }

  // Add with next priority
  await db.insert(userGoal).values({
    userId: session.user.id,
    goal: goalKey,
    priority: existingGoals.length + 1,
    createdAt: new Date(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

/**
 * Remove a single goal
 */
export async function removeUserGoal(goalId: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  await db.delete(userGoal).where(eq(userGoal.id, goalId));

  // Re-number priorities
  const remaining = await db.query.userGoal.findMany({
    where: eq(userGoal.userId, session.user.id),
    orderBy: [asc(userGoal.priority)],
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i]!.priority !== i + 1) {
      await db
        .update(userGoal)
        .set({ priority: i + 1 })
        .where(eq(userGoal.id, remaining[i]!.id));
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

/**
 * Calculate goal progress for the current user
 * Returns progress for each of the user's goals
 */
export async function getGoalProgress(): Promise<GoalProgress[]> {
  const session = await getSession();
  if (!session) return [];

  // Get user's goals
  const userGoals = await getUserGoals();
  if (userGoals.length === 0) return [];

  // Get all supplements the user is taking across all stacks
  const userStackItems = await db.query.stackItem.findMany({
    with: {
      stack: true,
      supplement: true,
    },
  });

  // Filter to user's stacks and get unique supplement names
  const userSupplementNames = new Set(
    userStackItems
      .filter((item) => item.stack.userId === session.user.id)
      .map((item) => item.supplement.name),
  );

  // Also check supplements that have this goal in commonGoals
  const supplementsWithGoals = await db.query.supplement.findMany({
    columns: {
      name: true,
      commonGoals: true,
    },
  });

  // Build progress for each goal
  const progress: GoalProgress[] = [];

  for (const ug of userGoals) {
    const goal = getGoalByKey(ug.goal);
    if (!goal) continue;

    // Get recommended supplements from goal-recommendations.ts
    const recommended = goal.supplements.map((s) => s.name);

    // Find which recommended supplements the user is taking
    const taking = recommended.filter((name) => userSupplementNames.has(name));

    // Also include supplements that have this goal in commonGoals
    // (user might be taking alternative supplements for the same goal)
    const alternativeTaking = supplementsWithGoals
      .filter(
        (s) =>
          s.commonGoals?.includes(ug.goal) &&
          userSupplementNames.has(s.name) &&
          !recommended.includes(s.name),
      )
      .map((s) => s.name);

    const allTaking = [...taking, ...alternativeTaking];
    const missing = recommended.filter(
      (name) => !userSupplementNames.has(name),
    );

    // Coverage based on recommended supplements
    const coverage =
      recommended.length > 0 ? taking.length / recommended.length : 0;

    progress.push({
      goal,
      recommended,
      taking: allTaking,
      missing,
      coverage,
    });
  }

  return progress;
}

/**
 * Get supplement details by ID (for info sheet)
 */
export async function getSupplementById(supplementId: string) {
  const result = await db.query.supplement.findFirst({
    where: eq(supplement.id, supplementId),
  });

  return result;
}

/**
 * Get all supplements with their metadata (for search/info)
 */
export async function getSupplementsWithMetadata() {
  return db.query.supplement.findMany({
    columns: {
      id: true,
      name: true,
      form: true,
      description: true,
      mechanism: true,
      researchUrl: true,
      category: true,
      commonGoals: true,
      defaultUnit: true,
    },
    orderBy: [supplement.name],
  });
}
