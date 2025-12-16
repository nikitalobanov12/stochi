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
          <Target className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">No goals set</p>
            <p className="text-xs text-muted-foreground">
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
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <Target className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-mono text-sm font-medium">Goal Progress</p>
              <p className="text-xs text-muted-foreground">
                {progress.length} active goal{progress.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-2 space-y-4">
            {progress.map((p) => (
              <GoalProgressItem key={p.goal.key} progress={p} />
            ))}
            
            <div className="pt-2 border-t">
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
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
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
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">Taking:</span>{" "}
            {taking.slice(0, 3).join(", ")}
            {taking.length > 3 && ` +${taking.length - 3} more`}
          </p>
        )}
        {missing.length > 0 && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1">
              <span className="text-orange-600">Consider:</span>{" "}
              {missing[0]}
            </p>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" asChild>
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
