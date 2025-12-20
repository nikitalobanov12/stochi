"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { AlertTriangle, ShieldAlert, ChevronDown } from "lucide-react";

/**
 * RiskCardCompact - Condensed risk cards for Bento grid integration
 *
 * Features:
 * - Compact display with expandable details
 * - Danger/Warning severity levels
 * - PMID citation links
 * - No UUIDs or sensitive data
 */

type RiskSeverity = "danger" | "warning";

type RiskItem = {
  id: string;
  severity: RiskSeverity;
  label: string;
  title: string;
  description: string;
  detection: string;
  recommendation: string;
  pmid: string;
};

const DEMO_RISKS: RiskItem[] = [
  {
    id: "zinc-copper",
    severity: "danger",
    label: "Absorption Block",
    title: "Zinc depleting Copper stores",
    description:
      "High-dose Zinc (30mg+) without Copper causes gradual depletion. Symptoms: fatigue, anemia, neurological issues.",
    detection: "Zn:Cu ratio exceeds 15:1",
    recommendation: "Add 2mg Copper per 30mg Zinc",
    pmid: "9701160",
  },
  {
    id: "serotonin-stack",
    severity: "danger",
    label: "Pharmacodynamic Risk",
    title: "Serotonergic compound stacking",
    description:
      "Ashwagandha, 5-HTP, St. John's Wort enhance serotonin. Combined with SSRIs, risk of serotonin syndrome.",
    detection: "Multiple serotonergic agents",
    recommendation: "Physician review required",
    pmid: "26437231",
  },
  {
    id: "fat-soluble",
    severity: "warning",
    label: "Half-Life Conflict",
    title: "Fat-soluble vitamin timing",
    description:
      "Vitamin D, K, E, A require dietary fat for absorption. Empty stomach reduces bioavailability by ~50%.",
    detection: "D3/K2 logged without meal",
    recommendation: "Take with fatty meal",
    pmid: "20200983",
  },
];

const SEVERITY_STYLES: Record<
  RiskSeverity,
  {
    border: string;
    bg: string;
    text: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  danger: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-400",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    label: "CRITICAL",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    label: "WARNING",
  },
};

type RiskCardCompactProps = {
  className?: string;
  /** Number of risks to show (default: 3) */
  limit?: number;
};

export function RiskCardCompact({ className, limit = 3 }: RiskCardCompactProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const risks = DEMO_RISKS.slice(0, limit);

  return (
    <div className={cn("h-full", className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/90">Risk Detection</h3>
        <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-400">
          {risks.filter((r) => r.severity === "danger").length} critical
        </span>
      </div>

      {/* Risk list */}
      <div className="space-y-2">
        {risks.map((risk) => (
          <RiskItemCard
            key={risk.id}
            risk={risk}
            isExpanded={expandedId === risk.id}
            onToggle={() =>
              setExpandedId(expandedId === risk.id ? null : risk.id)
            }
          />
        ))}
      </div>

      {/* Footer */}
      <p className="mt-3 text-center text-[10px] text-white/30">
        Real-time pharmacokinetic analysis
      </p>
    </div>
  );
}

type RiskItemCardProps = {
  risk: RiskItem;
  isExpanded: boolean;
  onToggle: () => void;
};

function RiskItemCard({ risk, isExpanded, onToggle }: RiskItemCardProps) {
  const styles = SEVERITY_STYLES[risk.severity];

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200",
        styles.border,
        styles.bg
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 p-2.5 text-left"
        aria-expanded={isExpanded}
      >
        <span className={cn("shrink-0", styles.text)}>{styles.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn("font-mono text-[9px] tracking-wider", styles.text)}
            >
              {styles.label}
            </span>
            <span className="truncate text-[11px] font-medium text-white/90">
              {risk.title}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200 border-t border-white/[0.06] px-2.5 pb-2.5 pt-2">
          <p className="mb-2 text-[11px] text-white/50">{risk.description}</p>

          {/* Detection & Recommendation */}
          <div className="space-y-1 rounded bg-black/30 p-2 font-mono text-[10px]">
            <div className="flex items-start gap-1.5">
              <span className={cn("shrink-0", styles.text)}>⚠</span>
              <span className="text-white/80">{risk.detection}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 text-emerald-400">→</span>
              <span className="text-white/50">{risk.recommendation}</span>
            </div>
          </div>

          {/* Citation */}
          <div className="mt-2 flex justify-end">
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${risk.pmid}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] text-white/30 transition-colors hover:text-emerald-400"
            >
              [PMID:{risk.pmid}]
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
