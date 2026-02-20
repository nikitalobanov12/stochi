"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

type ExperienceOption = {
  key: ExperienceLevel;
  icon: string;
  name: string;
  description: string;
  examples: string;
};

const experienceOptions: ExperienceOption[] = [
  {
    key: "beginner",
    icon: "🌱",
    name: "Beginner",
    description:
      "New to supplements or just starting to build a routine. Prefer simple, well-studied options.",
    examples: "Vitamin D, Magnesium, Fish Oil",
  },
  {
    key: "intermediate",
    icon: "🧪",
    name: "Intermediate",
    description:
      "Familiar with common supplements and comfortable with more targeted stacking strategies.",
    examples: "Lion's Mane, NAC, Alpha-GPC",
  },
  {
    key: "advanced",
    icon: "🔬",
    name: "Advanced",
    description:
      "Experienced bio-hacker comfortable with research chemicals, peptides, and experimental protocols.",
    examples: "BPC-157, Semax, Noopept",
  },
];

type ExperienceStepProps = {
  onNext: (level: ExperienceLevel) => void;
  onSkip: () => void;
  onBack: () => void;
};

export function ExperienceStep({
  onNext,
  onSkip,
  onBack,
}: ExperienceStepProps) {
  const [selected, setSelected] = useState<ExperienceLevel | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div className="space-y-2">
          <h2 className="font-mono text-xl font-bold">
            What&apos;s your experience level?
          </h2>
          <p className="text-muted-foreground text-sm">
            This helps us tailor suggestions to your comfort level. You can
            change this anytime in settings.
          </p>
        </div>

        <div className="space-y-2 pb-4">
          {experienceOptions.map((option) => (
            <ExperienceCard
              key={option.key}
              option={option}
              selected={selected === option.key}
              onSelect={() => setSelected(option.key)}
            />
          ))}
        </div>
      </div>

      <div className="border-border/40 flex shrink-0 items-center gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          onClick={onSkip}
          size="sm"
          className="text-muted-foreground"
        >
          Skip
        </Button>
        <Button
          onClick={() => selected && onNext(selected)}
          disabled={!selected}
          size="sm"
        >
          Continue
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ExperienceCard({
  option,
  selected,
  onSelect,
}: {
  option: ExperienceOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border-2 p-3 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "bg-muted/50 hover:border-muted-foreground/30 border-transparent",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{option.icon}</span>
        <div className="flex-1">
          <div className="font-medium">{option.name}</div>
          <div className="text-muted-foreground text-xs">
            {option.description}
          </div>
          <div className="text-muted-foreground mt-1 font-mono text-[10px]">
            e.g. {option.examples}
          </div>
        </div>
        {selected && (
          <div className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
    </button>
  );
}
