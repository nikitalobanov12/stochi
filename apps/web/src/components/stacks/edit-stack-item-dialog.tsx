"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { updateStackItem } from "~/server/actions/stacks";

type EditStackItemDialogProps = {
  itemId: string;
  supplementName: string;
  currentDosage: number;
  currentUnit: "mg" | "mcg" | "g" | "IU" | "ml";
};

export function EditStackItemDialog({
  itemId,
  supplementName,
  currentDosage,
  currentUnit,
}: EditStackItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [dosage, setDosage] = useState(currentDosage.toString());
  const [unit, setUnit] = useState<"mg" | "mcg" | "g" | "IU" | "ml">(currentUnit);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dosageNum = parseFloat(dosage);
    if (!dosageNum || dosageNum <= 0) return;

    startTransition(async () => {
      await updateStackItem(itemId, dosageNum, unit);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-1 text-muted-foreground/50 opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            Edit {supplementName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="dosage" className="sr-only">
                Dosage
              </label>
              <Input
                id="dosage"
                type="number"
                step="any"
                min="0"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Dosage"
                className="font-mono"
                autoFocus
              />
            </div>
            <Select value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
              <SelectTrigger className="w-24">
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !dosage || parseFloat(dosage) <= 0}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
