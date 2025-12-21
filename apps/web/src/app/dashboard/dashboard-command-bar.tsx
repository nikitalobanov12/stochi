"use client";

import { useState, useTransition, useEffect } from "react";
import { Search } from "lucide-react";
import { CommandBar, type LogOptions } from "~/components/log/command-bar";
import { ToxicityWarningDialog } from "~/components/ui/toxicity-warning-dialog";
import { createLog, type CreateLogResult } from "~/server/actions/logs";
import { type SafetyCheckResult } from "~/server/services/safety";
import { type routeEnum } from "~/server/db/schema";

type RouteOfAdministration = (typeof routeEnum.enumValues)[number];

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  route?: RouteOfAdministration | null;
  isResearchChemical?: boolean | null;
  safetyCategory?: string | null;
};

type DashboardCommandBarProps = {
  supplements: Supplement[];
};

type PendingLog = LogOptions;

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
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheckResult | null>(
    null,
  );
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

  async function handleLog(options: LogOptions): Promise<void> {
    setPendingLog(options);

    const result: CreateLogResult = await createLog({
      supplementId: options.supplementId,
      dosage: options.dosage,
      unit: options.unit,
      route: options.route,
      mealContext: options.mealContext,
    });

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
      const result = await createLog({
        supplementId: pendingLog.supplementId,
        dosage: pendingLog.dosage,
        unit: pendingLog.unit,
        route: pendingLog.route,
        mealContext: pendingLog.mealContext,
        forceOverride: true,
      });

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
      if (
        e.key === "/" &&
        !isExpanded &&
        document.activeElement === document.body
      ) {
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
          className="group relative w-full rounded-xl border border-emerald-500/20 bg-[#0A0A0A] px-4 py-3 text-left transition-all hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
        >
          {/* Breathing border animation */}
          <div className="absolute inset-0 animate-pulse rounded-xl border border-emerald-500/10" />

          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-emerald-500/60" />
            <span className="font-mono text-sm text-white/40 transition-opacity">
              {PROMPTS[placeholderIndex]}
            </span>
          </div>

          {/* Keyboard hint */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <kbd className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40 sm:inline-block">
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
      <div className="relative rounded-xl border border-emerald-500/30 bg-[#0A0A0A] p-3 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="absolute right-2 top-2 rounded p-1 text-white/40 hover:bg-white/5 hover:text-white/60"
        >
          <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px]">
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
