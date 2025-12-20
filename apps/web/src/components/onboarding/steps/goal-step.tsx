"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  goals,
  type Goal,
  type GoalKey,
} from "~/server/data/goal-recommendations";
import { cn } from "~/lib/utils";

type GoalStepProps = {
  onNext: (goalKeys: GoalKey[]) => void;
  onSkip: () => void;
  onBack: () => void;
};

export function GoalStep({ onNext, onSkip, onBack }: GoalStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<GoalKey[]>([]);

  function toggleGoal(goalKey: GoalKey) {
    setSelectedGoals((prev) =>
      prev.includes(goalKey)
        ? prev.filter((g) => g !== goalKey)
        : [...prev, goalKey],
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div className="space-y-2">
          <h2 className="font-mono text-xl font-bold">
            What are your goals?
          </h2>
          <p className="text-muted-foreground text-sm">
            Select all that apply. We&apos;ll suggest supplements based on your
            focus areas.
          </p>
        </div>

        <div className="space-y-2 pb-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.key}
              goal={goal}
              selected={selectedGoals.includes(goal.key)}
              onToggle={() => toggleGoal(goal.key)}
            />
          ))}
        </div>
      </div>

      <div className="border-border/40 flex shrink-0 items-center gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {selectedGoals.length > 0 && (
          <Badge variant="secondary" className="font-mono text-xs">
            {selectedGoals.length} selected
          </Badge>
        )}
        <div className="flex-1" />
        <Button
          variant="ghost"
          onClick={onSkip}
          size="sm"
          className="text-muted-foreground"
        >
          Skip
        </Button>
        <Button
          onClick={() => onNext(selectedGoals)}
          disabled={selectedGoals.length === 0}
          size="sm"
        >
          Continue
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  selected,
  onToggle,
}: {
  goal: Goal;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full rounded-lg border-2 p-3 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "bg-muted/50 hover:border-muted-foreground/30 border-transparent",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{goal.icon}</span>
        <div className="flex-1">
          <div className="font-medium">{goal.name}</div>
          <div className="text-muted-foreground text-xs">
            {goal.description}
          </div>
        </div>
        {selected && (
          <div className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
    </button>
  );
}
