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
 * SystemStatus - Minimal status row replacing the big greeting
 *
 * Shows:
 * - Current streak (consecutive days logged)
 * - Today's log count
 * - Last log timestamp
 * - Streak expiration warning (after 12:00 PM if no logs today)
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

  // Streak expiration warning logic
  // Show warning if: streak > 0, past noon, and no logs today
  const isPastNoon = now.getHours() >= 12;
  const noLogsToday = todayLogCount === 0;
  const showStreakWarning = streak > 0 && isPastNoon && noLogsToday;
  
  // Calculate hours until midnight for escalation
  const hoursUntilMidnight = 24 - now.getHours();
  const isUrgent = hoursUntilMidnight <= 2; // Red + pulse when <2 hours

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Date */}
        <div className="text-muted-foreground flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span className="font-mono text-xs">{formattedDate}</span>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-1.5">
            <Flame
              className={cn(
                "h-3 w-3",
                streak >= 7 ? "text-orange-500" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                streak >= 7 ? "text-orange-500" : "text-muted-foreground",
              )}
            >
              {streak}d streak
            </span>
          </div>
        )}

        {/* Today's log count */}
        <div className="text-muted-foreground flex items-center gap-1.5">
          <Pill className="h-3 w-3" />
          <span className="font-mono text-xs tabular-nums">
            {todayLogCount} log{todayLogCount !== 1 ? "s" : ""} today
          </span>
        </div>

        {/* Last log */}
        {formattedLastLog && (
          <span className="text-muted-foreground/60 font-mono text-[10px]">
            Last: {formattedLastLog}
          </span>
        )}
      </div>

      {/* Streak Expiration Warning */}
      {showStreakWarning && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2",
            isUrgent
              ? "bg-status-critical animate-pulse"
              : "bg-status-conflict",
          )}
        >
          <AlertTriangle
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isUrgent ? "status-critical" : "status-conflict",
            )}
          />
          <span
            className={cn(
              "font-sans text-xs",
              isUrgent ? "status-critical" : "status-conflict",
            )}
          >
            {isUrgent ? (
              <>
                <span className="font-medium">Streak expires soon!</span>
                {" "}Log now to keep your {streak}-day streak.
              </>
            ) : (
              <>
                Don&apos;t forget to log today to maintain your{" "}
                <span className="font-mono tabular-nums">{streak}</span>-day streak.
              </>
            )}
          </span>
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
