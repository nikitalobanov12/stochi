"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, Lightbulb, Zap, AlertTriangle, Clock, Scale } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import type { InteractionWarning, TimingWarning, RatioWarning } from "~/server/actions/interactions";

// ============================================================================
// Shared Utilities
// ============================================================================

function getSeverityStyles(severity: "low" | "medium" | "critical", isSynergy = false) {
  if (isSynergy) {
    return {
      border: "border-green-500/30",
      bg: "bg-green-500/5",
      text: "text-green-600",
      icon: "text-green-500",
    };
  }
  
  switch (severity) {
    case "critical":
      return {
        border: "border-destructive/30",
        bg: "bg-destructive/5",
        text: "text-destructive",
        icon: "text-destructive",
      };
    case "medium":
      return {
        border: "border-yellow-500/30",
        bg: "bg-yellow-500/5",
        text: "text-yellow-600",
        icon: "text-yellow-500",
      };
    default:
      return {
        border: "border-muted",
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        icon: "text-muted-foreground",
      };
  }
}

function SeverityBadge({ severity, isSynergy }: { severity: string; isSynergy?: boolean }) {
  if (isSynergy) {
    return (
      <Badge className="bg-green-500/20 text-green-600 text-xs">
        synergy
      </Badge>
    );
  }
  
  const styles = {
    critical: "bg-destructive/20 text-destructive",
    medium: "bg-yellow-500/20 text-yellow-600",
    low: "bg-muted text-muted-foreground",
  };
  
  return (
    <Badge className={cn("text-xs", styles[severity as keyof typeof styles] ?? styles.low)}>
      {severity}
    </Badge>
  );
}

// ============================================================================
// Interaction Card (for inhibition, competition, synergy)
// ============================================================================

type InteractionCardProps = {
  interaction: InteractionWarning;
  defaultExpanded?: boolean;
};

export function InteractionCard({ interaction, defaultExpanded = false }: InteractionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const isSynergy = interaction.type === "synergy";
  const styles = getSeverityStyles(interaction.severity, isSynergy);
  
  const hasDetails = interaction.mechanism || interaction.suggestion || interaction.researchUrl;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("rounded-lg border p-3", styles.border, styles.bg)}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start gap-3 text-left"
            disabled={!hasDetails}
          >
            {isSynergy ? (
              <Zap className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
            ) : (
              <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {interaction.source.name}
                </span>
                <span className="text-muted-foreground">
                  {isSynergy ? "+" : "→"}
                </span>
                <span className="text-sm font-medium">
                  {interaction.target.name}
                </span>
                <SeverityBadge severity={interaction.severity} isSynergy={isSynergy} />
              </div>
              {/* Preview of mechanism - always visible */}
              {interaction.mechanism && !isOpen && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
                  {interaction.mechanism}
                </p>
              )}
            </div>
            {hasDetails && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
            {/* Mechanism - full text */}
            {interaction.mechanism && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Why this happens</p>
                <p className="text-sm">{interaction.mechanism}</p>
              </div>
            )}

            {/* Suggestion */}
            {interaction.suggestion && (
              <div className="flex gap-2 rounded-md bg-background/50 p-2">
                <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-primary mb-0.5">What to do</p>
                  <p className="text-sm">{interaction.suggestion}</p>
                </div>
              </div>
            )}

            {/* Research Link */}
            {interaction.researchUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                asChild
              >
                <a
                  href={interaction.researchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Learn more on Examine.com
                </a>
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// Timing Warning Card
// ============================================================================

type TimingCardProps = {
  warning: TimingWarning;
  defaultExpanded?: boolean;
};

export function TimingCard({ warning, defaultExpanded = false }: TimingCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const styles = getSeverityStyles(warning.severity);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("rounded-lg border p-3", styles.border, styles.bg)}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start gap-3 text-left"
          >
            <Clock className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {warning.source.name}
                </span>
                <span className="text-muted-foreground">↔</span>
                <span className="text-sm font-medium">
                  {warning.target.name}
                </span>
                <SeverityBadge severity={warning.severity} />
                <Badge variant="outline" className="text-xs">
                  timing
                </Badge>
              </div>
              {!isOpen && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Taken {warning.actualHoursApart}h apart, need {warning.minHoursApart}h+
                </p>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
            {/* Timing Details */}
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Current gap</p>
                <p className="font-mono font-medium">{warning.actualHoursApart}h</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recommended</p>
                <p className="font-mono font-medium">{warning.minHoursApart}h+</p>
              </div>
            </div>

            {/* Reason */}
            {warning.reason && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Why timing matters</p>
                <p className="text-sm">{warning.reason}</p>
              </div>
            )}

            {/* Suggestion */}
            <div className="flex gap-2 rounded-md bg-background/50 p-2">
              <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary mb-0.5">What to do</p>
                <p className="text-sm">
                  Take {warning.source.name} at least {warning.minHoursApart} hours{" "}
                  {warning.minHoursApart >= 6 ? "before" : "apart from"} {warning.target.name}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// Ratio Warning Card
// ============================================================================

type RatioCardProps = {
  warning: RatioWarning;
  defaultExpanded?: boolean;
};

// Helper to format dosage with appropriate units
function formatDosage(value: number, unit: string): string {
  // Round to sensible precision based on magnitude
  if (value >= 1000) {
    return `${Math.round(value / 100) * 100}${unit}`;
  } else if (value >= 100) {
    return `${Math.round(value / 10) * 10}${unit}`;
  } else if (value >= 10) {
    return `${Math.round(value)}${unit}`;
  } else {
    return `${Math.round(value * 10) / 10}${unit}`;
  }
}

type AdjustmentSuggestion = {
  action: "increase" | "decrease";
  supplement: string;
  rangeMin: string;
  rangeMax: string;
  explanation: string;
} | null;

export function RatioCard({ warning, defaultExpanded = false }: RatioCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const styles = getSeverityStyles(warning.severity);

  // Calculate what adjustment is needed - returns a range
  const getAdjustmentSuggestion = (): AdjustmentSuggestion => {
    const { currentRatio, minRatio, maxRatio, source, target } = warning;
    
    // Need both min and max to calculate a meaningful range
    if (minRatio === null || maxRatio === null) return null;
    if (source.dosage === 0 || target.dosage === 0) return null;
    
    if (currentRatio < minRatio) {
      // Ratio too low - need more source (or less target)
      // Calculate source needed to hit min and max ratios
      const sourceForMin = target.dosage * minRatio;
      const sourceForMax = target.dosage * maxRatio;
      
      return {
        action: "increase",
        supplement: source.name,
        rangeMin: formatDosage(sourceForMin, source.unit),
        rangeMax: formatDosage(sourceForMax, source.unit),
        explanation: `With ${target.dosage}${target.unit} ${target.name}, aim for ${minRatio}-${maxRatio}:1`,
      };
    } else if (currentRatio > maxRatio) {
      // Ratio too high - need more target (or less source)
      // Calculate target needed to hit min and max ratios
      const targetForMax = source.dosage / minRatio; // More target = lower ratio
      const targetForMin = source.dosage / maxRatio; // Less target = higher ratio
      
      return {
        action: "increase",
        supplement: target.name,
        rangeMin: formatDosage(targetForMin, target.unit),
        rangeMax: formatDosage(targetForMax, target.unit),
        explanation: `With ${source.dosage}${source.unit} ${source.name}, aim for ${minRatio}-${maxRatio}:1`,
      };
    }
    
    return null;
  };

  const suggestion = getAdjustmentSuggestion();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("rounded-lg border p-3", styles.border, styles.bg)}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start gap-3 text-left"
          >
            <Scale className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {warning.source.name}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className="text-sm font-medium">
                  {warning.target.name}
                </span>
                <SeverityBadge severity={warning.severity} />
                <Badge variant="outline" className="text-xs">
                  ratio
                </Badge>
              </div>
              {!isOpen && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {warning.currentRatio}:1 ratio (optimal: {warning.minRatio}-{warning.maxRatio}:1)
                </p>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
            {/* Ratio Details */}
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Current ratio</p>
                <p className="font-mono font-medium">{warning.currentRatio}:1</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Optimal range</p>
                <p className="font-mono font-medium">{warning.minRatio}-{warning.maxRatio}:1</p>
              </div>
              {warning.optimalRatio && (
                <div>
                  <p className="text-xs text-muted-foreground">Ideal</p>
                  <p className="font-mono font-medium">{warning.optimalRatio}:1</p>
                </div>
              )}
            </div>

            {/* Current Dosages */}
            <div className="text-sm">
              <p className="text-xs text-muted-foreground mb-1">Your current dosages</p>
              <p>
                {warning.source.name}: <span className="font-mono">{warning.source.dosage}{warning.source.unit}</span>
                {" • "}
                {warning.target.name}: <span className="font-mono">{warning.target.dosage}{warning.target.unit}</span>
              </p>
            </div>

            {/* Message */}
            {warning.message && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Why this matters</p>
                <p className="text-sm">{warning.message}</p>
              </div>
            )}

            {/* Adjustment Suggestion - Now with range */}
            {suggestion && (
              <div className="flex gap-2 rounded-md bg-background/50 p-2">
                <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-primary mb-0.5">How to optimize</p>
                  <p className="text-sm font-medium">
                    {suggestion.action === "increase" ? "Increase" : "Decrease"}{" "}
                    {suggestion.supplement} to{" "}
                    <span className="font-mono">{suggestion.rangeMin}-{suggestion.rangeMax}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {suggestion.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Research Link */}
            {warning.researchUrl && (
              <a
                href={warning.researchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View research on Examine.com</span>
              </a>
            )}

            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground/70 border-t border-border/30 pt-2">
              Analysis based on indexed research. Not medical advice.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
