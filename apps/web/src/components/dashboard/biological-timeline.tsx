"use client";

import { useMemo, useState, useCallback, memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { Eye, EyeOff, Focus } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import type { TimelineDataPoint, ActiveCompound } from "~/server/services/biological-state";

// ============================================================================
// Types
// ============================================================================

type BiologicalTimelineProps = {
  /** Timeline data points with concentration curves */
  timelineData: TimelineDataPoint[];
  /** Active compounds for legend/labels */
  activeCompounds: ActiveCompound[];
  /** Current time marker (ISO string) */
  currentTime?: string;
  /** Enable focus mode (toggleable compounds) */
  focusModeEnabled?: boolean;
};

// ============================================================================
// Color Palette for Compounds
// ============================================================================

// HUD-consistent colors (rotating palette)
const COMPOUND_COLORS = [
  "#00D4FF", // Cyan - primary data color
  "#39FF14", // Green - synergy/active
  "#F0A500", // Amber - secondary
  "#A855F7", // Purple - tertiary
  "#FF6B6B", // Red - quaternary
  "#00FFA3", // Mint
  "#FF00FF", // Magenta
  "#FFD700", // Gold
];

function getCompoundColor(index: number): string {
  return COMPOUND_COLORS[index % COMPOUND_COLORS.length]!;
}

// ============================================================================
// Custom Tooltip
// ============================================================================

type TooltipPayload = {
  name: string;
  value: number;
  color: string;
  payload?: TimelineDataPoint;
};

function CustomTooltip({
  active,
  payload,
  supplementNames,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
  supplementNames: Map<string, string>;
}) {
  if (!active || !payload?.length) return null;

  // Get timestamp from the first payload item's data point
  const dataPoint = payload[0]?.payload;
  const timestamp = dataPoint?.timestamp;

  // Format the timestamp
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="border-border bg-card rounded-md border px-3 py-2 shadow-lg">
      <div className="text-muted-foreground mb-1 font-mono text-xs">
        {timestamp ? formatTime(timestamp) : "--:--"}
      </div>
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const name = supplementNames.get(entry.name) ?? entry.name;
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-foreground font-mono text-xs">
                {name}:{" "}
                <span className="tabular-nums">{Math.round(entry.value)}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Memoized Area Component for Performance
// ============================================================================

type MemoizedAreaProps = {
  id: string;
  index: number;
  allSupplementIds: string[];
};

const MemoizedArea = memo(function MemoizedArea({ id, index, allSupplementIds }: MemoizedAreaProps) {
  // Use consistent color based on original index in allSupplementIds
  const colorIndex = allSupplementIds.indexOf(id);
  return (
    <Area
      type="monotone"
      dataKey={`concentrations.${id}`}
      stroke={getCompoundColor(colorIndex >= 0 ? colorIndex : index)}
      strokeWidth={2}
      fill={`url(#gradient-${id})`}
      fillOpacity={1}
      isAnimationActive={false}
    />
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function BiologicalTimeline({
  timelineData,
  activeCompounds,
  currentTime,
  focusModeEnabled = true,
}: BiologicalTimelineProps) {
  // Focus mode: track which compounds are visible
  const [hiddenCompounds, setHiddenCompounds] = useState<Set<string>>(new Set());
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Build supplement name map
  const supplementNames = useMemo(() => {
    const map = new Map<string, string>();
    activeCompounds.forEach((c) => map.set(c.supplementId, c.name));
    return map;
  }, [activeCompounds]);

  // Get unique supplement IDs from timeline data
  const allSupplementIds = useMemo(() => {
    const ids = new Set<string>();
    timelineData.forEach((point) => {
      Object.keys(point.concentrations).forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [timelineData]);

  // Filter to only visible compounds
  const supplementIds = useMemo(() => {
    if (!isFocusMode) return allSupplementIds;
    return allSupplementIds.filter((id) => !hiddenCompounds.has(id));
  }, [allSupplementIds, hiddenCompounds, isFocusMode]);

  // Toggle compound visibility
  const toggleCompound = useCallback((supplementId: string) => {
    setHiddenCompounds((prev) => {
      const next = new Set(prev);
      if (next.has(supplementId)) {
        next.delete(supplementId);
      } else {
        next.add(supplementId);
      }
      return next;
    });
  }, []);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
    if (isFocusMode) {
      // Exiting focus mode - show all
      setHiddenCompounds(new Set());
    }
  }, [isFocusMode]);

  // Calculate current time marker position
  const currentMinutesFromStart = useMemo(() => {
    if (!currentTime || timelineData.length === 0) return null;
    const currentDate = new Date(currentTime);
    const firstPoint = timelineData[0];
    if (!firstPoint) return null;
    const startDate = new Date(firstPoint.timestamp);
    return (currentDate.getTime() - startDate.getTime()) / (1000 * 60);
  }, [currentTime, timelineData]);

  // Create a map from minutesFromStart to timestamp for x-axis formatting
  const timestampMap = useMemo(() => {
    const map = new Map<number, string>();
    timelineData.forEach((point) => {
      map.set(point.minutesFromStart, point.timestamp);
    });
    return map;
  }, [timelineData]);

  // Format x-axis ticks using pre-computed timestamps (memoized to prevent Recharts re-renders)
  const formatXAxis = useCallback((minutes: number) => {
    const timestamp = timestampMap.get(minutes);
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, [timestampMap]);

  if (timelineData.length === 0 || supplementIds.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-muted-foreground font-mono text-xs">
          No active compounds in the last 24h
        </p>
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={timelineData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {supplementIds.map((id, index) => (
              <linearGradient
                key={id}
                id={`gradient-${id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={getCompoundColor(index)}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={getCompoundColor(index)}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>

          <XAxis
            dataKey="minutesFromStart"
            tickFormatter={formatXAxis}
            stroke="#30363D"
            tick={{ fill: "#A8B1BB", fontSize: 10, fontFamily: "monospace" }}
            tickLine={{ stroke: "#30363D" }}
            axisLine={{ stroke: "#30363D" }}
            interval="preserveStartEnd"
            minTickGap={60}
          />

          <YAxis
            domain={[0, 120]}
            tickFormatter={(value) => `${value}%`}
            stroke="#30363D"
            tick={{ fill: "#A8B1BB", fontSize: 10, fontFamily: "monospace" }}
            tickLine={{ stroke: "#30363D" }}
            axisLine={{ stroke: "#30363D" }}
            width={40}
          />

          <Tooltip
            content={
              <CustomTooltip
                supplementNames={supplementNames}
              />
            }
          />

          {/* Current time marker */}
          {currentMinutesFromStart !== null && (
            <ReferenceLine
              x={currentMinutesFromStart}
              stroke="#39FF14"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: "NOW",
                position: "top",
                fill: "#39FF14",
                fontSize: 9,
                fontFamily: "monospace",
              }}
            />
          )}

          {/* Peak zone reference (100% line) */}
          <ReferenceLine
            y={100}
            stroke="#30363D"
            strokeDasharray="2 2"
            strokeWidth={1}
          />

          {/* Concentration areas - memoized for performance */}
          {supplementIds.map((id, index) => (
            <MemoizedArea
              key={id}
              id={id}
              index={index}
              allSupplementIds={allSupplementIds}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend with Focus Mode */}
      <div className="mt-3 space-y-2">
        {focusModeEnabled && allSupplementIds.length > 3 && (
          <button
            type="button"
            onClick={toggleFocusMode}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] transition-colors ${
              isFocusMode
                ? "bg-[#00D4FF]/20 text-[#00D4FF]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Focus className="h-3 w-3" />
            {isFocusMode ? "EXIT FOCUS" : "FOCUS MODE"}
          </button>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {allSupplementIds.map((id, index) => {
            const name = supplementNames.get(id) ?? "Unknown";
            const compound = activeCompounds.find((c) => c.supplementId === id);
            const phase = compound?.phase ?? "cleared";
            const isHidden = hiddenCompounds.has(id);

            return (
              <button
                key={id}
                type="button"
                onClick={isFocusMode ? () => toggleCompound(id) : undefined}
                disabled={!isFocusMode}
                className={`flex items-center gap-1.5 transition-opacity ${
                  isFocusMode ? "cursor-pointer hover:opacity-80" : "cursor-default"
                } ${isHidden && isFocusMode ? "opacity-30" : ""}`}
              >
                {isFocusMode && (
                  isHidden ? (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  )
                )}
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getCompoundColor(index) }}
                />
                <span className="text-muted-foreground font-mono text-[10px]">
                  {name}
                  {phase === "peak" && (
                    <span className="status-safe ml-1">[PEAK]</span>
                  )}
                  {phase === "absorbing" && (
                    <span className="status-info ml-1">[ABS]</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Active Compounds List
// ============================================================================

type ActiveCompoundsListProps = {
  compounds: ActiveCompound[];
};

export function ActiveCompoundsList({ compounds }: ActiveCompoundsListProps) {
  if (compounds.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center font-mono text-xs">
        No active compounds
      </div>
    );
  }

  // Sort by concentration (highest first)
  const sorted = [...compounds].sort(
    (a, b) => b.concentrationPercent - a.concentrationPercent,
  );

  return (
    <div className="space-y-2">
      {sorted.map((compound, index) => (
        <CompoundRow key={compound.logId} compound={compound} index={index} />
      ))}
    </div>
  );
}

function CompoundRow({
  compound,
  index,
}: {
  compound: ActiveCompound;
  index: number;
}) {
  const color = getCompoundColor(index);
  const phaseLabel = {
    absorbing: "ABS",
    peak: "PEAK",
    eliminating: "ELIM",
    cleared: "CLR",
  }[compound.phase];

  const phaseClass = {
    absorbing: "status-info",
    peak: "status-safe",
    eliminating: "text-muted-foreground",
    cleared: "text-muted-foreground/50",
  }[compound.phase];

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-foreground font-mono text-xs">
          {compound.name}
        </span>
        <span className={`font-mono text-[10px] ${phaseClass}`}>
          [{phaseLabel}]
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min(compound.concentrationPercent, 100)}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span className="text-muted-foreground w-10 text-right font-mono text-[10px] tabular-nums">
          {Math.round(compound.concentrationPercent)}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton Components
// ============================================================================

export function BiologicalTimelineSkeleton() {
  return (
    <div className="h-[200px] w-full">
      {/* Chart area skeleton */}
      <div className="bg-muted/20 relative h-full w-full rounded-md">
        {/* Y-axis skeleton */}
        <div className="absolute left-0 top-0 flex h-full w-10 flex-col justify-between py-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
        {/* Chart placeholder lines */}
        <div className="absolute inset-0 ml-10 flex flex-col justify-center gap-4 p-4">
          <Skeleton className="h-px w-full opacity-30" />
          <Skeleton className="h-px w-full opacity-30" />
          <Skeleton className="h-px w-full opacity-30" />
        </div>
        {/* X-axis skeleton */}
        <div className="absolute bottom-0 left-10 right-0 flex justify-between px-4 pb-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-10" />
          ))}
        </div>
      </div>
      {/* Legend skeleton */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActiveCompoundsListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-1.5 w-16 rounded-full" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}
