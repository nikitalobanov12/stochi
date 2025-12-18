import { Flame, Calendar, Pill } from "lucide-react";
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

  const formattedLastLog = lastLogAt
    ? formatTimeAgo(lastLogAt)
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Date */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span className="font-mono text-xs">{formattedDate}</span>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5">
          <Flame
            className={cn(
              "h-3 w-3",
              streak >= 7 ? "text-orange-500" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              streak >= 7 ? "text-orange-500" : "text-muted-foreground"
            )}
          >
            {streak}d streak
          </span>
        </div>
      )}

      {/* Today's log count */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Pill className="h-3 w-3" />
        <span className="font-mono text-xs tabular-nums">
          {todayLogCount} log{todayLogCount !== 1 ? "s" : ""} today
        </span>
      </div>

      {/* Last log */}
      {formattedLastLog && (
        <span className="font-mono text-[10px] text-muted-foreground/60">
          Last: {formattedLastLog}
        </span>
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
