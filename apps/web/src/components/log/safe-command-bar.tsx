"use client";

import { useState, useTransition } from "react";
import { CommandBar } from "~/components/log/command-bar";
import { ToxicityWarningDialog } from "~/components/ui/toxicity-warning-dialog";
import { createLog, type CreateLogResult } from "~/server/actions/logs";
import { type SafetyCheckResult } from "~/server/services/safety";

type Supplement = {
  id: string;
  name: string;
  form: string | null;
};

type SafeCommandBarProps = {
  supplements: Supplement[];
};

type PendingLog = {
  supplementId: string;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
};

export function SafeCommandBar({ supplements }: SafeCommandBarProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingLog, setPendingLog] = useState<PendingLog | null>(null);
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheckResult | null>(
    null,
  );
  const [showWarning, setShowWarning] = useState(false);

  async function handleLog(
    supplementId: string,
    dosage: number,
    unit: "mg" | "mcg" | "g" | "IU" | "ml",
  ): Promise<void> {
    // Store the pending log details in case we need to retry with override
    setPendingLog({ supplementId, dosage, unit });

    const result: CreateLogResult = await createLog(supplementId, dosage, unit);

    if (result.success) {
      // Clear pending state
      setPendingLog(null);
      setSafetyCheck(null);
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
      const result = await createLog(
        pendingLog.supplementId,
        pendingLog.dosage,
        pendingLog.unit,
        undefined, // loggedAt
        true, // forceOverride
      );

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
