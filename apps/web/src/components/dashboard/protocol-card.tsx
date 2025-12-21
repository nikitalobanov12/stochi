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
 * ProtocolCard - Split-Action Row Design (Scientific Laboratory v1.1)
 *
 * Zone A (Left ~70%): The Briefing - Click to navigate to stack detail
 * Zone B (Right ~30%): The Trigger - Explicit execute button
 *
 * Uses Glass Card styling per spec section 2
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
        "glass-card flex items-stretch transition-colors",
        isComplete && "border-status-optimized bg-status-optimized",
      )}
    >
      {/* Zone A: The Briefing (Navigate to detail) */}
      <Link
        href={`/dashboard/stacks/${stackId}`}
        className="flex flex-1 items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
      >
        {/* Status Indicator */}
        <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
          {isComplete && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
              <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />
            </div>
          )}
          {isPartial && (
            <svg className="h-6 w-6 -rotate-90" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray={`${(loggedItems / totalItems) * 50.27} 50.27`}
              />
            </svg>
          )}
          {isIdle && (
            <Circle
              className="h-6 w-6 text-white/20"
              strokeWidth={2}
            />
          )}
        </div>

        {/* Stack Name & Progress */}
        <div className="min-w-0 flex-1">
          {/* Protocol name - Primary header */}
          <p className="type-header truncate text-sm">{stackName}</p>
          {/* Progress - Technical data */}
          <p className="mt-0.5 font-mono text-[10px]">
            {isComplete ? (
              <span className="status-optimized">COMPLETE</span>
            ) : (
              <>
                <span className="type-technical tabular-nums">{loggedItems}</span>
                <span className="text-muted-foreground/60">/</span>
                <span className="type-technical tabular-nums">{totalItems}</span>
                <span className="type-prose ml-1 text-[10px]">logged</span>
              </>
            )}
          </p>
        </div>
      </Link>

      {/* Vertical Divider */}
      <div className="w-px bg-white/[0.08]" />

      {/* Zone B: The Trigger (Execute) */}
      <div className="flex items-center px-3">
        {isComplete ? (
          <div className="flex h-11 min-w-[80px] items-center justify-center rounded-xl bg-status-optimized px-4">
            <span className="type-technical text-[10px] font-medium">
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
              "h-11 min-w-[80px] gap-2 rounded-xl border-white/[0.08] bg-white/[0.02] font-mono text-xs",
              "hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400",
              isPending && "pointer-events-none",
            )}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
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
 * MissionControl - Protocol deck section (Secondary Row per spec section 4)
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
    <section className="space-y-4">
      <h2 className="type-label">
        Protocols
      </h2>
      <div className="space-y-3">
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
