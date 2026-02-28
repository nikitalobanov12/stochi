import { eq, and, gte, lt, desc } from "drizzle-orm";

import { db } from "~/server/db";
import { log, supplement, protocol } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { getUserPreferences } from "~/server/actions/preferences";
import { WelcomeFlow } from "~/components/onboarding/welcome-flow";
import { checkNeedsOnboarding } from "~/server/actions/onboarding";
import { getStartOfDayInTimezone } from "~/lib/utils";

import {
  DashboardClient,
  type LogEntry,
} from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // Fetch preferences first (needed for timezone-aware "today" calculation)
  const preferences = await getUserPreferences();

  // Calculate "today" in user's timezone
  const todayStart = getStartOfDayInTimezone(preferences.timezone);

  const [
    userProtocol,
    todayLogs,
    allSupplements,
    streak,
    needsOnboarding,
    interactionRules,
    ratioRules,
    timingRules,
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
        safetyCategory: true,
        peakMinutes: true,
        halfLifeMinutes: true,
        kineticsType: true,
        vmax: true,
        km: true,
        rdaAmount: true,
        bioavailabilityPercent: true,
        category: true,
        isResearchChemical: true,
        route: true,
      },
      orderBy: [supplement.name],
    }),
    calculateStreak(session.user.id),
    checkNeedsOnboarding(),
    db.query.interaction.findMany({
      with: {
        source: {
          columns: { id: true, name: true, form: true },
        },
        target: {
          columns: { id: true, name: true, form: true },
        },
      },
    }),
    db.query.ratioRule.findMany({
      with: {
        sourceSupplement: {
          columns: { id: true, name: true, form: true },
        },
        targetSupplement: {
          columns: { id: true, name: true, form: true },
        },
      },
    }),
    db.query.timingRule.findMany({
      with: {
        sourceSupplement: {
          columns: { id: true, name: true },
        },
        targetSupplement: {
          columns: { id: true, name: true },
        },
      },
    }),
  ]);

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

  const ruleSnapshot = {
    supplements: allSupplements.map((s) => ({
      id: s.id,
      name: s.name,
      form: s.form,
      safetyCategory: s.safetyCategory,
      peakMinutes: s.peakMinutes,
      halfLifeMinutes: s.halfLifeMinutes,
      kineticsType: s.kineticsType,
      vmax: s.vmax,
      km: s.km,
      rdaAmount: s.rdaAmount,
      bioavailabilityPercent: s.bioavailabilityPercent,
      category: s.category,
    })),
    interactionRules,
    ratioRules,
    timingRules,
  };

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
        ruleSnapshot={ruleSnapshot}
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
