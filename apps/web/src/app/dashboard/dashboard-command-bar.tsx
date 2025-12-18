"use client";

import { useState, useTransition, useEffect } from "react";
import { Search } from "lucide-react";
import { CommandBar } from "~/components/log/command-bar";
import { ToxicityWarningDialog } from "~/components/ui/toxicity-warning-dialog";
import { createLog, type CreateLogResult } from "~/server/actions/logs";
import { type SafetyCheckResult } from "~/server/services/safety";

type Supplement = {
  id: string;
  name: string;
  form: string | null;
};

type DashboardCommandBarProps = {
  supplements: Supplement[];
};

type PendingLog = {
  supplementId: string;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
};

const PROMPTS = [
  "Log Stack...",
  "Check Interactions...",
  "Analyze Zinc...",
  "Track D3...",
  "Log Magnesium...",
];

export function DashboardCommandBar({ supplements }: DashboardCommandBarProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingLog, setPendingLog] = useState<PendingLog | null>(null);
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheckResult | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Cycle through placeholder prompts
  useEffect(() => {
    if (isExpanded) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PROMPTS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  async function handleLog(
    supplementId: string,
    dosage: number,
    unit: "mg" | "mcg" | "g" | "IU" | "ml"
  ): Promise<void> {
    setPendingLog({ supplementId, dosage, unit });

    const result: CreateLogResult = await createLog(supplementId, dosage, unit);

    if (result.success) {
      setPendingLog(null);
      setSafetyCheck(null);
      // Collapse after successful log
      setIsExpanded(false);
      return;
    }

    setSafetyCheck(result.safetyCheck);
    setShowWarning(true);
  }

  function handleWarningCancel() {
    setPendingLog(null);
    setSafetyCheck(null);
    setShowWarning(false);
  }

  function handleWarningProceed() {
    if (!pendingLog) return;

    startTransition(async () => {
      const result = await createLog(
        pendingLog.supplementId,
        pendingLog.dosage,
        pendingLog.unit,
        undefined,
        true
      );

      if (result.success) {
        setPendingLog(null);
        setSafetyCheck(null);
        setShowWarning(false);
        setIsExpanded(false);
      } else {
        setSafetyCheck(result.safetyCheck);
      }
    });
  }

  // Listen for "/" key to expand
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !isExpanded && document.activeElement === document.body) {
        e.preventDefault();
        setIsExpanded(true);
      } else if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Collapsed trigger view
  if (!isExpanded) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group relative w-full rounded-lg border border-primary/20 bg-card/50 px-4 py-3 text-left transition-all hover:border-primary/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        >
          {/* Breathing border animation */}
          <div className="absolute inset-0 rounded-lg border border-primary/10 animate-pulse" />

          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-primary/60" />
            <span className="font-mono text-sm text-muted-foreground transition-opacity">
              {PROMPTS[placeholderIndex]}
            </span>
          </div>

          {/* Keyboard hint */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <kbd className="hidden rounded border border-border/40 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              /
            </kbd>
          </div>
        </button>

        <ToxicityWarningDialog
          open={showWarning}
          onOpenChange={setShowWarning}
          safetyCheck={safetyCheck}
          onProceed={handleWarningProceed}
          onCancel={handleWarningCancel}
          isProceedPending={isPending}
        />
      </>
    );
  }

  // Expanded command bar view
  return (
    <>
      <div className="relative rounded-lg border border-primary/30 bg-card/50 p-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <kbd className="rounded border border-border/40 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">
            ESC
          </kbd>
        </button>

        <CommandBar supplements={supplements} onLog={handleLog} />
      </div>

      <ToxicityWarningDialog
        open={showWarning}
        onOpenChange={setShowWarning}
        safetyCheck={safetyCheck}
        onProceed={handleWarningProceed}
        onCancel={handleWarningCancel}
        isProceedPending={isPending}
      />
    </>
  );
}
