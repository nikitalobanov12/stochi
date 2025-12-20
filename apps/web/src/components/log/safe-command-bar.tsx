"use client";

import { useState, useTransition } from "react";
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

type SafeCommandBarProps = {
  supplements: Supplement[];
};

type PendingLog = LogOptions;

export function SafeCommandBar({ supplements }: SafeCommandBarProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingLog, setPendingLog] = useState<PendingLog | null>(null);
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheckResult | null>(
    null,
  );
  const [showWarning, setShowWarning] = useState(false);

  async function handleLog(options: LogOptions): Promise<void> {
    // Store the pending log details in case we need to retry with override
    setPendingLog(options);

    const result: CreateLogResult = await createLog({
      supplementId: options.supplementId,
      dosage: options.dosage,
      unit: options.unit,
      route: options.route,
      mealContext: options.mealContext,
    });

    if (result.success) {
      // Clear pending state
      setPendingLog(null);
      setSafetyCheck(null);
      // Note: mealContextWarning is informational only, not blocking
      return;
    }

    // Safety check failed - show warning dialog
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
      // Retry with force override (soft limits only)
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
      } else {
        // This shouldn't happen for soft limits, but handle it anyway
        setSafetyCheck(result.safetyCheck);
      }
    });
  }

  return (
    <>
      <CommandBar supplements={supplements} onLog={handleLog} />
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
