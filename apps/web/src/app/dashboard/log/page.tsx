import { db } from "~/server/db";
import { log, stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { eq, desc } from "drizzle-orm";

import {
  checkInteractions,
  checkTimingWarnings,
  type TimingWarning,
} from "~/server/actions/interactions";
import { getUserPreferences } from "~/server/actions/preferences";
import { getStartOfDayInTimezone } from "~/lib/utils";
import { LogPageClient } from "./log-page-client";
import type { LogEntry, StackItem } from "~/components/log/log-context";

export default async function LogPage() {
  const session = await getSession();
  if (!session) return null;

  // Fetch user preferences for timezone-aware "today" calculation
  const preferences = await getUserPreferences();
  const today = getStartOfDayInTimezone(preferences.timezone);

  const [allSupplements, userStacks, recentLogs] = await Promise.all([
    db.query.supplement.findMany({
      columns: {
        id: true,
        name: true,
        form: true,
        defaultUnit: true,
      },
      orderBy: (s, { asc }) => [asc(s.name)],
    }),
    db.query.stack.findMany({
      where: eq(stack.userId, session.user.id),
      with: {
        items: {
          with: {
            supplement: true,
          },
        },
      },
      orderBy: (s, { desc }) => [desc(s.updatedAt)],
    }),
    db.query.log.findMany({
      where: eq(log.userId, session.user.id),
      with: {
        supplement: true,
      },
      orderBy: [desc(log.loggedAt)],
      limit: 50,
    }),
  ]);

  const todaysLogs = recentLogs.filter((l) => new Date(l.loggedAt) >= today);

  // Build dosage data for ratio calculations
  const dosageMap = new Map<
    string,
    { id: string; dosage: number; unit: string }
  >();
  for (const l of todaysLogs) {
    dosageMap.set(l.supplement.id, {
      id: l.supplement.id,
      dosage: l.dosage,
      unit: l.unit,
    });
  }
  const dosages = Array.from(dosageMap.values());

  // Check interactions for today's logged supplements (with dosages for ratio checking)
  const todaySupplementIds = [
    ...new Set(todaysLogs.map((l) => l.supplement.id)),
  ];
  const { interactions, ratioWarnings } = await checkInteractions(
    todaySupplementIds,
    dosages,
  );

  // Check timing warnings for today's logs
  const timingWarningsPromises = todaysLogs.map((logEntry) =>
    checkTimingWarnings(
      session.user.id,
      logEntry.supplement.id,
      new Date(logEntry.loggedAt),
    ),
  );
  const timingWarningsArrays = await Promise.all(timingWarningsPromises);

  // Flatten and dedupe timing warnings (same pair might be flagged from both sides)
  const timingWarningsMap = new Map<string, TimingWarning>();
  for (const warningsArr of timingWarningsArrays) {
    for (const warning of warningsArr) {
      const key = [warning.source.id, warning.target.id].sort().join("-");
      if (!timingWarningsMap.has(key)) {
        timingWarningsMap.set(key, warning);
      }
    }
  }
  const timingWarnings = Array.from(timingWarningsMap.values());

  // Transform logs to match LogEntry type
  const formattedTodayLogs: LogEntry[] = todaysLogs.map((l) => ({
    id: l.id,
    loggedAt: l.loggedAt,
    dosage: l.dosage,
    unit: l.unit,
    supplement: {
      id: l.supplement.id,
      name: l.supplement.name,
      isResearchChemical: l.supplement.isResearchChemical ?? false,
      route: l.supplement.route,
      category: l.supplement.category,
    },
  }));

  // Recent logs (excluding today) for history section
  const recentLogsExcludingToday = recentLogs
    .filter((l) => new Date(l.loggedAt) < today)
    .map((l) => ({
      id: l.id,
      loggedAt: l.loggedAt,
      dosage: l.dosage,
      unit: l.unit,
      supplement: {
        id: l.supplement.id,
        name: l.supplement.name,
        isResearchChemical: l.supplement.isResearchChemical ?? false,
        route: l.supplement.route,
        category: l.supplement.category,
      },
    }));

  // Transform stacks with items for optimistic logging
  const userStacksWithItems = userStacks.map((s) => ({
    id: s.id,
    name: s.name,
    items: s.items.map((item): StackItem => ({
      supplementId: item.supplementId,
      dosage: item.dosage,
      unit: item.unit,
      supplement: {
        id: item.supplement.id,
        name: item.supplement.name,
        isResearchChemical: item.supplement.isResearchChemical ?? false,
        route: item.supplement.route,
        form: item.supplement.form,
      },
    })),
  }));

  return (
    <LogPageClient
      todayLogs={formattedTodayLogs}
      recentLogs={recentLogsExcludingToday}
      allSupplements={allSupplements}
      userStacks={userStacksWithItems}
      interactions={interactions}
      ratioWarnings={ratioWarnings}
      timingWarnings={timingWarnings}
    />
  );
}
