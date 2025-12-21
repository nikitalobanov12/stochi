"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Check, Loader2, AlertCircle } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { logStack } from "~/server/actions/stacks";

type LogStackButtonProps = {
  stackId: string;
  itemCount: number;
  className?: string;
};

type LogState = "idle" | "loading" | "success" | "error";

/**
 * Optimistic Log button with success animation.
 * - Idle: Ghost button with Play icon
 * - Loading: Spinner
 * - Success: Green checkmark pulse (2s), then revert to idle
 * - Error: Red shake + "Retry" text
 */
export function LogStackButton({
  stackId,
  itemCount,
  className,
}: LogStackButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logState, setLogState] = useState<LogState>("idle");

  const isDisabled = itemCount === 0 || isPending || logState === "loading";

  async function handleLog() {
    if (isDisabled) return;

    setLogState("loading");

    startTransition(async () => {
      try {
        await logStack(stackId);
        setLogState("success");

        // Revert to idle after 2s success animation
        setTimeout(() => {
          setLogState("idle");
        }, 2000);

        // Refresh to update lastLoggedAt display
        router.refresh();
      } catch {
        setLogState("error");

        // Revert to idle after 3s to allow retry
        setTimeout(() => {
          setLogState("idle");
        }, 3000);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleLog}
      disabled={isDisabled}
      className={cn(
        "h-8 gap-1.5 font-mono text-xs transition-all duration-200",
        // Success state styling
        logState === "success" &&
          "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500",
        // Error state styling
        logState === "error" &&
          "animate-shake bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive",
        className,
      )}
    >
      {logState === "loading" && (
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
  );
}
