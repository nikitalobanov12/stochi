"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { StepIndicator } from "./step-indicator";
import { WelcomeStep } from "./steps/welcome-step";
import { GoalStep } from "./steps/goal-step";
import { BuildStackStep, type SelectedSupplement } from "./steps/build-stack-step";
import { InteractionsStep } from "./steps/interactions-step";
import { createStackFromOnboarding } from "~/server/actions/onboarding";
import { type GoalKey } from "~/server/data/goal-recommendations";

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: "mg" | "mcg" | "g" | "IU" | "ml" | null;
};

type WelcomeFlowProps = {
  open: boolean;
  supplements: Supplement[];
};

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function WelcomeFlow({ open, supplements }: WelcomeFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<GoalKey | null>(null);
  const [selectedSupplements, setSelectedSupplements] = useState<SelectedSupplement[]>([]);
  const [stackName, setStackName] = useState("Morning Stack");

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleGoalNext = useCallback((goalKey: GoalKey | null) => {
    setSelectedGoal(goalKey);
    goNext();
  }, [goNext]);

  const handleGoalSkip = useCallback(() => {
    setSelectedGoal(null);
    goNext();
  }, [goNext]);

  const handleAddSupplement = useCallback((supplement: SelectedSupplement) => {
    setSelectedSupplements((prev) => [...prev, supplement]);
  }, []);

  const handleComplete = useCallback(async () => {
    const result = await createStackFromOnboarding({
      stackName,
      supplements: selectedSupplements.map((s) => ({
        supplementId: s.id,
        dosage: s.dosage,
        unit: s.unit,
      })),
      goal: selectedGoal ?? undefined,
    });

    if (result.success) {
      router.refresh();
    }
  }, [stackName, selectedSupplements, selectedGoal, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background sm:bg-background/80 sm:backdrop-blur-sm">
      <div className="relative flex h-full w-full flex-col bg-background sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:rounded-xl sm:border sm:shadow-xl lg:max-w-xl">
        {/* Close button - only show after first step */}
        {step > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 h-8 w-8"
            onClick={() => {
              // Could add confirmation dialog here if needed
              router.refresh();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Step indicator - fixed at top */}
        <div className="shrink-0 pt-4">
          <StepIndicator current={step} total={TOTAL_STEPS} />
        </div>

        {/* Content area with animations - scrollable */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="h-full"
            >
              {step === 0 && <WelcomeStep onNext={goNext} />}
              {step === 1 && (
                <GoalStep
                  onNext={handleGoalNext}
                  onSkip={handleGoalSkip}
                  onBack={goBack}
                />
              )}
              {step === 2 && (
                <BuildStackStep
                  supplements={supplements}
                  selectedGoal={selectedGoal}
                  selected={selectedSupplements}
                  stackName={stackName}
                  onChangeSupplements={setSelectedSupplements}
                  onChangeStackName={setStackName}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}
              {step === 3 && (
                <InteractionsStep
                  supplements={selectedSupplements}
                  allSupplements={supplements}
                  onAddSupplement={handleAddSupplement}
                  onComplete={handleComplete}
                  onBack={goBack}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
