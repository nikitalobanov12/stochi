"use client";

import { useState, useTransition } from "react";
import { Play, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
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
 * Optimistic Log button with success animation.
 * Requires LogProvider context.
 * - Idle: Ghost button with Play icon
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

  const isDisabled = items.length === 0 || isPending || logState === "loading";

  async function handleLog() {
    if (isDisabled) return;

    if (items.length === 0) {
      toast.error("No items in stack to log");
      return;
    }

    setLogState("loading");

    // Await the optimistic update to get actual result
    const result = await logStackOptimistic(stackId, items);

    if (result.success) {
      setLogState("success");
      toast.success(`Logged ${stackName}`);
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

  const isDisabled = itemCount === 0 || isPending || logState === "loading";

  function handleLog() {
    if (isDisabled) return;

    setLogState("loading");

    startTransition(async () => {
      try {
        await logStack(stackId);
        setLogState("success");
        toast.success(`Logged ${stackName}`);
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

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleLog}
      disabled={isDisabled}
      className={cn(
        "h-8 gap-1.5 font-mono text-xs transition-all duration-200",
        logState === "success" &&
          "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500",
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
