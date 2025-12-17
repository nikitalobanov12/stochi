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

export function RatioCard({ warning, defaultExpanded = false }: RatioCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const styles = getSeverityStyles(warning.severity);

  // Calculate what adjustment is needed
  const getAdjustmentSuggestion = () => {
    if (warning.optimalRatio === null) return null;
    
    const currentRatio = warning.currentRatio;
    const optimal = warning.optimalRatio;
    
    if (currentRatio > (warning.maxRatio ?? optimal)) {
      // Ratio too high - need more target or less source
      const targetNeeded = Math.round(warning.source.dosage / optimal);
      return `Consider ${targetNeeded}${warning.target.unit} of ${warning.target.name} to balance`;
    } else if (currentRatio < (warning.minRatio ?? optimal)) {
      // Ratio too low - need more source or less target
      const sourceNeeded = Math.round(warning.target.dosage * optimal);
      return `Consider ${sourceNeeded}${warning.source.unit} of ${warning.source.name} to balance`;
    }
    return null;
  };

  const adjustmentSuggestion = getAdjustmentSuggestion();

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

            {/* Adjustment Suggestion */}
            {adjustmentSuggestion && (
              <div className="flex gap-2 rounded-md bg-background/50 p-2">
                <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-primary mb-0.5">How to fix</p>
                  <p className="text-sm">{adjustmentSuggestion}</p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
