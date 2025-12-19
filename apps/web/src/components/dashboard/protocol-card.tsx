"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, Circle, Loader2, Play } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { type StackCompletionStatus } from "~/server/services/analytics";

type ProtocolCardProps = {
  stack: StackCompletionStatus;
  onLog: () => Promise<void>;
};

/**
 * ProtocolCard - Split-Action Row Design
 *
 * Zone A (Left ~70%): The Briefing - Click to navigate to stack detail
 * Zone B (Right ~30%): The Trigger - Explicit execute button
 *
 * This solves the "invisible action" problem by making the LOG button
 * always visible and physically distinct from navigation.
 */
export function ProtocolCard({ stack, onLog }: ProtocolCardProps) {
  const [isPending, startTransition] = useTransition();

  const { stackId, stackName, totalItems, loggedItems, isComplete } = stack;

  // Status states
  const isIdle = loggedItems === 0;
  const isPartial = loggedItems > 0 && !isComplete;

  function handleExecute(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await onLog();
    });
  }

  return (
    <div
      className={cn(
        "flex items-stretch rounded-lg border transition-colors",
        isComplete
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border/40 bg-card/30"
      )}
    >
      {/* Zone A: The Briefing (Navigate to detail) */}
      <Link
        href={`/dashboard/stacks/${stackId}`}
        className="flex flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-card/50"
      >
        {/* Status Indicator */}
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          {isComplete && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
          {isPartial && (
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
          )}
          {isIdle && (
            <Circle
              className="h-5 w-5 text-muted-foreground/40"
              strokeWidth={2}
            />
          )}
        </div>

        {/* Stack Name & Progress */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-medium">{stackName}</p>
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
      </Link>

      {/* Vertical Divider (explicit on mobile) */}
      <div className="w-px bg-border/40" />

      {/* Zone B: The Trigger (Execute) */}
      <div className="flex items-center px-2">
        {isComplete ? (
          <div className="flex h-11 min-w-[72px] items-center justify-center rounded-md bg-emerald-500/10 px-3">
            <span className="font-mono text-[10px] font-medium text-emerald-500">
              DONE
            </span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExecute}
            disabled={isPending || totalItems === 0}
            className={cn(
              "h-11 min-w-[72px] gap-1.5 border-border/60 font-mono text-xs",
              "hover:border-primary hover:bg-primary hover:text-primary-foreground",
              isPending && "pointer-events-none"
            )}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Play className="h-3 w-3" />
                LOG
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * MissionControl - Protocol deck section
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
    <section className="space-y-3">
      <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Protocols
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
    </section>
  );
}
