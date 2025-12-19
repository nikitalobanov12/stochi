"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  ExternalLink,
  ChevronDown,
  Lightbulb,
  Zap,
  AlertTriangle,
  Clock,
  Scale,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import type {
  InteractionWarning,
  TimingWarning,
  RatioWarning,
} from "~/server/actions/interactions";
import {
  generateDosageExplanation,
  type DosageExplanationResponse,
} from "~/server/actions/ai-suggestions";

// ============================================================================
// Shared Utilities
// ============================================================================

function getSeverityStyles(
  severity: "low" | "medium" | "critical",
  isSynergy = false,
) {
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

function SeverityBadge({
  severity,
  isSynergy,
}: {
  severity: string;
  isSynergy?: boolean;
}) {
  if (isSynergy) {
    return (
      <Badge className="bg-green-500/20 text-xs text-green-600">synergy</Badge>
    );
  }

  const styles = {
    critical: "bg-destructive/20 text-destructive",
    medium: "bg-yellow-500/20 text-yellow-600",
    low: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      className={cn(
        "text-xs",
        styles[severity as keyof typeof styles] ?? styles.low,
      )}
    >
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

export function InteractionCard({
  interaction,
  defaultExpanded = false,
}: InteractionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const isSynergy = interaction.type === "synergy";
  const styles = getSeverityStyles(interaction.severity, isSynergy);

  const hasDetails =
    interaction.mechanism || interaction.suggestion || interaction.researchUrl;

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
              <AlertTriangle
                className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {interaction.source.name}
                </span>
                <span className="text-muted-foreground">
                  {isSynergy ? "+" : "→"}
                </span>
                <span className="text-sm font-medium">
                  {interaction.target.name}
                </span>
                <SeverityBadge
                  severity={interaction.severity}
                  isSynergy={isSynergy}
                />
              </div>
              {/* Preview of mechanism - always visible */}
              {interaction.mechanism && !isOpen && (
                <p className="text-muted-foreground mt-1.5 line-clamp-1 text-xs">
                  {interaction.mechanism}
                </p>
              )}
            </div>
            {hasDetails && (
              <ChevronDown
                className={cn(
                  "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-border/50 mt-3 space-y-3 border-t pt-3">
            {/* Mechanism - full text */}
            {interaction.mechanism && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Why this happens
                </p>
                <p className="text-sm">{interaction.mechanism}</p>
              </div>
            )}

            {/* Suggestion */}
            {interaction.suggestion && (
              <div className="bg-background/50 flex gap-2 rounded-md p-2">
                <Lightbulb className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-primary mb-0.5 text-xs font-medium">
                    What to do
                  </p>
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

export function TimingCard({
  warning,
  defaultExpanded = false,
}: TimingCardProps) {
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
              <div className="flex flex-wrap items-center gap-2">
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
                <p className="text-muted-foreground mt-1.5 text-xs">
                  Taken {warning.actualHoursApart}h apart, need{" "}
                  {warning.minHoursApart}h+
                </p>
              )}
            </div>
            <ChevronDown
              className={cn(
                "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-border/50 mt-3 space-y-3 border-t pt-3">
            {/* Timing Details */}
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Current gap</p>
                <p className="font-mono font-medium">
                  {warning.actualHoursApart}h
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Recommended</p>
                <p className="font-mono font-medium">
                  {warning.minHoursApart}h+
                </p>
              </div>
            </div>

            {/* Reason */}
            {warning.reason && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Why timing matters
                </p>
                <p className="text-sm">{warning.reason}</p>
              </div>
            )}

            {/* Suggestion */}
            <div className="bg-background/50 flex gap-2 rounded-md p-2">
              <Lightbulb className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-primary mb-0.5 text-xs font-medium">
                  What to do
                </p>
                <p className="text-sm">
                  Take {warning.source.name} at least {warning.minHoursApart}{" "}
                  hours {warning.minHoursApart >= 6 ? "before" : "apart from"}{" "}
                  {warning.target.name}
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

export function RatioCard({
  warning,
  defaultExpanded = false,
}: RatioCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [aiInsight, setAiInsight] = useState<DosageExplanationResponse | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const loadAttemptedRef = useRef(false);
  const styles = getSeverityStyles(warning.severity);

  // Calculate what adjustment is needed - returns a range
  // Logic: prefer adjusting the supplement that's "off" from typical doses
  const getAdjustmentSuggestion = (): AdjustmentSuggestion => {
    const { currentRatio, minRatio, maxRatio, source, target } = warning;

    // Need both min and max to calculate a meaningful range
    if (minRatio === null || maxRatio === null) return null;
    if (source.dosage === 0 || target.dosage === 0) return null;

    if (currentRatio < minRatio) {
      // Ratio too low - either increase source OR decrease target
      // For D3:K2 (33:1 when 40:1 needed), suggesting to increase D3 from 4000IU is bad advice
      // Instead, suggest reducing K2 (the target) since it's the "excess" component
      const targetForMin = source.dosage / minRatio; // target at minimum ratio
      const targetForMax = source.dosage / maxRatio; // target at maximum ratio (less target)

      return {
        action: "decrease",
        supplement: target.name,
        rangeMin: formatDosage(targetForMax, target.unit), // Less target = higher ratio
        rangeMax: formatDosage(targetForMin, target.unit), // More target = lower ratio
        explanation: `With ${source.dosage}${source.unit} ${source.name}, aim for ${minRatio}-${maxRatio}:1`,
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

  // Load AI insight when card is expanded
  useEffect(() => {
    if (!isOpen || !suggestion || loadAttemptedRef.current || isPending) return;

    // Mark as attempted before starting transition (ref doesn't trigger re-render)
    loadAttemptedRef.current = true;

    startTransition(async () => {
      try {
        const result = await generateDosageExplanation({
          sourceId: warning.source.id,
          sourceName: warning.source.name,
          sourceDosage: warning.source.dosage,
          sourceUnit: warning.source.unit,
          targetId: warning.target.id,
          targetName: warning.target.name,
          targetDosage: warning.target.dosage,
          targetUnit: warning.target.unit,
          currentRatio: warning.currentRatio,
          optimalRatio: warning.optimalRatio,
          minRatio: warning.minRatio,
          maxRatio: warning.maxRatio,
          warningMessage: warning.message,
          suggestedSupplement: suggestion!.supplement,
          suggestedRangeMin: suggestion!.rangeMin,
          suggestedRangeMax: suggestion!.rangeMax,
        });
        setAiInsight(result);
      } catch (error) {
        console.error("Failed to load AI insight:", error);
      }
    });
  }, [isOpen, suggestion, isPending, warning]);

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
              <div className="flex flex-wrap items-center gap-2">
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
                <p className="text-muted-foreground mt-1.5 text-xs">
                  {warning.currentRatio}:1 ratio (optimal: {warning.minRatio}-
                  {warning.maxRatio}:1)
                </p>
              )}
            </div>
            <ChevronDown
              className={cn(
                "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-border/50 mt-3 space-y-3 border-t pt-3">
            {/* Ratio Details */}
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Current ratio</p>
                <p className="font-mono font-medium">
                  {warning.currentRatio}:1
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Optimal range</p>
                <p className="font-mono font-medium">
                  {warning.minRatio}-{warning.maxRatio}:1
                </p>
              </div>
              {warning.optimalRatio && (
                <div>
                  <p className="text-muted-foreground text-xs">Ideal</p>
                  <p className="font-mono font-medium">
                    {warning.optimalRatio}:1
                  </p>
                </div>
              )}
            </div>

            {/* Current Dosages */}
            <div className="text-sm">
              <p className="text-muted-foreground mb-1 text-xs">
                Your current dosages
              </p>
              <p>
                {warning.source.name}:{" "}
                <span className="font-mono">
                  {warning.source.dosage}
                  {warning.source.unit}
                </span>
                {" • "}
                {warning.target.name}:{" "}
                <span className="font-mono">
                  {warning.target.dosage}
                  {warning.target.unit}
                </span>
              </p>
            </div>

            {/* Message */}
            {warning.message && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Why this matters
                </p>
                <p className="text-sm">{warning.message}</p>
              </div>
            )}

            {/* Adjustment Suggestion - Now with range */}
            {suggestion && (
              <div className="bg-background/50 flex gap-2 rounded-md p-2">
                <Lightbulb className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-primary mb-0.5 text-xs font-medium">
                    How to optimize
                  </p>
                  <p className="text-sm font-medium">
                    {suggestion.action === "increase" ? "Increase" : "Decrease"}{" "}
                    {suggestion.supplement} to{" "}
                    <span className="font-mono">
                      {suggestion.rangeMin}-{suggestion.rangeMax}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {suggestion.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* AI Insight Section */}
            {suggestion && (
              <div className="border-primary/20 bg-primary/5 rounded-md border p-2.5">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="text-primary h-3.5 w-3.5" />
                  <p className="text-primary text-xs font-medium">AI Insight</p>
                  {aiInsight?.cached && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1 py-0 text-[10px]"
                    >
                      cached
                    </Badge>
                  )}
                </div>
                {isPending ? (
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Generating explanation...</span>
                  </div>
                ) : aiInsight ? (
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed">
                      {aiInsight.explanation}
                    </p>
                    {aiInsight.researchSnippet && (
                      <p className="text-muted-foreground border-primary/30 border-l-2 pl-2 text-xs">
                        {aiInsight.researchSnippet}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Expand card to load AI insight
                  </p>
                )}
              </div>
            )}

            {/* Research Link */}
            {warning.researchUrl && (
              <a
                href={warning.researchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View research on Examine.com</span>
              </a>
            )}

            {/* Disclaimer */}
            <p className="text-muted-foreground/70 border-border/30 border-t pt-2 text-[10px]">
              Analysis based on indexed research. Not medical advice.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
