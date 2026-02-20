"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { SimpleLogStackButton } from "~/components/stacks/log-stack-button";
import { StackTimingBadge } from "~/components/stacks/stack-timing-badge";
import { formatRelativeTime } from "~/lib/utils";
import { type optimalTimeOfDayEnum } from "~/server/db/schema";

type OptimalTimeOfDay = (typeof optimalTimeOfDayEnum.enumValues)[number];

type StackRowProps = {
  stack: {
    id: string;
    name: string;
    lastLoggedAt: Date | null;
    items: Array<{
      supplement: {
        id: string;
        name: string;
        optimalTimeOfDay: OptimalTimeOfDay | null;
      };
    }>;
  };
};

export function StackRow({ stack }: StackRowProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  function handleNavigate() {
    startTransition(() => {
      router.push(`/dashboard/stacks/${stack.id}`);
    });
  }

  return (
    <div className="group glass-card px-4 py-3 transition-colors">
      {/* Mobile: stacked layout, Desktop: single row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side - Stack info (clickable) */}
        <button
          type="button"
          onClick={handleNavigate}
          disabled={isNavigating}
          className="min-w-0 flex-1 text-left disabled:opacity-70"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-medium">
              {stack.name}
            </span>
            <Badge
              variant="secondary"
              className="bg-muted/50 font-mono text-xs tabular-nums"
            >
              {stack.items.length}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {/* Timing badge */}
            <StackTimingBadge items={stack.items} />

            {/* Supplements preview - hidden on mobile to reduce clutter */}
            <p className="text-muted-foreground hidden truncate font-mono text-xs sm:block">
              {stack.items.length === 0
                ? "Empty protocol"
                : stack.items
                    .slice(0, 3)
                    .map((item) => item.supplement.name)
                    .join(" • ") + (stack.items.length > 3 ? " ..." : "")}
            </p>
          </div>
        </button>

        {/* Right side - Actions */}
        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          {/* Last logged indicator */}
          <span className="text-muted-foreground font-mono text-xs">
            {stack.lastLoggedAt
              ? formatRelativeTime(new Date(stack.lastLoggedAt))
              : "Never logged"}
          </span>

          <div className="flex items-center gap-3">
            {/* Log button */}
            <SimpleLogStackButton
              stackId={stack.id}
              stackName={stack.name}
              itemCount={stack.items.length}
            />

            {/* Navigate arrow */}
            <button
              type="button"
              onClick={handleNavigate}
              disabled={isNavigating}
              className="disabled:opacity-50"
            >
              {isNavigating ? (
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
