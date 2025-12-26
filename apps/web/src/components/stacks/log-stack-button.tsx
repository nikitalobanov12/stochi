"use client";

import { useState, useTransition } from "react";
import { Play, Check, Loader2, AlertCircle, ChevronDown, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
import { useLogContext, type StackItem } from "~/components/log/log-context";
import { logStack } from "~/server/actions/stacks";

export type LogStackButtonProps = {
  stackId: string;
  stackName: string;
  items: StackItem[];
  className?: string;
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
 * Optimistic Log button with success animation and time selection.
 * Requires LogProvider context.
 * - Idle: Ghost button with Play icon + dropdown for time selection
 * - Loading: Spinner
 * - Success: Green checkmark pulse (2s), then revert to idle
 * - Error: Red shake + "Retry" text
 */
export function LogStackButton({
  stackId,
  stackName,
  items,
  className,
}: LogStackButtonProps) {
  const { logStackOptimistic, isPending } = useLogContext();
  const [logState, setLogState] = useState<LogState>("idle");
  const [isOpen, setIsOpen] = useState(false);

  const isLoading = logState === "loading";
  const isDisabled = items.length === 0 || isPending || isLoading;

  async function handleLog(loggedAt?: Date) {
    if (isDisabled) return;

    if (items.length === 0) {
      toast.error("No items in stack to log");
      return;
    }

    setLogState("loading");
    setIsOpen(false);

    // Await the optimistic update to get actual result
    const result = await logStackOptimistic(stackId, items, loggedAt);

    if (result.success) {
      setLogState("success");
      const timeLabel = loggedAt ? ` at ${formatTime(loggedAt)}` : "";
      toast.success(`Logged ${stackName}${timeLabel}`);
      // Revert to idle after 2s success animation
      setTimeout(() => {
        setLogState("idle");
      }, 2000);
    } else {
      setLogState("error");
      // Revert to idle after 3s error animation
      setTimeout(() => {
        setLogState("idle");
      }, 3000);
    }
  }

  const timePresets = generateTimePresets();

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleLog()}
        disabled={isDisabled}
        className={cn(
          "h-8 gap-1.5 rounded-r-none font-mono text-xs transition-all duration-200",
          logState === "success" &&
            "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500",
          logState === "error" &&
            "animate-shake bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive",
        )}
      >
        {isLoading && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="sr-only">Logging...</span>
          </>
        )}
        {logState === "success" && (
          <>
            <Check className="h-3.5 w-3.5 animate-pulse" />
            <span>Logged</span>
          </>
        )}
        {logState === "error" && (
          <>
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Retry</span>
          </>
        )}
        {logState === "idle" && (
          <>
            <Play className="h-3.5 w-3.5" />
            <span>Log</span>
          </>
        )}
      </Button>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            className={cn(
              "h-8 w-6 rounded-l-none px-0",
              logState === "success" &&
                "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500",
              logState === "error" &&
                "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive",
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
          {timePresets.map((preset, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => handleLog(preset.getTime())}
              className="font-mono text-xs"
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Simple log button that uses server action directly.
 * Use this on pages WITHOUT LogProvider context (e.g., stacks list page).
 */
export function SimpleLogStackButton({
  stackId,
  stackName,
  itemCount,
  className,
}: {
  stackId: string;
  stackName: string;
  itemCount: number;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logState, setLogState] = useState<LogState>("idle");
  const [isOpen, setIsOpen] = useState(false);

  const isLoading = logState === "loading";
  const isDisabled = itemCount === 0 || isPending || isLoading;

  function handleLog(loggedAt?: Date) {
    if (isDisabled) return;

    setLogState("loading");
    setIsOpen(false);

    startTransition(async () => {
      try {
        await logStack(stackId, loggedAt);
        setLogState("success");
        const timeLabel = loggedAt ? ` at ${formatTime(loggedAt)}` : "";
        toast.success(`Logged ${stackName}${timeLabel}`);
        router.refresh();
        
        // Revert to idle after 2s success animation
        setTimeout(() => {
          setLogState("idle");
        }, 2000);
      } catch {
        setLogState("error");
        toast.error("Failed to log stack");
        
        // Revert to idle after 3s
        setTimeout(() => {
          setLogState("idle");
        }, 3000);
      }
    });
  }

  const timePresets = generateTimePresets();

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleLog()}
        disabled={isDisabled}
        className={cn(
          "h-8 gap-1.5 rounded-r-none font-mono text-xs transition-all duration-200",
          logState === "success" &&
            "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500",
          logState === "error" &&
            "animate-shake bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive",
        )}
      >
        {isLoading && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="sr-only">Logging...</span>
          </>
        )}
        {logState === "success" && (
          <>
            <Check className="h-3.5 w-3.5 animate-pulse" />
            <span>Logged</span>
          </>
        )}
        {logState === "error" && (
          <>
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Retry</span>
          </>
        )}
        {logState === "idle" && (
          <>
            <Play className="h-3.5 w-3.5" />
            <span>Log</span>
          </>
        )}
      </Button>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            className={cn(
              "h-8 w-6 rounded-l-none px-0",
              logState === "success" &&
                "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500",
              logState === "error" &&
                "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive",
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
          {timePresets.map((preset, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => handleLog(preset.getTime())}
              className="font-mono text-xs"
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
