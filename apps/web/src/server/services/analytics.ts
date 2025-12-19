import { eq, and, gte } from "drizzle-orm";
import { db } from "~/server/db";
import { log, stack } from "~/server/db/schema";

// ============================================================================
// Stack Completion Status
// ============================================================================

export type StackCompletionStatus = {
  stackId: string;
  stackName: string;
  totalItems: number;
  loggedItems: number;
  isComplete: boolean;
  items: Array<{
    supplementId: string;
    supplementName: string;
    expectedDosage: number;
    expectedUnit: string;
    logged: boolean;
  }>;
};

/**
 * Get completion status for user's stacks (what's been logged today).
 */
export async function getStackCompletionStatus(
  userId: string,
): Promise<StackCompletionStatus[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get user's stacks with items
  const userStacks = await db.query.stack.findMany({
    where: eq(stack.userId, userId),
    with: {
      items: {
        with: {
          supplement: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: (s, { desc }) => [desc(s.updatedAt)],
  });

  // Get today's logs
  const todayLogs = await db.query.log.findMany({
    where: and(eq(log.userId, userId), gte(log.loggedAt, todayStart)),
    columns: {
      supplementId: true,
    },
  });

  const loggedSupplementIds = new Set(todayLogs.map((l) => l.supplementId));

  // Build completion status
  return userStacks.map((userStack) => {
    const items = userStack.items.map((item) => ({
      supplementId: item.supplement.id,
      supplementName: item.supplement.name,
      expectedDosage: item.dosage,
      expectedUnit: item.unit,
      logged: loggedSupplementIds.has(item.supplement.id),
    }));

    const loggedItems = items.filter((i) => i.logged).length;

    return {
      stackId: userStack.id,
      stackName: userStack.name,
      totalItems: items.length,
      loggedItems,
      isComplete: loggedItems >= items.length && items.length > 0,
      items,
    };
  });
}
