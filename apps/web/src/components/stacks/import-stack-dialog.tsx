"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
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
import { cn } from "~/lib/utils";
import {
  parseStackImport,
  createStackFromImport,
  type ParseResult,
  type MatchedItem,
  type UnmatchedItem,
} from "~/server/actions/import-stack";

type ImportStackDialogProps = {
  children?: React.ReactNode;
};

type Step = "input" | "review" | "success";

const EXAMPLE_TEXT = `Vitamin D3 5000IU
Magnesium Glycinate 400mg
Omega-3 Fish Oil 2000mg
Vitamin K2 100mcg
Zinc 30mg`;

export function ImportStackDialog({ children }: ImportStackDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [isParsing, startParsing] = useTransition();
  const [isCreating, startCreating] = useTransition();

  // Input step state
  const [rawText, setRawText] = useState("");

  // Review step state
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [stackName, setStackName] = useState("Imported Stack");
  const [editingItems, setEditingItems] = useState<MatchedItem[]>([]);
  const [resolvedUnmatched, setResolvedUnmatched] = useState<
    Map<
      string,
      { supplementId: string; name: string; dosage: number; unit: string }
    >
  >(new Map());

  // Success step state
  const [createdStackId, setCreatedStackId] = useState<string | null>(null);

  function handleParse() {
    startParsing(async () => {
      const result = await parseStackImport(rawText);
      setParseResult(result);
      setEditingItems(result.matched);
      setStep("review");
    });
  }

  function handleResolveUnmatched(
    item: UnmatchedItem,
    supplementId: string,
    supplementName: string,
  ) {
    setResolvedUnmatched((prev) => {
      const next = new Map(prev);
      next.set(item.rawText, {
        supplementId,
        name: supplementName,
        dosage: item.dosage ?? 100,
        unit: item.unit ?? "mg",
      });
      return next;
    });
  }

  function handleRemoveMatched(index: number) {
    setEditingItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateDosage(index: number, dosage: number) {
    setEditingItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, resolvedDosage: dosage } : item,
      ),
    );
  }

  function handleUpdateUnit(
    index: number,
    unit: "mg" | "mcg" | "g" | "IU" | "ml",
  ) {
    setEditingItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, resolvedUnit: unit } : item,
      ),
    );
  }

  function handleCreate() {
    // Combine matched items and resolved unmatched items
    const allItems = [
      ...editingItems.map((item) => ({
        supplementId: item.supplementId,
        dosage: item.resolvedDosage,
        unit: item.resolvedUnit,
      })),
      ...Array.from(resolvedUnmatched.values()).map((item) => ({
        supplementId: item.supplementId,
        dosage: item.dosage,
        unit: item.unit as "mg" | "mcg" | "g" | "IU" | "ml",
      })),
    ];

    startCreating(async () => {
      const result = await createStackFromImport(stackName, allItems);
      if (result.success && result.stackId) {
        setCreatedStackId(result.stackId);
        setStep("success");
        router.refresh();
      }
    });
  }

  function handleClose() {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("input");
      setRawText("");
      setParseResult(null);
      setStackName("Imported Stack");
      setEditingItems([]);
      setResolvedUnmatched(new Map());
      setCreatedStackId(null);
    }, 200);
  }

  function handleOpenStack() {
    if (createdStackId) {
      router.push(`/dashboard/stacks/${createdStackId}`);
      handleClose();
    }
  }

  const totalItems = editingItems.length + resolvedUnmatched.size;
  const unresolvedCount =
    (parseResult?.unmatched.length ?? 0) - resolvedUnmatched.size;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-mono text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-xl">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono">
                <Upload className="h-4 w-4" />
                Import Protocol
              </DialogTitle>
              <DialogDescription>
                Paste your supplement list from any app, spreadsheet, or notes.
                We&apos;ll match them to our database.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Format hints */}
              <div className="rounded-md border border-dashed p-3">
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Supported formats:
                </p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>
                    <FileText className="mr-1.5 inline h-3 w-3" />
                    Plain text: &quot;Vitamin D 5000IU&quot;
                  </li>
                  <li>
                    <FileText className="mr-1.5 inline h-3 w-3" />
                    CSV: Supplement, Dosage, Unit
                  </li>
                  <li>
                    <FileText className="mr-1.5 inline h-3 w-3" />
                    One supplement per line
                  </li>
                </ul>
              </div>

              {/* Text input */}
              <div className="space-y-2">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={EXAMPLE_TEXT}
                  className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[200px] w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-1 focus-visible:outline-none"
                />
                <p className="text-muted-foreground text-xs">
                  {rawText.split("\n").filter((l) => l.trim()).length} items
                  detected
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleParse}
                  disabled={!rawText.trim() || isParsing}
                >
                  {isParsing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Parse & Review
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "review" && parseResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono">
                <Check className="h-4 w-4" />
                Review Import
              </DialogTitle>
              <DialogDescription>
                {editingItems.length} matched, {unresolvedCount} need attention
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2">
              {/* Stack name */}
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-medium">
                  Protocol name
                </label>
                <Input
                  value={stackName}
                  onChange={(e) => setStackName(e.target.value)}
                  placeholder="My Protocol"
                  className="font-mono text-sm"
                />
              </div>

              {/* Matched items */}
              {editingItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-medium">
                      Matched ({editingItems.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {editingItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.supplementName}
                          </p>
                          {item.name !== item.supplementName && (
                            <p className="text-muted-foreground truncate text-xs">
                              from &quot;{item.name}&quot;
                            </p>
                          )}
                        </div>
                        <Input
                          type="number"
                          value={item.resolvedDosage}
                          onChange={(e) =>
                            handleUpdateDosage(
                              index,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 w-20 font-mono text-xs"
                        />
                        <Select
                          value={item.resolvedUnit}
                          onValueChange={(v) =>
                            handleUpdateUnit(
                              index,
                              v as "mg" | "mcg" | "g" | "IU" | "ml",
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-16">
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
                        <button
                          onClick={() => handleRemoveMatched(index)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmatched items */}
              {parseResult.unmatched.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-medium">
                      Needs attention ({parseResult.unmatched.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {parseResult.unmatched.map((item) => {
                      const resolved = resolvedUnmatched.get(item.rawText);
                      return (
                        <div
                          key={item.rawText}
                          className={cn(
                            "rounded-md border p-2",
                            resolved
                              ? "border-emerald-500/20 bg-emerald-500/5"
                              : "border-amber-500/20 bg-amber-500/5",
                          )}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium">
                              &quot;{item.name}&quot;
                            </p>
                            {resolved && (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-500/10 text-emerald-500"
                              >
                                <Check className="mr-1 h-3 w-3" />
                                {resolved.name}
                              </Badge>
                            )}
                          </div>
                          {!resolved && item.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-muted-foreground text-xs">
                                Did you mean:
                              </span>
                              {item.suggestions.map((sugg) => (
                                <button
                                  key={sugg.id}
                                  onClick={() =>
                                    handleResolveUnmatched(
                                      item,
                                      sugg.id,
                                      sugg.name,
                                    )
                                  }
                                  className="hover:bg-primary/10 hover:text-primary rounded-full border px-2 py-0.5 text-xs transition-colors"
                                >
                                  {sugg.name}
                                </button>
                              ))}
                            </div>
                          )}
                          {!resolved && item.suggestions.length === 0 && (
                            <p className="text-muted-foreground text-xs">
                              No matches found - this item will be skipped
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep("input")}
                size="sm"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {totalItems} items to import
                </span>
                <Button
                  onClick={handleCreate}
                  disabled={totalItems === 0 || !stackName.trim() || isCreating}
                  size="sm"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Create Protocol
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono">
                <Check className="h-4 w-4 text-emerald-500" />
                Import Complete
              </DialogTitle>
              <DialogDescription>
                Your protocol &quot;{stackName}&quot; has been created with{" "}
                {totalItems} supplements.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleOpenStack}>
                View Protocol
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
