"use client";

import { useState, useTransition } from "react";
import { Lightbulb, RotateCcw, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { setShowAddSuggestions } from "~/server/actions/preferences";
import { resetDismissedSuggestions } from "~/server/actions/dismissed-suggestions";

type SuggestionsCardProps = {
  initialShowAddSuggestions: boolean;
  dismissedCount: number;
};

export function SuggestionsCard({
  initialShowAddSuggestions,
  dismissedCount,
}: SuggestionsCardProps) {
  const [showAddSuggestions, setShowAddSuggestionsState] = useState(
    initialShowAddSuggestions,
  );
  const [localDismissedCount, setLocalDismissedCount] = useState(dismissedCount);
  const [isPendingToggle, startToggleTransition] = useTransition();
  const [isPendingReset, startResetTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    // Optimistic update
    setShowAddSuggestionsState(checked);
    startToggleTransition(async () => {
      await setShowAddSuggestions(checked);
    });
  };

  const handleReset = () => {
    startResetTransition(async () => {
      await resetDismissedSuggestions();
      setLocalDismissedCount(0);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono">
          <Lightbulb className="h-4 w-4" />
          Suggestions
        </CardTitle>
        <CardDescription>
          Control how supplement suggestions appear on your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Show Add Suggestions Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Add Supplement Suggestions</div>
            <div className="text-muted-foreground text-xs">
              Show suggestions to add supplements that synergize with your current stack
            </div>
          </div>
          <Switch
            checked={showAddSuggestions}
            onCheckedChange={handleToggle}
            disabled={isPendingToggle}
          />
        </div>

        {/* Dismissed Suggestions */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Dismissed Suggestions</div>
              <div className="text-muted-foreground text-xs">
                {localDismissedCount === 0
                  ? "No suggestions have been dismissed"
                  : `${localDismissedCount} suggestion${localDismissedCount === 1 ? "" : "s"} hidden`}
              </div>
            </div>
            {localDismissedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isPendingReset}
              >
                {isPendingReset ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Reset All
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
