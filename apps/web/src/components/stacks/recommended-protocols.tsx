"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  Loader2,
  Check,
  Settings,
  Library,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  type StackTemplate,
  getStacksByGoals,
} from "~/server/data/stack-templates";
import { type GoalKey, getGoalByKey } from "~/server/data/goal-recommendations";

type RecommendedProtocolsProps = {
  userGoals: GoalKey[];
  existingStackNames: string[];
  createStackFromTemplate: (
    templateKey: string,
  ) => Promise<{ success: boolean; stackId?: string; error?: string }>;
};

/**
 * Goal-based protocol recommendations section.
 * Shows personalized stack templates based on user's health goals.
 * Displays CTA to settings if no goals are set.
 */
export function RecommendedProtocols({
  userGoals,
  existingStackNames,
  createStackFromTemplate,
}: RecommendedProtocolsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [importedKeys, setImportedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // No goals set - show CTA
  if (userGoals.length === 0) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <h2 className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            Personalized Recommendations
          </h2>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-muted-foreground font-mono text-sm">
            Define your health goals in Settings to unlock personalized stack
            recommendations.
          </p>
          <Link href="/dashboard/settings">
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-amber-500/30 font-mono text-xs hover:bg-amber-500/10"
            >
              <Settings className="mr-2 h-3 w-3" />
              Set Goals
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  // Get templates matching user's goals
  const matchingTemplates = getStacksByGoals(userGoals)
    // Filter out already imported stacks (by name)
    .filter((t) => !existingStackNames.includes(t.name))
    // Filter out research stacks for cleaner recommendations
    .filter((t) => !t.isResearchStack)
    // Prioritize high authority
    .sort((a, b) => {
      const order = { high: 0, medium: 1, community: 2 };
      return (
        (order[a.authority ?? "community"] ?? 2) -
        (order[b.authority ?? "community"] ?? 2)
      );
    })
    // Limit to 4 recommendations
    .slice(0, 4);

  // No matching templates (all imported or no matches)
  if (matchingTemplates.length === 0) {
    return null;
  }

  // Format user goals for display
  const goalLabels = userGoals
    .map((g) => getGoalByKey(g)?.name ?? g)
    .slice(0, 2)
    .join(" & ");

  function handleImport(templateKey: string) {
    setLoadingKey(templateKey);
    setError(null);
    startTransition(async () => {
      try {
        const result = await createStackFromTemplate(templateKey);
        if (result.success && result.stackId) {
          setImportedKeys((prev) => new Set([...prev, templateKey]));
          router.refresh();
        } else {
          setError(result.error ?? "Failed to import");
        }
      } catch {
        setError("Failed to import protocol");
      } finally {
        setLoadingKey(null);
      }
    });
  }

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <h2 className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            Recommended for {goalLabels}
          </h2>
        </div>
        <Link
          href="/dashboard/stacks"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono text-xs transition-colors"
        >
          <Library className="h-3 w-3" />
          View all
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-500/10 p-2 font-mono text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Template cards - Amber border to denote "Expert Library" */}
      <div className="grid gap-2 sm:grid-cols-2">
        {matchingTemplates.map((template) => (
          <TemplateCard
            key={template.key}
            template={template}
            onImport={() => handleImport(template.key)}
            isLoading={loadingKey === template.key && isPending}
            isImported={importedKeys.has(template.key)}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Template Card
// ============================================================================

function TemplateCard({
  template,
  onImport,
  isLoading,
  isImported,
}: {
  template: StackTemplate;
  onImport: () => void;
  isLoading: boolean;
  isImported: boolean;
}) {
  return (
    <button
      onClick={onImport}
      disabled={isLoading || isImported}
      className={cn(
        "group w-full rounded-lg border p-3 text-left transition-all",
        // Amber thin-film border for Expert Library visual treatment
        "border-amber-500/20 bg-amber-500/[0.02]",
        "hover:border-amber-500/30 hover:bg-amber-500/[0.04]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isImported && "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">{template.name}</span>
            {template.authority === "high" && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-400">
                <Sparkles className="h-2 w-2" />
                EXPERT
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground line-clamp-1 font-mono text-xs">
            {template.description}
          </p>

          {/* Supplements preview */}
          <div className="flex flex-wrap gap-1">
            {template.supplements.slice(0, 3).map((supp, i) => (
              <span
                key={i}
                className="text-muted-foreground font-mono text-xs"
              >
                {supp.supplementName}
                {i < Math.min(template.supplements.length, 3) - 1 && " •"}
              </span>
            ))}
            {template.supplements.length > 3 && (
              <span className="text-muted-foreground font-mono text-xs">
                +{template.supplements.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Action indicator */}
        <div className="flex-shrink-0 pt-0.5">
          {isImported ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-3 w-3 text-emerald-500" />
            </div>
          ) : isLoading ? (
            <Loader2 className="text-primary h-4 w-4 animate-spin" />
          ) : (
            <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
      </div>
    </button>
  );
}
