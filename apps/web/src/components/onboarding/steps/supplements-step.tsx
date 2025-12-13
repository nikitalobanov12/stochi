"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, Search, Plus, X, Sparkles } from "lucide-react";
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
import { getGoalByKey } from "~/server/data/goal-recommendations";
import { fuzzySearchSupplements } from "~/server/data/supplement-aliases";

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

type SupplementsStepProps = {
  supplements: Supplement[];
  selectedGoal: string | null;
  selected: SelectedSupplement[];
  onChange: (supplements: SelectedSupplement[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export function SupplementsStep({
  supplements,
  selectedGoal,
  selected,
  onChange,
  onNext,
  onBack,
}: SupplementsStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingDosage, setPendingDosage] = useState("");
  const [pendingUnit, setPendingUnit] = useState<"mg" | "mcg" | "g" | "IU" | "ml">("mg");
  const [pendingSupplement, setPendingSupplement] = useState<Supplement | null>(null);

  // Get goal-based suggestions
  const goalRecommendations = selectedGoal ? getGoalByKey(selectedGoal) : null;

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
    return fuzzySearchSupplements(availableSupplements, searchQuery).slice(0, 6);
  }, [availableSupplements, searchQuery]);

  // Goal-based suggestions (not yet added)
  const suggestedSupplements = useMemo(() => {
    if (!goalRecommendations) return [];
    return goalRecommendations.supplements
      .filter((rec) => !selected.some((sel) => sel.name === rec.name))
      .map((rec) => {
        const supp = supplements.find((s) => s.name === rec.name);
        return supp ? { ...supp, recommended: rec } : null;
      })
      .filter(Boolean) as Array<Supplement & { recommended: { dosage: number; unit: string; reason: string } }>;
  }, [goalRecommendations, selected, supplements]);

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

    onChange([...selected, newSupplement]);

    // Reset form
    setPendingSupplement(null);
    setSearchQuery("");
    setPendingDosage("");
    setPendingUnit("mg");
  }

  function handleAddSuggestion(
    supplement: Supplement & { recommended: { dosage: number; unit: string } },
  ) {
    const newSupplement: SelectedSupplement = {
      id: supplement.id,
      name: supplement.name,
      form: supplement.form,
      dosage: supplement.recommended.dosage,
      unit: supplement.recommended.unit as "mg" | "mcg" | "g" | "IU" | "ml",
    };
    onChange([...selected, newSupplement]);
  }

  function handleRemove(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="space-y-1">
          <h2 className="font-mono text-xl font-bold">Add your supplements</h2>
          <p className="text-sm text-muted-foreground">
            What supplements are you currently taking?
          </p>
        </div>

        {/* Search and add form */}
        <div className="space-y-2 rounded-lg border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                <div className="max-h-[150px] overflow-y-auto py-1">
                  {searchResults.map((supplement) => (
                    <button
                      key={supplement.id}
                      type="button"
                      onClick={() => handleSelectSupplement(supplement)}
                      className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <div>
                        <div className="font-medium">{supplement.name}</div>
                        {supplement.form && (
                          <div className="text-xs text-muted-foreground">
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
          )}
        </div>

        {/* Goal-based suggestions */}
        {suggestedSupplements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>Suggested for {goalRecommendations?.name}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedSupplements.map((supp) => (
                <button
                  key={supp.id}
                  type="button"
                  onClick={() => handleAddSuggestion(supp)}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-primary/5 px-3 py-1.5 text-xs transition-colors hover:border-primary hover:bg-primary/10"
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
            <span className="text-xs text-muted-foreground">
              Your supplements
            </span>
            {selected.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {selected.length}
              </Badge>
            )}
          </div>
          {selected.length === 0 ? (
            <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              No supplements added yet
            </div>
          ) : (
            <div className="space-y-1.5">
              {selected.map((supp) => (
                <div
                  key={supp.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium">{supp.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
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

      <div className="flex gap-2 pt-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1" />
        <Button onClick={onNext} disabled={selected.length === 0} size="sm">
          Continue
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
