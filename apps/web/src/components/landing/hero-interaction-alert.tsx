"use client";

import { AlertTriangle, ArrowRight, Clock, Scale, Zap } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * HeroInteractionAlert - Attio-inspired warning display for the landing page hero
 *
 * Design updates (Attio aesthetic):
 * - Translucent card with backdrop blur
 * - Softer gradients and glows
 * - Clean sans-serif typography (mono only for data)
 * - Off-center asymmetric positioning option
 * - Reduced visual noise
 */
export function HeroInteractionAlert() {
  return (
    <div
      className="relative mx-auto w-full max-w-2xl"
      role="img"
      aria-label="Live interaction analysis showing a critical Zinc/Copper ratio warning with actionable recommendations"
    >
      {/* Main card - Surgical Precision style */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl">
        {/* Top edge highlight */}
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden="true"
        />

        {/* Soft radial glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(255,107,107,0.08) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />

        {/* Top bar with "LIVE ANALYSIS" indicator */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </div>
            <span className="text-xs font-medium tracking-wide text-white/50">
              Live Analysis
            </span>
          </div>
          <span className="hidden font-mono text-[10px] text-white/30 sm:block">
            stack_audit.exe
          </span>
        </div>

        {/* Main content area */}
        <div className="relative p-4 sm:p-5" aria-hidden="true">
          {/* CRITICAL WARNING - Primary focus */}
          <div className="mb-4 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/[0.06]">
            {/* Warning header */}
            <div className="flex items-center gap-3 border-b border-red-500/10 bg-red-500/[0.04] px-4 py-3">
              <div className="relative shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-red-400">
                  Critical: Absorption Blocked
                </span>
              </div>
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/9701160/"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-400/80 transition-colors hover:bg-red-500/20 hover:text-red-400"
              >
                PMID:9701160
              </a>
            </div>

            {/* Warning body */}
            <div className="space-y-3 p-4">
              {/* The conflict */}
              <div className="flex items-start gap-3">
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-red-400/70" />
                <div className="min-w-0">
                  <p className="text-sm text-white/90">
                    <span className="font-mono font-medium text-red-400">
                      Zinc (50mg)
                    </span>{" "}
                    is blocking{" "}
                    <span className="font-mono font-medium text-red-400">
                      Copper
                    </span>{" "}
                    absorption
                  </p>
                  <p className="mt-1.5 text-xs text-white/50">
                    Current ratio:{" "}
                    <span className="font-mono font-semibold text-red-400">
                      50:0
                    </span>{" "}
                    — Optimal:{" "}
                    <span className="font-mono font-medium text-emerald-400">
                      8:1 – 15:1
                    </span>
                  </p>
                </div>
              </div>

              {/* The consequence */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs leading-relaxed text-white/50">
                  <span className="font-medium text-white/80">Risk:</span>{" "}
                  Copper depletion appears after 2-4 months — fatigue, anemia,
                  neurological issues.
                </p>
              </div>

              {/* The solution - HIGH VISIBILITY */}
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] p-3">
                <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">
                  Add 2mg Copper or stagger by 4 hours
                </p>
              </div>
            </div>
          </div>

          {/* Secondary alerts row */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Timing warning */}
            <SecondaryAlert
              icon={<Clock className="h-4 w-4" />}
              type="warning"
              title="D3 + K2 Timing"
              description="Fat-soluble. Take with meal."
            />

            {/* Synergy detected */}
            <SecondaryAlert
              icon={<Zap className="h-4 w-4" />}
              type="synergy"
              title="Caffeine + L-Theanine"
              description="Synergy. Theanine smooths jitters."
            />
          </div>

          {/* Footer stats bar */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/10 pt-4 text-xs text-white/30">
            <span>
              <span className="font-mono text-emerald-400">89,412</span> pairs
            </span>
            <span className="text-white/10">•</span>
            <span>
              <span className="font-mono text-emerald-400">1,423</span>{" "}
              compounds
            </span>
            <span className="hidden text-white/10 sm:inline">•</span>
            <span className="hidden font-mono sm:inline">47ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Secondary alert component for consistent styling
 */
function SecondaryAlert({
  icon,
  type,
  title,
  description,
}: {
  icon: React.ReactNode;
  type: "warning" | "synergy";
  title: string;
  description: string;
}) {
  const styles = {
    warning: {
      border: "border-amber-500/20",
      bg: "bg-amber-500/[0.06]",
      iconColor: "text-amber-400",
    },
    synergy: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/[0.06]",
      iconColor: "text-emerald-400",
    },
  };

  const s = styles[type];

  return (
    <div className={cn("rounded-xl border p-3", s.border, s.bg)}>
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-0.5 shrink-0", s.iconColor)}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/90">{title}</p>
          <p className="mt-0.5 text-[11px] text-white/50">{description}</p>
        </div>
      </div>
    </div>
  );
}
