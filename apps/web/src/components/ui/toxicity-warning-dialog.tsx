"use client";

import { AlertTriangle, XOctagon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { type SafetyCheckResult } from "~/server/services/safety";

type ToxicityWarningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  safetyCheck: SafetyCheckResult | null;
  /** Called when user clicks "Proceed Anyway" (only for soft limits) */
  onProceed?: () => void;
  /** Called when user clicks "Cancel" or closes the dialog */
  onCancel?: () => void;
  /** Loading state for the proceed button */
  isProceedPending?: boolean;
};

export function ToxicityWarningDialog({
  open,
  onOpenChange,
  safetyCheck,
  onProceed,
  onCancel,
  isProceedPending = false,
}: ToxicityWarningDialogProps) {
  if (!safetyCheck) return null;

  const isHardLimit = safetyCheck.isHardLimit;
  const categoryDisplay = safetyCheck.category
    ? safetyCheck.category
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Unknown";

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleProceed = () => {
    onProceed?.();
    // Don't close here - let the parent handle it after the action completes
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isHardLimit ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <XOctagon className="h-5 w-5 text-destructive" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            )}
            <DialogTitle className="text-left">
              {isHardLimit ? "Dosage Blocked" : "Dosage Warning"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-left">
            {safetyCheck.message}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted/50 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">
                Category
              </p>
              <p className="mt-1 font-medium">{categoryDisplay}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">
                Daily Limit
              </p>
              <p className="mt-1 font-medium">
                {safetyCheck.limit}
                {safetyCheck.unit}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">
                Your Total
              </p>
              <p className="mt-1 font-medium">
                {Math.round(safetyCheck.currentTotal * 10) / 10}
                {safetyCheck.unit}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">
                % of Limit
              </p>
              <p
                className={`mt-1 font-medium ${
                  safetyCheck.percentOfLimit > 100
                    ? "text-destructive"
                    : safetyCheck.percentOfLimit > 80
                      ? "text-amber-500"
                      : ""
                }`}
              >
                {safetyCheck.percentOfLimit}%
              </p>
            </div>
          </div>
          {safetyCheck.source && (
            <p className="mt-3 text-xs text-muted-foreground">
              Source: {safetyCheck.source}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {!isHardLimit && onProceed && (
            <Button
              variant="destructive"
              onClick={handleProceed}
              disabled={isProceedPending}
            >
              {isProceedPending ? "Logging..." : "Proceed Anyway"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
