"use client";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type Severity = "critical" | "medium" | "low";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

/**
 * Renders a consistent severity badge with appropriate colors.
 * - critical: destructive red
 * - medium: warning yellow
 * - low: muted default
 */
export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <Badge
      variant={severity === "critical" ? "destructive" : "secondary"}
      className={cn(
        "text-[10px]",
        severity === "medium" && "bg-yellow-500/20 text-yellow-600",
        className,
      )}
    >
      {severity}
    </Badge>
  );
}

/**
 * Returns the background class for a warning item based on severity.
 */
export function getWarningBackgroundClass(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-destructive/10";
    case "medium":
      return "bg-yellow-500/10";
    default:
      return "bg-muted";
  }
}

/**
 * Returns the text color class for warning text based on severity.
 */
export function getWarningTextClass(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "text-destructive";
    case "medium":
      return "text-yellow-600";
    default:
      return "";
  }
}

/**
 * Returns the border class for a card based on warning counts.
 */
export function getWarningBorderClass(
  criticalCount: number,
  mediumCount: number,
): string {
  if (criticalCount > 0) return "border-destructive/50";
  if (mediumCount > 0) return "border-yellow-500/50";
  return "";
}
