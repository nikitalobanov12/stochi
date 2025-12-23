"use client";

import Link from "next/link";
import { ChevronRight, Clock, Layers } from "lucide-react";

import { Button } from "~/components/ui/button";
import { TodayLogList } from "~/components/log/today-log-list";
import { LogProvider, type LogEntry, type StackItem } from "~/components/log/log-context";

// Dashboard Components
import { SystemStatus } from "~/components/dashboard/system-status";
import { InteractionHeadsUp } from "~/components/dashboard/interaction-heads-up";
import { MissionControl } from "~/components/dashboard/protocol-card";
import { DashboardCommandBar } from "./dashboard-command-bar";

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
  stackCompletion: StackCompletionStatus[];
  userStacksWithItems: Array<{
    id: string;
    name: string;
    items: StackItem[];
  }>;

  // UI State
  streak: number;
  lastLogAt: Date | null;
  needsOnboarding: boolean;
  hasStacks: boolean;

  // Biological State
  biologicalState: BiologicalState;
  timelineData: TimelineDataPoint[];
  safetyHeadroom: SafetyHeadroom[];

  // Interactions
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
};

export function DashboardClient({
  todayLogs,
  allSupplements,
  stackCompletion,
  userStacksWithItems,
  streak,
  lastLogAt,
  needsOnboarding,
  hasStacks,
  biologicalState,
  timelineData,
  safetyHeadroom,
  interactions,
  ratioWarnings,
  timingWarnings,
}: DashboardClientProps) {
  return (
    <LogProvider initialLogs={todayLogs}>
      <DashboardContent
        allSupplements={allSupplements}
        stackCompletion={stackCompletion}
        userStacksWithItems={userStacksWithItems}
        streak={streak}
        lastLogAt={lastLogAt}
        needsOnboarding={needsOnboarding}
        hasStacks={hasStacks}
        biologicalState={biologicalState}
        timelineData={timelineData}
        safetyHeadroom={safetyHeadroom}
        interactions={interactions}
        ratioWarnings={ratioWarnings}
        timingWarnings={timingWarnings}
        initialLogCount={todayLogs.length}
      />
    </LogProvider>
  );
}

// Inner component that uses the LogContext
function DashboardContent({
  allSupplements,
  stackCompletion,
  userStacksWithItems,
  streak,
  lastLogAt,
  needsOnboarding,
  hasStacks,
  biologicalState,
  timelineData,
  safetyHeadroom,
  interactions,
  ratioWarnings,
  timingWarnings,
  initialLogCount,
}: Omit<DashboardClientProps, "todayLogs"> & { initialLogCount: number }) {
  // Import log context to get current log count for conditional rendering
  // We use initialLogCount for server-side conditions since optimistic updates
  // shouldn't change what sections are shown (e.g., empty states)

  return (
    <div className="space-y-6">
      {/* ================================================================
       * Header Row (Full Width): System Status Bar
       * Shows: Streak, Last Log, Today's log count
       * ================================================================ */}
      <SystemStatus
        streak={streak}
        todayLogCount={initialLogCount}
        lastLogAt={lastLogAt}
      />

      {/* ================================================================
       * Command Bar - Primary Input (Full Width)
       * ================================================================ */}
      <DashboardCommandBar supplements={allSupplements} />

      {/* ================================================================
       * Protocols Section (Full Width) - Primary Action
       * Moved to top as the first thing users want to do
       * ================================================================ */}
      {stackCompletion.length > 0 && (
        <MissionControl
          stacks={stackCompletion}
          userStacksWithItems={userStacksWithItems}
        />
      )}

      {/* ================================================================
       * Main Content: 12-Column Bento Grid Layout
       * Left (8 cols): Timeline, Optimization HUD, Live Console
       * Right (4 cols): Bio-Score Card, Micro-KPIs, Active Compounds
       * ================================================================ */}
      {initialLogCount > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Column: Timeline + HUD + Console (8 cols) */}
          <div className="space-y-4 lg:col-span-8">
            {/* Biological Timeline */}
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

            {/* Optimization HUD */}
            <div>
              <h2 className="text-muted-foreground mb-3 font-mono text-[10px] tracking-wider uppercase">
                Optimization HUD
              </h2>
              <OptimizationHUD
                exclusionZones={biologicalState.exclusionZones}
                optimizations={biologicalState.optimizations}
              />
            </div>

            {/* Live Console Feed */}
            <LiveConsoleFeed
              interactions={interactions}
              ratioWarnings={ratioWarnings}
              timingWarnings={timingWarnings}
            />
          </div>

          {/* Right Column: Bio-Score + KPIs + Compounds (4 cols) */}
          <div className="space-y-4 lg:col-span-4">
            {/* Bio-Score Card */}
            <BioScoreCard
              score={biologicalState.bioScore}
              exclusionZones={biologicalState.exclusionZones}
              optimizations={biologicalState.optimizations}
            />

            {/* Micro-KPI Row */}
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

            {/* Active Compounds List */}
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

      {/* Legacy Interaction HUD (show if no timeline data but has logs) */}
      {initialLogCount > 0 && timelineData.length === 0 && (
        <InteractionHeadsUp
          interactions={interactions}
          ratioWarnings={ratioWarnings}
          timingWarnings={timingWarnings}
        />
      )}

      {/* Today's Activity Log - Compact */}
      {initialLogCount > 0 && (
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
          <TodayLogList maxVisible={5} />
        </div>
      )}

      {/* Empty State - No logs today but has stacks */}
      {initialLogCount === 0 && hasStacks && (
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

      {/* Empty State - No stacks configured (not during onboarding) */}
      {!hasStacks && stackCompletion.length === 0 && !needsOnboarding && (
        <div className="glass-card border-dashed py-12 text-center">
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
  );
}
