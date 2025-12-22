"use client";

import {
  Activity,
  AlertTriangle,
  Zap,
  ChevronRight,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type {
  ExclusionZone,
  OptimizationOpportunity,
} from "~/server/services/biological-state";

// ============================================================================
// Types
// ============================================================================

type BioScoreCardProps = {
  score: number;
  exclusionZones: ExclusionZone[];
  optimizations: OptimizationOpportunity[];
};

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColorClass(score: number): string {
  if (score >= 80) return "status-optimized";
  if (score >= 60) return "status-info";
  if (score >= 40) return "status-conflict";
  return "status-critical";
}

function getScoreColorVar(score: number): string {
  if (score >= 80) return "var(--chart-1)";
  if (score >= 60) return "var(--chart-2)";
  if (score >= 40) return "var(--chart-3)";
  return "var(--chart-4)";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "OPTIMAL";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "MODERATE";
  if (score >= 30) return "SUBOPTIMAL";
  return "CRITICAL";
}

// ============================================================================
// Score Gauge Component
// ============================================================================

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const colorVar = getScoreColorVar(score);
  const colorClass = getScoreColorClass(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          className="text-white/10"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorVar}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      {/* Score value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono text-xl font-bold tabular-nums ${colorClass}`}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Breakdown Modal (reused from bio-score.tsx)
// ============================================================================

type ScoreBreakdownItem = {
  type: "penalty" | "bonus";
  label: string;
  value: number;
  severity?: "critical" | "medium" | "low";
};

function calculateBreakdown(
  exclusionZones: ExclusionZone[],
  optimizations: OptimizationOpportunity[],
): ScoreBreakdownItem[] {
  const items: ScoreBreakdownItem[] = [];

  for (const zone of exclusionZones) {
    const penalty =
      zone.severity === "critical"
        ? -50
        : zone.severity === "medium"
          ? -25
          : -15;
    items.push({
      type: "penalty",
      label: `${zone.sourceSupplementName}/${zone.targetSupplementName}`,
      value: penalty,
      severity: zone.severity,
    });
  }

  const activeSynergies = optimizations.filter(
    (o) => o.type === "synergy" && o.title.startsWith("Active synergy"),
  );

  let synergyBonusTotal = 0;
  for (const synergy of activeSynergies) {
    const bonus = Math.min(5, 20 - synergyBonusTotal);
    if (bonus > 0) {
      items.push({
        type: "bonus",
        label: synergy.title.replace("Active synergy: ", ""),
        value: bonus,
      });
      synergyBonusTotal += bonus;
    }
  }

  return items;
}

function BreakdownModal({
  score,
  exclusionZones,
  optimizations,
  children,
}: BioScoreCardProps & { children: React.ReactNode }) {
  const breakdown = calculateBreakdown(exclusionZones, optimizations);
  const hasItems = breakdown.length > 0;
  const scoreColorClass = getScoreColorClass(score);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm border-white/10 bg-[#0A0A0A]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-sans text-sm font-medium">
            <Activity className="h-4 w-4" />
            Bio-Score Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Score summary */}
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div>
              <div className="text-muted-foreground font-sans text-xs">
                Current Score
              </div>
              <div
                className={`font-mono text-3xl font-bold tabular-nums ${scoreColorClass}`}
              >
                {score}
              </div>
              <div className={`font-mono text-[10px] ${scoreColorClass}`}>
                {getScoreLabel(score)}
              </div>
            </div>
            <ScoreGauge score={score} size={96} />
          </div>

          {/* Breakdown items */}
          {hasItems ? (
            <div className="space-y-2">
              <div className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                Factors
              </div>
              {breakdown.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {item.type === "penalty" ? (
                      <AlertTriangle
                        className={`h-3 w-3 shrink-0 ${
                          item.severity === "critical"
                            ? "status-critical"
                            : item.severity === "medium"
                              ? "status-conflict"
                              : "text-muted-foreground"
                        }`}
                      />
                    ) : (
                      <Zap className="status-optimized h-3 w-3 shrink-0" />
                    )}
                    <span className="text-foreground truncate font-sans text-xs">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`ml-2 shrink-0 font-mono text-xs tabular-nums ${
                      item.type === "penalty"
                        ? "status-critical"
                        : "status-optimized"
                    }`}
                  >
                    {item.value > 0 ? "+" : ""}
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-4 text-center font-sans text-xs">
              No active modifiers
            </div>
          )}

          {/* Formula */}
          <div className="border-border/30 rounded-lg border p-3">
            <div className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
              Scoring Formula
            </div>
            <div className="text-muted-foreground mt-2 space-y-1 font-sans text-[10px]">
              <div>Base: 100</div>
              <div className="status-critical">Critical conflict: -50</div>
              <div className="status-conflict">Medium conflict: -25</div>
              <div className="text-muted-foreground">Low conflict: -15</div>
              <div className="status-optimized">
                Active synergy: +5 (max +20)
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BioScoreCard({
  score,
  exclusionZones,
  optimizations,
}: BioScoreCardProps) {
  const colorClass = getScoreColorClass(score);
  const label = getScoreLabel(score);

  // Calculate stats
  const conflicts = exclusionZones.filter(
    (z) => z.severity === "critical" || z.severity === "medium",
  ).length;

  const synergies = optimizations.filter(
    (o) => o.type === "synergy" && o.title.startsWith("Active synergy"),
  ).length;

  const pendingWindows = exclusionZones.filter(
    (z) => z.minutesRemaining > 0,
  ).length;

  return (
    <div>
      {/* Header - Outside card to match other sections */}
      <h2 className="text-muted-foreground mb-3 font-mono text-[10px] tracking-wider uppercase">
        Bio-Score
      </h2>

      <div className="glass-card p-4">
        {/* Gauge + Label Row */}
        <div className="flex items-center gap-4">
          <ScoreGauge score={score} size={64} />
          <div className="flex-1">
            <div
              className={`font-mono text-2xl font-bold tabular-nums ${colorClass}`}
            >
              {score}
            </div>
            <div
              className={`font-mono text-[10px] tracking-wider ${colorClass}`}
            >
              {label}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          {/* Conflicts */}
          <div className="flex items-center gap-1.5">
            {conflicts > 0 ? (
              <AlertTriangle className="status-conflict h-3 w-3" />
            ) : (
              <Shield className="status-optimized h-3 w-3" />
            )}
            <span className="font-mono text-xs text-white/70 tabular-nums">
              {conflicts} conflict{conflicts !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Synergies */}
          <div className="flex items-center gap-1.5">
            <Zap
              className={`h-3 w-3 ${synergies > 0 ? "status-optimized" : "text-muted-foreground"}`}
            />
            <span className="font-mono text-xs text-white/70 tabular-nums">
              {synergies} synerg{synergies !== 1 ? "ies" : "y"}
            </span>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${pendingWindows > 0 ? "animate-pulse bg-cyan-400" : "bg-white/20"}`}
            />
            <span className="font-mono text-xs text-white/70 tabular-nums">
              {pendingWindows} pending
            </span>
          </div>
        </div>

        {/* View Details Button */}
        <BreakdownModal
          score={score}
          exclusionZones={exclusionZones}
          optimizations={optimizations}
        >
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] py-1.5 font-mono text-[10px] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white/80"
          >
            VIEW BREAKDOWN
            <ChevronRight className="h-3 w-3" />
          </button>
        </BreakdownModal>
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

export function BioScoreCardSkeleton() {
  return (
    <div>
      <div className="mb-3 h-3 w-16 animate-pulse rounded bg-white/5" />
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-12 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-white/5 pt-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 w-16 animate-pulse rounded bg-white/5"
            />
          ))}
        </div>
        <div className="mt-3 h-7 animate-pulse rounded-lg bg-white/5" />
      </div>
    </div>
  );
}
