"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Circle, Loader2, Play, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const { stackId, stackName, totalItems, loggedItems, isComplete, items } = stack;

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

  function toggleExpand(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
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
        <Link
          href={`/dashboard/stacks/${stackId}`}
          className="flex flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
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
                  stroke="var(--chart-3)"
                  strokeWidth="2"
                  strokeDasharray={`${(loggedItems / totalItems) * 50.27} 50.27`}
                />
              </svg>
            )}
            {isIdle && (
              <Circle
                className="text-muted-foreground/40 h-5 w-5"
                strokeWidth={2}
              />
            )}
          </div>

          {/* Stack Name & Progress */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm font-medium">{stackName}</p>
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
        </Link>

        {/* Expand Toggle */}
        {items.length > 0 && (
          <button
            type="button"
            onClick={toggleExpand}
            className="flex items-center px-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
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
            <div className="flex h-11 min-w-[72px] items-center justify-center rounded-xl bg-status-optimized px-3">
              <span className="font-mono text-[10px] font-medium status-optimized">
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
                "border-border/60 h-11 min-w-[72px] gap-1.5 rounded-xl font-mono text-xs",
                "hover:border-primary hover:bg-primary hover:text-primary-foreground",
                isPending && "pointer-events-none",
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
                    : "border-white/10 bg-white/[0.02] text-muted-foreground"
                )}
              >
                {item.logged ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : (
                  <Circle className="h-2.5 w-2.5" />
                )}
                <span className={item.logged ? "" : ""}>{item.supplementName}</span>
                <span className="text-muted-foreground/60 tabular-nums">
                  {item.expectedDosage}{item.expectedUnit}
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
      <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
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
