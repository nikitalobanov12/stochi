"use client";

import { useState, useRef, useEffect, useTransition, useMemo } from "react";
import { Input } from "~/components/ui/input";
import { Terminal } from "lucide-react";

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
const UNIT_PATTERN = new RegExp(`(\\d+(?:\\.\\d+)?)(${UNITS.join("|")})`, "i");

type ParseResult = {
  suggestions: Supplement[];
  dosage: number | null;
  unit: "mg" | "mcg" | "g" | "IU" | "ml" | null;
};

function parseInput(text: string, supps: Supplement[]): ParseResult {
  const trimmed = text.trim().toLowerCase();

  if (!trimmed) {
    return { suggestions: [], dosage: null, unit: null };
  }

  const parts = trimmed.split(/\s+/);
  const searchTerm = parts[0] ?? "";
  const dosageStr = parts[1] ?? "";

  if (!searchTerm) {
    return { suggestions: [], dosage: null, unit: null };
  }

  const matchingSupps = supps.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm) ||
      s.name.toLowerCase().startsWith(searchTerm) ||
      s.form?.toLowerCase().includes(searchTerm),
  );

  // Parse dosage if provided
  let dosage: number | null = null;
  let unit: "mg" | "mcg" | "g" | "IU" | "ml" | null = null;

  const dosageMatch = UNIT_PATTERN.exec(dosageStr);
  if (dosageMatch) {
    const dosageValue = dosageMatch[1];
    const unitValue = dosageMatch[2];
    if (dosageValue && unitValue) {
      dosage = parseFloat(dosageValue);
      const unitRaw = unitValue.toLowerCase();
      unit = unitRaw === "iu" ? "IU" : (unitRaw as "mg" | "mcg" | "g" | "ml");
    }
  }

  return {
    suggestions: matchingSupps.slice(0, 5),
    dosage,
    unit,
  };
}

export function CommandBar({ supplements, onLog }: CommandBarProps) {
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, dosage, unit } = useMemo(
    () => parseInput(input, supplements),
    [input, supplements],
  );

  // Can submit if we have suggestions, a selected one, and valid dosage
  const selectedSupplement = suggestions[selectedIndex];
  const canSubmit = selectedSupplement && dosage !== null && unit !== null;

  function handleInputChange(value: string) {
    setInput(value);
    setSelectedIndex(0);
  }

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  function handleSubmit() {
    if (!canSubmit || !selectedSupplement || dosage === null || unit === null) return;

    startTransition(async () => {
      try {
        await onLog(selectedSupplement.id, dosage, unit);
        setInput("");
        setFeedback({
          type: "success",
          message: `Logged ${dosage}${unit} ${selectedSupplement.name}`,
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
      } else if (suggestions.length > 0 && selectedSupplement) {
        // Auto-complete the supplement name
        handleInputChange(selectedSupplement.name.toLowerCase().split(" ")[0] + " ");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Tab" && suggestions.length > 0 && selectedSupplement) {
      e.preventDefault();
      handleInputChange(selectedSupplement.name.toLowerCase().split(" ")[0] + " ");
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Quick log: type a supplement name and dosage
      </p>
      <div className="relative">
        <Terminal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="mag 200mg, zinc 15mg, vitamin d 5000IU..."
          className="pl-10 font-mono"
          disabled={isPending}
        />
      </div>

      {feedback && (
        <div
          className={`rounded-md px-3 py-2 text-sm font-mono ${
            feedback.type === "success"
              ? "bg-green-500/10 text-green-500"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-md border bg-popover p-1">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-muted"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => {
                if (dosage !== null && unit !== null) {
                  // If dosage already entered, submit directly
                  setSelectedIndex(i);
                  startTransition(async () => {
                    try {
                      await onLog(s.id, dosage, unit);
                      setInput("");
                      setFeedback({
                        type: "success",
                        message: `Logged ${dosage}${unit} ${s.name}`,
                      });
                    } catch {
                      setFeedback({
                        type: "error",
                        message: "Failed to log supplement",
                      });
                    }
                  });
                } else {
                  // Auto-complete the name
                  handleInputChange(s.name.toLowerCase().split(" ")[0] + " ");
                  inputRef.current?.focus();
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{s.name}</span>
                  {s.form && (
                    <span className="ml-2 text-muted-foreground">({s.form})</span>
                  )}
                </div>
                {i === selectedIndex && canSubmit && (
                  <span className="text-xs text-muted-foreground">
                    Press Enter to log {dosage}{unit}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
