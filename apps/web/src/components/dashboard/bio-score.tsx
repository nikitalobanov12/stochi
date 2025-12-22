"use client";

import {
  Activity,
  ChevronRight,
  AlertTriangle,
  Zap,
  ExternalLink,
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

type BioScoreProps = {
  score: number;
  exclusionZones: ExclusionZone[];
  optimizations: OptimizationOpportunity[];
};

type ScoreBreakdownItem = {
  type: "penalty" | "bonus";
  label: string;
  value: number;
  severity?: "critical" | "medium" | "low";
  researchUrl?: string | null;
};

// ============================================================================
// Helper Functions
// ============================================================================

// Semantic color classes for bio-score levels
function getScoreColorClass(score: number): string {
  if (score >= 80) return "status-optimized"; // Green - optimal
  if (score >= 60) return "status-info"; // Cyan - good
  if (score >= 40) return "status-conflict"; // Amber - warning
  return "status-critical"; // Red - critical
}

// CSS variable colors for SVG elements (Recharts-compatible)
function getScoreColorVar(score: number): string {
  if (score >= 80) return "var(--chart-1)"; // Emerald - optimal
  if (score >= 60) return "var(--chart-2)"; // Cyan - good
  if (score >= 40) return "var(--chart-3)"; // Amber - warning
  return "var(--chart-4)"; // Red - critical
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "OPTIMAL";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "MODERATE";
  if (score >= 30) return "SUBOPTIMAL";
  return "CRITICAL";
}

function calculateBreakdown(
  exclusionZones: ExclusionZone[],
  optimizations: OptimizationOpportunity[],
): ScoreBreakdownItem[] {
  const items: ScoreBreakdownItem[] = [];

  // Penalties from exclusion zones
  for (const zone of exclusionZones) {
    const penalty =
      zone.severity === "critical"
        ? -50
        : zone.severity === "medium"
          ? -25
          : -15;
    items.push({
      type: "penalty",
      label: `${zone.sourceSupplementName}/${zone.targetSupplementName} conflict`,
      value: penalty,
      severity: zone.severity,
      researchUrl: zone.researchUrl,
    });
  }

  // Bonuses from active synergies
  const activeSynergies = optimizations.filter(
    (o) => o.type === "synergy" && o.title.startsWith("Active synergy"),
  );

  let synergyBonusTotal = 0;
  for (const synergy of activeSynergies) {
    const bonus = Math.min(5, 20 - synergyBonusTotal); // Cap at +20 total
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

// ============================================================================
// Components
// ============================================================================

function ScoreGauge({ score }: { score: number }) {
  const colorVar = getScoreColorVar(score);
  const colorClass = getScoreColorClass(score);
  const circumference = 2 * Math.PI * 36; // r=36
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r="36"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r="36"
          stroke={colorVar}
          strokeWidth="6"
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
          className={`font-mono text-2xl font-bold tabular-nums ${colorClass}`}
        >
          {score}
        </span>
        <span className="text-muted-foreground font-mono text-[8px] tracking-wider">
          BIO-SCORE
        </span>
      </div>
    </div>
  );
}

function BreakdownModal({
  score,
  exclusionZones,
  optimizations,
  children,
}: BioScoreProps & { children: React.ReactNode }) {
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
            <ScoreGauge score={score} />
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
                  className="flex items-center justify-between rounded-lg bg-black/10 px-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
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
                    {item.researchUrl && (
                      <a
                        href={item.researchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:status-info shrink-0 transition-colors"
                        title="View PubMed citation"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
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

          {/* Formula explanation */}
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
// Main Export
// ============================================================================

export function BioScore({
  score,
  exclusionZones,
  optimizations,
}: BioScoreProps) {
  const colorClass = getScoreColorClass(score);
  const colorVar = getScoreColorVar(score);
  const label = getScoreLabel(score);
  const hasModifiers =
    exclusionZones.length > 0 ||
    optimizations.some(
      (o) => o.type === "synergy" && o.title.startsWith("Active synergy"),
    );

  return (
    <BreakdownModal
      score={score}
      exclusionZones={exclusionZones}
      optimizations={optimizations}
    >
      <button
        type="button"
        className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0A0A0A] p-3 transition-colors hover:border-white/15 hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className={`h-5 w-5 ${colorClass}`} />
            {hasModifiers && (
              <div
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: colorVar }}
              />
            )}
          </div>
          <div className="text-left">
            <div className="text-foreground font-mono text-sm tabular-nums">
              {score}
            </div>
            <div className={`font-mono text-[10px] ${colorClass}`}>{label}</div>
          </div>
        </div>
        <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </BreakdownModal>
  );
}
