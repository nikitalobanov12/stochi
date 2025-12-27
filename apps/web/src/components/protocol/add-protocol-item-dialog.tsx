"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
import { fuzzySearchSupplements } from "~/server/data/supplement-aliases";
import { addProtocolItem } from "~/server/actions/protocol";
import { cn } from "~/lib/utils";
import {
  type timeSlotEnum,
  type frequencyEnum,
  type dosageUnitEnum,
} from "~/server/db/schema";

type TimeSlot = (typeof timeSlotEnum.enumValues)[number];
type Frequency = (typeof frequencyEnum.enumValues)[number];
type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: DosageUnit | null;
  optimalTimeOfDay: string | null;
  isResearchChemical: boolean | null;
  route: string | null;
  suggestedFrequency: Frequency | null;
  frequencyNotes: string | null;
};

type AddProtocolItemDialogProps = {
  _protocolId: string; // Reserved for future use
  timeSlot: TimeSlot;
  supplements: Supplement[];
  existingSupplementIds: Set<string>;
  children?: React.ReactNode;
};

const DAYS_OF_WEEK = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

export function AddProtocolItemDialog({
  _protocolId,
  timeSlot,
  supplements,
  existingSupplementIds,
  children,
}: AddProtocolItemDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(
    null
  );

  // Form state
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState<DosageUnit>("mg");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([
    "monday",
    "wednesday",
    "friday",
  ]);
  const [groupName, setGroupName] = useState("");

  // Filter available supplements
  const availableSupplements = useMemo(() => {
    return supplements.filter((s) => !existingSupplementIds.has(s.id));
  }, [supplements, existingSupplementIds]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableSupplements.slice(0, 8);
    }
    return fuzzySearchSupplements(availableSupplements, searchQuery).slice(0, 8);
  }, [availableSupplements, searchQuery]);

  function handleSelectSupplement(supplement: Supplement) {
    setSelectedSupplement(supplement);
    setSearchQuery("");
    // Pre-fill defaults
    setUnit((supplement.defaultUnit as DosageUnit) ?? "mg");
    if (supplement.suggestedFrequency) {
      setFrequency(supplement.suggestedFrequency);
    }
  }

  function handleSubmit() {
    if (!selectedSupplement) return;

    const dosageNum = parseFloat(dosage);
    if (!dosage || isNaN(dosageNum) || dosageNum <= 0) {
      toast.error("Please enter a valid dosage");
      return;
    }

    if (frequency === "specific_days" && daysOfWeek.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    startTransition(async () => {
      try {
        await addProtocolItem({
          supplementId: selectedSupplement.id,
          dosage: dosageNum,
          unit,
          timeSlot,
          frequency,
          daysOfWeek: frequency === "specific_days" ? daysOfWeek : undefined,
          groupName: groupName.trim() || null,
        });
        toast.success(`Added ${selectedSupplement.name} to protocol`);
        setOpen(false);
        resetForm();
        router.refresh();
      } catch (error) {
        console.error("Failed to add item:", error);
        toast.error("Failed to add supplement");
      }
    });
  }

  function resetForm() {
    setSearchQuery("");
    setSelectedSupplement(null);
    setDosage("");
    setUnit("mg");
    setFrequency("daily");
    setDaysOfWeek(["monday", "wednesday", "friday"]);
    setGroupName("");
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  }

  function toggleDay(day: string) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Add Supplement</DialogTitle>
          <DialogDescription>
            Add a supplement to your {timeSlot} routine
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Select supplement */}
          {!selectedSupplement ? (
            <>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Search supplements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 font-mono"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div className="max-h-[300px] space-y-1 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((supplement) => (
                    <button
                      key={supplement.id}
                      type="button"
                      onClick={() => handleSelectSupplement(supplement)}
                      className="hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-sm font-medium">
                          {supplement.name}
                        </div>
                        {supplement.form && (
                          <div className="text-muted-foreground truncate text-xs">
                            {supplement.form}
                          </div>
                        )}
                      </div>
                      {supplement.optimalTimeOfDay &&
                        supplement.optimalTimeOfDay !== timeSlot &&
                        supplement.optimalTimeOfDay !== "any" &&
                        supplement.optimalTimeOfDay !== "with_meals" && (
                          <span className="text-muted-foreground text-xs">
                            Best: {supplement.optimalTimeOfDay}
                          </span>
                        )}
                    </button>
                  ))
                ) : searchQuery ? (
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    No supplements found
                  </div>
                ) : (
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    Start typing to search
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Step 2: Configure supplement */
            <>
              {/* Selected supplement header */}
              <div className="bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2">
                <div>
                  <div className="font-mono text-sm font-medium">
                    {selectedSupplement.name}
                  </div>
                  {selectedSupplement.form && (
                    <div className="text-muted-foreground text-xs">
                      {selectedSupplement.form}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSupplement(null)}
                  className="text-xs"
                >
                  Change
                </Button>
              </div>

              {/* Timing warning */}
              {selectedSupplement.optimalTimeOfDay &&
                selectedSupplement.optimalTimeOfDay !== timeSlot &&
                selectedSupplement.optimalTimeOfDay !== "any" &&
                selectedSupplement.optimalTimeOfDay !== "with_meals" && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      This supplement is typically best taken in the{" "}
                      {selectedSupplement.optimalTimeOfDay}
                    </span>
                  </div>
                )}

              {/* Frequency notes */}
              {selectedSupplement.frequencyNotes && (
                <div className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">
                  {selectedSupplement.frequencyNotes}
                </div>
              )}

              {/* Dosage */}
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="dosage" className="text-xs">
                    Dosage
                  </Label>
                  <Input
                    id="dosage"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="font-mono"
                    autoFocus
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label className="text-xs">Unit</Label>
                  <Select
                    value={unit}
                    onValueChange={(v) => setUnit(v as DosageUnit)}
                  >
                    <SelectTrigger className="font-mono">
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

              {/* Frequency */}
              <div className="space-y-2">
                <Label className="text-xs">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as Frequency)}
                >
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="specific_days">Specific Days</SelectItem>
                    <SelectItem value="as_needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Days of week (when specific_days) */}
              {frequency === "specific_days" && (
                <div className="space-y-2">
                  <Label className="text-xs">Days</Label>
                  <div className="flex flex-wrap gap-1">
                    {DAYS_OF_WEEK.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDay(key)}
                        className={cn(
                          "rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors",
                          daysOfWeek.includes(key)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Group name (optional) */}
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-xs">
                  Group (optional)
                </Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Morning Stack, Pre-Workout"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="font-mono"
                />
                <p className="text-muted-foreground text-xs">
                  Group related supplements together
                </p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isPending || !dosage}
                className="w-full font-mono"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add to Protocol
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
