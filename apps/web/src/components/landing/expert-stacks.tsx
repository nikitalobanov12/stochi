"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import {
  Beaker,
  Brain,
  Moon,
  Sparkles,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

/**
 * ExpertStacks - Landing page component showcasing expert-backed supplement protocols
 *
 * Features:
 * - Real protocol data from Huberman, Sinclair, Attia
 * - EXPERT/RESEARCH badges for authority signaling
 * - Hover-to-expand supplement details
 * - No UUIDs or sensitive data
 */

type ExpertStack = {
  id: string;
  name: string;
  source: string;
  sourceType: "expert" | "research" | "clinical";
  description: string;
  icon: React.ReactNode;
  supplements: Array<{
    name: string;
    dosage: string;
  }>;
  synergies: number;
  timing?: string;
};

const EXPERT_STACKS: ExpertStack[] = [
  {
    id: "huberman-sleep",
    name: "Sleep Cocktail",
    source: "Huberman Lab",
    sourceType: "expert",
    description: "GABA-ergic sleep architecture optimization",
    icon: <Moon className="h-4 w-4" />,
    supplements: [
      { name: "Magnesium Threonate", dosage: "145mg" },
      { name: "L-Theanine", dosage: "200mg" },
      { name: "Apigenin", dosage: "50mg" },
    ],
    synergies: 2,
    timing: "30-60 min before bed",
  },
  {
    id: "sinclair-longevity",
    name: "Longevity Core",
    source: "Sinclair / Attia",
    sourceType: "research",
    description: "NAD+ precursor + sirtuin activation",
    icon: <Sparkles className="h-4 w-4" />,
    supplements: [
      { name: "NMN", dosage: "500mg" },
      { name: "Resveratrol", dosage: "500mg" },
      { name: "Quercetin", dosage: "500mg" },
    ],
    synergies: 1,
    timing: "Morning with fat source",
  },
  {
    id: "huberman-focus",
    name: "Dopamine Focus",
    source: "Huberman Lab",
    sourceType: "expert",
    description: "Catecholamine precursor stack",
    icon: <Brain className="h-4 w-4" />,
    supplements: [
      { name: "L-Tyrosine", dosage: "500mg" },
      { name: "Alpha-GPC", dosage: "300mg" },
      { name: "Caffeine", dosage: "100mg" },
    ],
    synergies: 1,
    timing: "30 min before work",
  },
  {
    id: "examine-cognitive",
    name: "Cognitive Stack",
    source: "Examine.com",
    sourceType: "research",
    description: "Racetam-free nootropic foundation",
    icon: <FlaskConical className="h-4 w-4" />,
    supplements: [
      { name: "Lion's Mane", dosage: "500mg" },
      { name: "Bacopa Monnieri", dosage: "300mg" },
      { name: "Phosphatidylserine", dosage: "100mg" },
    ],
    synergies: 2,
    timing: "With breakfast",
  },
];

const SOURCE_BADGE_STYLES: Record<ExpertStack["sourceType"], string> = {
  expert: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  research: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  clinical: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const SOURCE_BADGE_LABELS: Record<ExpertStack["sourceType"], string> = {
  expert: "EXPERT",
  research: "RESEARCH",
  clinical: "CLINICAL",
};

type ExpertStacksProps = {
  className?: string;
  /** Number of stacks to show (default: 4) */
  limit?: number;
};

export function ExpertStacks({ className, limit = 4 }: ExpertStacksProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const stacks = EXPERT_STACKS.slice(0, limit);

  return (
    <div className={cn("h-full", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/90">Expert Protocols</h3>
        <div className="flex items-center gap-1.5">
          <Beaker className="h-3.5 w-3.5 text-white/30" />
          <span className="font-mono text-[10px] text-white/30">
            {stacks.length} stacks
          </span>
        </div>
      </div>

      {/* Stacks list */}
      <div className="space-y-2">
        {stacks.map((stack) => (
          <ExpertStackCard
            key={stack.id}
            stack={stack}
            isExpanded={expandedId === stack.id}
            onToggle={() =>
              setExpandedId(expandedId === stack.id ? null : stack.id)
            }
          />
        ))}
      </div>

      {/* Footer CTA hint */}
      <p className="mt-3 text-center text-[10px] text-white/30">
        One-click import • Interaction analysis included
      </p>
    </div>
  );
}

type ExpertStackCardProps = {
  stack: ExpertStack;
  isExpanded: boolean;
  onToggle: () => void;
};

function ExpertStackCard({
  stack,
  isExpanded,
  onToggle,
}: ExpertStackCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-left transition-all duration-200",
        "hover:border-white/15 hover:bg-white/[0.04]",
        isExpanded && "border-white/15 bg-white/[0.04]"
      )}
      aria-expanded={isExpanded}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-white/50">{stack.icon}</span>
          <div>
            <span className="text-sm font-medium text-white/90">
              {stack.name}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 font-mono text-[9px]",
                  SOURCE_BADGE_STYLES[stack.sourceType]
                )}
              >
                {SOURCE_BADGE_LABELS[stack.sourceType]}
              </span>
              <span className="text-[10px] text-white/30">{stack.source}</span>
            </div>
          </div>
        </div>

        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-white/30 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </div>

      {/* Collapsed summary */}
      {!isExpanded && (
        <p className="mt-2 text-[11px] text-white/30">{stack.description}</p>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="mb-2 text-[11px] text-white/50">{stack.description}</p>

          {/* Supplements */}
          <div className="space-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-2">
            {stack.supplements.map((supp) => (
              <div
                key={supp.name}
                className="flex items-center justify-between"
              >
                <span className="text-[11px] text-white/50">{supp.name}</span>
                <span className="font-mono text-[10px] text-white/30">
                  {supp.dosage}
                </span>
              </div>
            ))}
          </div>

          {/* Meta info */}
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-emerald-500">
              {stack.synergies} {stack.synergies === 1 ? "synergy" : "synergies"}{" "}
              detected
            </span>
            {stack.timing && (
              <span className="text-white/30">{stack.timing}</span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
