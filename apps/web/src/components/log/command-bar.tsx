"use client";

import { useState, useRef, useEffect, useTransition, useMemo } from "react";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
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

type ParsedCommand = {
  type: "log";
  supplement: Supplement;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
} | null;

const UNITS = ["mg", "mcg", "g", "IU", "ml"] as const;
const UNIT_PATTERN = new RegExp(`(\\d+(?:\\.\\d+)?)(${UNITS.join("|")})`, "i");

function parseInput(
  text: string,
  supps: Supplement[],
): { command: ParsedCommand; suggestions: Supplement[] } {
  const trimmed = text.trim().toLowerCase();

  if (!trimmed) {
    return { command: null, suggestions: [] };
  }

  const parts = trimmed.split(/\s+/);
  const searchTerm = parts[0] ?? "";
  const dosageStr = parts[1] ?? "";

  if (!searchTerm) {
    return { command: null, suggestions: [] };
  }

  const matchingSupps = supps.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm) ||
      s.name.toLowerCase().startsWith(searchTerm) ||
      s.form?.toLowerCase().includes(searchTerm),
  );

  const dosageMatch = UNIT_PATTERN.exec(dosageStr);

  if (matchingSupps.length === 1 && dosageMatch) {
    const dosageValue = dosageMatch[1];
    const unitValue = dosageMatch[2];
    if (!dosageValue || !unitValue) {
      return { command: null, suggestions: matchingSupps.slice(0, 5) };
    }

    const dosage = parseFloat(dosageValue);
    const unitRaw = unitValue.toLowerCase();
    const normalizedUnit =
      unitRaw === "iu" ? "IU" : (unitRaw as "mg" | "mcg" | "g" | "ml");

    const supplement = matchingSupps[0];
    if (!supplement) {
      return { command: null, suggestions: [] };
    }

    return {
      command: {
        type: "log",
        supplement,
        dosage,
        unit: normalizedUnit,
      },
      suggestions: [],
    };
  }

  return {
    command: null,
    suggestions: matchingSupps.slice(0, 5),
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

  const { command: parsed, suggestions } = useMemo(
    () => parseInput(input, supplements),
    [input, supplements],
  );

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
    if (!parsed) return;

    startTransition(async () => {
      try {
        await onLog(parsed.supplement.id, parsed.dosage, parsed.unit);
        setInput("");
        setFeedback({
          type: "success",
          message: `Logged ${parsed.dosage}${parsed.unit} ${parsed.supplement.name}`,
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
      if (parsed) {
        e.preventDefault();
        void handleSubmit();
      } else if (suggestions.length > 0) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        if (selected) {
          handleInputChange(selected.name.toLowerCase().split(" ")[0] + " ");
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      if (selected) {
        handleInputChange(selected.name.toLowerCase().split(" ")[0] + " ");
      }
    }
  }

  return (
    <div className="space-y-2">
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

      {parsed && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
          <span className="text-sm text-muted-foreground">Ready to log:</span>
          <Badge variant="secondary" className="font-mono">
            {parsed.supplement.name}
          </Badge>
          <Badge className="font-mono">
            {parsed.dosage}
            {parsed.unit}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Press Enter to confirm
          </span>
        </div>
      )}

      {suggestions.length > 0 && !parsed && (
        <div className="rounded-md border bg-popover p-1">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`w-full rounded px-3 py-2 text-left text-sm ${
                i === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
              }`}
              onClick={() => {
                handleInputChange(s.name.toLowerCase().split(" ")[0] + " ");
                inputRef.current?.focus();
              }}
            >
              <span className="font-medium">{s.name}</span>
              {s.form && (
                <span className="ml-2 text-muted-foreground">({s.form})</span>
              )}
            </button>
          ))}
          <div className="mt-1 border-t px-3 py-1.5 text-xs text-muted-foreground">
            Type supplement name + dosage (e.g., &quot;mag 200mg&quot;)
          </div>
        </div>
      )}

      {!input && (
        <div className="text-xs text-muted-foreground">
          Examples:{" "}
          <code className="rounded bg-muted px-1">mag 200mg</code>{" "}
          <code className="rounded bg-muted px-1">zinc 15mg</code>{" "}
          <code className="rounded bg-muted px-1">d3 5000IU</code>
        </div>
      )}
    </div>
  );
}
