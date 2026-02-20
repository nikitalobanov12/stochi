"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  updateProtocolItem,
  removeProtocolItem,
} from "~/server/actions/protocol";
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

type ProtocolItem = {
  id: string;
  supplementId: string;
  dosage: number;
  unit: DosageUnit;
  timeSlot: TimeSlot;
  frequency: Frequency;
  daysOfWeek: string[] | null;
  groupName: string | null;
  sortOrder: number;
  supplement: {
    id: string;
    name: string;
    form: string | null;
    optimalTimeOfDay: string | null;
  };
};

type EditProtocolItemDialogProps = {
  item: ProtocolItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplements: Supplement[];
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

const TIME_SLOTS: { slot: TimeSlot; label: string }[] = [
  { slot: "morning", label: "Morning" },
  { slot: "afternoon", label: "Afternoon" },
  { slot: "evening", label: "Evening" },
  { slot: "bedtime", label: "Bedtime" },
];

export function EditProtocolItemDialog({
  item,
  open,
  onOpenChange,
  supplements,
}: EditProtocolItemDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state - initialized from item
  const [dosage, setDosage] = useState(item.dosage.toString());
  const [unit, setUnit] = useState<DosageUnit>(item.unit);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(item.timeSlot);
  const [frequency, setFrequency] = useState<Frequency>(item.frequency);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(item.daysOfWeek ?? []);
  const [groupName, setGroupName] = useState(item.groupName ?? "");

  // Get the full supplement data
  const supplementData = supplements.find((s) => s.id === item.supplementId);

  function handleSubmit() {
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
        await updateProtocolItem(item.id, {
          dosage: dosageNum,
          unit,
          timeSlot,
          frequency,
          daysOfWeek: frequency === "specific_days" ? daysOfWeek : undefined,
          groupName: groupName.trim() || null,
        });
        toast.success("Updated successfully");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to update item:", error);
        toast.error("Failed to update");
      }
    });
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await removeProtocolItem(item.id);
      toast.success("Removed from protocol");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error("Failed to remove");
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleDay(day: string) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  // Reset form when dialog opens with new item
  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      setDosage(item.dosage.toString());
      setUnit(item.unit);
      setTimeSlot(item.timeSlot);
      setFrequency(item.frequency);
      setDaysOfWeek(item.daysOfWeek ?? []);
      setGroupName(item.groupName ?? "");
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Supplement</DialogTitle>
          <DialogDescription>
            Update {item.supplement.name} in your protocol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Supplement info */}
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <div className="font-mono text-sm font-medium">
              {item.supplement.name}
            </div>
            {item.supplement.form && (
              <div className="text-muted-foreground text-xs">
                {item.supplement.form}
              </div>
            )}
          </div>

          {/* Timing warning */}
          {item.supplement.optimalTimeOfDay &&
            item.supplement.optimalTimeOfDay !== timeSlot &&
            item.supplement.optimalTimeOfDay !== "any" &&
            item.supplement.optimalTimeOfDay !== "with_meals" && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  This supplement is typically best taken in the{" "}
                  {item.supplement.optimalTimeOfDay}
                </span>
              </div>
            )}

          {/* Frequency notes */}
          {supplementData?.frequencyNotes && (
            <div className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">
              {supplementData.frequencyNotes}
            </div>
          )}

          {/* Dosage */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="edit-dosage" className="text-xs">
                Dosage
              </Label>
              <Input
                id="edit-dosage"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="font-mono"
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

          {/* Time Slot */}
          <div className="space-y-2">
            <Label className="text-xs">Time</Label>
            <Select
              value={timeSlot}
              onValueChange={(v) => setTimeSlot(v as TimeSlot)}
            >
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map(({ slot, label }) => (
                  <SelectItem key={slot} value={slot}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group name */}
          <div className="space-y-2">
            <Label htmlFor="edit-groupName" className="text-xs">
              Group (optional)
            </Label>
            <Input
              id="edit-groupName"
              placeholder="e.g., Morning Stack, Pre-Workout"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || isPending}
            className="font-mono"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Remove
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || isDeleting || !dosage}
            className="font-mono"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
