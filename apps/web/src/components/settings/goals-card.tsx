"use client";

import { useOptimistic, useTransition } from "react";
import { Target, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { goals, type GoalKey } from "~/server/data/goal-recommendations";
import { setUserGoals } from "~/server/actions/goals";
import { retryWithBackoff } from "~/lib/retry";

type GoalsCardProps = {
  initialGoals: GoalKey[];
};

export function GoalsCard({ initialGoals }: GoalsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticGoals, setOptimisticGoals] = useOptimistic(initialGoals);

  const toggleGoal = (key: GoalKey) => {
    let newGoals: GoalKey[];

    if (optimisticGoals.includes(key)) {
      // Remove
      newGoals = optimisticGoals.filter((g) => g !== key);
    } else if (optimisticGoals.length < 3) {
      // Add (max 3)
      newGoals = [...optimisticGoals, key];
    } else {
      // At max, replace last
      newGoals = [...optimisticGoals.slice(0, 2), key];
    }

    // Optimistic update - show new state immediately
    setOptimisticGoals(newGoals);

    // Persist to server in background
    startTransition(async () => {
      const result = await retryWithBackoff(() => setUserGoals(newGoals));

      if (!result.success) {
        toast.error("Failed to save goals. Please try again.");
        // Sync with server to restore original state
        router.refresh();
      }
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono">
          <Target className="h-4 w-4" />
          Your Goals
          {isPending && (
            <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
          )}
        </CardTitle>
        <CardDescription>
          What are you optimizing for? Select up to 3 goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {goals.map((goal) => {
            const isSelected = optimisticGoals.includes(goal.key);
            const priority = optimisticGoals.indexOf(goal.key) + 1;

            return (
              <button
                key={goal.key}
                type="button"
                onClick={() => toggleGoal(goal.key)}
                disabled={isPending}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-70 ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "bg-muted/50 hover:bg-muted border-transparent"
                }`}
              >
                <span className="shrink-0 text-lg">{goal.icon}</span>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{goal.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {goal.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex shrink-0 items-center gap-2">
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

        {optimisticGoals.length > 0 && (
          <p className="text-muted-foreground text-xs">
            Priority order:{" "}
            {optimisticGoals
              .map(
                (g, i) => `${i + 1}. ${goals.find((x) => x.key === g)?.name}`,
              )
              .join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
