import { and, desc, eq, gte } from "drizzle-orm";

import { checkInteractions } from "~/server/actions/interactions";
import { db } from "~/server/db";
import { log, stack } from "~/server/db/schema";
import { getStartOfDayInTimezone } from "~/lib/utils";

export type CoachContext = {
  windowDays: 7;
  timezone: string | null;
  generatedAt: string;
  logSummary: {
    totalLogs: number;
    activeDays: number;
    uniqueSupplements: number;
    topSupplements: Array<{ name: string; count: number }>;
  };
  adherence: {
    stackCount: number;
    averageEstimatedRate: number;
    lowestStacks: Array<{ stackName: string; estimatedRate: number }>;
  };
  warningSummary: {
    critical: number;
    medium: number;
    low: number;
    synergies: number;
    ratioWarnings: number;
  };
  keyFacts: string[];
};

export function summarizeWarnings(
  warnings: Array<{ severity: "low" | "medium" | "critical" }>,
): { critical: number; medium: number; low: number } {
  return {
    critical: warnings.filter((warning) => warning.severity === "critical")
      .length,
    medium: warnings.filter((warning) => warning.severity === "medium").length,
    low: warnings.filter((warning) => warning.severity === "low").length,
  };
}

function getDayKey(date: Date, timezone: string | null): string {
  if (!timezone) {
    return date.toISOString().slice(0, 10);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function roundPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function getCoachContext(
  userId: string,
  timezone: string | null,
): Promise<CoachContext> {
  const todayStart = getStartOfDayInTimezone(timezone);
  const windowStart = new Date(todayStart);
  windowStart.setDate(windowStart.getDate() - 6);

  const [windowLogs, userStacks] = await Promise.all([
    db.query.log.findMany({
      where: and(eq(log.userId, userId), gte(log.loggedAt, windowStart)),
      with: {
        supplement: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(log.loggedAt)],
    }),
    db.query.stack.findMany({
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
      orderBy: [desc(stack.updatedAt)],
    }),
  ]);

  const logsPerSupplement = new Map<string, { name: string; count: number }>();
  const activeDayKeys = new Set<string>();

  for (const entry of windowLogs) {
    activeDayKeys.add(getDayKey(entry.loggedAt, timezone));
    const current = logsPerSupplement.get(entry.supplementId);

    if (current) {
      current.count += 1;
    } else {
      logsPerSupplement.set(entry.supplementId, {
        name: entry.supplement.name,
        count: 1,
      });
    }
  }

  const topSupplements = Array.from(logsPerSupplement.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const dosageBySupplementId = new Map<
    string,
    { id: string; dosage: number; unit: string }
  >();
  for (const entry of windowLogs) {
    if (!dosageBySupplementId.has(entry.supplementId)) {
      dosageBySupplementId.set(entry.supplementId, {
        id: entry.supplementId,
        dosage: entry.dosage,
        unit: entry.unit,
      });
    }
  }

  const uniqueSupplementIds = [...new Set(windowLogs.map((entry) => entry.supplementId))];
  const dosages = Array.from(dosageBySupplementId.values());

  const { interactions, ratioWarnings } = await checkInteractions(
    uniqueSupplementIds,
    dosages,
  );

  const pureWarnings = interactions.filter(
    (interaction) => interaction.type !== "synergy",
  );
  const severitySummary = summarizeWarnings(
    pureWarnings.map((warning) => ({ severity: warning.severity })),
  );

  const supplementDayMap = new Map<string, Set<string>>();
  for (const entry of windowLogs) {
    const dayKey = getDayKey(entry.loggedAt, timezone);
    const current = supplementDayMap.get(entry.supplementId) ?? new Set<string>();
    current.add(dayKey);
    supplementDayMap.set(entry.supplementId, current);
  }

  const stackAdherence = userStacks
    .filter((userStack) => userStack.items.length > 0)
    .map((userStack) => {
      const rates = userStack.items.map((item) => {
        const daysLogged = supplementDayMap.get(item.supplementId)?.size ?? 0;
        return daysLogged / 7;
      });

      const averageRate = rates.reduce((sum, value) => sum + value, 0) / rates.length;

      return {
        stackName: userStack.name,
        estimatedRate: roundPercent(averageRate * 100),
      };
    });

  const averageEstimatedRate =
    stackAdherence.length > 0
      ? roundPercent(
          stackAdherence.reduce((sum, item) => sum + item.estimatedRate, 0) /
            stackAdherence.length,
        )
      : 0;

  const lowestStacks = [...stackAdherence]
    .sort((a, b) => a.estimatedRate - b.estimatedRate)
    .slice(0, 3);

  const context: CoachContext = {
    windowDays: 7,
    timezone,
    generatedAt: new Date().toISOString(),
    logSummary: {
      totalLogs: windowLogs.length,
      activeDays: activeDayKeys.size,
      uniqueSupplements: uniqueSupplementIds.length,
      topSupplements,
    },
    adherence: {
      stackCount: userStacks.length,
      averageEstimatedRate,
      lowestStacks,
    },
    warningSummary: {
      ...severitySummary,
      synergies: interactions.filter((interaction) => interaction.type === "synergy")
        .length,
      ratioWarnings: ratioWarnings.length,
    },
    keyFacts: [],
  };

  context.keyFacts = buildCoachFacts(context);

  return context;
}

export function buildCoachFacts(context: CoachContext): string[] {
  const facts: string[] = [];

  facts.push(
    `Over the last 7 days, you logged ${context.logSummary.totalLogs} entries across ${context.logSummary.activeDays} active days.`,
  );

  if (context.logSummary.topSupplements.length > 0) {
    const topLine = context.logSummary.topSupplements
      .slice(0, 3)
      .map((item) => `${item.name} (${item.count})`)
      .join(", ");
    facts.push(`Most frequent supplements: ${topLine}.`);
  }

  facts.push(
    `Estimated adherence is ${context.adherence.averageEstimatedRate}% across ${context.adherence.stackCount} stacks.`,
  );

  facts.push(
    `Warning profile: ${context.warningSummary.critical} critical, ${context.warningSummary.medium} medium, ${context.warningSummary.low} low, ${context.warningSummary.ratioWarnings} ratio warnings, ${context.warningSummary.synergies} synergies.`,
  );

  if (context.adherence.lowestStacks.length > 0) {
    const lowest = context.adherence.lowestStacks
      .map((stackRate) => `${stackRate.stackName} (${stackRate.estimatedRate}%)`)
      .join(", ");
    facts.push(`Lowest consistency stacks: ${lowest}.`);
  }

  return facts;
}
