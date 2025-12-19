"use client";

import { useEffect, useRef } from "react";
import {
  type InteractionWarning,
  type RatioWarning,
  type TimingWarning,
} from "~/server/actions/interactions";
import { type SafetyCheckResult } from "~/server/services/safety";

export type ConsoleEntry = {
  timestamp: Date;
  module:
    | "SAFETY_CHECK"
    | "RATIO_ENGINE"
    | "TIMING_CHECK"
    | "INTERACTION"
    | "SYSTEM";
  message: string;
  status: "PASS" | "FAIL" | "WARN" | "INFO";
};

type LiveConsoleFeedProps = {
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
  safetyChecks?: SafetyCheckResult[];
};

/**
 * Convert interaction/ratio/timing data into console entries.
 */
function generateConsoleEntries(
  interactions: InteractionWarning[],
  ratioWarnings: RatioWarning[],
  timingWarnings: TimingWarning[],
  safetyChecks: SafetyCheckResult[] = [],
): ConsoleEntry[] {
  const entries: ConsoleEntry[] = [];
  const now = new Date();

  // Safety checks
  for (const check of safetyChecks) {
    if (!check.category) continue;

    const categoryDisplay = check.category.toUpperCase().replace("-", "_");
    if (check.isSafe) {
      entries.push({
        timestamp: now,
        module: "SAFETY_CHECK",
        message: `${categoryDisplay} (${check.currentTotal}${check.unit}) < Limit (${check.limit}${check.unit})`,
        status: "PASS",
      });
    } else {
      entries.push({
        timestamp: now,
        module: "SAFETY_CHECK",
        message: `${categoryDisplay} (${check.currentTotal}${check.unit}) > Limit (${check.limit}${check.unit})`,
        status: "FAIL",
      });
    }
  }

  // Ratio warnings
  for (const warning of ratioWarnings) {
    const ratioStr = `${warning.source.name.split(" ")[0]}:${warning.target.name.split(" ")[0]}`;
    const optimalStr = warning.optimalRatio
      ? `optimal ${warning.optimalRatio}:1`
      : "";

    entries.push({
      timestamp: now,
      module: "RATIO_ENGINE",
      message: `${ratioStr} (${warning.currentRatio}:1) ${optimalStr}`,
      status: warning.severity === "critical" ? "FAIL" : "WARN",
    });
  }

  // Timing warnings
  for (const warning of timingWarnings) {
    entries.push({
      timestamp: now,
      module: "TIMING_CHECK",
      message: `${warning.source.name} <> ${warning.target.name} (${warning.actualHoursApart}h apart, need ${warning.minHoursApart}h)`,
      status: warning.severity === "critical" ? "FAIL" : "WARN",
    });
  }

  // Interactions
  for (const interaction of interactions) {
    if (interaction.type === "synergy") {
      entries.push({
        timestamp: now,
        module: "INTERACTION",
        message: `${interaction.source.name} + ${interaction.target.name} [SYNERGY]`,
        status: "PASS",
      });
    } else {
      entries.push({
        timestamp: now,
        module: "INTERACTION",
        message: `${interaction.source.name} <> ${interaction.target.name} [${interaction.type.toUpperCase()}]`,
        status: interaction.severity === "critical" ? "FAIL" : "WARN",
      });
    }
  }

  // Add system entries if nothing else
  if (entries.length === 0) {
    entries.push({
      timestamp: now,
      module: "SYSTEM",
      message: "All checks passed. No warnings detected.",
      status: "INFO",
    });
  }

  return entries;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getStatusColor(status: ConsoleEntry["status"]): string {
  switch (status) {
    case "PASS":
      return "text-emerald-500";
    case "FAIL":
      return "text-red-500";
    case "WARN":
      return "text-amber-500";
    case "INFO":
    default:
      return "text-muted-foreground";
  }
}

function getModuleColor(module: ConsoleEntry["module"]): string {
  switch (module) {
    case "SAFETY_CHECK":
      return "text-red-400";
    case "RATIO_ENGINE":
      return "text-blue-400";
    case "TIMING_CHECK":
      return "text-purple-400";
    case "INTERACTION":
      return "text-amber-400";
    case "SYSTEM":
    default:
      return "text-muted-foreground";
  }
}

export function LiveConsoleFeed({
  interactions,
  ratioWarnings,
  timingWarnings,
  safetyChecks = [],
}: LiveConsoleFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const entries = generateConsoleEntries(
    interactions,
    ratioWarnings,
    timingWarnings,
    safetyChecks,
  );

  // Auto-scroll to bottom when entries change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="space-y-2">
      <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
        System Console
      </h2>
      <div
        ref={containerRef}
        className="border-border/40 h-24 overflow-hidden rounded-lg border bg-black/20 p-2 font-mono text-[10px] leading-relaxed"
      >
        {entries.map((entry, index) => (
          <div key={index} className="flex gap-2">
            <span className="text-muted-foreground/80 shrink-0">
              [{formatTime(entry.timestamp)}]
            </span>
            <span className={`shrink-0 ${getModuleColor(entry.module)}`}>
              {entry.module}:
            </span>
            <span className="text-foreground/80">{entry.message}</span>
            <span className={`shrink-0 ${getStatusColor(entry.status)}`}>
              [{entry.status}]
            </span>
          </div>
        ))}

        {/* Blinking cursor effect */}
        <div className="mt-1 flex items-center gap-1">
          <span className="text-muted-foreground/80">&gt;</span>
          <span className="h-3 w-2 animate-pulse bg-emerald-500/70" />
        </div>
      </div>
    </div>
  );
}
