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
            Track your supplements and discover interactions between them.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <FeatureItem text="Log supplements quickly with one tap" />
          <FeatureItem text="Detect harmful interactions automatically" />
          <FeatureItem text="Find beneficial synergies in your stack" />
          <FeatureItem text="Get smart suggestions for optimization" />
        </div>
      </div>

      <div className="pt-6">
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
    <div className="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
