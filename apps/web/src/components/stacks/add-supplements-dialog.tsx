"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";

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

type Supplement = {
  id: string;
  name: string;
  form: string | null;
};

type PendingItem = {
  supplementId: string;
  supplementName: string;
  supplementForm: string | null;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
};

type AddSupplementsDialogProps = {
  stackId: string;
  supplements: Supplement[];
  addStackItems: (
    stackId: string,
    items: Array<{ supplementId: string; dosage: number; unit: string }>
  ) => Promise<void>;
  children?: React.ReactNode;
};

export function AddSupplementsDialog({
  stackId,
  supplements,
  addStackItems,
  children,
}: AddSupplementsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  // Form state
  const [selectedSupplementId, setSelectedSupplementId] = useState<string>("");
  const [dosage, setDosage] = useState<string>("");
  const [unit, setUnit] = useState<"mg" | "mcg" | "g" | "IU" | "ml">("mg");

  function handleAddToList() {
    if (!selectedSupplementId || !dosage || isNaN(parseFloat(dosage))) {
      return;
    }

    const supplement = supplements.find((s) => s.id === selectedSupplementId);
    if (!supplement) return;

    // Check if already in list
    if (pendingItems.some((item) => item.supplementId === selectedSupplementId)) {
      return;
    }

    setPendingItems((prev) => [
      ...prev,
      {
        supplementId: selectedSupplementId,
        supplementName: supplement.name,
        supplementForm: supplement.form,
        dosage: parseFloat(dosage),
        unit,
      },
    ]);

    // Reset form
    setSelectedSupplementId("");
    setDosage("");
    setUnit("mg");
  }

  function handleRemoveFromList(supplementId: string) {
    setPendingItems((prev) =>
      prev.filter((item) => item.supplementId !== supplementId)
    );
  }

  function handleSubmitAll() {
    if (pendingItems.length === 0) return;

    startTransition(async () => {
      await addStackItems(
        stackId,
        pendingItems.map((item) => ({
          supplementId: item.supplementId,
          dosage: item.dosage,
          unit: item.unit,
        }))
      );
      setPendingItems([]);
      setOpen(false);
      router.refresh();
    });
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setPendingItems([]);
      setSelectedSupplementId("");
      setDosage("");
      setUnit("mg");
    }
  }

  // Filter out supplements already in pending list
  const availableSupplements = supplements.filter(
    (s) => !pendingItems.some((item) => item.supplementId === s.id)
  );

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
            Build your list then add all at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add to list form */}
          <div className="space-y-3 rounded-md border p-3">
            <div className="space-y-2">
              <Label htmlFor="supplement" className="text-xs">
                Supplement
              </Label>
              <Select
                value={selectedSupplementId}
                onValueChange={setSelectedSupplementId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplement" />
                </SelectTrigger>
                <SelectContent>
                  {availableSupplements.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.form && (
                        <span className="ml-2 text-muted-foreground">
                          ({s.form})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-xs">
                  Unit
                </Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
                  <SelectTrigger>
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
              disabled={!selectedSupplementId || !dosage}
            >
              <Plus className="mr-2 h-3 w-3" />
              Add to List
            </Button>
          </div>

          {/* Pending items list */}
          {pendingItems.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
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
                            <div className="text-xs text-muted-foreground">
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
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFromList(item.supplementId)}
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
            <div className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
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
