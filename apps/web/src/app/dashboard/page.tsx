import { eq, desc, and, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, Clock, Layers } from "lucide-react";

import { db } from "~/server/db";
import { stack, log, supplement } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { logStack } from "~/server/actions/stacks";
import {
  checkInteractions,
  checkTimingWarnings,
  type TimingWarning,
} from "~/server/actions/interactions";
import { Button } from "~/components/ui/button";
import { WelcomeFlow } from "~/components/onboarding/welcome-flow";
import { TodayLogList } from "~/components/log/today-log-list";
import { getStackCompletionStatus } from "~/server/services/analytics";
import {
  getBiologicalState,
  getTimelineData,
} from "~/server/services/biological-state";

// New V2 Components
import { SystemStatus } from "~/components/dashboard/system-status";
import { InteractionHeadsUp } from "~/components/dashboard/interaction-heads-up";
import { MissionControl } from "~/components/dashboard/protocol-card";
import { DashboardCommandBar } from "./dashboard-command-bar";

// Biological State Engine Components
import { BiologicalTimeline, ActiveCompoundsList } from "~/components/dashboard/biological-timeline";
import { BioScore } from "~/components/dashboard/bio-score";
import { OptimizationHUD } from "~/components/dashboard/optimization-hud";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [userStacks, todayLogs, allSupplements, stackCompletion, streak, biologicalState, timelineData] =
    await Promise.all([
      db.query.stack.findMany({
        where: eq(stack.userId, session.user.id),
        with: {
          items: {
            with: {
              supplement: true,
            },
          },
        },
        orderBy: [desc(stack.updatedAt)],
        limit: 5,
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
      getStackCompletionStatus(session.user.id),
      calculateStreak(session.user.id),
      getBiologicalState(session.user.id),
      getTimelineData(session.user.id),
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

  const { interactions, ratioWarnings } = await checkInteractions(
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

  // Check if user needs onboarding (no stacks)
  const needsOnboarding = userStacks.length === 0;

  // Get last log timestamp
  const lastLogAt = todayLogs.length > 0 ? todayLogs[0]!.loggedAt : null;

  return (
    <>
      <WelcomeFlow open={needsOnboarding} supplements={allSupplements} />

      <div className="space-y-6">
        {/* Zone 1: System Status - Minimal header */}
        <SystemStatus
          streak={streak}
          todayLogCount={todayLogs.length}
          lastLogAt={lastLogAt}
        />

        {/* Zone 2: Command Bar - Primary Input */}
        <DashboardCommandBar supplements={allSupplements} />

        {/* Zone 3: Biological State Engine - 2-Column Layout */}
        {todayLogs.length > 0 && timelineData.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Timeline (66%) */}
            <div className="space-y-4 lg:col-span-2">
              {/* Bio-Score + Timeline Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                  Biological Timeline
                </h2>
                <div className="w-32">
                  <BioScore
                    score={biologicalState.bioScore}
                    exclusionZones={biologicalState.exclusionZones}
                    optimizations={biologicalState.optimizations}
                  />
                </div>
              </div>

              {/* Timeline Chart */}
              <div className="border-border/40 bg-card/30 rounded-lg border p-4">
                <BiologicalTimeline
                  timelineData={timelineData}
                  activeCompounds={biologicalState.activeCompounds}
                  currentTime={new Date().toISOString()}
                />
              </div>

              {/* Active Compounds List */}
              {biologicalState.activeCompounds.length > 0 && (
                <div className="border-border/40 bg-card/30 rounded-lg border p-4">
                  <div className="text-muted-foreground mb-3 font-mono text-[10px] tracking-wider uppercase">
                    Active Compounds
                  </div>
                  <ActiveCompoundsList
                    compounds={biologicalState.activeCompounds.filter(
                      (c) => c.phase !== "cleared",
                    )}
                  />
                </div>
              )}
            </div>

            {/* Right: Optimization HUD (33%) */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <div className="text-muted-foreground mb-3 font-mono text-[10px] tracking-wider uppercase">
                Optimization HUD
              </div>
              <OptimizationHUD
                exclusionZones={biologicalState.exclusionZones}
                optimizations={biologicalState.optimizations}
              />
            </div>
          </div>
        )}

        {/* Zone 4: Interaction HUD - Legacy (show if no timeline data) */}
        {todayLogs.length > 0 && timelineData.length === 0 && (
          <InteractionHeadsUp
            interactions={interactions}
            ratioWarnings={ratioWarnings}
            timingWarnings={timingWarnings}
          />
        )}

        {/* Zone 5: Mission Control - Stack Status */}
        {stackCompletion.length > 0 && (
          <MissionControl
            stacks={stackCompletion}
            onLogStack={async (stackId) => {
              "use server";
              await logStack(stackId);
            }}
          />
        )}

        {/* Today's Log - Compact */}
        {todayLogs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                Activity Log
              </h2>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground h-auto py-1 font-mono text-[10px]"
              >
                <Link href="/dashboard/log">
                  VIEW ALL
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <TodayLogList logs={todayLogs} maxVisible={5} />
          </div>
        )}

        {/* Empty State */}
        {todayLogs.length === 0 && userStacks.length > 0 && (
          <div className="border-border/40 bg-card/30 rounded-lg border border-dashed py-12 text-center">
            <Clock className="text-muted-foreground/30 mx-auto mb-3 h-6 w-6" />
            <p className="text-muted-foreground font-mono text-xs">
              No activity logged today
            </p>
            <p className="text-muted-foreground/60 mt-1 font-mono text-[10px]">
              Use command bar or tap a protocol
            </p>
          </div>
        )}

        {/* No Stacks State */}
        {userStacks.length === 0 && !needsOnboarding && (
          <div className="border-border/40 bg-card/30 rounded-lg border border-dashed py-12 text-center">
            <Layers className="text-muted-foreground/30 mx-auto mb-3 h-6 w-6" />
            <p className="text-muted-foreground font-mono text-xs">
              No protocols configured
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-4 font-mono text-xs"
            >
              <Link href="/dashboard/stacks">Create Protocol</Link>
            </Button>
          </div>
        )}
      </div>
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
