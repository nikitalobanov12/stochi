"use client";

import { useState, useTransition } from "react";
import {
  Lightbulb,
  RotateCcw,
  Loader2,
  Zap,
  Clock,
  Scale,
  ChevronDown,
  ChevronUp,
  Undo2,
  ShieldAlert,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { setShowAddSuggestions } from "~/server/actions/preferences";
import {
  resetDismissedSuggestions,
  restoreSuggestion,
  type DismissedSuggestionWithContext,
} from "~/server/actions/dismissed-suggestions";
import { cn } from "~/lib/utils";
import {
  useCategoryPreferences,
  type SuggestionCategory,
} from "~/lib/use-category-preferences";

type SuggestionsCardProps = {
  initialShowAddSuggestions: boolean;
  dismissedSuggestions: DismissedSuggestionWithContext[];
};

const TYPE_CONFIG = {
  synergy: {
    label: "Synergy",
    icon: Zap,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  timing: {
    label: "Timing",
    icon: Clock,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  balance: {
    label: "Balance",
    icon: Scale,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  unknown: {
    label: "Other",
    icon: Lightbulb,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  },
};

// Category configuration for toggles
const CATEGORY_CONFIG: Record<
  SuggestionCategory,
  {
    label: string;
    description: string;
    icon: typeof Zap;
    colorClass: string;
  }
> = {
  safety: {
    label: "Safety Warnings",
    description: "Alerts about supplement interactions and limits",
    icon: ShieldAlert,
    colorClass: "text-red-400",
  },
  timing: {
    label: "Timing Tips",
    description: "Suggestions for optimal timing of supplements",
    icon: Clock,
    colorClass: "text-blue-400",
  },
  synergy: {
    label: "Synergy Opportunities",
    description: "Suggestions for supplements that work well together",
    icon: Zap,
    colorClass: "text-emerald-400",
  },
  balance: {
    label: "Balance Suggestions",
    description: "Recommendations for mineral balance pairs",
    icon: Scale,
    colorClass: "text-amber-400",
  },
};

export function SuggestionsCard({
  initialShowAddSuggestions,
  dismissedSuggestions: initialDismissed,
}: SuggestionsCardProps) {
  const [showAddSuggestions, setShowAddSuggestionsState] = useState(
    initialShowAddSuggestions,
  );
  const [dismissed, setDismissed] = useState(initialDismissed);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPendingToggle, startToggleTransition] = useTransition();
  const [isPendingReset, startResetTransition] = useTransition();
  const [restoringKey, setRestoringKey] = useState<string | null>(null);

  // Category preferences from localStorage (instant, no server roundtrip)
  const {
    preferences: categoryPrefs,
    toggleCategory,
    isHydrated,
  } = useCategoryPreferences();

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
      setDismissed([]);
      setIsExpanded(false);
    });
  };

  const handleRestore = (suggestionKey: string) => {
    setRestoringKey(suggestionKey);
    // Optimistic update
    setDismissed((prev) =>
      prev.filter((d) => d.suggestionKey !== suggestionKey),
    );

    // Server action
    restoreSuggestion(suggestionKey).finally(() => {
      setRestoringKey(null);
    });
  };

  const formatDescription = (item: DismissedSuggestionWithContext): string => {
    if (item.supplementNames.length === 0) {
      return "Unknown supplements";
    }
    if (item.type === "timing") {
      return item.supplementNames[0] ?? "Unknown supplement";
    }
    // synergy or balance: show both supplements
    return item.supplementNames.join(" + ");
  };

  // Category order for display
  const categoryOrder: SuggestionCategory[] = [
    "safety",
    "timing",
    "synergy",
    "balance",
  ];

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
            <div className="text-sm font-medium">
              Add Supplement Suggestions
            </div>
            <div className="text-muted-foreground text-xs">
              Show suggestions to add supplements that synergize with your
              current stack
            </div>
          </div>
          <Switch
            checked={showAddSuggestions}
            onCheckedChange={handleToggle}
            disabled={isPendingToggle}
          />
        </div>

        {/* Category Toggles */}
        <div className="border-t pt-4">
          <div className="mb-3 space-y-0.5">
            <div className="text-sm font-medium">Suggestion Categories</div>
            <div className="text-muted-foreground text-xs">
              Choose which types of suggestions to show on your dashboard
            </div>
          </div>
          <div className="space-y-3">
            {categoryOrder.map((category) => {
              const config = CATEGORY_CONFIG[category];
              const Icon = config.icon;

              return (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", config.colorClass)} />
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {config.description}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={isHydrated ? categoryPrefs[category] : true}
                    onCheckedChange={() => toggleCategory(category)}
                    disabled={!isHydrated}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dismissed Suggestions */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Dismissed Suggestions</div>
              <div className="text-muted-foreground text-xs">
                {dismissed.length === 0
                  ? "No suggestions have been dismissed"
                  : `${dismissed.length} suggestion${dismissed.length === 1 ? "" : "s"} hidden`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dismissed.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-muted-foreground"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="mr-1 h-3 w-3" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1 h-3 w-3" />
                        Show
                      </>
                    )}
                  </Button>
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
                </>
              )}
            </div>
          </div>

          {/* Expandable list of dismissed suggestions */}
          {isExpanded && dismissed.length > 0 && (
            <div className="mt-4 space-y-2">
              {dismissed.map((item) => {
                const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.unknown;
                const Icon = config.icon;
                const isRestoring = restoringKey === item.suggestionKey;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3",
                      "bg-muted/30 transition-opacity",
                      isRestoring && "opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 font-mono text-[10px]",
                          config.className,
                        )}
                      >
                        <Icon className="h-2.5 w-2.5" />
                        {config.label}
                      </Badge>
                      <span className="font-mono text-sm">
                        {formatDescription(item)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(item.suggestionKey)}
                      disabled={isRestoring}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isRestoring ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Undo2 className="mr-1 h-3 w-3" />
                          Restore
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
