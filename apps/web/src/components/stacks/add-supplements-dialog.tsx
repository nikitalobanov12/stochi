"use client";

import { useState, useMemo } from "react";
import { Plus, Loader2, Search } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { fuzzySearchSupplements } from "~/server/data/supplement-aliases";
import { cn } from "~/lib/utils";
import { useStackItemsContext } from "~/components/stacks/stack-items-context";

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: string | null;
  isResearchChemical?: boolean | null;
  route?: string | null;
};

type AddSupplementsDialogProps = {
  stackId: string;
  supplements: Supplement[];
  children?: React.ReactNode;
};

type DosageUnit = "mg" | "mcg" | "g" | "IU" | "ml";

// Track dosage/unit state for each supplement in search results
type SupplementDosageState = {
  dosage: string;
  unit: DosageUnit;
  isAdding: boolean;
};

export function AddSupplementsDialog({
  stackId,
  supplements,
  children,
}: AddSupplementsDialogProps) {
  const {
    addItemsOptimistic,
    isPending,
    items: existingItems,
  } = useStackItemsContext();
  const [open, setOpen] = useState(false);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");

  // Track dosage state per supplement (keyed by supplement id)
  const [dosageStates, setDosageStates] = useState<
    Record<string, SupplementDosageState>
  >({});

  // Filter out supplements already in stack
  const availableSupplements = useMemo(() => {
    const existingIds = new Set(existingItems.map((item) => item.supplementId));
    return supplements.filter((s) => !existingIds.has(s.id));
  }, [supplements, existingItems]);

  // Fuzzy search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableSupplements.slice(0, 8);
    }
    return fuzzySearchSupplements(availableSupplements, searchQuery).slice(
      0,
      8,
    );
  }, [availableSupplements, searchQuery]);

  // Get or initialize dosage state for a supplement
  function getDosageState(supplement: Supplement): SupplementDosageState {
    const existing = dosageStates[supplement.id];
    if (existing) {
      return existing;
    }
    return {
      dosage: "",
      unit: (supplement.defaultUnit as DosageUnit) ?? "mg",
      isAdding: false,
    };
  }

  function updateDosageState(
    supplementId: string,
    updates: Partial<SupplementDosageState>,
  ) {
    setDosageStates((prev) => ({
      ...prev,
      [supplementId]: {
        ...getDosageStateById(supplementId, prev),
        ...updates,
      },
    }));
  }

  // Helper to get state with fallback (for use inside setState callback)
  function getDosageStateById(
    supplementId: string,
    states: Record<string, SupplementDosageState>,
  ): SupplementDosageState {
    const supplement = supplements.find((s) => s.id === supplementId);
    if (states[supplementId]) {
      return states[supplementId];
    }
    return {
      dosage: "",
      unit: (supplement?.defaultUnit as DosageUnit) ?? "mg",
      isAdding: false,
    };
  }

  function handleQuickAdd(supplement: Supplement) {
    const state = getDosageState(supplement);
    const dosageNum = parseFloat(state.dosage);

    if (!state.dosage || isNaN(dosageNum) || dosageNum <= 0) {
      // Focus the dosage input for this supplement
      document.getElementById(`dosage-${supplement.id}`)?.focus();
      return;
    }

    // Mark as adding
    updateDosageState(supplement.id, { isAdding: true });

    // Add to stack via optimistic update
    addItemsOptimistic(stackId, [
      {
        supplementId: supplement.id,
        dosage: dosageNum,
        unit: state.unit,
        supplement: {
          id: supplement.id,
          name: supplement.name,
          form: supplement.form,
          isResearchChemical: supplement.isResearchChemical,
          route: supplement.route,
        },
      },
    ]);

    // Clear state for this supplement (it will be filtered out anyway)
    setDosageStates((prev) => {
      const newState = { ...prev };
      delete newState[supplement.id];
      return newState;
    });
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setSearchQuery("");
      setDosageStates({});
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, supplement: Supplement) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickAdd(supplement);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplements
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">Add Supplements</DialogTitle>
          <DialogDescription>
            Search and add supplements with inline dosage entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              id="supplement-search"
              placeholder="Search supplements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-mono"
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Results with inline dosage inputs */}
          <div className="space-y-2">
            {searchResults.length > 0 ? (
              <div className="max-h-[400px] space-y-2 overflow-y-auto">
                {searchResults.map((supplement) => {
                  const state = getDosageState(supplement);
                  const isThisAdding = state.isAdding || isPending;

                  return (
                    <div
                      key={supplement.id}
                      className="bg-card flex items-center gap-2 rounded-lg border p-3"
                    >
                      {/* Supplement info */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {supplement.name}
                        </div>
                        {supplement.form && (
                          <div className="text-muted-foreground truncate text-xs">
                            {supplement.form}
                          </div>
                        )}
                      </div>

                      {/* Inline dosage input */}
                      <div className="flex items-center gap-1.5">
                        <Input
                          id={`dosage-${supplement.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          value={state.dosage}
                          onChange={(e) =>
                            updateDosageState(supplement.id, {
                              dosage: e.target.value,
                            })
                          }
                          onKeyDown={(e) => handleKeyDown(e, supplement)}
                          className="h-8 w-20 font-mono text-sm"
                          disabled={isThisAdding}
                        />
                        <Select
                          value={state.unit}
                          onValueChange={(v) =>
                            updateDosageState(supplement.id, {
                              unit: v as DosageUnit,
                            })
                          }
                          disabled={isThisAdding}
                        >
                          <SelectTrigger className="h-8 w-[70px] font-mono text-sm">
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
                          type="button"
                          size="sm"
                          className={cn(
                            "h-8 gap-1 px-2.5 font-mono text-xs",
                            state.dosage && "bg-primary",
                          )}
                          variant={state.dosage ? "default" : "secondary"}
                          onClick={() => handleQuickAdd(supplement)}
                          disabled={isThisAdding || !state.dosage}
                        >
                          {isThisAdding ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="text-muted-foreground rounded-md border border-dashed py-8 text-center text-sm">
                No supplements found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="text-muted-foreground rounded-md border border-dashed py-8 text-center text-sm">
                Start typing to search supplements
              </div>
            )}
          </div>

          {/* Help text */}
          <p className="text-muted-foreground text-center text-xs">
            Enter dosage and press Enter or click Add
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
