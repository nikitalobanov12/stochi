import { eq, and, gte, lt, asc, desc } from "drizzle-orm";

import { db } from "~/server/db";
import { log, supplement, userGoal, protocol } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  checkInteractions,
  checkTimingWarnings,
  type TimingWarning,
} from "~/server/actions/interactions";
import { getUserPreferences } from "~/server/actions/preferences";
import { getDismissedSuggestionKeys } from "~/server/actions/dismissed-suggestions";
import { WelcomeFlow } from "~/components/onboarding/welcome-flow";
import { checkNeedsOnboarding } from "~/server/actions/onboarding";
import {
  getBiologicalState,
  getTimelineData,
  getSafetyHeadroom,
} from "~/server/services/biological-state";
import { getStartOfDayInTimezone } from "~/lib/utils";

import {
  DashboardClient,
  type LogEntry,
} from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // Fetch preferences first (needed for timezone-aware "today" calculation)
  const [preferences, dismissedKeys] = await Promise.all([
    getUserPreferences(),
    getDismissedSuggestionKeys(),
  ]);

  // Calculate "today" in user's timezone
  const todayStart = getStartOfDayInTimezone(preferences.timezone);

  // Fetch user goals for goal-based suggestion filtering
  const userGoals = await db.query.userGoal.findMany({
    where: eq(userGoal.userId, session.user.id),
    orderBy: [asc(userGoal.priority)],
    columns: { goal: true },
  });
  const userGoalKeys = userGoals.map((g) => g.goal);

  const [
    userProtocol,
    todayLogs,
    allSupplements,
    streak,
    biologicalState,
    timelineData,
    safetyHeadroom,
    needsOnboarding,
  ] = await Promise.all([
    db.query.protocol.findFirst({
      where: eq(protocol.userId, session.user.id),
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
          orderBy: (items, { asc: ascBy }) => [
            ascBy(items.timeSlot),
            ascBy(items.sortOrder),
          ],
        },
      },
    }),
    db.query.log.findMany({
      where: and(
        eq(log.userId, session.user.id),
        gte(log.loggedAt, todayStart),
      ),
      with: {
        supplement: true,
      },
      orderBy: [desc(log.loggedAt)],
    }),
    db.query.supplement.findMany({
      columns: {
        id: true,
        name: true,
        form: true,
        defaultUnit: true,
      },
      orderBy: [supplement.name],
    }),
    calculateStreak(session.user.id),
    getBiologicalState(session.user.id, {
      dismissedKeys,
      showAddSuggestions: preferences.showAddSuggestions,
      userGoals: userGoalKeys,
      timezone: preferences.timezone,
      experienceLevel: preferences.experienceLevel,
      suggestionFilterLevel: preferences.suggestionFilterLevel,
      showConditionalSupplements: preferences.showConditionalSupplements,
    }),
    getTimelineData(session.user.id),
    getSafetyHeadroom(session.user.id),
    checkNeedsOnboarding(),
  ]);

  // Get interactions and ratio warnings for today's supplements
  const todaySupplementIds = [
    ...new Set(todayLogs.map((l) => l.supplement.id)),
  ];

  // Build dosage data for ratio calculations
  const dosageMap = new Map<
    string,
    { id: string; dosage: number; unit: string }
  >();
  for (const l of todayLogs) {
    dosageMap.set(l.supplement.id, {
      id: l.supplement.id,
      dosage: l.dosage,
      unit: l.unit,
    });
  }
  const dosages = Array.from(dosageMap.values());

  const { interactions, ratioWarnings, ratioEvaluationGaps } = await checkInteractions(
    todaySupplementIds,
    dosages,
  );

  // Check timing warnings for today's logs
  const timingWarningsPromises = todayLogs.map((logEntry) =>
    checkTimingWarnings(
      session.user.id,
      logEntry.supplement.id,
      new Date(logEntry.loggedAt),
    ),
  );
  const timingWarningsArrays = await Promise.all(timingWarningsPromises);

  // Flatten and dedupe timing warnings
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

  // Get last log timestamp
  const lastLogAt = todayLogs.length > 0 ? todayLogs[0]!.loggedAt : null;

  // Transform logs to match LogEntry type
  const formattedLogs: LogEntry[] = todayLogs.map((l) => ({
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

  const hasProtocolItems = (userProtocol?.items.length ?? 0) > 0;

  return (
    <>
      <WelcomeFlow open={needsOnboarding} supplements={allSupplements} />

      <DashboardClient
        todayLogs={formattedLogs}
        allSupplements={allSupplements}
        protocol={userProtocol ?? null}
        streak={streak}
        lastLogAt={lastLogAt}
        needsOnboarding={needsOnboarding}
        hasProtocolItems={hasProtocolItems}
        biologicalState={biologicalState}
        timelineData={timelineData}
        safetyHeadroom={safetyHeadroom}
        interactions={interactions}
        ratioWarnings={ratioWarnings}
        ratioEvaluationGaps={ratioEvaluationGaps}
        timingWarnings={timingWarnings}
      />
    </>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate the user's current streak (consecutive days with logs)
 */
async function calculateStreak(userId: string): Promise<number> {
  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Check up to 365 days back
  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayLogs = await db.query.log.findFirst({
      where: and(
        eq(log.userId, userId),
        gte(log.loggedAt, dayStart),
        lt(log.loggedAt, dayEnd),
      ),
      columns: { id: true },
    });

    if (dayLogs) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // If it's today and no logs yet, check yesterday
      if (i === 0) {
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streak;
}
