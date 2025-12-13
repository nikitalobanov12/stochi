"use client";

import { useState, useRef, useEffect, useTransition, useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Terminal, X } from "lucide-react";
import { getServingPresets, type ServingPreset } from "~/server/data/serving-presets";

type Supplement = {
  id: string;
  name: string;
  form: string | null;
};

type CommandBarProps = {
  supplements: Supplement[];
  onLog: (
    supplementId: string,
    dosage: number,
    unit: "mg" | "mcg" | "g" | "IU" | "ml",
  ) => Promise<void>;
};

const UNITS = ["mg", "mcg", "g", "IU", "ml"] as const;
const UNIT_PATTERN = new RegExp(`^(\\d+(?:\\.\\d+)?)(${UNITS.join("|")})$`, "i");

function searchSupplements(query: string, supps: Supplement[]): Supplement[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return supps
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.name.toLowerCase().startsWith(q) ||
        s.form?.toLowerCase().includes(q),
    )
    .slice(0, 5);
}

function parseDosageInput(
  text: string,
): { dosage: number; unit: "mg" | "mcg" | "g" | "IU" | "ml" } | null {
  const match = UNIT_PATTERN.exec(text.trim());
  if (!match?.[1] || !match[2]) return null;

  const dosage = parseFloat(match[1]);
  const unitRaw = match[2].toLowerCase();
  const unit = unitRaw === "iu" ? "IU" : (unitRaw as "mg" | "mcg" | "g" | "ml");

  return { dosage, unit };
}

export function CommandBar({ supplements, onLog }: CommandBarProps) {
  const [input, setInput] = useState("");
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (selectedSupplement) return [];
    return searchSupplements(input, supplements);
  }, [input, supplements, selectedSupplement]);

  const parsedDosage = useMemo(() => {
    if (!selectedSupplement) return null;
    return parseDosageInput(input);
  }, [input, selectedSupplement]);

  // Get serving presets for the selected supplement
  const servingPresets = useMemo(() => {
    if (!selectedSupplement) return [];
    return getServingPresets(selectedSupplement.name);
  }, [selectedSupplement]);

  const canSubmit = selectedSupplement && parsedDosage;

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  function handleInputChange(value: string) {
    setInput(value);
    setHighlightedIndex(0);
  }

  function selectSupplement(supp: Supplement) {
    setSelectedSupplement(supp);
    setInput("");
    inputRef.current?.focus();
  }

  function clearSelection() {
    setSelectedSupplement(null);
    setInput("");
    inputRef.current?.focus();
  }

  function handleSubmit() {
    if (!canSubmit || !parsedDosage) return;

    startTransition(async () => {
      try {
        await onLog(selectedSupplement.id, parsedDosage.dosage, parsedDosage.unit);
        setSelectedSupplement(null);
        setInput("");
        setFeedback({
          type: "success",
          message: `Logged ${parsedDosage.dosage}${parsedDosage.unit} ${selectedSupplement.name}`,
        });
      } catch {
        setFeedback({
          type: "error",
          message: "Failed to log supplement",
        });
      }
    });
  }

  function handlePresetClick(preset: ServingPreset) {
    if (!selectedSupplement) return;

    startTransition(async () => {
      try {
        await onLog(selectedSupplement.id, preset.dosage, preset.unit);
        setSelectedSupplement(null);
        setInput("");
        setFeedback({
          type: "success",
          message: `Logged ${preset.label} (${preset.dosage}${preset.unit}) ${selectedSupplement.name}`,
        });
      } catch {
        setFeedback({
          type: "error",
          message: "Failed to log supplement",
        });
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canSubmit) {
        void handleSubmit();
      } else if (!selectedSupplement && suggestions.length > 0) {
        const selected = suggestions[highlightedIndex];
        if (selected) {
          selectSupplement(selected);
        }
      }
    } else if (e.key === "Backspace" && input === "" && selectedSupplement) {
      e.preventDefault();
      clearSelection();
    } else if (e.key === "Escape" && selectedSupplement) {
      e.preventDefault();
      clearSelection();
    } else if (!selectedSupplement) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Tab" && suggestions.length > 0) {
        e.preventDefault();
        const selected = suggestions[highlightedIndex];
        if (selected) {
          selectSupplement(selected);
        }
      }
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Quick log: type a supplement name and dosage
      </p>
      <div className="relative">
        <Terminal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <div className="flex items-center gap-1 rounded-md border bg-background pl-10 pr-3">
          {selectedSupplement && (
            <Badge
              variant="secondary"
              className="shrink-0 cursor-pointer gap-1 font-mono hover:bg-secondary/80"
              onClick={clearSelection}
            >
              {selectedSupplement.name}
              <X className="h-3 w-3" />
            </Badge>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedSupplement ? "200mg, 5000IU..." : "Search supplement..."
            }
            className="flex-1 bg-transparent py-2 font-mono text-sm outline-none placeholder:text-muted-foreground"
            disabled={isPending}
          />
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-md px-3 py-2 font-mono text-sm ${
            feedback.type === "success"
              ? "bg-green-500/10 text-green-500"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {selectedSupplement && parsedDosage && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Press Enter to log {parsedDosage.dosage}
            {parsedDosage.unit} of {selectedSupplement.name}
          </span>
        </div>
      )}

      {/* Serving presets - show when supplement is selected and no dosage entered yet */}
      {selectedSupplement && !parsedDosage && servingPresets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Quick servings:</p>
          <div className="flex flex-wrap gap-1.5">
            {servingPresets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={() => handlePresetClick(preset)}
                disabled={isPending}
              >
                {preset.label}
                <span className="ml-1 text-muted-foreground">
                  ({preset.dosage}
                  {preset.unit})
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-md border bg-popover p-1">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                i === highlightedIndex ? "bg-muted" : "hover:bg-muted/50"
              }`}
              onClick={() => selectSupplement(s)}
            >
              <span className="font-medium">{s.name}</span>
              {s.form && (
                <span className="ml-2 text-muted-foreground">({s.form})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
