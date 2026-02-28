"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Zap,
  Clock,
  Scale,
  Info,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  InteractionCard,
  TimingCard,
  RatioCard,
} from "~/components/interactions/interaction-card";
import type {
  InteractionWarning,
  TimingWarning,
  RatioWarning,
  RatioEvaluationGap,
} from "~/server/actions/interactions";
import { buildRatioGapMessage } from "~/lib/engine/ratio-gaps";

// ============================================================================
// Types
// ============================================================================

type InteractionHeadsUpProps = {
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
  ratioEvaluationGaps?: RatioEvaluationGap[];
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * InteractionHeadsUp - Primary safety display component
 *
 * States:
 * - Safe (Green): "System Nominal. No interactions detected." - Collapsed by default
 * - Warning (Yellow/Red): Auto-expanded. Lists specific conflicts with explanations
 */
export function InteractionHeadsUp({
  interactions,
  ratioWarnings,
  timingWarnings,
  ratioEvaluationGaps = [],
}: InteractionHeadsUpProps) {
  // Deduplicate: if a timing warning exists for a pair, filter out the general interaction
  // since timing warnings are more specific and actionable
  const timingPairs = new Set(
    timingWarnings.map((tw) => {
      const ids = [tw.source.id, tw.target.id].sort();
      return `${ids[0]}-${ids[1]}`;
    }),
  );

  const deduplicatedInteractions = interactions.filter((interaction) => {
    const ids = [interaction.source.id, interaction.target.id].sort();
    const pairKey = `${ids[0]}-${ids[1]}`;
    // Keep interaction only if there's no timing warning for this pair
    return !timingPairs.has(pairKey);
  });

  const warnings = deduplicatedInteractions.filter((i) => i.type !== "synergy");
  const synergies = deduplicatedInteractions.filter(
    (i) => i.type === "synergy",
  );

  const totalWarnings =
    warnings.length + ratioWarnings.length + timingWarnings.length;
  const criticalCount =
    warnings.filter((w) => w.severity === "critical").length +
    ratioWarnings.filter((w) => w.severity === "critical").length +
    timingWarnings.filter((w) => w.severity === "critical").length;

  const hasAnyContent =
    totalWarnings > 0 || synergies.length > 0 || ratioEvaluationGaps.length > 0;

  // Auto-expand if there are warnings
  const [isOpen, setIsOpen] = useState(totalWarnings > 0);

  // Determine status
  const status: "nominal" | "warning" | "critical" =
    criticalCount > 0 ? "critical" : totalWarnings > 0 ? "warning" : "nominal";

  const statusConfig = {
    nominal: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      label: "SYSTEM NOMINAL",
      labelColor: "text-emerald-500",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/5",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      label: `${totalWarnings} WARNING${totalWarnings !== 1 ? "S" : ""}`,
      labelColor: "text-amber-500",
    },
    critical: {
      border: "border-destructive/30",
      bg: "bg-destructive/5",
      icon: AlertTriangle,
      iconColor: "text-destructive",
      label: `${criticalCount} CRITICAL`,
      labelColor: "text-destructive",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <section className="space-y-3">
      <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
        Interaction Analysis
      </p>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "rounded-lg border transition-colors",
            config.border,
            config.bg,
          )}
        >
          {/* Header - Always Visible */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-3 text-left"
              disabled={!hasAnyContent}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4", config.iconColor)} />
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-xs font-medium",
                      config.labelColor,
                    )}
                  >
                    {config.label}
                  </span>

                  {/* Synergy indicator */}
                  {synergies.length > 0 && (
                    <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                      <Zap className="h-2.5 w-2.5" />
                      {synergies.length}
                    </span>
                  )}

                  {/* Timing indicator */}
                  {timingWarnings.length > 0 && (
                    <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                      <Clock className="h-2.5 w-2.5" />
                      {timingWarnings.length}
                    </span>
                  )}

                  {/* Ratio indicator */}
                  {ratioWarnings.length > 0 && (
                    <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                      <Scale className="h-2.5 w-2.5" />
                      {ratioWarnings.length}
                    </span>
                  )}

                  {ratioEvaluationGaps.length > 0 && (
                    <span className="flex items-center gap-1 rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">
                      <Info className="h-2.5 w-2.5" />
                      {ratioEvaluationGaps.length}
                    </span>
                  )}
                </div>
              </div>

              {hasAnyContent && (
                <ChevronDown
                  className={cn(
                    "text-muted-foreground h-4 w-4 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              )}
            </button>
          </CollapsibleTrigger>

          {/* Expandable Content */}
          <CollapsibleContent>
            <div className="border-border/30 space-y-2 border-t p-3">
              {/* Timing Warnings - Most time-sensitive */}
              {timingWarnings.map((warning) => (
                <TimingCard
                  key={warning.id}
                  warning={warning}
                  defaultExpanded={timingWarnings.length === 1}
                />
              ))}

              {/* Ratio Warnings */}
              {ratioWarnings.map((warning) => (
                <RatioCard
                  key={warning.id}
                  warning={warning}
                  defaultExpanded={
                    ratioWarnings.length === 1 && timingWarnings.length === 0
                  }
                />
              ))}

              {ratioEvaluationGaps.length > 0 && (
                <div className="space-y-1 rounded-md border border-sky-500/20 bg-sky-500/5 p-2">
                  <p className="font-mono text-[10px] tracking-wider text-sky-300 uppercase">
                    Ratio Checks Needing More Data
                  </p>
                  {ratioEvaluationGaps.map((gap, index) => (
                    <p
                      key={`${gap.sourceSupplementId}-${gap.targetSupplementId}-${index}`}
                      className="text-muted-foreground font-mono text-[11px]"
                    >
                      {buildRatioGapMessage(gap)}
                    </p>
                  ))}
                </div>
              )}

              {/* Interaction Warnings */}
              {warnings.map((warning) => (
                <InteractionCard
                  key={warning.id}
                  interaction={warning}
                  defaultExpanded={
                    warnings.length === 1 &&
                    timingWarnings.length === 0 &&
                    ratioWarnings.length === 0
                  }
                />
              ))}

              {/* Synergies - Positive, show last */}
              {synergies.length > 0 && (
                <>
                  {(warnings.length > 0 ||
                    ratioWarnings.length > 0 ||
                    timingWarnings.length > 0) && (
                    <div className="border-border/20 my-2 border-t" />
                  )}
                  {synergies.map((synergy) => (
                    <InteractionCard key={synergy.id} interaction={synergy} />
                  ))}
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </section>
  );
}
