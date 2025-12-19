"use client";

import { Check, X, Minus } from "lucide-react";

/**
 * CapabilityTable - Technical comparison between Stochi, Generic Apps, and Spreadsheets
 *
 * Demonstrates Stochi's unique capabilities in a scannable format.
 * Uses checkmarks/x-marks for quick visual parsing.
 */

type FeatureSupport = "full" | "partial" | "none";

interface Feature {
  name: string;
  description?: string;
  stochi: FeatureSupport;
  genericApps: FeatureSupport;
  spreadsheet: FeatureSupport;
}

const FEATURES: Feature[] = [
  {
    name: "Peptide Routes",
    description: "SubQ, IM, Intranasal",
    stochi: "full",
    genericApps: "none",
    spreadsheet: "none",
  },
  {
    name: "Bioavailability Math",
    description: "Elemental weight calculations",
    stochi: "full",
    genericApps: "none",
    spreadsheet: "none",
  },
  {
    name: "Interaction Database",
    description: "89,412 pairs",
    stochi: "full",
    genericApps: "partial",
    spreadsheet: "none",
  },
  {
    name: "Zn:Cu Ratio Detection",
    description: "Real-time monitoring",
    stochi: "full",
    genericApps: "none",
    spreadsheet: "none",
  },
  {
    name: "Serotonergic Stacking Alerts",
    description: "5-HTP, SSRIs, Ashwagandha",
    stochi: "full",
    genericApps: "none",
    spreadsheet: "none",
  },
  {
    name: "Upper Limit Tracking",
    description: "NIH-sourced UL values",
    stochi: "full",
    genericApps: "partial",
    spreadsheet: "none",
  },
  {
    name: "Protocol Batching",
    description: "One-tap multi-supplement logging",
    stochi: "full",
    genericApps: "partial",
    spreadsheet: "none",
  },
  {
    name: "Research Chemical Support",
    description: "Experimental compounds",
    stochi: "full",
    genericApps: "none",
    spreadsheet: "partial",
  },
];

function SupportIcon({ support }: { support: FeatureSupport }) {
  switch (support) {
    case "full":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#39FF14]/10">
          <Check className="h-3 w-3 text-[#39FF14]" strokeWidth={3} />
        </div>
      );
    case "partial":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F0A500]/10">
          <Minus className="h-3 w-3 text-[#F0A500]" strokeWidth={3} />
        </div>
      );
    case "none":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B6B]/10">
          <X className="h-3 w-3 text-[#FF6B6B]" strokeWidth={3} />
        </div>
      );
  }
}

export function CapabilityTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#30363D] bg-[#0D1117]">
      <div className="min-w-[480px]">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 border-b border-[#30363D] bg-[#161B22] px-4 py-3">
          <div className="font-mono text-[10px] tracking-widest text-[#A8B1BB] uppercase">
            Feature
          </div>
          <div className="text-center font-mono text-[10px] tracking-widest text-[#39FF14] uppercase">
            Stochi
          </div>
          <div className="text-center font-mono text-[10px] tracking-widest text-[#A8B1BB] uppercase">
            Generic Apps
          </div>
          <div className="text-center font-mono text-[10px] tracking-widest text-[#A8B1BB] uppercase">
            Spreadsheet
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#30363D]/50">
          {FEATURES.map((feature) => (
            <div
              key={feature.name}
              className="grid grid-cols-4 gap-4 px-4 py-3 transition-colors hover:bg-[#161B22]/50"
            >
              <div>
                <p className="font-mono text-xs font-medium text-[#E6EDF3]">
                  {feature.name}
                </p>
                {feature.description && (
                  <p className="mt-0.5 text-[10px] text-[#A8B1BB]">
                    {feature.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center">
                <SupportIcon support={feature.stochi} />
              </div>
              <div className="flex items-center justify-center">
                <SupportIcon support={feature.genericApps} />
              </div>
              <div className="flex items-center justify-center">
                <SupportIcon support={feature.spreadsheet} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between border-t border-[#30363D] bg-[#161B22] px-4 py-2">
          <span className="font-mono text-[10px] text-[#A8B1BB]">
            <span className="text-[#39FF14]">8</span>/8 features
          </span>
          <span className="font-mono text-[10px] text-[#A8B1BB]/50">
            Updated Dec 2025
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * CapabilityTableCompact - Smaller version for tighter layouts
 */
export function CapabilityTableCompact() {
  const keyFeatures = FEATURES.slice(0, 5);

  return (
    <div className="space-y-2">
      {keyFeatures.map((feature) => (
        <div
          key={feature.name}
          className="flex items-center justify-between rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <SupportIcon support={feature.stochi} />
            <span className="font-mono text-xs text-[#E6EDF3]">
              {feature.name}
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span className="text-[#A8B1BB]/50">Generic: </span>
            <SupportIcon support={feature.genericApps} />
          </div>
        </div>
      ))}
    </div>
  );
}
