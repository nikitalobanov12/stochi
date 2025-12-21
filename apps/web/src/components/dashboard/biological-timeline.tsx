"use client";

import { useMemo, useState, useCallback, memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
} from "recharts";
import { EyeOff, ChevronDown, ChevronUp } from "lucide-react";
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
  /** Default number of compounds to show (Top N) */
  defaultVisibleCount?: number;
};

// ============================================================================
// Constants - Surgical Precision v2.0
// ============================================================================

/** Chart stroke width: 1px for "ghost stroke" aesthetic */
const CHART_STROKE_WIDTH = 1;
/** Highlighted stroke width when hovering */
const CHART_STROKE_WIDTH_HIGHLIGHTED = 1.5;
/** Fill opacity: 0 - strokes only, no area fills */
const CHART_FILL_OPACITY_MAX = 0;
/** Chart height for the timeline */
const CHART_HEIGHT = 280;
/** Zone band configuration - Clinical Precision v2.0 */
const ZONE_BANDS = {
  /** Optimal therapeutic window: 80-100% */
  optimal: { y1: 80, y2: 100, color: "rgba(57, 255, 20, 0.04)" }, // Emerald glow
  /** Caution zone: above 100% (potential overstimulation) */
  caution: { y1: 100, y2: 120, color: "rgba(240, 165, 0, 0.04)" }, // Amber warning
  /** Sub-therapeutic zone: below 30% */
  subTherapeutic: { y1: 0, y2: 30, color: "rgba(255, 255, 255, 0.01)" }, // Subtle dim
} as const;

// ============================================================================
// Color Palette for Compounds
// ============================================================================

// Fallback hex values for Recharts (doesn't support CSS variables)
// Maps to chart-2/1/3/5/4 from globals.css theme
const COMPOUND_COLORS_HEX = [
  "#00D4FF", // Cyan
  "#39FF14", // Emerald
  "#F0A500", // Amber
  "#A855F7", // Purple
  "#FF6B6B", // Red
  "#00FFA3", // Mint
  "#FF00FF", // Magenta
  "#FFD700", // Gold
];

function getCompoundColor(index: number): string {
  return COMPOUND_COLORS_HEX[index % COMPOUND_COLORS_HEX.length]!;
}

// ============================================================================
// Custom Tooltip - Fixed UUID Leak
// ============================================================================

type TooltipPayload = {
  name: string;
  value: number;
  color: string;
  dataKey: string;
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

  // Sort by concentration value (highest first)
  const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 shadow-lg">
      <div className="mb-1 font-mono text-xs text-white/40">
        {timestamp ? formatTime(timestamp) : "--:--"}
      </div>
      <div className="space-y-1">
        {sortedPayload.map((entry, i) => {
          // Extract UUID from dataKey: "concentrations.uuid" -> "uuid"
          const dataKeyStr = String(entry.dataKey ?? entry.name);
          const supplementId = dataKeyStr.replace("concentrations.", "");
          const name = supplementNames.get(supplementId) ?? "Unknown";
          
          // Skip if value is 0 or negligible
          if (entry.value < 1) return null;

          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-mono text-xs text-white/90">
                  {name}
                </span>
              </div>
              <span className="font-mono text-xs tabular-nums text-white">
                {Math.round(entry.value)}%
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
  name: string;
  isHighlighted: boolean | null; // null = no hover, true = this is hovered, false = another is hovered
  phase: "absorbing" | "peak" | "eliminating" | "cleared";
};

const MemoizedArea = memo(function MemoizedArea({ 
  id, 
  index, 
  allSupplementIds, 
  name, 
  isHighlighted,
  phase,
}: MemoizedAreaProps) {
  // Use consistent color based on original index in allSupplementIds
  const colorIndex = allSupplementIds.indexOf(id);
  // Dim other curves when one is highlighted
  const opacity = isHighlighted === null ? 1 : isHighlighted ? 1 : 0.15;
  const strokeOpacity = isHighlighted === null ? 1 : isHighlighted ? 1 : 0.3;
  
  // Surgical Precision v2.0: Absorption phase = solid, Elimination phase = 2px dashed
  // Post-peak phases (eliminating, cleared) use dashed strokes
  const isEliminating = phase === "eliminating" || phase === "cleared";
  const strokeDasharray = isEliminating ? "2 2" : "0";
  
  return (
    <Area
      type="monotone"
      dataKey={`concentrations.${id}`}
      name={name}
      stroke={getCompoundColor(colorIndex >= 0 ? colorIndex : index)}
      strokeWidth={isHighlighted ? CHART_STROKE_WIDTH_HIGHLIGHTED : CHART_STROKE_WIDTH}
      strokeOpacity={strokeOpacity}
      strokeDasharray={strokeDasharray}
      fill={`url(#gradient-${id})`}
      fillOpacity={opacity}
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
  defaultVisibleCount = 100, // Show all by default
}: BiologicalTimelineProps) {
  // Track whether to show all compounds or just top N
  const [showAll, setShowAll] = useState(true); // Default to showing all
  // Track manually hidden compounds (for fine-grained control)
  const [hiddenCompounds, setHiddenCompounds] = useState<Set<string>>(new Set());
  // Track hovered compound for highlighting (null = no hover)
  const [hoveredCompoundId, setHoveredCompoundId] = useState<string | null>(null);

  // Build supplement name map
  const supplementNames = useMemo(() => {
    const map = new Map<string, string>();
    activeCompounds.forEach((c) => map.set(c.supplementId, c.name));
    return map;
  }, [activeCompounds]);

  // Get unique supplement IDs from timeline data, sorted by current concentration
  const allSupplementIds = useMemo(() => {
    const ids = new Set<string>();
    timelineData.forEach((point) => {
      Object.keys(point.concentrations).forEach((id) => ids.add(id));
    });
    
    // Sort by current concentration (use the latest data point)
    const latestPoint = timelineData[timelineData.length - 1];
    const sortedIds = Array.from(ids).sort((a, b) => {
      const concA = latestPoint?.concentrations[a] ?? 0;
      const concB = latestPoint?.concentrations[b] ?? 0;
      return concB - concA;
    });
    
    return sortedIds;
  }, [timelineData]);

  // Determine which compounds to show on the chart
  const visibleSupplementIds = useMemo(() => {
    // Start with either all or top N
    const baseIds = showAll 
      ? allSupplementIds 
      : allSupplementIds.slice(0, defaultVisibleCount);
    
    // Apply manual hide filters
    return baseIds.filter((id) => !hiddenCompounds.has(id));
  }, [allSupplementIds, showAll, defaultVisibleCount, hiddenCompounds]);

  // Toggle individual compound visibility
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

  // Check if there are more compounds than the default visible count
  const hasMoreCompounds = allSupplementIds.length > defaultVisibleCount;
  
  // Check if all compounds are manually hidden
  const allHidden = allSupplementIds.length > 0 && visibleSupplementIds.length === 0;

  // No timeline data at all
  if (timelineData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center">
        <p className="text-muted-foreground font-mono text-xs">
          No active compounds in the last 24h
        </p>
      </div>
    );
  }
  
  // All compounds manually hidden - show restore option
  if (allHidden) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground font-mono text-xs">
          All compounds hidden
        </p>
        <button
          type="button"
          onClick={() => setHiddenCompounds(new Set())}
          className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 font-mono text-[10px] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white/80"
        >
          SHOW ALL COMPOUNDS
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart */}
      <div style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={timelineData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              {visibleSupplementIds.map((id) => {
                const colorIndex = allSupplementIds.indexOf(id);
                return (
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
                      stopColor={getCompoundColor(colorIndex)}
                      stopOpacity={CHART_FILL_OPACITY_MAX}
                    />
                    <stop
                      offset="95%"
                      stopColor={getCompoundColor(colorIndex)}
                      stopOpacity={0}
                    />
                  </linearGradient>
                );
              })}
            </defs>

            {/* Zone bands - Clinical Precision v2.0 */}
            {/* Sub-therapeutic zone (0-30%) - dimmed */}
            <ReferenceArea
              y1={ZONE_BANDS.subTherapeutic.y1}
              y2={ZONE_BANDS.subTherapeutic.y2}
              fill={ZONE_BANDS.subTherapeutic.color}
              fillOpacity={1}
            />
            {/* Optimal therapeutic window (80-100%) - emerald glow */}
            <ReferenceArea
              y1={ZONE_BANDS.optimal.y1}
              y2={ZONE_BANDS.optimal.y2}
              fill={ZONE_BANDS.optimal.color}
              fillOpacity={1}
            />
            {/* Caution zone (100-120%) - amber warning */}
            <ReferenceArea
              y1={ZONE_BANDS.caution.y1}
              y2={ZONE_BANDS.caution.y2}
              fill={ZONE_BANDS.caution.color}
              fillOpacity={1}
            />

            <XAxis
              dataKey="minutesFromStart"
              tickFormatter={formatXAxis}
              stroke="var(--border)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={{ stroke: "var(--border)" }}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
              minTickGap={60}
            />

            <YAxis
              domain={[0, 120]}
              tickFormatter={(value) => `${value}%`}
              stroke="var(--border)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={{ stroke: "var(--border)" }}
              axisLine={{ stroke: "var(--border)" }}
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
                stroke="var(--chart-1)"
                strokeDasharray="3 3"
                strokeWidth={CHART_STROKE_WIDTH}
                label={{
                  value: "NOW",
                  position: "top",
                  fill: "var(--chart-1)",
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                }}
              />
            )}

            {/* Peak zone reference (100% line) */}
            <ReferenceLine
              y={100}
              stroke="var(--border)"
              strokeDasharray="2 2"
              strokeWidth={CHART_STROKE_WIDTH}
            />

            {/* Concentration areas - memoized for performance */}
            {visibleSupplementIds.map((id) => {
              const colorIndex = allSupplementIds.indexOf(id);
              // Determine highlight state: null if nothing hovered, true if this is hovered, false if another is hovered
              const isHighlighted = hoveredCompoundId === null ? null : hoveredCompoundId === id;
              // Get compound phase for stroke style (absorption=solid, elimination=dashed)
              const compound = activeCompounds.find((c) => c.supplementId === id);
              const phase = compound?.phase ?? "cleared";
              return (
                <MemoizedArea
                  key={id}
                  id={id}
                  index={colorIndex}
                  allSupplementIds={allSupplementIds}
                  name={supplementNames.get(id) ?? "Unknown"}
                  isHighlighted={isHighlighted}
                  phase={phase}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with Show All toggle */}
      <div className="mt-3 space-y-2">
        {/* Compound pills - clickable to toggle, hoverable to highlight */}
        <div className="flex flex-wrap items-center gap-2">
          {(showAll ? allSupplementIds : allSupplementIds.slice(0, defaultVisibleCount)).map((id) => {
            const colorIndex = allSupplementIds.indexOf(id);
            const name = supplementNames.get(id) ?? "Unknown";
            const compound = activeCompounds.find((c) => c.supplementId === id);
            const phase = compound?.phase ?? "cleared";
            const isHidden = hiddenCompounds.has(id);
            const concentration = compound?.concentrationPercent ?? 0;
            const isHovered = hoveredCompoundId === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleCompound(id)}
                onMouseEnter={() => !isHidden && setHoveredCompoundId(id)}
                onMouseLeave={() => setHoveredCompoundId(null)}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-all ${
                  isHidden
                    ? "border-border/30 bg-transparent text-muted-foreground/50"
                    : isHovered
                      ? "border-foreground/50 bg-card text-foreground ring-1 ring-foreground/20"
                      : "border-border/50 bg-card/50 text-foreground hover:bg-card"
                }`}
              >
                {isHidden ? (
                  <EyeOff className="h-2.5 w-2.5" />
                ) : (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getCompoundColor(colorIndex) }}
                  />
                )}
                <span className={isHidden ? "line-through" : ""}>
                  {name}
                </span>
                {!isHidden && concentration > 0 && (
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round(concentration)}%
                  </span>
                )}
                {!isHidden && phase === "peak" && (
                  <span className="status-optimized">PEAK</span>
                )}
              </button>
            );
          })}

          {/* Show All / Show Less toggle */}
          {hasMoreCompounds && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-full border border-dashed border-border/50 px-2 py-0.5 font-mono text-[10px] transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-2.5 w-2.5" />
                  SHOW LESS
                </>
              ) : (
                <>
                  <ChevronDown className="h-2.5 w-2.5" />
                  +{allSupplementIds.length - defaultVisibleCount} MORE
                </>
              )}
            </button>
          )}
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

// Human-readable phase labels with explanations
// Typography: Phase labels use font-mono for pharmacokinetic precision
// Clinical Precision v2.0: Use [ABS] and [ELIM] tags per manifesto
const PHASE_CONFIG = {
  absorbing: {
    label: "Absorbing",
    shortLabel: "[ABS]",
    description: "Entering bloodstream",
    className: "status-info", // Cyan - neutral phase indicator
  },
  peak: {
    label: "Peak",
    shortLabel: "[PEAK]",
    description: "Maximum concentration",
    className: "status-optimized", // Emerald - optimal state
  },
  eliminating: {
    label: "Eliminating",
    shortLabel: "[ELIM]",
    description: "Being metabolized",
    className: "text-muted-foreground",
  },
  cleared: {
    label: "Cleared",
    shortLabel: "—",
    description: "Below threshold",
    className: "text-muted-foreground/50",
  },
} as const;

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
  const phaseConfig = PHASE_CONFIG[compound.phase];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
      {/* Vertical saturation bar - Surgical Precision v2.0 */}
      <div className="relative h-10 w-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="absolute bottom-0 w-full transition-all duration-300"
          style={{
            height: `${Math.min(compound.concentrationPercent, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      
      {/* Compound info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-mono text-xs text-white/90">
            {compound.name}
          </span>
          <span 
            className={`shrink-0 font-mono text-[10px] ${phaseConfig.className}`}
            title={phaseConfig.description}
          >
            {phaseConfig.shortLabel}
          </span>
        </div>
        <span className="font-mono text-[10px] tabular-nums text-white/40">
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
    <div className="w-full" style={{ height: CHART_HEIGHT }}>
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
