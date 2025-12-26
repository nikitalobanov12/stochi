"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Circle,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { type StackCompletionStatus } from "~/server/services/analytics";
import { useLogContext, type StackItem } from "~/components/log/log-context";

type ProtocolCardProps = {
  stack: StackCompletionStatus;
  stackItems?: StackItem[];
};

type LogState = "idle" | "loading" | "success" | "error";

/**
 * Generate time presets relative to now.
 * Returns "Now" plus past times rounded to nearest 30 min.
 */
function generateTimePresets(): Array<{ label: string; getTime: () => Date }> {
  const now = new Date();
  const presets: Array<{ label: string; getTime: () => Date }> = [
    { label: "Now", getTime: () => new Date() },
  ];

  // Round current time down to nearest 30 minutes for past options
  const roundedMinutes = Math.floor(now.getMinutes() / 30) * 30;
  const currentRounded = new Date(now);
  currentRounded.setMinutes(roundedMinutes, 0, 0);

  // If we're not close to the rounded time, add it as an option
  const minutesSinceRounded = (now.getTime() - currentRounded.getTime()) / 60000;
  if (minutesSinceRounded > 5) {
    const capturedTime = new Date(currentRounded);
    presets.push({
      label: formatTime(capturedTime),
      getTime: () => new Date(capturedTime),
    });
  }

  // Add past 30-min intervals (up to 4 hours back)
  for (let i = 1; i <= 8; i++) {
    const pastTime = new Date(currentRounded.getTime() - i * 30 * 60 * 1000);
    // Only show times from today
    if (pastTime.getDate() === now.getDate()) {
      const capturedTime = new Date(pastTime);
      presets.push({
        label: formatTime(capturedTime),
        getTime: () => new Date(capturedTime),
      });
    }
  }

  return presets;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * ProtocolCard - Split-Action Row Design
 *
 * Zone A (Left ~70%): The Briefing - Click to navigate to stack detail
 * Zone B (Right ~30%): The Trigger - Explicit execute button
 *
 * This solves the "invisible action" problem by making the LOG button
 * always visible and physically distinct from navigation.
 */
export function ProtocolCard({ stack, stackItems }: ProtocolCardProps) {
  const router = useRouter();
  const { logStackOptimistic } = useLogContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [logState, setLogState] = useState<LogState>("idle");
  const [isNavigating, startNavTransition] = useTransition();
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);

  const { stackId, stackName, totalItems, loggedItems, isComplete, items } =
    stack;

  // Status states
  const isPartial = loggedItems > 0 && !isComplete;

  // Local loading state for this specific button
  const isLoading = logState === "loading";

  async function handleExecute(e: React.MouseEvent, loggedAt?: Date) {
    e.preventDefault();
    e.stopPropagation();

    if (!stackItems || stackItems.length === 0) {
      toast.error("No items in stack to log");
      return;
    }

    setLogState("loading");
    setIsTimeMenuOpen(false);

    // Await the optimistic update to get actual result
    const result = await logStackOptimistic(stackId, stackItems, loggedAt);

    if (result.success) {
      setLogState("success");
      const timeLabel = loggedAt ? ` at ${formatTime(loggedAt)}` : "";
      toast.success(`Logged ${stackName}${timeLabel}`);
      // Revert to idle after animation
      setTimeout(() => {
        setLogState("idle");
      }, 2000);
    } else {
      setLogState("error");
      // Revert to idle after error animation
      setTimeout(() => {
        setLogState("idle");
      }, 3000);
    }
  }

  function toggleExpand(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }

  function handleNavigate() {
    startNavTransition(() => {
      router.push(`/dashboard/stacks/${stackId}`);
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        isComplete
          ? "border-emerald-500/50 bg-emerald-500/5"
          : "border-white/10 bg-[#0A0A0A]",
      )}
    >
      <div className="flex items-stretch">
        {/* Zone A: The Briefing (Navigate to detail) */}
        <button
          type="button"
          onClick={handleNavigate}
          disabled={isNavigating}
          className="flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02] disabled:opacity-70"
        >
          {/* Status Indicator */}
          <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
            {isNavigating ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isComplete ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </div>
            ) : isPartial ? (
              <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="var(--chart-3)"
                  strokeWidth="2"
                  strokeDasharray={`${(loggedItems / totalItems) * 50.27} 50.27`}
                />
              </svg>
            ) : (
              <Circle
                className="text-muted-foreground/40 h-5 w-5"
                strokeWidth={2}
              />
            )}
          </div>

          {/* Stack Name & Progress */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm font-medium">
              {stackName}
            </p>
            <p className="text-muted-foreground font-mono text-[10px]">
              {isComplete ? (
                <span className="status-optimized">COMPLETE</span>
              ) : (
                <>
                  <span className="tabular-nums">{loggedItems}</span>
                  <span className="text-muted-foreground/60">/</span>
                  <span className="tabular-nums">{totalItems}</span>
                  <span className="text-muted-foreground/60 ml-1">logged</span>
                </>
              )}
            </p>
          </div>
        </button>

        {/* Expand Toggle */}
        {items.length > 0 && (
          <button
            type="button"
            onClick={toggleExpand}
            className="text-muted-foreground/50 hover:text-muted-foreground flex items-center px-2 transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Vertical Divider (explicit on mobile) */}
        <div className="w-px bg-white/10" />

        {/* Zone B: The Trigger (Execute) */}
        <div className="flex items-center px-2">
          {isComplete ? (
            <div className="bg-status-optimized flex h-11 min-w-[72px] items-center justify-center rounded-xl px-3">
              <span className="status-optimized font-mono text-[10px] font-medium">
                DONE
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleExecute(e)}
                disabled={isLoading || totalItems === 0}
                className={cn(
                  "border-border/60 h-11 min-w-[56px] gap-1.5 rounded-l-xl rounded-r-none border-r-0 font-mono text-xs",
                  "hover:border-primary hover:bg-primary hover:text-primary-foreground",
                  isLoading && "pointer-events-none",
                  logState === "success" &&
                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-500",
                  logState === "error" &&
                    "animate-shake border-destructive/50 bg-destructive/10 text-destructive",
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : logState === "success" ? (
                  <>
                    <Check className="h-3 w-3" />
                    DONE
                  </>
                ) : logState === "error" ? (
                  <>
                    <Play className="h-3 w-3" />
                    RETRY
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    LOG
                  </>
                )}
              </Button>

              <DropdownMenu open={isTimeMenuOpen} onOpenChange={setIsTimeMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading || totalItems === 0}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "border-border/60 h-11 w-8 rounded-l-none rounded-r-xl px-0 font-mono text-xs",
                      "hover:border-primary hover:bg-primary hover:text-primary-foreground",
                      logState === "success" &&
                        "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
                      logState === "error" &&
                        "border-destructive/50 bg-destructive/10 text-destructive",
                    )}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3 w-3" />
                    Log at different time
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {generateTimePresets().map((preset, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecute(e as unknown as React.MouseEvent, preset.getTime());
                      }}
                      className="font-mono text-xs"
                    >
                      {preset.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Items List */}
      {isExpanded && items.length > 0 && (
        <div className="border-t border-white/5 px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item.supplementId}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-all",
                  item.logged
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "text-muted-foreground border-white/10 bg-white/[0.02]",
                )}
              >
                {item.logged ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : (
                  <Circle className="h-2.5 w-2.5" />
                )}
                <span>
                  {item.supplementName}
                </span>
                <span className="text-muted-foreground/60 tabular-nums">
                  {item.expectedDosage}
                  {item.expectedUnit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MissionControl - Protocol deck section
 */
export function MissionControl({
  stacks,
  userStacksWithItems,
}: {
  stacks: StackCompletionStatus[];
  userStacksWithItems: Array<{
    id: string;
    name: string;
    items: StackItem[];
  }>;
}) {
  if (stacks.length === 0) {
    return null;
  }

  // Create a map for quick lookup
  const stackItemsMap = new Map(
    userStacksWithItems.map((s) => [s.id, s.items]),
  );

  return (
    <section className="space-y-3">
      <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
        Protocols
      </h2>
      <div className="space-y-2">
        {stacks.map((stack) => (
          <ProtocolCard
            key={stack.stackId}
            stack={stack}
            stackItems={stackItemsMap.get(stack.stackId)}
          />
        ))}
      </div>
    </section>
  );
}
