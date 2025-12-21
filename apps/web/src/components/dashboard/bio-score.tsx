"use client";

import { Activity, ChevronRight, AlertTriangle, Zap, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { ExclusionZone, OptimizationOpportunity } from "~/server/services/biological-state";

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
// Helper Functions - Semantic Color System (Spec Section 5)
// ============================================================================

// Semantic color classes for bio-score levels
function getScoreColorClass(score: number): string {
  if (score >= 80) return "status-optimized"; // Emerald - optimal
  if (score >= 60) return "status-info"; // Cyan - good
  if (score >= 40) return "status-conflict"; // Amber - warning
  return "status-critical"; // Red - critical
}

// Hex colors for SVG gradients (per spec section 5 semantic colors)
function getScoreColorHex(score: number): string {
  if (score >= 80) return "#10B981"; // Emerald - optimal
  if (score >= 60) return "#06B6D4"; // Cyan - good
  if (score >= 40) return "#F59E0B"; // Amber - warning
  return "#EF4444"; // Red - critical
}

// Secondary gradient color (lighter variant)
function getScoreSecondaryColorHex(score: number): string {
  if (score >= 80) return "#34D399"; // Emerald-400
  if (score >= 60) return "#22D3EE"; // Cyan-400
  if (score >= 40) return "#FBBF24"; // Amber-400
  return "#F87171"; // Red-400
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
      zone.severity === "critical" ? -50 : zone.severity === "medium" ? -25 : -15;
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
// Radial SVG Gauge Component - Per Spec Section 6
// ============================================================================
// "Bio-Score Gauge: Replace progress bars with a Radial SVG Gauge featuring 
// a gradient stroke."

function ScoreGauge({ score }: { score: number }) {
  const primaryColor = getScoreColorHex(score);
  const secondaryColor = getScoreSecondaryColorHex(score);
  const colorClass = getScoreColorClass(score);
  
  // SVG circle parameters
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;
  
  // Unique gradient ID to avoid conflicts
  const gradientId = `bio-score-gradient-${score}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg 
        className="-rotate-90" 
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size }}
      >
        <defs>
          {/* Gradient stroke per spec */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={secondaryColor} />
            <stop offset="100%" stopColor={primaryColor} />
          </linearGradient>
        </defs>
        
        {/* Background circle - subtle track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle with gradient stroke */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      {/* Score value overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono text-3xl font-bold tabular-nums ${colorClass}`}>
          {score}
        </span>
        <span className="type-label text-[8px]">
          BIO-SCORE
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Breakdown Modal - Glass Card Styling
// ============================================================================

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
      <DialogContent className="glass-card-elevated max-w-sm">
        <DialogHeader>
          <DialogTitle className="type-header flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Bio-Score Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Score summary with radial gauge */}
          <div className="flex items-center justify-between rounded-2xl bg-white/[0.02] p-5">
            <div>
              <div className="type-prose text-xs">
                Current Score
              </div>
              <div className={`font-mono text-4xl font-bold tabular-nums ${scoreColorClass}`}>
                {score}
              </div>
              <div className={`type-technical text-[10px] ${scoreColorClass}`}>
                {getScoreLabel(score)}
              </div>
            </div>
            <ScoreGauge score={score} />
          </div>

          {/* Breakdown items */}
          {hasItems ? (
            <div className="space-y-2">
              <div className="type-label">
                Factors
              </div>
              {breakdown.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {item.type === "penalty" ? (
                      <AlertTriangle
                        className={`h-3.5 w-3.5 shrink-0 ${
                          item.severity === "critical"
                            ? "status-critical"
                            : item.severity === "medium"
                              ? "status-conflict"
                              : "text-muted-foreground"
                        }`}
                      />
                    ) : (
                      <Zap className="h-3.5 w-3.5 shrink-0 status-optimized" />
                    )}
                    <span className="type-header truncate text-xs">
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
                    className={`ml-2 shrink-0 font-mono text-xs font-medium tabular-nums ${
                      item.type === "penalty" ? "status-critical" : "status-optimized"
                    }`}
                  >
                    {item.value > 0 ? "+" : ""}
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="type-prose py-4 text-center text-xs">
              No active modifiers
            </div>
          )}

          {/* Formula explanation - Technical data */}
          <div className="glass-card p-4">
            <div className="type-label mb-2">
              Scoring Formula
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="type-prose">Base: 100</div>
              <div className="status-critical">Critical conflict: -50</div>
              <div className="status-conflict">Medium conflict: -25</div>
              <div className="type-prose">Low conflict: -15</div>
              <div className="status-optimized">Active synergy: +5 (max +20)</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Export - Compact BioScore Widget
// ============================================================================

export function BioScore({ score, exclusionZones, optimizations }: BioScoreProps) {
  const colorClass = getScoreColorClass(score);
  const colorHex = getScoreColorHex(score);
  const label = getScoreLabel(score);
  const hasModifiers = exclusionZones.length > 0 || optimizations.some(
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
        className="glass-card group flex w-full items-center justify-between p-3 transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className={`h-5 w-5 ${colorClass}`} />
            {hasModifiers && (
              <div
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: colorHex }}
              />
            )}
          </div>
          <div className="text-left">
            {/* Score - Technical data: JetBrains Mono */}
            <div className="type-technical text-sm tabular-nums">
              {score}
            </div>
            {/* Label - uses semantic color */}
            <div className={`font-mono text-[10px] ${colorClass}`}>
              {label}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>
    </BreakdownModal>
  );
}
