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
import { Terminal, X, Sparkles, Loader2, Salad, Syringe } from "lucide-react";
import {
  getServingPresets,
  type ServingPreset,
} from "~/server/data/serving-presets";
import {
  parseCommand,
  type ParsedDosage,
  type ParsedTime,
} from "~/lib/ai/command-parser";
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
import {
  getBioavailabilityRule,
  type BioavailabilityModifier,
} from "~/server/data/bioavailability-rules";
import { type routeEnum, type mealContextEnum } from "~/server/db/schema";

type RouteOfAdministration = (typeof routeEnum.enumValues)[number];
type MealContext = (typeof mealContextEnum.enumValues)[number];

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  route?: RouteOfAdministration | null;
  isResearchChemical?: boolean | null;
  safetyCategory?: string | null;
};

export type LogOptions = {
  supplementId: string;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
  route?: RouteOfAdministration;
  mealContext?: MealContext;
  /** Optional timestamp for when the supplement was taken */
  loggedAt?: Date;
};

type CommandBarProps = {
  supplements: Supplement[];
  onLog: (options: LogOptions) => Promise<void>;
  initialInput?: string;
  isCoachPrimed?: boolean;
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

export function CommandBar({
  supplements,
  onLog,
  initialInput,
  isCoachPrimed = false,
}: CommandBarProps) {
  const [input, setInput] = useState("");
  const [selectedSupplement, setSelectedSupplement] =
    useState<Supplement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "pending";
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
  const initialInputAppliedRef = useRef(false);
  const [showCoachPulse, setShowCoachPulse] = useState(isCoachPrimed);

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

  // Get bioavailability rule for the selected supplement
  const bioRule: BioavailabilityModifier | undefined = useMemo(() => {
    if (!selectedSupplement) return undefined;
    return getBioavailabilityRule(
      selectedSupplement.name,
      selectedSupplement.safetyCategory,
    );
  }, [selectedSupplement]);

  // Check if supplement is injectable (non-oral route)
  const isInjectable = useMemo(() => {
    if (!selectedSupplement) return false;
    const route = selectedSupplement.route;
    return (
      route &&
      ["subq_injection", "im_injection", "intranasal", "sublingual"].includes(
        route,
      )
    );
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
    if (!initialInput || initialInputAppliedRef.current) {
      return;
    }

    initialInputAppliedRef.current = true;
    setInput(initialInput);
    setOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  }, [initialInput]);

  useEffect(() => {
    if (!isCoachPrimed) {
      return;
    }

    const timer = setTimeout(() => {
      setShowCoachPulse(false);
    }, 3600);

    return () => {
      clearTimeout(timer);
    };
  }, [isCoachPrimed]);

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

  function handleInputBlur(e: React.FocusEvent) {
    // Delay closing to allow clicking on suggestions
    // Check if the new focus target is within our component
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('[data-slot="command-item"]')) {
      // Clicking on a suggestion, don't close
      return;
    }
    // Close after a short delay to allow click events to fire
    setTimeout(() => {
      setOpen(false);
    }, 150);
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

  function handleSubmit(
    supplement?: Supplement,
    dosage?: ParsedDosage | null,
    parsedTimeOverride?: ParsedTime | null,
  ) {
    const targetSupplement = supplement ?? selectedSupplement;
    const targetDosage = dosage ?? parsedDosage;
    const targetTime = parsedTimeOverride ?? parsedCommand.parsedTime;

    if (!targetSupplement || !targetDosage) return;

    // Build the feedback message
    let pendingMessage = `${targetDosage.value}${targetDosage.unit} ${targetSupplement.name}`;
    if (targetTime) {
      pendingMessage += ` (${targetTime.description})`;
    }

    setFeedback({
      type: "pending",
      message: `Logging ${pendingMessage}...`,
    });
    setSelectedSupplement(null);
    setInput("");
    setAiSuggestions([]);

    startTransition(async () => {
      try {
        await onLog({
          supplementId: targetSupplement.id,
          dosage: targetDosage.value,
          unit: targetDosage.unit,
          route: targetSupplement.route ?? undefined,
          loggedAt: targetTime?.date,
        });
        setFeedback({
          type: "success",
          message: `Logged ${pendingMessage}`,
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

    // Optimistic: show pending immediately
    const pendingMessage = `${preset.label} (${preset.dosage}${preset.unit}) ${selectedSupplement.name}`;
    const suppName = selectedSupplement.name;
    const suppId = selectedSupplement.id;
    const suppRoute = selectedSupplement.route;
    setFeedback({
      type: "pending",
      message: `Logging ${pendingMessage}...`,
    });
    setSelectedSupplement(null);
    setInput("");

    startTransition(async () => {
      try {
        await onLog({
          supplementId: suppId,
          dosage: preset.dosage,
          unit: preset.unit,
          route: suppRoute ?? undefined,
        });
        setFeedback({
          type: "success",
          message: `Logged ${preset.label} (${preset.dosage}${preset.unit}) ${suppName}`,
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
      handleSubmit(supp, parsedCommand.dosage, parsedCommand.parsedTime);
    } else {
      selectSupplement(supp, parsedCommand.dosage);
    }
  }

  const showList = open && suggestions.length > 0 && !selectedSupplement;

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">
        Quick log: type a supplement name and dosage
      </p>

      <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <div className="relative">
          <Terminal className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <div
            className={`bg-background flex items-center gap-1 rounded-md border pr-3 pl-10 transition-all ${
              showCoachPulse ? "border-cyan-400/45 ring-2 ring-cyan-400/25" : ""
            }`}
          >
            {selectedSupplement && (
              <Badge
                variant="secondary"
                className="hover:bg-secondary/80 shrink-0 cursor-pointer gap-1 font-mono"
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
              onBlur={handleInputBlur}
              placeholder={
                selectedSupplement
                  ? "200mg, 5000IU..."
                  : "200mg mag, vitamin d 5000iu..."
              }
              className="placeholder:text-muted-foreground flex-1 bg-transparent py-2 font-mono text-sm outline-none"
              disabled={isPending}
            />
            {isSearching && (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
          </div>
        </div>

        {showList && (
          <div className="relative mt-1">
            <CommandList className="bg-popover absolute z-10 w-full rounded-md border shadow-md">
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
                            <span className="text-muted-foreground ml-2">
                              ({s.form})
                            </span>
                          )}
                        </div>
                        {aiMatch && aiMatch.score > 0.5 && (
                          <span className="text-primary/70 flex items-center gap-1 text-xs">
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
          className={`flex items-center gap-2 rounded-md px-3 py-2 font-mono text-sm ${
            feedback.type === "success"
              ? "bg-green-500/10 text-green-500"
              : feedback.type === "pending"
                ? "bg-muted text-muted-foreground"
                : "bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.type === "pending" && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {feedback.message}
        </div>
      )}

      {/* One-shot log hint */}
      {showCoachPulse && (
        <div className="flex items-center gap-2 rounded-md border border-cyan-400/25 bg-cyan-500/10 px-3 py-2">
          <Sparkles className="h-3 w-3 text-cyan-300" />
          <span className="text-muted-foreground text-xs">
            Coach primed this command bar. Adjust dosage and press Enter to log.
          </span>
        </div>
      )}

      {canOneShotLog && suggestions.length > 0 && open && (
        <div className="bg-primary/10 flex items-center gap-2 rounded-md px-3 py-2">
          <Sparkles className="text-primary h-3 w-3" />
          <span className="text-muted-foreground text-xs">
            Press Enter to log {parsedCommand.dosage?.value}
            {parsedCommand.dosage?.unit} of{" "}
            <span className="text-foreground font-medium">
              {suggestions[0]?.name}
            </span>
            {parsedCommand.parsedTime && (
              <span className="text-muted-foreground">
                {" "}
                at {parsedCommand.parsedTime.description}
              </span>
            )}
          </span>
        </div>
      )}

      {selectedSupplement && parsedDosage && (
        <div className="bg-primary/10 flex items-center gap-2 rounded-md px-3 py-2">
          <span className="text-muted-foreground text-xs">
            Press Enter to log {parsedDosage.value}
            {parsedDosage.unit} of {selectedSupplement.name}
          </span>
        </div>
      )}

      {/* Serving presets - show when supplement is selected and no dosage entered yet */}
      {selectedSupplement && !parsedDosage && servingPresets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">Quick servings:</p>
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
                <span className="text-muted-foreground ml-1">
                  ({preset.dosage}
                  {preset.unit})
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Bioavailability hint - show when supplement needs special meal context */}
      {selectedSupplement && bioRule && (
        <div className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2">
          <Salad className="h-4 w-4 shrink-0 text-amber-500" />
          <div className="space-y-0.5">
            <p className="text-foreground text-xs font-medium">
              {bioRule.optimalMultiplier > 1
                ? `+${Math.round((bioRule.optimalMultiplier - 1) * 100)}% absorption`
                : "Optimal timing"}
            </p>
            <p className="text-muted-foreground text-xs">
              {bioRule.optimalContexts.includes("with_fat")
                ? "Take with a meal containing fat"
                : bioRule.optimalContexts.includes("fasted")
                  ? "Take on an empty stomach"
                  : "Take with food"}
            </p>
          </div>
        </div>
      )}

      {/* Route hint - show for injectable/non-oral supplements */}
      {selectedSupplement && isInjectable && (
        <div className="flex items-start gap-2 rounded-md bg-blue-500/10 px-3 py-2">
          <Syringe className="h-4 w-4 shrink-0 text-blue-500" />
          <div className="space-y-0.5">
            <p className="text-foreground text-xs font-medium">
              {selectedSupplement.route === "subq_injection"
                ? "Subcutaneous injection"
                : selectedSupplement.route === "im_injection"
                  ? "Intramuscular injection"
                  : selectedSupplement.route === "intranasal"
                    ? "Intranasal spray"
                    : selectedSupplement.route === "sublingual"
                      ? "Sublingual (under tongue)"
                      : selectedSupplement.route}
            </p>
            {selectedSupplement.isResearchChemical && (
              <p className="text-muted-foreground text-xs">
                Research compound - consult usage guidelines
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
