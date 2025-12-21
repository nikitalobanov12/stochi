"use client";

import { useState, useMemo, useTransition } from "react";
import { ArrowRight, ArrowLeft, Search, Plus, X, Sparkles, Upload, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getGoalByKey, type GoalKey } from "~/server/data/goal-recommendations";
import { fuzzySearchSupplements } from "~/server/data/supplement-aliases";
import { getServingPresets } from "~/server/data/serving-presets";
import { parseStackImport } from "~/server/actions/import-stack";

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: "mg" | "mcg" | "g" | "IU" | "ml" | null;
};

export type SelectedSupplement = {
  id: string;
  name: string;
  form: string | null;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
};

type BuildStackStepProps = {
  supplements: Supplement[];
  selectedGoals: GoalKey[];
  selected: SelectedSupplement[];
  stackName: string;
  onChangeSupplements: (supplements: SelectedSupplement[]) => void;
  onChangeStackName: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function BuildStackStep({
  supplements,
  selectedGoals,
  selected,
  stackName,
  onChangeSupplements,
  onChangeStackName,
  onNext,
  onBack,
}: BuildStackStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingDosage, setPendingDosage] = useState("");
  const [pendingUnit, setPendingUnit] = useState<
    "mg" | "mcg" | "g" | "IU" | "ml"
  >("mg");
  const [pendingSupplement, setPendingSupplement] = useState<Supplement | null>(
    null,
  );

  // Import mode state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [isParsing, startParsing] = useTransition();

  // Get goal-based suggestions from all selected goals
  const goalRecommendations = selectedGoals
    .map((g) => getGoalByKey(g))
    .filter(Boolean);

  // Filter out already selected supplements
  const availableSupplements = useMemo(
    () => supplements.filter((s) => !selected.some((sel) => sel.id === s.id)),
    [supplements, selected],
  );

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableSupplements.slice(0, 6);
    }
    return fuzzySearchSupplements(availableSupplements, searchQuery).slice(
      0,
      6,
    );
  }, [availableSupplements, searchQuery]);

  // Goal-based suggestions (not yet added) - combine from all selected goals
  const suggestedSupplements = useMemo(() => {
    if (goalRecommendations.length === 0) return [];

    // Collect all recommended supplements from all goals, avoiding duplicates
    const seenNames = new Set<string>();
    const allRecommendations: Array<{
      name: string;
      dosage: number;
      unit: string;
      reason: string;
      goalName: string;
    }> = [];

    for (const goal of goalRecommendations) {
      if (!goal) continue;
      for (const rec of goal.supplements) {
        if (!seenNames.has(rec.name)) {
          seenNames.add(rec.name);
          allRecommendations.push({ ...rec, goalName: goal.name });
        }
      }
    }

    return allRecommendations
      .filter((rec) => !selected.some((sel) => sel.name === rec.name))
      .map((rec) => {
        const supp = supplements.find((s) => s.name === rec.name);
        return supp ? { ...supp, recommended: rec } : null;
      })
      .filter(Boolean) as Array<
      Supplement & {
        recommended: {
          dosage: number;
          unit: string;
          reason: string;
          goalName: string;
        };
      }
    >;
  }, [goalRecommendations, selected, supplements]);

  // Get serving presets for pending supplement
  const servingPresets = useMemo(() => {
    if (!pendingSupplement) return [];
    return getServingPresets(pendingSupplement.name);
  }, [pendingSupplement]);

  function handleSelectSupplement(supplement: Supplement) {
    setPendingSupplement(supplement);
    setSearchQuery(supplement.name);
    setPendingUnit(supplement.defaultUnit ?? "mg");
    setShowDropdown(false);
  }

  function handleAddSupplement() {
    if (!pendingSupplement || !pendingDosage) return;

    const newSupplement: SelectedSupplement = {
      id: pendingSupplement.id,
      name: pendingSupplement.name,
      form: pendingSupplement.form,
      dosage: parseFloat(pendingDosage),
      unit: pendingUnit,
    };

    onChangeSupplements([...selected, newSupplement]);
    resetForm();
  }

  function handleAddWithPreset(
    dosage: number,
    unit: "mg" | "mcg" | "g" | "IU" | "ml",
  ) {
    if (!pendingSupplement) return;

    const newSupplement: SelectedSupplement = {
      id: pendingSupplement.id,
      name: pendingSupplement.name,
      form: pendingSupplement.form,
      dosage,
      unit,
    };

    onChangeSupplements([...selected, newSupplement]);
    resetForm();
  }

  function handleAddSuggestion(
    supplement: Supplement & {
      recommended: { dosage: number; unit: string; goalName: string };
    },
  ) {
    const newSupplement: SelectedSupplement = {
      id: supplement.id,
      name: supplement.name,
      form: supplement.form,
      dosage: supplement.recommended.dosage,
      unit: supplement.recommended.unit as "mg" | "mcg" | "g" | "IU" | "ml",
    };
    onChangeSupplements([...selected, newSupplement]);
  }

  function handleRemove(id: string) {
    onChangeSupplements(selected.filter((s) => s.id !== id));
  }

  function resetForm() {
    setPendingSupplement(null);
    setSearchQuery("");
    setPendingDosage("");
    setPendingUnit("mg");
  }

  function handleImport() {
    if (!importText.trim()) return;

    startParsing(async () => {
      const result = await parseStackImport(importText);

      // Convert matched items to SelectedSupplement format
      const imported: SelectedSupplement[] = result.matched.map((item) => ({
        id: item.supplementId,
        name: item.supplementName,
        form: supplements.find((s) => s.id === item.supplementId)?.form ?? null,
        dosage: item.resolvedDosage,
        unit: item.resolvedUnit,
      }));

      // Add to existing selection (avoiding duplicates)
      const existingIds = new Set(selected.map((s) => s.id));
      const newItems = imported.filter((item) => !existingIds.has(item.id));

      onChangeSupplements([...selected, ...newItems]);
      setImportText("");
      setShowImport(false);
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
        <div className="space-y-1">
          <h2 className="font-mono text-xl font-bold">Build your stack</h2>
          <p className="text-muted-foreground text-sm">
            Add supplements you take together. You&apos;ll be able to log them
            all with one tap.
          </p>
        </div>

        {/* Stack name input */}
        <div className="space-y-1.5">
          <label
            htmlFor="stack-name"
            className="text-muted-foreground text-xs font-medium"
          >
            Stack name
          </label>
          <Input
            id="stack-name"
            value={stackName}
            onChange={(e) => onChangeStackName(e.target.value)}
            placeholder="e.g., Morning Protocol"
            className="font-mono text-sm"
          />
        </div>

        {/* Import from text toggle */}
        {!showImport ? (
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-xs transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Import from another app
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                Paste your supplement list
              </span>
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Vitamin D 5000IU&#10;Magnesium 400mg&#10;Omega-3 2000mg"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[100px] w-full rounded-md border px-3 py-2 font-mono text-xs focus-visible:ring-1 focus-visible:outline-none"
            />
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!importText.trim() || isParsing}
              className="w-full"
            >
              {isParsing ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-2 h-3.5 w-3.5" />
              )}
              Import Supplements
            </Button>
          </div>
        )}

        {/* Search and add form */}
        <div className="space-y-2 rounded-lg border p-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search supplements..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPendingSupplement(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-9 font-mono text-sm"
            />
            {showDropdown && searchResults.length > 0 && !pendingSupplement && (
              <div className="bg-popover absolute z-50 mt-1 w-full rounded-md border shadow-lg">
                <div className="max-h-[150px] overflow-y-auto py-1">
                  {searchResults.map((supplement) => (
                    <button
                      key={supplement.id}
                      type="button"
                      onClick={() => handleSelectSupplement(supplement)}
                      className="hover:bg-muted flex w-full items-center px-3 py-2 text-left text-sm"
                    >
                      <div>
                        <div className="font-medium">{supplement.name}</div>
                        {supplement.form && (
                          <div className="text-muted-foreground text-xs">
                            {supplement.form}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {pendingSupplement && (
            <div className="space-y-2">
              {/* Serving presets */}
              {servingPresets.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">
                    Quick servings:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {servingPresets.slice(0, 4).map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() =>
                          handleAddWithPreset(preset.dosage, preset.unit)
                        }
                      >
                        {preset.label}
                        <span className="text-muted-foreground ml-1">
                          ({preset.dosage}
                          {preset.unit})
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual dosage input */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Dosage"
                  value={pendingDosage}
                  onChange={(e) => setPendingDosage(e.target.value)}
                  className="w-24 font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSupplement();
                    }
                  }}
                />
                <Select
                  value={pendingUnit}
                  onValueChange={(v) => setPendingUnit(v as typeof pendingUnit)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="mcg">mcg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="IU">IU</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddSupplement}
                  disabled={!pendingDosage}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Goal-based suggestions */}
        {suggestedSupplements.length > 0 && (
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Sparkles className="h-3 w-3" />
              <span>
                Suggested for{" "}
                {goalRecommendations.map((g) => g?.name).join(", ")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedSupplements.map((supp) => (
                <button
                  key={supp.id}
                  type="button"
                  onClick={() => handleAddSuggestion(supp)}
                  className="border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10 flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-xs transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>{supp.name}</span>
                  <span className="text-muted-foreground">
                    {supp.recommended.dosage}
                    {supp.recommended.unit}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected supplements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              Supplements in stack
            </span>
            {selected.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {selected.length}
              </Badge>
            )}
          </div>
          {selected.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm">
              No supplements added yet
            </div>
          ) : (
            <div className="space-y-1.5">
              {selected.map((supp) => (
                <div
                  key={supp.id}
                  className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium">{supp.name}</span>
                    <span className="text-muted-foreground ml-2 font-mono text-xs">
                      {supp.dosage}
                      {supp.unit}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(supp.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-border/40 flex shrink-0 gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1" />
        <Button
          onClick={onNext}
          disabled={selected.length === 0 || !stackName.trim()}
          size="sm"
        >
          Continue
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
