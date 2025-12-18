"use client";

import { useTransition } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { type StackCompletionStatus } from "~/server/services/analytics";

type ProtocolCardProps = {
  stack: StackCompletionStatus;
  onLog: () => Promise<void>;
};

export function ProtocolCard({ stack, onLog }: ProtocolCardProps) {
  const [isPending, startTransition] = useTransition();

  const { stackName, totalItems, loggedItems, isComplete } = stack;

  // Status indicator states
  const isPending_ = loggedItems === 0;
  const isPartial = loggedItems > 0 && !isComplete;

  function handleLog() {
    startTransition(async () => {
      await onLog();
    });
  }

  return (
    <div className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-4 py-3 transition-colors hover:border-border/60 hover:bg-card/50">
      {/* Left: Stack Info */}
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="relative flex h-5 w-5 items-center justify-center">
          {isPending && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {!isPending && isComplete && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          {!isPending && isPartial && (
            <div className="relative h-5 w-5">
              {/* Partial ring using SVG */}
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
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${(loggedItems / totalItems) * 50.27} 50.27`}
                  className="text-amber-500"
                />
              </svg>
            </div>
          )}
          {!isPending && isPending_ && (
            <Circle className="h-5 w-5 text-muted-foreground/40" strokeWidth={2} />
          )}
        </div>

        {/* Stack Name & Progress */}
        <div>
          <p className="font-mono text-sm font-medium">{stackName}</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {isComplete ? (
              <span className="text-emerald-500">COMPLETE</span>
            ) : (
              <>
                <span className="tabular-nums">{loggedItems}</span>
                <span className="text-muted-foreground/60">/</span>
                <span className="tabular-nums">{totalItems}</span>
                <span className="ml-1 text-muted-foreground/60">logged</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right: Log Button */}
      <Button
        variant="ghost"
        size="sm"
        className="font-mono text-xs opacity-0 transition-opacity group-hover:opacity-100"
        onClick={handleLog}
        disabled={isPending || totalItems === 0}
      >
        {isPending ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          "LOG"
        )}
      </Button>
    </div>
  );
}

/**
 * Mission Control section containing all protocol cards.
 */
export function MissionControl({
  stacks,
  onLogStack,
}: {
  stacks: StackCompletionStatus[];
  onLogStack: (stackId: string) => Promise<void>;
}) {
  if (stacks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Mission Control
      </h2>
      <div className="space-y-2">
        {stacks.map((stack) => (
          <ProtocolCard
            key={stack.stackId}
            stack={stack}
            onLog={() => onLogStack(stack.stackId)}
          />
        ))}
      </div>
    </div>
  );
}
