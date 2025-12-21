"use client";

import { useState } from "react";
import Link from "next/link";
import { Target, ChevronDown, Plus, Settings } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Button } from "~/components/ui/button";
import { type GoalProgress } from "~/server/actions/goals";

type GoalProgressCardProps = {
  progress: GoalProgress[];
};

export function GoalProgressCard({ progress }: GoalProgressCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (progress.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4">
        <div className="flex items-center gap-3">
          <Target className="text-muted-foreground h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-medium">No goals set</p>
            <p className="text-muted-foreground text-xs">
              Set your optimization goals to get personalized recommendations
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              Set Goals
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-white/10 bg-[#0A0A0A]">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.02]"
          >
            <Target className="h-5 w-5 text-emerald-500" />
            <div className="flex-1">
              <p className="font-mono text-sm font-medium">Goal Progress</p>
              <p className="text-xs text-white/40">
                {progress.length} active goal{progress.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-white/40 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 border-t border-white/5 px-4 pb-4 pt-2">
            {progress.map((p) => (
              <GoalProgressItem key={p.goal.key} progress={p} />
            ))}

            <div className="border-t border-white/5 pt-2">
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Goals
                </Link>
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function GoalProgressItem({ progress }: { progress: GoalProgress }) {
  const { goal, taking, missing, coverage } = progress;
  const percentage = Math.round(coverage * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{goal.icon}</span>
          <span className="font-mono text-sm font-medium">{goal.name}</span>
        </div>
        <span className="text-muted-foreground font-mono text-sm tabular-nums">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all ${
            percentage >= 75
              ? "bg-green-500"
              : percentage >= 50
                ? "bg-yellow-500"
                : "bg-orange-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Taking & Missing */}
      <div className="space-y-1">
        {taking.length > 0 && (
          <p className="text-muted-foreground text-xs">
            <span className="text-green-600">Taking:</span>{" "}
            {taking.slice(0, 3).join(", ")}
            {taking.length > 3 && ` +${taking.length - 3} more`}
          </p>
        )}
        {missing.length > 0 && (
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground flex-1 text-xs">
              <span className="text-orange-600">Consider:</span> {missing[0]}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              asChild
            >
              <Link href="/dashboard/stacks">
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
