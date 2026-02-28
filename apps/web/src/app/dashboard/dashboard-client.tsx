"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock, Loader2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { TodayLogList } from "~/components/log/today-log-list";
import {
  LogProvider,
  useLogContext,
  type LogEntry,
  type StackItem,
} from "~/components/log/log-context";

// Dashboard Components
import { SystemStatus } from "~/components/dashboard/system-status";
import { ProtocolCard as DailyProtocolCard } from "~/components/protocol/protocol-card";
import { DashboardCommandBar } from "./dashboard-command-bar";

// Biological State Engine Components
import {
  BiologicalTimeline,
  ActiveCompoundsList,
} from "~/components/dashboard/biological-timeline";
import { OptimizationHUD } from "~/components/dashboard/optimization-hud";

// Additional Components
import { BioScoreCard } from "~/components/dashboard/bio-score-card";
import {
  MicroKPIRow,
} from "~/components/dashboard/micro-kpi-row";
import { LiveConsoleFeed } from "~/components/dashboard/live-console-feed";

import {
  deriveOptimisticDashboardState,
  type DashboardRuleSnapshot,
} from "~/lib/dashboard/optimistic-dashboard";

// Re-export types for convenience
export type { LogEntry, StackItem };

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: string | null;
};

type DashboardClientProps = {
  // Data
  todayLogs: LogEntry[];
  allSupplements: Supplement[];
  protocol: {
    id: string;
    name: string;
    autoLogEnabled: boolean;
    morningTime: string;
    afternoonTime: string;
    eveningTime: string;
    bedtimeTime: string;
    items: Array<{
      id: string;
      supplementId: string;
      dosage: number;
      unit: "mg" | "mcg" | "g" | "IU" | "ml";
      timeSlot: "morning" | "afternoon" | "evening" | "bedtime";
      frequency: "daily" | "specific_days" | "as_needed";
      daysOfWeek: string[] | null;
      groupName: string | null;
      sortOrder: number;
      supplement: {
        id: string;
        name: string;
      };
    }>;
  } | null;

  // UI State
  streak: number;
  lastLogAt: Date | null;
  needsOnboarding: boolean;
  hasProtocolItems: boolean;
  ruleSnapshot: DashboardRuleSnapshot;
};

export function DashboardClient({
  todayLogs,
  allSupplements,
  protocol,
  streak,
  lastLogAt,
  needsOnboarding,
  hasProtocolItems,
  ruleSnapshot,
}: DashboardClientProps) {
  return (
    <LogProvider initialLogs={todayLogs}>
      <DashboardContent
        allSupplements={allSupplements}
        protocol={protocol}
        streak={streak}
        lastLogAt={lastLogAt}
        needsOnboarding={needsOnboarding}
        hasProtocolItems={hasProtocolItems}
        ruleSnapshot={ruleSnapshot}
      />
    </LogProvider>
  );
}

// Inner component that uses the LogContext
function DashboardContent({
  allSupplements,
  protocol,
  streak,
  lastLogAt,
  needsOnboarding,
  hasProtocolItems,
  ruleSnapshot,
}: Omit<DashboardClientProps, "todayLogs">) {
  const { logs, logProtocolSlotOptimistic } = useLogContext();

  const derived = useMemo(
    () =>
      deriveOptimisticDashboardState({
        logs,
        snapshot: ruleSnapshot,
      }),
    [logs, ruleSnapshot],
  );

  const currentLogCount = derived.todayLogCount;
  const currentLastLogAt = derived.lastLogAt;
  const currentBiologicalState = derived.biologicalState;
  const currentTimelineData = derived.timelineData;
  const currentInteractions = derived.interactions;
  const currentRatioWarnings = derived.ratioWarnings;
  const currentRatioEvaluationGaps = derived.ratioEvaluationGaps;
  const currentTimingWarnings = derived.timingWarnings;
  const currentSafetyHeadroom = derived.safetyHeadroom;

  const activeCompounds = currentBiologicalState.activeCompounds.filter(
    (c) => c.phase !== "cleared",
  );

  return (
    <div className="space-y-5">
      <SystemStatus
        streak={streak}
        todayLogCount={currentLogCount}
        lastLogAt={currentLastLogAt ?? lastLogAt}
      />

      <DashboardCommandBar supplements={allSupplements} />

      {protocol && (
        <DailyProtocolCard
          protocol={protocol}
          onLogSlotOptimistic={logProtocolSlotOptimistic}
        />
      )}

      {currentLogCount > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            {currentTimelineData.length > 0 && (
              <div>
                <h2 className="text-muted-foreground mb-2 font-mono text-[10px] tracking-wider uppercase">
                  Biological Timeline
                </h2>
                <div className="bg-card border-border rounded-xl border p-4 shadow-[var(--elevation-1)]">
                  <BiologicalTimeline
                    timelineData={currentTimelineData}
                    activeCompounds={currentBiologicalState.activeCompounds}
                    currentTime={new Date().toISOString()}
                  />
                </div>
              </div>
            )}

            <div>
              <h2 className="text-muted-foreground mb-2 font-mono text-[10px] tracking-wider uppercase">
                Next Actions
              </h2>
              <OptimizationHUD
                exclusionZones={currentBiologicalState.exclusionZones}
                optimizations={currentBiologicalState.optimizations}
              />
            </div>

            <details className="bg-card border-border group rounded-xl border p-4 shadow-[var(--elevation-1)]">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none font-mono text-[10px] tracking-wider uppercase">
                System Feed
              </summary>
              <div className="mt-3">
                <LiveConsoleFeed
                  interactions={currentInteractions}
                  ratioWarnings={currentRatioWarnings}
                  ratioEvaluationGaps={currentRatioEvaluationGaps}
                  timingWarnings={currentTimingWarnings}
                />
              </div>
            </details>
          </div>

          <div className="space-y-5 lg:col-span-4">
            <BioScoreCard
              score={currentBiologicalState.bioScore}
              exclusionZones={currentBiologicalState.exclusionZones}
              optimizations={currentBiologicalState.optimizations}
            />

            <div>
              <h2 className="text-muted-foreground mb-2 font-mono text-[10px] tracking-wider uppercase">
                Key Metrics
              </h2>
              <div className="bg-card border-border rounded-xl border p-4 shadow-[var(--elevation-1)]">
                <MicroKPIRow
                  ratioWarnings={currentRatioWarnings}
                  safetyHeadroom={currentSafetyHeadroom}
                  exclusionZones={currentBiologicalState.exclusionZones}
                />
              </div>
            </div>

            {activeCompounds.length > 0 && (
              <details className="bg-card border-border group rounded-xl border p-4 shadow-[var(--elevation-1)]">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none font-mono text-[10px] tracking-wider uppercase">
                  Active Compounds ({activeCompounds.length})
                </summary>
                <div className="mt-3">
                  <ActiveCompoundsList compounds={activeCompounds} />
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {currentLogCount > 0 && (
        <details className="bg-card border-border group rounded-xl border p-4 shadow-[var(--elevation-1)]">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none font-mono text-[10px] tracking-wider uppercase">
            Recent Activity
          </summary>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-end">
              <ViewAllLink />
            </div>
            <TodayLogList maxVisible={5} />
          </div>
        </details>
      )}

      {/* Empty State - No logs today but has protocol items */}
      {currentLogCount === 0 && hasProtocolItems && (
        <div className="bg-card border-border rounded-xl border border-dashed py-12 text-center shadow-[var(--elevation-1)]">
          <Clock className="text-muted-foreground/30 mx-auto mb-3 h-6 w-6" />
          <p className="text-muted-foreground font-mono text-xs">
            No activity logged today
          </p>
          <p className="text-muted-foreground/60 mt-1 font-mono text-[10px]">
            Use command bar or log a protocol slot
          </p>
        </div>
      )}

      {/* Empty State - No protocol configured (not during onboarding) */}
      {!hasProtocolItems && !needsOnboarding && (
        <div className="bg-card border-border rounded-xl border border-dashed py-12 text-center shadow-[var(--elevation-1)]">
          <p className="text-muted-foreground font-mono text-xs">
            No protocols configured
          </p>
          <CreateProtocolLink />
        </div>
      )}
    </div>
  );
}

/** VIEW ALL link with loading spinner */
function ViewAllLink() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      router.push("/dashboard/log");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="text-muted-foreground hover:text-foreground h-auto py-1 font-mono text-[10px]"
    >
      VIEW ALL
      {isPending ? (
        <Loader2 className="ml-1 h-3 w-3 animate-spin" />
      ) : (
        <ChevronRight className="ml-1 h-3 w-3" />
      )}
    </Button>
  );
}

/** Create Protocol link with loading spinner */
function CreateProtocolLink() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      router.push("/dashboard/protocol");
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="mt-4 font-mono text-xs"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Loading...
        </>
      ) : (
        "Create Protocol"
      )}
    </Button>
  );
}
