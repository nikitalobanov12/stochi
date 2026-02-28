"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  Plus,
  CheckCircle2,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { type SelectedSupplement } from "./build-stack-step";
import {
  checkInteractions,
  type InteractionWarning,
} from "~/server/actions/interactions";
import { getSuggestions, type Suggestion } from "~/server/actions/suggestions";

type InteractionsStepProps = {
  supplements: SelectedSupplement[];
  allSupplements: Array<{
    id: string;
    name: string;
    form: string | null;
    defaultUnit: "mg" | "mcg" | "g" | "IU" | "ml" | null;
  }>;
  onAddSupplement: (supplement: SelectedSupplement) => void;
  onComplete: () => Promise<void>;
  onBack: () => void;
};

export function InteractionsStep({
  supplements,
  allSupplements,
  onAddSupplement,
  onComplete,
  onBack,
}: InteractionsStepProps) {
  const [interactions, setInteractions] = useState<InteractionWarning[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supplementIds = supplements.map((s) => s.id);

      const [interactionsResult, suggestionsResult] = await Promise.all([
        checkInteractions(supplementIds),
        getSuggestions(supplementIds),
      ]);

      setInteractions(interactionsResult.interactions);
      setSuggestions(suggestionsResult);
      setLoading(false);
    }

    void loadData();
  }, [supplements]);

  const warnings = interactions.filter((i) => i.type !== "synergy");
  const synergies = interactions.filter((i) => i.type === "synergy");

  function handleAddSuggestion(suggestion: Suggestion) {
    const supp = allSupplements.find((s) => s.id === suggestion.supplementId);
    if (!supp) return;

    onAddSupplement({
      id: supp.id,
      name: supp.name,
      form: supp.form,
      dosage: suggestion.dosage,
      unit: suggestion.unit,
      timeSlot: "morning",
    });
  }

  // Filter out suggestions for supplements already added
  const availableSuggestions = suggestions.filter(
    (s) => !supplements.some((sup) => sup.id === s.supplementId),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
        <div className="space-y-1">
          <h2 className="font-mono text-xl font-bold">
            Here&apos;s what we found
          </h2>
          <p className="text-muted-foreground text-sm">
            Based on your {supplements.length} supplements
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              {warnings.length > 0 && (
                <Badge variant="destructive" className="font-mono">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
                </Badge>
              )}
              {synergies.length > 0 && (
                <Badge className="bg-green-500/10 font-mono text-green-600">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {synergies.length} synerg
                  {synergies.length !== 1 ? "ies" : "y"}
                </Badge>
              )}
              {warnings.length === 0 && synergies.length === 0 && (
                <Badge variant="secondary" className="font-mono">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  No interactions detected
                </Badge>
              )}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-destructive flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </h3>
                {warnings.map((warning) => (
                  <div
                    key={warning.id}
                    className="bg-destructive/10 rounded-md p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          warning.severity === "critical"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {warning.severity}
                      </Badge>
                      <span className="font-medium">
                        {warning.source.name} + {warning.target.name}
                      </span>
                    </div>
                    {warning.mechanism && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {warning.mechanism}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Synergies */}
            {synergies.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <Sparkles className="h-4 w-4" />
                  Synergies
                </h3>
                {synergies.map((synergy) => (
                  <div
                    key={synergy.id}
                    className="rounded-md bg-green-500/10 p-3 text-sm"
                  >
                    <span className="font-medium">
                      {synergy.source.name} + {synergy.target.name}
                    </span>
                    {synergy.mechanism && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {synergy.mechanism}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {availableSuggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Suggestions
                </h3>
                {availableSuggestions.slice(0, 3).map((suggestion) => (
                  <div
                    key={suggestion.supplementId}
                    className="flex items-center justify-between rounded-md border border-dashed p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {suggestion.supplementName}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {suggestion.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {suggestion.reason}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddSuggestion(suggestion)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-border/40 flex shrink-0 gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onBack} size="sm" disabled={isPending}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1" />
        <Button
          onClick={() => {
            startTransition(async () => {
              await onComplete();
            });
          }}
          disabled={isPending}
          className="min-w-[140px]"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>
      </div>
    </div>
  );
}
