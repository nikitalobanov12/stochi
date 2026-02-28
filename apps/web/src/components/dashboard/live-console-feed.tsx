"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import {
  type InteractionWarning,
  type RatioWarning,
  type TimingWarning,
} from "~/server/actions/interactions";
import { type SafetyCheckResult } from "~/server/services/safety";
import { buildSafetyActionBuckets } from "~/components/dashboard/safety-actions";

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
  /** Initial collapsed state (default: true) */
  defaultCollapsed?: boolean;
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

  // Build set of timing warning pairs to deduplicate against interactions
  const timingPairs = new Set(
    timingWarnings.map((tw) => {
      const ids = [tw.source.id, tw.target.id].sort();
      return `${ids[0]}-${ids[1]}`;
    }),
  );

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

  // Interactions (deduplicated against timing warnings)
  for (const interaction of interactions) {
    // Skip if there's already a timing warning for this pair
    const ids = [interaction.source.id, interaction.target.id].sort();
    const pairKey = `${ids[0]}-${ids[1]}`;
    if (timingPairs.has(pairKey) && interaction.type !== "synergy") {
      continue;
    }

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
  defaultCollapsed = true,
}: LiveConsoleFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const entries = generateConsoleEntries(
    interactions,
    ratioWarnings,
    timingWarnings,
    safetyChecks,
  );
  const actionBuckets = buildSafetyActionBuckets({
    interactions,
    ratioWarnings,
    timingWarnings,
  });

  // Count warnings/errors for badge
  const errorCount = entries.filter((e) => e.status === "FAIL").length;
  const warnCount = entries.filter((e) => e.status === "WARN").length;

  // Auto-scroll to bottom when entries change (only when expanded)
  useEffect(() => {
    if (containerRef.current && !isCollapsed) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries.length, isCollapsed]);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      {/* Header with toggle */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="bg-card/85 hover:bg-card flex w-full items-center justify-between px-3 py-2.5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-emerald-500/70" />
          <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            System Console
          </span>
          {/* Status badges */}
          {errorCount > 0 && (
            <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-xs text-red-400">
              {errorCount} FAIL
            </span>
          )}
          {warnCount > 0 && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-xs text-amber-400">
              {warnCount} WARN
            </span>
          )}
          {errorCount === 0 && warnCount === 0 && entries.length > 0 && (
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-xs text-emerald-400">
              ALL PASS
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-xs">
            {entries.length} entries
          </span>
          {isCollapsed ? (
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="text-muted-foreground h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Console body - collapsible */}
      {!isCollapsed && (
        <>
          <div className="bg-card/65 border-t border-white/10 px-3 py-2.5">
            <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
              <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-2">
                <p className="font-mono text-[11px] tracking-wider uppercase text-emerald-300">
                  Do now ({actionBuckets.doNow.length})
                </p>
                <p className="text-foreground/80 mt-1">
                  {actionBuckets.doNow[0] ?? "No immediate positive actions."}
                </p>
              </div>
              <div className="rounded border border-red-500/30 bg-red-500/10 p-2">
                <p className="font-mono text-[11px] tracking-wider uppercase text-red-300">
                  Avoid now ({actionBuckets.avoidNow.length})
                </p>
                <p className="text-foreground/80 mt-1">
                  {actionBuckets.avoidNow[0] ?? "No critical avoid actions."}
                </p>
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2">
                <p className="font-mono text-[11px] tracking-wider uppercase text-amber-300">
                  Optimize later ({actionBuckets.optimizeLater.length})
                </p>
                <p className="text-foreground/80 mt-1">
                  {actionBuckets.optimizeLater[0] ??
                    "No follow-up optimization actions."}
                </p>
              </div>
            </div>
          </div>

          <div
            ref={containerRef}
            className="bg-card/50 h-40 overflow-y-auto border-t border-white/10 p-2.5 font-mono text-xs leading-6"
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
        </>
      )}
    </div>
  );
}
