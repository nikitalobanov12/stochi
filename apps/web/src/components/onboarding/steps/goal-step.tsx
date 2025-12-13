"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { goals, type Goal } from "~/server/data/goal-recommendations";
import { cn } from "~/lib/utils";

type GoalStepProps = {
  onNext: (goalKey: string | null) => void;
  onSkip: () => void;
  onBack: () => void;
};

export function GoalStep({ onNext, onSkip, onBack }: GoalStepProps) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <h2 className="font-mono text-xl font-bold">What&apos;s your goal?</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ll suggest supplements based on your primary focus.
          </p>
        </div>

        <div className="space-y-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.key}
              goal={goal}
              selected={selectedGoal === goal.key}
              onSelect={() => setSelectedGoal(goal.key)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
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
          onClick={() => onNext(selectedGoal)}
          disabled={!selectedGoal}
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
  onSelect,
}: {
  goal: Goal;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border-2 p-3 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-transparent bg-muted/50 hover:border-muted-foreground/30",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{goal.icon}</span>
        <div>
          <div className="font-medium">{goal.name}</div>
          <div className="text-xs text-muted-foreground">{goal.description}</div>
        </div>
      </div>
    </button>
  );
}
