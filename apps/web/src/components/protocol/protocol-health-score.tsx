"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Info,
  Lightbulb,
  Scale,
  Zap,
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
  ProtocolAnalysis,
  ProtocolIssue,
  IssueType,
  IssueSeverity,
} from "~/server/services/protocol-analysis";

type ProtocolHealthScoreProps = {
  analysis: ProtocolAnalysis;
};

// ============================================================================
// Score Display
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 50) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Attention";
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return "bg-green-500/10";
  if (score >= 70) return "bg-yellow-500/10";
  if (score >= 50) return "bg-orange-500/10";
  return "bg-red-500/10";
}

// ============================================================================
// Issue Display Helpers
// ============================================================================

const ISSUE_TYPE_ICONS: Record<IssueType, typeof AlertTriangle> = {
  conflict: AlertTriangle,
  timing: Clock,
  spacing: Clock,
  ratio: Scale,
  redundancy: Info,
  missing_synergy: Lightbulb,
};

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  conflict: "Conflict",
  timing: "Timing",
  spacing: "Spacing",
  ratio: "Ratio",
  redundancy: "Redundancy",
  missing_synergy: "Synergy Opportunity",
};

function getSeverityColor(severity: IssueSeverity): string {
  switch (severity) {
    case "critical":
      return "text-red-600 dark:text-red-400";
    case "warning":
      return "text-yellow-600 dark:text-yellow-400";
    case "info":
      return "text-blue-600 dark:text-blue-400";
  }
}

function getSeverityBgColor(severity: IssueSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/10";
    case "warning":
      return "bg-yellow-500/10";
    case "info":
      return "bg-blue-500/10";
  }
}

// ============================================================================
// Components
// ============================================================================

function IssueCard({ issue }: { issue: ProtocolIssue }) {
  const Icon = ISSUE_TYPE_ICONS[issue.type];
  const typeLabel = ISSUE_TYPE_LABELS[issue.type];

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        getSeverityBgColor(issue.severity),
        "border-border/50",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", getSeverityColor(issue.severity))}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">{issue.title}</span>
            <Badge
              variant="secondary"
              className={cn(
                "font-mono text-xs",
                getSeverityColor(issue.severity),
              )}
            >
              {typeLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {issue.description}
          </p>
          {issue.suggestion && (
            <p className="mt-2 font-mono text-xs">
              <span className="text-muted-foreground">Suggestion: </span>
              {issue.suggestion}
            </p>
          )}
          {issue.researchUrl && (
            <a
              href={issue.researchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1 font-mono text-xs"
            >
              <ExternalLink className="h-3 w-3" />
              Research
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueSection({
  title,
  issues,
  icon: Icon,
  defaultOpen = false,
}: {
  title: string;
  issues: ProtocolIssue[];
  icon: typeof AlertTriangle;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (issues.length === 0) return null;

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-between px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="font-mono text-sm">{title}</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {issues.length}
            </Badge>
            {criticalCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-500/10 font-mono text-xs text-red-600 dark:text-red-400"
              >
                {criticalCount} critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-yellow-500/10 font-mono text-xs text-yellow-600 dark:text-yellow-400"
              >
                {warningCount} warning
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-1 pt-2">
        {issues.map((issue, index) => (
          <IssueCard key={`${issue.type}-${index}`} issue={issue} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProtocolHealthScore({ analysis }: ProtocolHealthScoreProps) {
  const { score, issues, synergies, summary } = analysis;

  const hasIssues = issues.length > 0;
  const hasSynergies = synergies.length > 0;

  // Group issues by type for organized display
  const conflicts = issues.filter((i) => i.type === "conflict");
  const timingIssues = issues.filter((i) => i.type === "timing");
  const spacingIssues = issues.filter((i) => i.type === "spacing");
  const ratioIssues = issues.filter((i) => i.type === "ratio");
  const redundancies = issues.filter((i) => i.type === "redundancy");

  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div
        className={cn(
          "glass-card flex items-center gap-4 p-4",
          getScoreBgColor(score),
        )}
      >
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-mono text-3xl font-bold",
                getScoreColor(score),
              )}
            >
              {score}
            </span>
            <span className="text-muted-foreground font-mono text-sm">
              /100
            </span>
          </div>
          <p className={cn("font-mono text-sm", getScoreColor(score))}>
            {getScoreLabel(score)}
          </p>
        </div>
        <div className={cn("rounded-full p-2", getScoreBgColor(score))}>
          {score >= 70 ? (
            <CheckCircle2 className={cn("h-8 w-8", getScoreColor(score))} />
          ) : (
            <AlertTriangle className={cn("h-8 w-8", getScoreColor(score))} />
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary.totalItems > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-3 text-center">
            <p className="text-muted-foreground font-mono text-xs">Items</p>
            <p className="font-mono text-lg font-medium">
              {summary.totalItems}
            </p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-muted-foreground font-mono text-xs">Issues</p>
            <p
              className={cn(
                "font-mono text-lg font-medium",
                issues.length > 0 && "text-yellow-600 dark:text-yellow-400",
              )}
            >
              {issues.length}
            </p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-muted-foreground font-mono text-xs">
              Opportunities
            </p>
            <p className="font-mono text-lg font-medium text-blue-600 dark:text-blue-400">
              {synergies.length}
            </p>
          </div>
        </div>
      )}

      {/* Issues */}
      {hasIssues && (
        <div className="space-y-2">
          <h3 className="font-mono text-sm font-medium">Issues Found</h3>
          <IssueSection
            title="Conflicts"
            issues={conflicts}
            icon={AlertTriangle}
            defaultOpen={conflicts.some((i) => i.severity === "critical")}
          />
          <IssueSection
            title="Spacing Issues"
            issues={spacingIssues}
            icon={Clock}
            defaultOpen={spacingIssues.some((i) => i.severity === "critical")}
          />
          <IssueSection
            title="Ratio Imbalances"
            issues={ratioIssues}
            icon={Scale}
          />
          <IssueSection
            title="Timing Suggestions"
            issues={timingIssues}
            icon={Clock}
          />
          <IssueSection
            title="Redundancies"
            issues={redundancies}
            icon={Info}
          />
        </div>
      )}

      {/* Synergy Opportunities */}
      {hasSynergies && (
        <div className="space-y-2">
          <h3 className="font-mono text-sm font-medium">
            Synergy Opportunities
          </h3>
          <IssueSection
            title="Consider Adding"
            issues={synergies}
            icon={Zap}
            defaultOpen={false}
          />
        </div>
      )}

      {/* Perfect Protocol */}
      {!hasIssues && !hasSynergies && summary.totalItems > 0 && (
        <div className="glass-card flex items-center gap-3 border-green-500/30 bg-green-500/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-mono text-sm font-medium">
              Protocol looks great!
            </p>
            <p className="text-muted-foreground font-mono text-xs">
              No conflicts, timing issues, or imbalances detected.
            </p>
          </div>
        </div>
      )}

      {/* Empty Protocol */}
      {summary.totalItems === 0 && (
        <div className="glass-card flex items-center gap-3 p-4">
          <Info className="text-muted-foreground h-5 w-5" />
          <div>
            <p className="font-mono text-sm font-medium">Protocol is empty</p>
            <p className="text-muted-foreground font-mono text-xs">
              Add supplements to see health analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
