"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  Check,
  AlertTriangle,
} from "lucide-react";

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
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
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

type PendingItem = {
  supplementId: string;
  supplementName: string;
  supplementForm: string | null;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
  supplement: Supplement;
};

type AddSupplementsDialogProps = {
  stackId: string;
  supplements: Supplement[];
  children?: React.ReactNode;
};

export function AddSupplementsDialog({
  stackId,
  supplements,
  children,
}: AddSupplementsDialogProps) {
  const { addItemsOptimistic, isPending, items: existingItems } = useStackItemsContext();
  const [open, setOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplement, setSelectedSupplement] =
    useState<Supplement | null>(null);
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState<"mg" | "mcg" | "g" | "IU" | "ml">("mg");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter out supplements already in stack or pending list
  const availableSupplements = useMemo(() => {
    const existingIds = new Set(existingItems.map((item) => item.supplementId));
    const pendingIds = new Set(pendingItems.map((item) => item.supplementId));
    return supplements.filter(
      (s) => !existingIds.has(s.id) && !pendingIds.has(s.id),
    );
  }, [supplements, existingItems, pendingItems]);

  // Fuzzy search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableSupplements.slice(0, 8); // Show first 8 when no query
    }
    return fuzzySearchSupplements(availableSupplements, searchQuery).slice(
      0,
      8,
    );
  }, [availableSupplements, searchQuery]);

  function handleSelectSupplement(supplement: Supplement) {
    setSelectedSupplement(supplement);
    setSearchQuery(supplement.name);
    const defaultUnit = supplement.defaultUnit as "mg" | "mcg" | "g" | "IU" | "ml" | null;
    setUnit(defaultUnit ?? "mg");
    setShowDropdown(false);
  }

  function handleAddToList() {
    if (!selectedSupplement || !dosage || isNaN(parseFloat(dosage))) {
      return;
    }

    // Check if already in list
    if (
      pendingItems.some((item) => item.supplementId === selectedSupplement.id)
    ) {
      return;
    }

    setPendingItems((prev) => [
      ...prev,
      {
        supplementId: selectedSupplement.id,
        supplementName: selectedSupplement.name,
        supplementForm: selectedSupplement.form,
        dosage: parseFloat(dosage),
        unit,
        supplement: selectedSupplement,
      },
    ]);

    // Reset form
    setSelectedSupplement(null);
    setSearchQuery("");
    setDosage("");
    setUnit("mg");
  }

  function handleRemoveFromList(supplementId: string) {
    setPendingItems((prev) =>
      prev.filter((item) => item.supplementId !== supplementId),
    );
  }

  function handleSubmitAll() {
    if (pendingItems.length === 0) return;

    // Use optimistic update via context
    addItemsOptimistic(
      stackId,
      pendingItems.map((item) => ({
        supplementId: item.supplementId,
        dosage: item.dosage,
        unit: item.unit,
        supplement: {
          id: item.supplement.id,
          name: item.supplement.name,
          form: item.supplement.form,
          isResearchChemical: item.supplement.isResearchChemical,
          route: item.supplement.route,
        },
      })),
    );

    setPendingItems([]);
    setOpen(false);
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && pendingItems.length > 0) {
      // User trying to close with pending items - show confirmation
      setShowDiscardConfirm(true);
      return;
    }
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setPendingItems([]);
      setSelectedSupplement(null);
      setSearchQuery("");
      setDosage("");
      setUnit("mg");
      setShowDropdown(false);
      setShowDiscardConfirm(false);
    }
  }

  function handleConfirmDiscard() {
    setShowDiscardConfirm(false);
    setPendingItems([]);
    setSelectedSupplement(null);
    setSearchQuery("");
    setDosage("");
    setUnit("mg");
    setShowDropdown(false);
    setOpen(false);
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setSelectedSupplement(null);
    setShowDropdown(true);
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
      <DialogContent
        className="max-w-lg"
        onEscapeKeyDown={(e) => {
          // Always close dropdown first
          if (showDropdown) {
            e.preventDefault();
            setShowDropdown(false);
            return;
          }
          if (pendingItems.length > 0) {
            e.preventDefault();
            setShowDiscardConfirm(true);
          }
        }}
        onPointerDownOutside={(e) => {
          if (pendingItems.length > 0) {
            e.preventDefault();
            setShowDiscardConfirm(true);
          }
        }}
      >
        {/* Discard confirmation overlay */}
        {showDiscardConfirm && (
          <div className="bg-background/95 absolute inset-0 z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-yellow-500" />
              <div>
                <p className="font-medium">Discard unsaved changes?</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  You have {pendingItems.length} supplement
                  {pendingItems.length !== 1 ? "s" : ""} not yet added to the
                  stack.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Keep Editing
                </Button>
                <Button variant="destructive" onClick={handleConfirmDiscard}>
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="font-mono">Add Supplements</DialogTitle>
          <DialogDescription>
            Search by name or alias (e.g., &quot;k2&quot;, &quot;omega 3&quot;,
            &quot;mag&quot;)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add to list form */}
          <div className="space-y-3 rounded-md border p-3">
            {/* Searchable supplement input */}
            <div className="space-y-2">
              <Label htmlFor="supplement-search" className="text-xs">
                Supplement
              </Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  id="supplement-search"
                  placeholder="Search supplements..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={(e) => {
                    // Delay closing to allow clicking on dropdown items
                    const relatedTarget = e.relatedTarget as HTMLElement | null;
                    if (relatedTarget?.closest("[data-dropdown-item]")) {
                      return;
                    }
                    setTimeout(() => setShowDropdown(false), 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && showDropdown) {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDropdown(false);
                    }
                  }}
                  className="pl-9 font-mono"
                  autoComplete="off"
                />
                {/* Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="bg-popover absolute z-50 mt-1 w-full rounded-md border shadow-lg">
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {searchResults.map((supplement) => (
                        <button
                          key={supplement.id}
                          type="button"
                          data-dropdown-item
                          onClick={() => handleSelectSupplement(supplement)}
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                            "hover:bg-accent",
                            selectedSupplement?.id === supplement.id &&
                              "bg-primary/10 text-primary",
                          )}
                        >
                          <div>
                            <div className="font-medium">{supplement.name}</div>
                            {supplement.form && (
                              <div
                                className={cn(
                                  "text-muted-foreground text-xs",
                                  selectedSupplement?.id === supplement.id &&
                                    "text-primary/70",
                                )}
                              >
                                {supplement.form}
                              </div>
                            )}
                          </div>
                          {selectedSupplement?.id === supplement.id && (
                            <Check className="text-primary h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {showDropdown && searchQuery && searchResults.length === 0 && (
                  <div className="bg-popover text-muted-foreground absolute z-50 mt-1 w-full rounded-md border p-3 text-center text-sm shadow-lg">
                    No supplements found
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dosage" className="text-xs">
                  Dosage
                </Label>
                <Input
                  id="dosage"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="200"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  onFocus={() => setShowDropdown(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddToList();
                      document.getElementById("supplement-search")?.focus();
                    }
                  }}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-xs">
                  Unit
                </Label>
                <Select
                  value={unit}
                  onValueChange={(v) => setUnit(v as typeof unit)}
                >
                  <SelectTrigger onFocus={() => setShowDropdown(false)}>
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
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleAddToList}
              disabled={!selectedSupplement || !dosage}
            >
              <Plus className="mr-2 h-3 w-3" />
              Add to List
            </Button>
          </div>

          {/* Pending items list */}
          {pendingItems.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs">
                  Supplements to Add
                </Label>
                <Badge variant="secondary" className="font-mono">
                  {pendingItems.length}
                </Badge>
              </div>
              <div className="max-h-[200px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Supplement</TableHead>
                      <TableHead className="text-xs">Dosage</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingItems.map((item) => (
                      <TableRow key={item.supplementId}>
                        <TableCell className="py-2">
                          <div className="text-sm font-medium">
                            {item.supplementName}
                          </div>
                          {item.supplementForm && (
                            <div className="text-muted-foreground text-xs">
                              {item.supplementForm}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-2 font-mono text-sm">
                          {item.dosage}
                          {item.unit}
                        </TableCell>
                        <TableCell className="py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-7 w-7"
                            onClick={() =>
                              handleRemoveFromList(item.supplementId)
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground rounded-md border border-dashed py-6 text-center text-sm">
              No supplements added yet
            </div>
          )}

          {/* Submit button */}
          <Button
            type="button"
            className="w-full"
            onClick={handleSubmitAll}
            disabled={pendingItems.length === 0 || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                Add {pendingItems.length} Supplement
                {pendingItems.length !== 1 ? "s" : ""} to Stack
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
