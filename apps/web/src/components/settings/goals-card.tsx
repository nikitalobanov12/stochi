"use client";

import { useState, useTransition } from "react";
import { Target, Check, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { goals, type GoalKey } from "~/server/data/goal-recommendations";
import { setUserGoals } from "~/server/actions/goals";

type GoalsCardProps = {
  initialGoals: GoalKey[];
};

export function GoalsCard({ initialGoals }: GoalsCardProps) {
  const [selectedGoals, setSelectedGoals] = useState<GoalKey[]>(initialGoals);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  const toggleGoal = (key: GoalKey) => {
    setSelectedGoals((prev) => {
      let newGoals: GoalKey[];
      if (prev.includes(key)) {
        // Remove
        newGoals = prev.filter((g) => g !== key);
      } else if (prev.length < 3) {
        // Add (max 3)
        newGoals = [...prev, key];
      } else {
        // At max, replace last
        newGoals = [...prev.slice(0, 2), key];
      }
      setHasChanges(true);
      return newGoals;
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      await setUserGoals(selectedGoals);
      setHasChanges(false);
    });
  };

  const handleReset = () => {
    setSelectedGoals(initialGoals);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono">
          <Target className="h-4 w-4" />
          Your Goals
        </CardTitle>
        <CardDescription>
          What are you optimizing for? Select up to 3 goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.key);
            const priority = selectedGoals.indexOf(goal.key) + 1;

            return (
              <button
                key={goal.key}
                type="button"
                onClick={() => toggleGoal(goal.key)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "bg-muted/50 hover:bg-muted border-transparent"
                }`}
              >
                <span className="text-lg">{goal.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{goal.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {goal.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                      {priority}
                    </span>
                    <Check className="text-primary h-4 w-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedGoals.length > 0 && (
          <p className="text-muted-foreground text-xs">
            Priority order:{" "}
            {selectedGoals
              .map(
                (g, i) => `${i + 1}. ${goals.find((x) => x.key === g)?.name}`,
              )
              .join(", ")}
          </p>
        )}

        {hasChanges && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isPending}
              size="sm"
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              onClick={handleReset}
              disabled={isPending}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
