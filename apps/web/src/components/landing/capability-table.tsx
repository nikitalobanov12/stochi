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
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
        </div>
      );
    case "partial":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10">
          <Minus className="h-3 w-3 text-amber-400" strokeWidth={3} />
        </div>
      );
    case "none":
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10">
          <X className="h-3 w-3 text-red-400" strokeWidth={3} />
        </div>
      );
  }
}

export function CapabilityTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0A0A0A]">
      <div className="min-w-[480px]">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-medium tracking-widest text-white/40 uppercase">
            Feature
          </div>
          <div className="text-center text-[10px] font-medium tracking-widest text-emerald-400 uppercase">
            Stochi
          </div>
          <div className="text-center text-[10px] font-medium tracking-widest text-white/40 uppercase">
            Generic Apps
          </div>
          <div className="text-center text-[10px] font-medium tracking-widest text-white/40 uppercase">
            Spreadsheet
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {FEATURES.map((feature) => (
            <div
              key={feature.name}
              className="grid grid-cols-4 gap-4 px-4 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <div>
                <p className="text-xs font-medium text-white/90">
                  {feature.name}
                </p>
                {feature.description && (
                  <p className="mt-0.5 text-[10px] text-white/40">
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
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-2">
          <span className="font-mono text-[10px] text-white/50">
            <span className="text-emerald-400">8</span>/8 features
          </span>
          <span className="font-mono text-[10px] text-white/30">
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
          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <SupportIcon support={feature.stochi} />
            <span className="text-xs text-white/90">{feature.name}</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span className="text-white/30">Generic: </span>
            <SupportIcon support={feature.genericApps} />
          </div>
        </div>
      ))}
    </div>
  );
}
