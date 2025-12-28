"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { addStackToProtocol } from "~/server/actions/protocol";
import { type timeSlotEnum, type dosageUnitEnum } from "~/server/db/schema";

type TimeSlot = (typeof timeSlotEnum.enumValues)[number];
type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];

type StackItem = {
  id: string;
  dosage: number;
  unit: DosageUnit;
  supplement: {
    id: string;
    name: string;
  };
};

type Stack = {
  id: string;
  name: string;
  items: StackItem[];
};

type ImportStackDialogProps = {
  timeSlot: TimeSlot;
  stacks: Stack[];
  existingSupplementIds: Set<string>;
  children: React.ReactNode;
};

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  bedtime: "Bedtime",
};

export function ImportStackDialog({
  timeSlot,
  stacks,
  existingSupplementIds,
  children,
}: ImportStackDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [importingStackId, setImportingStackId] = useState<string | null>(null);

  async function handleImportStack(stackId: string) {
    setImportingStackId(stackId);
    try {
      const result = await addStackToProtocol(stackId, timeSlot);

      if (result.added === 0) {
        toast.info("All supplements from this stack are already in your protocol");
      } else {
        const skippedMsg =
          result.skipped > 0 ? ` (${result.skipped} already in protocol)` : "";
        toast.success(
          `Added ${result.added} supplement${result.added !== 1 ? "s" : ""} to ${TIME_SLOT_LABELS[timeSlot]}${skippedMsg}`,
        );
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to import stack:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import stack",
      );
    } finally {
      setImportingStackId(null);
    }
  }

  // Filter out empty stacks
  const nonEmptyStacks = stacks.filter((s) => s.items.length > 0);

  // For each stack, count how many items would be added vs skipped
  const stacksWithCounts = nonEmptyStacks.map((stack) => {
    const newItems = stack.items.filter(
      (item) => !existingSupplementIds.has(item.supplement.id),
    );
    return {
      ...stack,
      newCount: newItems.length,
      skippedCount: stack.items.length - newItems.length,
    };
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">
            Import Stack to {TIME_SLOT_LABELS[timeSlot]}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Add all supplements from a stack to this time slot
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {stacksWithCounts.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="text-muted-foreground/50 mx-auto mb-3 h-8 w-8" />
              <p className="text-muted-foreground font-mono text-sm">
                No stacks available
              </p>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                Create a stack first to import it here
              </p>
            </div>
          ) : (
            stacksWithCounts.map((stack) => {
              const isImporting = importingStackId === stack.id;
              const hasNewItems = stack.newCount > 0;

              return (
                <button
                  key={stack.id}
                  type="button"
                  onClick={() => handleImportStack(stack.id)}
                  disabled={importingStackId !== null || !hasNewItems}
                  className="glass-card hover:bg-accent/50 flex w-full items-center gap-3 p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    {isImporting ? (
                      <Loader2 className="text-primary h-4 w-4 animate-spin" />
                    ) : (
                      <Layers className="text-primary h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-sm font-medium">
                        {stack.name}
                      </span>
                      <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                        {stack.items.length}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {stack.items
                        .slice(0, 3)
                        .map((i) => i.supplement.name)
                        .join(", ")}
                      {stack.items.length > 3 && ` +${stack.items.length - 3} more`}
                    </p>
                    {stack.skippedCount > 0 && (
                      <p className="text-muted-foreground/70 mt-0.5 font-mono text-xs">
                        {stack.newCount > 0
                          ? `${stack.newCount} new, ${stack.skippedCount} already added`
                          : "All already in protocol"}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
