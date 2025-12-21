import { Flame, Calendar, Pill, AlertTriangle } from "lucide-react";
import { cn } from "~/lib/utils";

// ============================================================================
// Types
// ============================================================================

type SystemStatusProps = {
  streak: number;
  todayLogCount: number;
  lastLogAt: Date | null;
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * SystemStatus - Header Row System Status Bar (v1.1 Scientific Laboratory)
 *
 * Shows:
 * - Current streak (consecutive days logged)
 * - Today's log count
 * - Last log timestamp
 * - Loss Aversion prompt: Amber Pulse warning after 12:00 PM if no logs today
 * 
 * Per spec section 6: "If no logs exist after 12:00 PM, the streak counter must 
 * escalate to an Amber Pulse with an 'Expires in Xh' label."
 */
export function SystemStatus({
  streak,
  todayLogCount,
  lastLogAt,
}: SystemStatusProps) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const formattedLastLog = lastLogAt ? formatTimeAgo(lastLogAt) : null;

  // Loss Aversion logic (per spec section 6)
  // Show warning if: streak > 0, past noon, and no logs today
  const isPastNoon = now.getHours() >= 12;
  const noLogsToday = todayLogCount === 0;
  const showStreakWarning = streak > 0 && isPastNoon && noLogsToday;
  
  // Calculate hours until midnight for escalation
  const hoursUntilMidnight = 24 - now.getHours();
  const isUrgent = hoursUntilMidnight <= 2; // Critical when <2 hours

  return (
    <div className="space-y-3">
      {/* Status Badges Row - Glass Card styling */}
      <div className="glass-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="type-prose text-xs">{formattedDate}</span>
          </div>

          {/* Streak - Emerald when 7+ days */}
          {streak > 0 && (
            <div className="flex items-center gap-2">
              <Flame
                className={cn(
                  "h-3.5 w-3.5",
                  streak >= 7 ? "status-optimized" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  streak >= 7 ? "status-optimized" : "text-muted-foreground",
                )}
              >
                {streak}d streak
              </span>
            </div>
          )}

          {/* Today's log count */}
          <div className="flex items-center gap-2">
            <Pill className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="type-prose text-xs tabular-nums">
              {todayLogCount} log{todayLogCount !== 1 ? "s" : ""} today
            </span>
          </div>

          {/* Last log - Cyan info color */}
          {formattedLastLog && (
            <span className="status-info font-mono text-[10px]">
              Last: {formattedLastLog}
            </span>
          )}
        </div>
      </div>

      {/* Loss Aversion Prompt - Amber Pulse Animation (per spec section 6) */}
      {showStreakWarning && (
        <div
          className={cn(
            "glass-card flex items-center gap-3 px-4 py-3",
            isUrgent
              ? "border-status-critical animate-pulse glass-card-glow-amber"
              : "border-status-conflict animate-amber-pulse",
          )}
        >
          <AlertTriangle
            className={cn(
              "h-4 w-4 shrink-0",
              isUrgent ? "status-critical" : "status-conflict",
            )}
          />
          <div className="flex-1">
            <span
              className={cn(
                "font-sans text-sm",
                isUrgent ? "status-critical" : "status-conflict",
              )}
            >
              {isUrgent ? (
                <>
                  <span className="font-semibold">Streak expires soon!</span>
                  {" "}Log now to keep your {streak}-day streak.
                </>
              ) : (
                <>
                  Don&apos;t forget to log today to maintain your{" "}
                  <span className="type-technical tabular-nums">{streak}</span>-day streak.
                </>
              )}
            </span>
          </div>
          {/* Countdown timer - JetBrains Mono for technical data */}
          <div className={cn(
            "font-mono text-sm font-bold tabular-nums shrink-0",
            isUrgent ? "status-critical" : "type-alert",
          )}>
            Expires in {hoursUntilMidnight}h
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}
