"use client";

import { Check, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";

type WelcomeStepProps = {
  onNext: () => void;
};

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="font-mono text-2xl font-bold">
            Welcome to <span className="text-primary">Stochi</span>
          </h2>
          <p className="text-muted-foreground">
            Build your full-day supplement protocol with clear timing and safety
            checks.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <FeatureItem text="Plan morning, afternoon, evening, and bedtime slots" />
          <FeatureItem text="Log your whole protocol or individual time slots" />
          <FeatureItem text="Detect harmful interactions automatically" />
          <FeatureItem text="Find beneficial synergies across your protocol" />
          <FeatureItem text="Get smart suggestions for optimization" />
        </div>
      </div>

      <div className="shrink-0 pt-6">
        <Button onClick={onNext} className="w-full font-mono" size="lg">
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-md px-4 py-3">
      <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
        <Check className="text-primary h-3.5 w-3.5" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
