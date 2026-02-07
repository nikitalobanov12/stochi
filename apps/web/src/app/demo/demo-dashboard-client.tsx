"use client";

import { ChevronRight, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { Button } from "~/components/ui/button";
import { useDemoContext } from "~/components/demo/demo-provider";

// Dashboard Components
import { SystemStatus } from "~/components/dashboard/system-status";
import { InteractionHeadsUp } from "~/components/dashboard/interaction-heads-up";

// Biological State Engine Components
import {
  BiologicalTimeline,
  ActiveCompoundsList,
} from "~/components/dashboard/biological-timeline";
import { OptimizationHUD } from "~/components/dashboard/optimization-hud";

// Additional Components
import { BioScoreCard } from "~/components/dashboard/bio-score-card";
import { MicroKPIRow, type SafetyHeadroom } from "~/components/dashboard/micro-kpi-row";
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
import { DemoHint } from "~/components/demo/demo-hint";

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

  return (
    <div className="space-y-6">
      {/* Header Row: System Status Bar */}
      <SystemStatus
        streak={streak}
        todayLogCount={logCount}
        lastLogAt={lastLogAt}
      />

      {/* Command Bar */}
      <DemoCommandBar supplements={allSupplements} />

      <DemoHint id="command-bar">
        Try the command bar — type a supplement name like{" "}
        <kbd className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1">mag 400mg</kbd>{" "}
        to log with natural language parsing
      </DemoHint>

      <DemoHint id="protocol-tap">
        Tap <strong className="text-cyan-300">Log Stack</strong> to execute an entire supplement protocol in one click
      </DemoHint>

      {/* Protocols Section */}
      {stackCompletion.length > 0 && (
        <DemoMissionControl stacks={stackCompletion} />
      )}

      {/* Main Content: Bento Grid */}
      {logCount > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Column */}
          <div className="space-y-4 lg:col-span-8">
            <DemoHint id="bio-timeline">
              Pharmacokinetic curves modeled with Michaelis-Menten kinetics — each compound shows real absorption and elimination phases
            </DemoHint>

            {timelineData.length > 0 && (
              <div>
                <h2 className="text-muted-foreground mb-3 font-mono text-[10px] tracking-wider uppercase">
                  Biological Timeline
                </h2>
                <div className="glass-card p-4">
                  <BiologicalTimeline
                    timelineData={timelineData}
                    activeCompounds={biologicalState.activeCompounds}
                    currentTime={new Date().toISOString()}
                  />
                </div>
              </div>
            )}

            <div>
              <h2 className="text-muted-foreground mb-3 font-mono text-[10px] tracking-wider uppercase">
                Optimization HUD
              </h2>
              <OptimizationHUD
                exclusionZones={biologicalState.exclusionZones}
                optimizations={biologicalState.optimizations}
              />
            </div>

            <LiveConsoleFeed
              interactions={interactions}
              ratioWarnings={ratioWarnings}
              timingWarnings={timingWarnings}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4 lg:col-span-4">
            <DemoHint id="bio-score">
              Bio-Score factors in exclusion zones, timing conflicts, and stoichiometric ratios — not just a count
            </DemoHint>

            <BioScoreCard
              score={biologicalState.bioScore}
              exclusionZones={biologicalState.exclusionZones}
              optimizations={biologicalState.optimizations}
            />

            <div>
              <h2 className="text-muted-foreground mb-3 font-mono text-[10px] tracking-wider uppercase">
                Key Metrics
              </h2>
              <div className="glass-card p-4">
                <MicroKPIRow
                  ratioWarnings={ratioWarnings}
                  safetyHeadroom={safetyHeadroom}
                  exclusionZones={biologicalState.exclusionZones}
                />
              </div>
            </div>

            {biologicalState.activeCompounds.filter(
              (c) => c.phase !== "cleared",
            ).length > 0 && (
              <div>
                <h2 className="text-muted-foreground mb-3 font-mono text-[10px] tracking-wider uppercase">
                  Active Compounds
                </h2>
                <div className="glass-card p-4">
                  <ActiveCompoundsList
                    compounds={biologicalState.activeCompounds.filter(
                      (c) => c.phase !== "cleared",
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Interaction HUD */}
      {logCount > 0 && timelineData.length === 0 && (
        <InteractionHeadsUp
          interactions={interactions}
          ratioWarnings={ratioWarnings}
          timingWarnings={timingWarnings}
        />
      )}

      {/* Today's Activity Log */}
      {logCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
              Activity Log
            </h2>
            <DemoViewAllLink />
          </div>
          <DemoLogList maxVisible={5} />
        </div>
      )}

      {/* Empty State - No logs today */}
      {logCount === 0 && hasStacks && (
        <div className="glass-card border-dashed py-12 text-center">
          <Clock className="text-muted-foreground/30 mx-auto mb-3 h-6 w-6" />
          <p className="text-muted-foreground font-mono text-xs">
            No activity logged today
          </p>
          <p className="text-muted-foreground/60 mt-1 font-mono text-[10px]">
            Use command bar or tap a protocol
          </p>
        </div>
      )}
    </div>
  );
}

// Demo-specific Mission Control that uses demo context for logging
function DemoMissionControl({
  stacks,
}: {
  stacks: StackCompletionStatus[];
}) {
  const demo = useDemoContext();
  const [isPending, startTransition] = useTransition();

  function handleLogStack(stackId: string) {
    startTransition(() => {
      demo.logStack(stackId);
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
        Protocols
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {stacks.map((stack) => (
            <div
              key={stack.stackId}
              className="glass-card flex items-center justify-between p-4"
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
                    : "bg-gradient-to-r from-emerald-500 to-cyan-500"
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
    </div>
  );
}

function DemoViewAllLink() {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="text-muted-foreground hover:text-foreground h-auto py-1 font-mono text-[10px]"
    >
      <Link href="/demo/log">
        VIEW ALL
        <ChevronRight className="ml-1 h-3 w-3" />
      </Link>
    </Button>
  );
}
