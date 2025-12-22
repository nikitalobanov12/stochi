"use client";

import { useMemo } from "react";
import { Clock, Shield, AlertTriangle } from "lucide-react";
import type { RatioWarning } from "~/server/actions/interactions";
import type { ExclusionZone } from "~/server/services/biological-state";

// ============================================================================
// Types
// ============================================================================

export type SafetyHeadroom = {
  category: string;
  label: string;
  current: number;
  limit: number;
  unit: string;
  percentUsed: number;
};

type MicroKPIRowProps = {
  /** Ratio warnings from today's logs */
  ratioWarnings: RatioWarning[];
  /** Current daily totals for safety categories */
  safetyHeadroom: SafetyHeadroom[];
  /** Exclusion zones for "next window" countdown */
  exclusionZones: ExclusionZone[];
  /** Calculated ratios to display (even if not warnings) */
  currentRatios?: Array<{
    label: string;
    numerator: string;
    denominator: string;
    current: number;
    optimal: number;
    isOptimal: boolean;
  }>;
};

// ============================================================================
// Ratio Balance Bar Component
// "Centered-zero" design: optimal ratio = centered indicator
// ============================================================================

function RatioKPI({
  label,
  current,
  optimal,
  min,
  max,
  isWarning,
}: {
  label: string;
  current: number;
  optimal: number;
  min?: number;
  max?: number;
  isWarning: boolean;
}) {
  // Calculate position on bar (0-100)
  // Optimal is center (50), min is 0, max is 100
  const effectiveMin = min ?? optimal * 0.5;
  const effectiveMax = max ?? optimal * 2;
  const range = effectiveMax - effectiveMin;

  // Clamp current to display range
  const clampedCurrent = Math.max(
    effectiveMin,
    Math.min(effectiveMax, current),
  );
  const position = ((clampedCurrent - effectiveMin) / range) * 100;

  // Optimal position (should be ~50% if min/max are symmetric)
  const optimalPosition = ((optimal - effectiveMin) / range) * 100;

  // Color based on deviation from optimal
  const deviation = Math.abs(current - optimal) / optimal;
  let statusColor = "bg-emerald-500";
  let textColor = "status-optimized";

  if (isWarning || deviation > 0.5) {
    statusColor = "bg-red-500";
    textColor = "status-critical";
  } else if (deviation > 0.25) {
    statusColor = "bg-amber-500";
    textColor = "status-conflict";
  }

  return (
    <div className="flex min-w-[120px] flex-col gap-1.5 rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
          {label}
        </span>
        <span className={`font-mono text-xs tabular-nums ${textColor}`}>
          {current.toFixed(1)}:1
        </span>
      </div>

      {/* Balance bar */}
      <div className="relative h-1.5 w-full rounded-full bg-white/10">
        {/* Optimal zone indicator (subtle) */}
        <div
          className="absolute top-0 h-full w-px bg-white/20"
          style={{ left: `${optimalPosition}%` }}
        />

        {/* Current position indicator */}
        <div
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${statusColor} shadow-lg`}
          style={{
            left: `${position}%`,
            transform: `translate(-50%, -50%)`,
            boxShadow: isWarning
              ? `0 0 8px ${statusColor === "bg-red-500" ? "rgba(239, 68, 68, 0.5)" : "rgba(245, 158, 11, 0.5)"}`
              : undefined,
          }}
        />
      </div>

      {/* Optimal label */}
      <div className="text-center font-mono text-[9px] text-white/30">
        optimal {optimal}:1
      </div>
    </div>
  );
}

// ============================================================================
// Safety Headroom Bar Component
// ============================================================================

function SafetyKPI({
  label,
  current,
  limit,
  unit,
  percentUsed,
}: SafetyHeadroom) {
  // Color based on percentage used
  let barColor = "bg-emerald-500";
  let textColor = "text-white/70";

  if (percentUsed >= 90) {
    barColor = "bg-red-500";
    textColor = "status-critical";
  } else if (percentUsed >= 70) {
    barColor = "bg-amber-500";
    textColor = "status-conflict";
  }

  // Format numbers nicely
  const formatNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString();

  return (
    <div className="flex min-w-[110px] flex-col gap-1.5 rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
          {label}
        </span>
        {percentUsed >= 70 && (
          <AlertTriangle className="status-conflict h-3 w-3" />
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      {/* Value */}
      <div className={`font-mono text-[10px] tabular-nums ${textColor}`}>
        {formatNum(current)}/{formatNum(limit)}
        {unit}
      </div>
    </div>
  );
}

// ============================================================================
// Next Window Countdown Component
// ============================================================================

function NextWindowKPI({
  exclusionZones,
}: {
  exclusionZones: ExclusionZone[];
}) {
  // Find the soonest window to open
  const nextWindow = useMemo(() => {
    const pending = exclusionZones
      .filter((z) => z.minutesRemaining > 0)
      .sort((a, b) => a.minutesRemaining - b.minutesRemaining);
    return pending[0] ?? null;
  }, [exclusionZones]);

  if (!nextWindow) {
    return (
      <div className="flex min-w-[110px] flex-col gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Shield className="status-optimized h-3 w-3" />
          <span className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
            Status
          </span>
        </div>
        <div className="status-optimized font-mono text-sm font-medium">
          ALL CLEAR
        </div>
        <div className="font-mono text-[9px] text-white/30">
          No timing conflicts
        </div>
      </div>
    );
  }

  // Format time remaining
  const hours = Math.floor(nextWindow.minutesRemaining / 60);
  const minutes = nextWindow.minutesRemaining % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Urgency color
  const isImminent = nextWindow.minutesRemaining < 30;
  const borderColor = isImminent ? "border-emerald-500/30" : "border-white/10";
  const bgColor = isImminent ? "bg-emerald-500/5" : "bg-[#0A0A0A]";

  return (
    <div
      className={`flex min-w-[110px] flex-col gap-1.5 rounded-lg border ${borderColor} ${bgColor} px-3 py-2`}
    >
      <div className="flex items-center gap-1.5">
        <Clock
          className={`h-3 w-3 ${isImminent ? "status-optimized" : "text-white/50"}`}
        />
        <span className="font-mono text-[10px] tracking-wider text-white/50 uppercase">
          Next Window
        </span>
      </div>
      <div
        className={`font-mono text-sm font-medium tabular-nums ${isImminent ? "status-optimized" : "text-white"}`}
      >
        {timeStr}
      </div>
      <div className="truncate font-mono text-[9px] text-white/30">
        {nextWindow.targetSupplementName}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MicroKPIRow({
  ratioWarnings,
  safetyHeadroom,
  exclusionZones,
  currentRatios,
}: MicroKPIRowProps) {
  // Extract ratio data from warnings or provided ratios
  const ratiosToDisplay = useMemo(() => {
    if (currentRatios && currentRatios.length > 0) {
      return currentRatios.slice(0, 2);
    }

    // Fall back to ratio warnings if no explicit ratios provided
    if (ratioWarnings.length > 0) {
      return ratioWarnings.slice(0, 2).map((w) => ({
        label: `${w.source.name.split(" ")[0]}:${w.target.name.split(" ")[0]}`,
        numerator: w.source.name,
        denominator: w.target.name,
        current: w.currentRatio,
        optimal: w.optimalRatio ?? 10,
        isOptimal: false,
        min: w.minRatio ?? undefined,
        max: w.maxRatio ?? undefined,
      }));
    }

    return [];
  }, [ratioWarnings, currentRatios]);

  // Get top 2 safety categories approaching limits
  const topSafetyItems = useMemo(() => {
    return safetyHeadroom
      .filter((s) => s.percentUsed > 0)
      .sort((a, b) => b.percentUsed - a.percentUsed)
      .slice(0, 2);
  }, [safetyHeadroom]);

  // Check if we have any content to show
  const hasContent =
    ratiosToDisplay.length > 0 ||
    topSafetyItems.length > 0 ||
    exclusionZones.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
      {/* Ratio KPIs */}
      {ratiosToDisplay.map((ratio, i) => (
        <RatioKPI
          key={i}
          label={ratio.label}
          current={ratio.current}
          optimal={ratio.optimal}
          isWarning={!ratio.isOptimal}
        />
      ))}

      {/* Safety Headroom KPIs */}
      {topSafetyItems.map((item) => (
        <SafetyKPI key={item.category} {...item} />
      ))}

      {/* Next Window KPI */}
      <NextWindowKPI exclusionZones={exclusionZones} />
    </div>
  );
}

// ============================================================================
// Skeleton Component
// ============================================================================

export function MicroKPIRowSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="min-w-[110px] animate-pulse rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2"
        >
          <div className="mb-2 h-3 w-16 rounded bg-white/5" />
          <div className="mb-1 h-1.5 w-full rounded bg-white/5" />
          <div className="h-3 w-12 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
