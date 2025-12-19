"use client";

import { useState, useCallback } from "react";
import { FlaskConical } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

const STORAGE_KEY = "hasAcknowledgedResearchRisks";

/**
 * Hook to check if user has acknowledged research compound risks.
 * Returns a function to show the dialog if acknowledgment is needed.
 */
export function useResearchDisclaimer() {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(
    null,
  );

  const checkAndProceed = useCallback((onProceed: () => void) => {
    // Check localStorage for previous acknowledgment
    if (typeof window !== "undefined") {
      const hasAcknowledged = localStorage.getItem(STORAGE_KEY) === "true";

      if (hasAcknowledged) {
        // Already acknowledged, proceed immediately
        onProceed();
      } else {
        // Show dialog and save callback for after acknowledgment
        setPendingCallback(() => onProceed);
        setShowDialog(true);
      }
    }
  }, []);

  const handleAcknowledge = useCallback(() => {
    // Save acknowledgment to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }

    // Close dialog
    setShowDialog(false);

    // Execute pending callback
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setPendingCallback(null);
  }, []);

  return {
    showDialog,
    checkAndProceed,
    handleAcknowledge,
    handleCancel,
  };
}

type ResearchDisclaimerDialogProps = {
  open: boolean;
  onAcknowledge: () => void;
  onCancel: () => void;
};

export function ResearchDisclaimerDialog({
  open,
  onAcknowledge,
  onCancel,
}: ResearchDisclaimerDialogProps) {
  // Prevent closing by clicking outside or pressing escape
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <FlaskConical className="h-6 w-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center">
            Research Compound Notice
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2 text-center">
            <p>
              You are logging a compound categorized as a{" "}
              <strong>Research Chemical</strong>.
            </p>
            <p>
              This app tracks data for personal reference only and does not
              provide medical advice or endorse usage.
            </p>
            <p className="text-amber-500/80">
              These compounds may not be approved for human consumption.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 sm:justify-center">
          <Button onClick={onAcknowledge} className="w-full sm:w-auto">
            I Acknowledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Provider component that wraps the app and provides the disclaimer dialog.
 * Use the `useResearchDisclaimerContext` hook to access the `checkAndProceed` function.
 */
export function ResearchDisclaimerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showDialog, handleAcknowledge, handleCancel } =
    useResearchDisclaimer();

  return (
    <>
      {children}
      <ResearchDisclaimerDialog
        open={showDialog}
        onAcknowledge={handleAcknowledge}
        onCancel={handleCancel}
      />
    </>
  );
}
