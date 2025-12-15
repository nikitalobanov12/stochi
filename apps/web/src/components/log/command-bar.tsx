"use client";

import {
  useState,
  useRef,
  useEffect,
  useTransition,
  useMemo,
  useCallback,
} from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Terminal, X, Sparkles, Loader2 } from "lucide-react";
import { getServingPresets, type ServingPreset } from "~/server/data/serving-presets";
import { parseCommand, type ParsedDosage } from "~/lib/ai/command-parser";
import {
  useSemanticSearch,
  type SearchResult,
} from "~/lib/ai/use-semantic-search";
import { fuzzySearchSupplements } from "~/server/data/supplement-aliases";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "~/components/ui/command";

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
const UNIT_PATTERN = new RegExp(
  `^(\\d+(?:\\.\\d+)?)\\s*(${UNITS.join("|")})$`,
  "i",
);

function parseDosageInput(text: string): ParsedDosage | null {
  const match = UNIT_PATTERN.exec(text.trim());
  if (!match?.[1] || !match[2]) return null;

  const value = parseFloat(match[1]);
  const unitRaw = match[2].toLowerCase();
  const unit = unitRaw === "iu" ? "IU" : (unitRaw as "mg" | "mcg" | "g" | "ml");

  return { value, unit };
}

export function CommandBar({ supplements, onLog }: CommandBarProps) {
  const [input, setInput] = useState("");
  const [selectedSupplement, setSelectedSupplement] =
    useState<Supplement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Semantic search integration
  const { search: semanticSearch, isReady: isAIReady } =
    useSemanticSearch(supplements);
  const [aiSuggestions, setAiSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse the full input for natural language commands
  const parsedCommand = useMemo(() => parseCommand(input), [input]);

  // Hybrid search: combine fuzzy (instant) with AI semantic (debounced)
  const fuzzySuggestions = useMemo(() => {
    if (selectedSupplement) return [];
    const query = parsedCommand.supplementQuery || input;
    if (!query.trim()) return [];
    return fuzzySearchSupplements(supplements, query).slice(0, 5);
  }, [input, supplements, selectedSupplement, parsedCommand.supplementQuery]);

  // Merge fuzzy and AI suggestions, prioritizing AI scores when available
  const suggestions = useMemo(() => {
    if (selectedSupplement) return [];

    // If no AI suggestions yet, use fuzzy
    if (aiSuggestions.length === 0) {
      return fuzzySuggestions;
    }

    // Merge: AI suggestions first (sorted by score), then any fuzzy matches not in AI results
    const aiIds = new Set(aiSuggestions.map((s) => s.id));
    const fuzzyOnly = fuzzySuggestions.filter((s) => !aiIds.has(s.id));

    const merged = [
      ...aiSuggestions.slice(0, 3).map((ai) => {
        const original = supplements.find((s) => s.id === ai.id);
        return original ?? { id: ai.id, name: ai.name, form: ai.form };
      }),
      ...fuzzyOnly.slice(0, 2),
    ];

    return merged.slice(0, 5);
  }, [aiSuggestions, fuzzySuggestions, selectedSupplement, supplements]);

  // Trigger semantic search with debounce
  const triggerSemanticSearch = useCallback(
    async (query: string) => {
      if (!isAIReady || !query.trim() || query.length < 2) {
        setAiSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await semanticSearch(query);
        setAiSuggestions(results);
      } catch {
        // Silently fail - fuzzy search is the fallback
      } finally {
        setIsSearching(false);
      }
    },
    [isAIReady, semanticSearch],
  );

  // Debounced semantic search
  useEffect(() => {
    if (selectedSupplement) {
      setAiSuggestions([]);
      return;
    }

    const query = parsedCommand.supplementQuery || input;
    if (!query.trim() || query.length < 2) {
      setAiSuggestions([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce: wait 150ms before triggering AI search
    searchTimeoutRef.current = setTimeout(() => {
      void triggerSemanticSearch(query);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [
    input,
    selectedSupplement,
    parsedCommand.supplementQuery,
    triggerSemanticSearch,
  ]);

  const parsedDosage = useMemo(() => {
    if (!selectedSupplement) {
      // Check if dosage is in the parsed command (natural language mode)
      return parsedCommand.dosage;
    }
    return parseDosageInput(input);
  }, [input, selectedSupplement, parsedCommand.dosage]);

  // Get serving presets for the selected supplement
  const servingPresets = useMemo(() => {
    if (!selectedSupplement) return [];
    return getServingPresets(selectedSupplement.name);
  }, [selectedSupplement]);

  const canSubmit = selectedSupplement && parsedDosage;

  // Check if we can do a one-shot log (supplement + dosage in one input)
  const canOneShotLog = useMemo(() => {
    if (selectedSupplement) return false;
    return (
      parsedCommand.dosage &&
      parsedCommand.supplementQuery &&
      suggestions.length > 0
    );
  }, [selectedSupplement, parsedCommand, suggestions]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  function handleInputChange(value: string) {
    setInput(value);
    setOpen(true);
  }

  function handleInputFocus() {
    setOpen(true);
  }

  function selectSupplement(supp: Supplement, dosage?: ParsedDosage | null) {
    setSelectedSupplement(supp);
    setOpen(false);
    // If dosage was parsed from natural language, pre-fill it
    if (dosage) {
      setInput(`${dosage.value}${dosage.unit}`);
    } else {
      setInput("");
    }
    inputRef.current?.focus();
  }

  function clearSelection() {
    setSelectedSupplement(null);
    setInput("");
    setAiSuggestions([]);
    inputRef.current?.focus();
  }

  function handleSubmit(supplement?: Supplement, dosage?: ParsedDosage | null) {
    const targetSupplement = supplement ?? selectedSupplement;
    const targetDosage = dosage ?? parsedDosage;

    if (!targetSupplement || !targetDosage) return;

    startTransition(async () => {
      try {
        await onLog(targetSupplement.id, targetDosage.value, targetDosage.unit);
        setSelectedSupplement(null);
        setInput("");
        setAiSuggestions([]);
        setFeedback({
          type: "success",
          message: `Logged ${targetDosage.value}${targetDosage.unit} ${targetSupplement.name}`,
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
      // cmdk handles item selection on Enter, but we handle dosage submission
      if (canSubmit) {
        e.preventDefault();
        handleSubmit();
      }
    } else if (e.key === "Backspace" && input === "" && selectedSupplement) {
      e.preventDefault();
      clearSelection();
    } else if (e.key === "Escape") {
      if (selectedSupplement) {
        e.preventDefault();
        clearSelection();
      } else if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  // Handle cmdk item selection
  function handleSelect(supplementId: string) {
    const supp = supplements.find((s) => s.id === supplementId);
    if (!supp) return;

    // If we have a dosage ready, do a one-shot log
    if (canOneShotLog && parsedCommand.dosage) {
      handleSubmit(supp, parsedCommand.dosage);
    } else {
      selectSupplement(supp, parsedCommand.dosage);
    }
  }

  const showList = open && suggestions.length > 0 && !selectedSupplement;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Quick log: type a supplement name and dosage
      </p>

      <Command
        shouldFilter={false}
        className="overflow-visible bg-transparent"
      >
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
              onFocus={handleInputFocus}
              placeholder={
                selectedSupplement
                  ? "200mg, 5000IU..."
                  : "200mg mag, vitamin d 5000iu..."
              }
              className="flex-1 bg-transparent py-2 font-mono text-sm outline-none placeholder:text-muted-foreground"
              disabled={isPending}
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {showList && (
          <div className="relative mt-1">
            <CommandList className="absolute z-10 w-full rounded-md border bg-popover shadow-md">
              <CommandEmpty className="py-3 text-sm">
                No supplements found.
              </CommandEmpty>
              <CommandGroup>
                {suggestions.map((s) => {
                  const aiMatch = aiSuggestions.find((ai) => ai.id === s.id);
                  return (
                    <CommandItem
                      key={s.id}
                      value={s.id}
                      onSelect={handleSelect}
                      className="cursor-pointer"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div>
                          <span className="font-medium">{s.name}</span>
                          {s.form && (
                            <span className="ml-2 text-muted-foreground">
                              ({s.form})
                            </span>
                          )}
                        </div>
                        {aiMatch && aiMatch.score > 0.5 && (
                          <span className="flex items-center gap-1 text-xs text-primary/70">
                            <Sparkles className="h-3 w-3" />
                            {Math.round(aiMatch.score * 100)}%
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>

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

      {/* One-shot log hint */}
      {canOneShotLog && suggestions.length > 0 && open && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground">
            Press Enter to log {parsedCommand.dosage?.value}
            {parsedCommand.dosage?.unit} of{" "}
            <span className="font-medium text-foreground">
              {suggestions[0]?.name}
            </span>
          </span>
        </div>
      )}

      {selectedSupplement && parsedDosage && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Press Enter to log {parsedDosage.value}
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
    </div>
  );
}
