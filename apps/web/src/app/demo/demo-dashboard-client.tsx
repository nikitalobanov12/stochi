"use client";

import { ChevronRight, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { Button } from "~/components/ui/button";
import { useDemoContext } from "~/components/demo/demo-provider";

// Dashboard Components
import { SystemStatus } from "~/components/dashboard/system-status";

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
  type SafetyHeadroom,
} from "~/components/dashboard/micro-kpi-row";
import { LiveConsoleFeed } from "~/components/dashboard/live-console-feed";

import type { LogEntry, StackItem } from "~/components/log/log-context";
import type { StackCompletionStatus } from "~/server/services/analytics";
import type {
  InteractionWarning,
  RatioWarning,
  TimingWarning,
} from "~/server/actions/interactions";
import type {
  BiologicalState,
  TimelineDataPoint,
} from "~/server/services/biological-state";

import { DemoCommandBar } from "./demo-command-bar";
import { DemoLogList } from "./demo-log-list";

type DemoSupplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: string | null;
};

type DemoDashboardClientProps = {
  todayLogs: LogEntry[];
  allSupplements: DemoSupplement[];
  stackCompletion: StackCompletionStatus[];
  userStacksWithItems: Array<{
    id: string;
    name: string;
    items: StackItem[];
  }>;
  streak: number;
  lastLogAt: Date | null;
  needsOnboarding: boolean;
  hasStacks: boolean;
  biologicalState: BiologicalState;
  timelineData: TimelineDataPoint[];
  safetyHeadroom: SafetyHeadroom[];
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
};

export function DemoDashboardClient({
  allSupplements,
  stackCompletion,
  userStacksWithItems: _userStacksWithItems,
  streak,
  lastLogAt,
  hasStacks,
  biologicalState,
  timelineData,
  safetyHeadroom,
  interactions,
  ratioWarnings,
  timingWarnings,
}: DemoDashboardClientProps) {
  const demo = useDemoContext();
  const logCount = demo.logs.length;
  const activeCompounds = biologicalState.activeCompounds.filter(
    (c) => c.phase !== "cleared",
  );

  return (
    <div className="space-y-4">
      <SystemStatus
        streak={streak}
        todayLogCount={logCount}
        lastLogAt={lastLogAt}
      />

      <DemoShowcasePanel />

      <section id="demo-command-bar" className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Command Bar
        </p>
        <DemoCommandBar supplements={allSupplements} />
      </section>

      {stackCompletion.length > 0 && (
        <DemoMissionControl stacks={stackCompletion} />
      )}

      {logCount > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {timelineData.length > 0 && (
              <div>
                <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-[0.12em] uppercase">
                  Biological Timeline
                </h2>
                <div className="bg-card border-border rounded-xl border p-4 shadow-[var(--elevation-1)]">
                  <BiologicalTimeline
                    timelineData={timelineData}
                    activeCompounds={biologicalState.activeCompounds}
                    currentTime={new Date().toISOString()}
                  />
                </div>
              </div>
            )}

            <div>
              <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-[0.12em] uppercase">
                Next Actions
              </h2>
              <OptimizationHUD
                exclusionZones={biologicalState.exclusionZones}
                optimizations={biologicalState.optimizations}
              />
            </div>

            <details className="bg-card border-border group rounded-xl border p-3.5 shadow-[var(--elevation-1)]">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-xs font-medium tracking-[0.12em] uppercase">
                System Feed
              </summary>
              <div className="mt-3">
                <LiveConsoleFeed
                  interactions={interactions}
                  ratioWarnings={ratioWarnings}
                  timingWarnings={timingWarnings}
                />
              </div>
            </details>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <BioScoreCard
              score={biologicalState.bioScore}
              exclusionZones={biologicalState.exclusionZones}
              optimizations={biologicalState.optimizations}
            />

            <div>
              <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-[0.12em] uppercase">
                Key Metrics
              </h2>
              <div className="bg-card border-border rounded-xl border p-3.5 shadow-[var(--elevation-1)]">
                <MicroKPIRow
                  ratioWarnings={ratioWarnings}
                  safetyHeadroom={safetyHeadroom}
                  exclusionZones={biologicalState.exclusionZones}
                />
              </div>
            </div>

            {activeCompounds.length > 0 && (
              <details className="bg-card border-border group rounded-xl border p-3.5 shadow-[var(--elevation-1)]">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-xs font-medium tracking-[0.12em] uppercase">
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

      {logCount > 0 && (
        <details className="bg-card border-border group rounded-xl border p-3.5 shadow-[var(--elevation-1)]">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none text-xs font-medium tracking-[0.12em] uppercase">
            Recent Activity
          </summary>
          <div className="mt-2.5 space-y-2.5">
            <div className="flex items-center justify-end">
              <DemoViewAllLink />
            </div>
            <DemoLogList maxVisible={5} />
          </div>
        </details>
      )}

      {logCount === 0 && hasStacks && (
        <div className="bg-card border-border rounded-xl border border-dashed py-12 text-center shadow-[var(--elevation-1)]">
          <Clock className="text-muted-foreground/30 mx-auto mb-3 h-6 w-6" />
          <p className="text-muted-foreground text-sm font-medium">
            No activity logged today
          </p>
          <p className="text-muted-foreground/70 mt-1 text-xs">
            Use command bar or tap a protocol
          </p>
        </div>
      )}
    </div>
  );
}

function DemoShowcasePanel() {
  return (
    <section className="bg-card border-border rounded-xl border p-4 shadow-[var(--elevation-1)] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
            Start here
          </p>
          <h2 className="text-foreground mt-2 text-2xl leading-tight font-semibold sm:text-[2rem]">
            See the engine react in one simple flow.
          </h2>
          <p className="text-muted-foreground mt-1.5 text-base leading-relaxed">
            Log one entry, run one protocol, then watch timeline and safety
            signals update.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-md">
              <a href="#demo-command-bar">Start in Command Bar</a>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-md">
              <a href="#demo-protocols">Go to Protocols</a>
            </Button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <div className="bg-secondary/45 border-border/70 rounded-lg border px-3.5 py-2.5 text-left">
            <p className="text-muted-foreground text-xs">
              1. Log one supplement in the command bar
            </p>
          </div>
          <div className="bg-secondary/45 border-border/70 rounded-lg border px-3.5 py-2.5 text-left">
            <p className="text-muted-foreground text-xs">
              2. Then run one protocol
            </p>
          </div>
          <div className="bg-secondary/45 border-border/70 rounded-lg border px-3.5 py-2.5 text-left">
            <p className="text-muted-foreground text-xs">
              3. Watch the timeline + alerts update
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Demo-specific Mission Control that uses demo context for logging
function DemoMissionControl({ stacks }: { stacks: StackCompletionStatus[] }) {
  const demo = useDemoContext();
  const [isPending, startTransition] = useTransition();

  function handleLogStack(stackId: string) {
    startTransition(() => {
      demo.logStack(stackId);
    });
  }

  return (
    <section id="demo-protocols" className="space-y-2">
      <h2 className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
        Protocols
      </h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {stacks.map((stack) => (
          <div
            key={stack.stackId}
            className="bg-card border-border flex items-center justify-between rounded-xl border p-3.5 shadow-[var(--elevation-1)]"
          >
            <div>
              <p className="font-medium">{stack.stackName}</p>
              <p className="text-muted-foreground text-xs">
                {stack.loggedItems}/{stack.totalItems} logged
              </p>
            </div>
            <Button
              size="sm"
              variant={stack.isComplete ? "outline" : "default"}
              disabled={isPending || stack.isComplete}
              onClick={() => handleLogStack(stack.stackId)}
              className={
                stack.isComplete
                  ? "border-emerald-500/30 text-emerald-400"
                  : "bg-primary text-primary-foreground"
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : stack.isComplete ? (
                "Complete"
              ) : (
                "Log Stack"
              )}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function DemoViewAllLink() {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="text-muted-foreground hover:text-foreground h-auto py-1 text-xs"
    >
      <Link href="/demo/log">
        VIEW ALL
        <ChevronRight className="ml-1 h-3 w-3" />
      </Link>
    </Button>
  );
}
