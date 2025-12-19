"use client";

import { AlertTriangle, ArrowRight, Clock, Scale, Zap } from "lucide-react";

/**
 * HeroInteractionAlert - High-contrast warning display for the landing page hero
 *
 * Replaces the generic dashboard preview with a focused "conflict/synergy diagnostic"
 * that demonstrates the core value proposition: detecting dangerous interactions.
 *
 * Design requirements:
 * - Warning occupies 40%+ of visual real estate
 * - High contrast red/amber for immediate attention
 * - Specific, actionable recommendation
 * - Pulse animation to draw eye
 */
export function HeroInteractionAlert() {
  return (
    <div
      className="relative mx-auto w-full max-w-2xl overflow-hidden"
      role="img"
      aria-label="Live interaction analysis showing a critical Zinc/Copper ratio warning with actionable recommendations"
    >
      {/* Container with subtle 3D effect */}
      <div
        className="relative overflow-hidden rounded-xl border border-[#30363D] bg-[#0D1117] shadow-2xl"
        style={{
          transform: "perspective(1000px) rotateX(1deg)",
          transformOrigin: "center center",
        }}
      >
        {/* Breathing glow effect */}
        <div className="animate-breathing-glow pointer-events-none absolute inset-0 rounded-xl" />

        {/* Top bar with "LIVE ANALYSIS" indicator */}
        <div className="flex items-center justify-between border-b border-[#30363D] bg-[#161B22] px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B6B] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B6B]" />
            </div>
            <span className="font-mono text-[10px] tracking-widest text-[#A8B1BB] uppercase">
              Live Analysis
            </span>
          </div>
          <span className="hidden font-mono text-[10px] text-[#A8B1BB]/60 sm:block">
            stack_audit.exe
          </span>
        </div>

        {/* Main content area */}
        <div className="relative p-4 sm:p-6" aria-hidden="true">
          {/* CRITICAL WARNING - Primary focus (40%+ of space) */}
          <div className="mb-4 overflow-hidden rounded-lg border-2 border-[#FF6B6B] bg-[#FF6B6B]/10 shadow-[0_0_30px_rgba(255,107,107,0.15)]">
            {/* Warning header with pulse */}
            <div className="flex items-center gap-2 border-b border-[#FF6B6B]/30 bg-[#FF6B6B]/5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
              <div className="relative shrink-0">
                <AlertTriangle className="h-4 w-4 text-[#FF6B6B] sm:h-5 sm:w-5" />
                <div className="absolute inset-0 animate-ping">
                  <AlertTriangle className="h-4 w-4 text-[#FF6B6B] opacity-50 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono text-xs font-bold tracking-wide text-[#FF6B6B] uppercase sm:text-sm">
                    Critical: Absorption Blocked
                  </span>
                </div>
              </div>
              <span className="hidden shrink-0 rounded bg-[#FF6B6B]/20 px-2 py-0.5 font-mono text-[10px] font-medium text-[#FF6B6B] sm:block">
                PMID:9701160
              </span>
            </div>

            {/* Warning body - detailed explanation */}
            <div className="space-y-3 p-3 sm:p-4">
              {/* The conflict */}
              <div className="flex items-start gap-2 sm:gap-3">
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B6B]" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#E6EDF3] sm:text-sm">
                    <span className="font-mono text-[#FF6B6B]">Zinc (50mg)</span>{" "}
                    is blocking{" "}
                    <span className="font-mono text-[#FF6B6B]">Copper</span>{" "}
                    absorption
                  </p>
                  <p className="mt-1 text-[10px] text-[#A8B1BB] sm:text-xs">
                    Current ratio:{" "}
                    <span className="font-mono font-semibold text-[#FF6B6B]">
                      50:0
                    </span>{" "}
                    — Optimal:{" "}
                    <span className="font-mono text-[#39FF14]">8:1 – 15:1</span>
                  </p>
                </div>
              </div>

              {/* The consequence */}
              <div className="rounded border border-[#30363D] bg-[#0A0C10] p-2 sm:p-3">
                <p className="text-[10px] leading-relaxed text-[#A8B1BB] sm:text-xs">
                  <span className="font-semibold text-[#E6EDF3]">Risk:</span>{" "}
                  Copper depletion appears after 2-4 months — fatigue,
                  anemia, neurological issues.
                </p>
              </div>

              {/* The solution - HIGH VISIBILITY */}
              <div className="flex items-center gap-2 rounded-lg border border-[#39FF14]/50 bg-[#39FF14]/10 p-2 sm:gap-3 sm:p-3">
                <ArrowRight className="h-4 w-4 shrink-0 text-[#39FF14]" />
                <p className="text-xs font-medium text-[#39FF14] sm:text-sm">
                  Add 2mg Copper or stagger by 4 hours
                </p>
              </div>
            </div>
          </div>

          {/* Secondary alerts row - demonstrate breadth of analysis */}
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            {/* Timing warning */}
            <div className="rounded-lg border border-[#F0A500]/30 bg-[#F0A500]/5 p-2 sm:p-3">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#F0A500]" />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-medium text-[#E6EDF3] sm:text-xs">
                    D3 + K2 Timing
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#A8B1BB]">
                    Fat-soluble. Take with meal.
                  </p>
                </div>
              </div>
            </div>

            {/* Synergy detected */}
            <div className="rounded-lg border border-[#39FF14]/30 bg-[#39FF14]/5 p-2 sm:p-3">
              <div className="flex items-start gap-2">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#39FF14]" />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-medium text-[#E6EDF3] sm:text-xs">
                    Caffeine + L-Theanine
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#A8B1BB]">
                    Synergy. Theanine smooths jitters.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer stats bar */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-[#30363D] pt-3 font-mono text-[10px] text-[#A8B1BB]/60 sm:mt-4 sm:gap-x-4 sm:pt-4">
            <span>
              <span className="text-[#39FF14]">89,412</span> pairs
            </span>
            <span className="text-[#30363D]">•</span>
            <span>
              <span className="text-[#39FF14]">1,423</span> compounds
            </span>
            <span className="hidden text-[#30363D] sm:inline">•</span>
            <span className="hidden sm:inline">47ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
