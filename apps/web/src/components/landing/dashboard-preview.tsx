"use client";

import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Circle,
  Flame,
  Pill,
  Play,
  Scale,
  Zap,
} from "lucide-react";

/**
 * DashboardPreview - Simplified mockup of the real dashboard
 *
 * Uses the same visual language as the actual dashboard components
 * but with hardcoded "dummy" data. No DB fetches.
 */
export function DashboardPreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-2xl"
      role="img"
      aria-label="Dashboard preview showing system status, interaction analysis with warnings and synergies, and protocol cards for morning, evening, and sleep stacks"
    >
      {/* Tilt container with perspective */}
      <div
        className="relative rounded-xl border border-[#30363D] bg-[#0D1117] p-4 shadow-2xl sm:p-6"
        style={{
          transform: "perspective(1000px) rotateX(2deg) rotateY(-1deg)",
          transformOrigin: "center center",
        }}
        aria-hidden="true"
      >
        {/* Breathing glow effect */}
        <div className="animate-breathing-glow pointer-events-none absolute inset-0 rounded-xl" />

        {/* Top bar reflection effect */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/30 to-transparent" />

        {/* Content */}
        <div className="relative space-y-4">
          {/* System Status Row */}
          <MockSystemStatus />

          {/* Interaction HUD */}
          <MockInteractionHUD />

          {/* Protocol Cards */}
          <MockProtocols />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Mock Components (Simplified versions of real dashboard components)
// ============================================================================

function MockSystemStatus() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Date */}
      <div className="flex items-center gap-1.5 text-[#8B949E]">
        <Calendar className="h-3 w-3" />
        <span className="font-mono text-xs">Thu, Dec 18</span>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <Flame className="h-3 w-3 text-orange-500" />
        <span className="font-mono text-xs text-orange-500 tabular-nums">
          12d streak
        </span>
      </div>

      {/* Today's log count */}
      <div className="flex items-center gap-1.5 text-[#8B949E]">
        <Pill className="h-3 w-3" />
        <span className="font-mono text-xs tabular-nums">4 logs today</span>
      </div>

      {/* Last log */}
      <span className="font-mono text-[10px] text-[#8B949E]/60">
        Last: 23m ago
      </span>
    </div>
  );
}

function MockInteractionHUD() {
  return (
    <section className="space-y-3">
      <p className="text-[10px] tracking-wider text-[#8B949E] uppercase">
        Interaction Analysis
      </p>

      {/* Warning state card */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5">
        {/* Header */}
        <button
          type="button"
          className="flex w-full items-center justify-between p-3 text-left"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-amber-500">
                2 WARNINGS
              </span>

              {/* Synergy indicator */}
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                <Zap className="h-2.5 w-2.5" />1
              </span>

              {/* Ratio indicator */}
              <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                <Scale className="h-2.5 w-2.5" />1
              </span>
            </div>
          </div>

          <ChevronDown className="h-4 w-4 rotate-180 text-[#8B949E]" />
        </button>

        {/* Expanded Content */}
        <div className="space-y-2 border-t border-[#30363D]/30 p-3">
          {/* Ratio warning */}
          <div className="rounded-md border border-amber-500/20 bg-[#0A0C10] p-3">
            <div className="flex items-start gap-2">
              <Scale className="mt-0.5 h-3.5 w-3.5 text-amber-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-[#C9D1D9]">
                    Zinc:Copper Ratio
                  </span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                    15:1
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[#8B949E]">
                  Optimal range: 8:1 - 12:1. Add 2mg Copper to balance.
                </p>
              </div>
            </div>
          </div>

          {/* Synergy card */}
          <div className="rounded-md border border-emerald-500/20 bg-[#0A0C10] p-3">
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-[#C9D1D9]">
                    Caffeine + L-Theanine
                  </span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                    SYNERGY
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[#8B949E]">
                  Calm focus stack. Theanine smooths caffeine jitters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockProtocols() {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-[10px] tracking-wider text-[#8B949E] uppercase">
        Protocols
      </h2>
      <div className="space-y-2">
        {/* Complete protocol */}
        <div className="flex items-stretch rounded-lg border border-emerald-500/30 bg-emerald-500/5">
          {/* Zone A */}
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-medium text-[#C9D1D9]">
                Morning Stack
              </p>
              <p className="font-mono text-[10px] text-emerald-500">COMPLETE</p>
            </div>
          </div>
          <div className="w-px bg-emerald-500/20" />
          <div className="flex items-center px-2">
            <div className="flex h-11 min-w-[72px] items-center justify-center rounded-md bg-emerald-500/10 px-3">
              <span className="font-mono text-[10px] font-medium text-emerald-500">
                DONE
              </span>
            </div>
          </div>
        </div>

        {/* Partial protocol */}
        <div className="flex items-stretch rounded-lg border border-[#30363D]/40 bg-[#0D1117]/30">
          {/* Zone A */}
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#30363D"
                strokeWidth="2"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="25.135 50.27"
              />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-medium text-[#C9D1D9]">
                Evening Protocol
              </p>
              <p className="font-mono text-[10px] text-[#8B949E]">
                <span className="tabular-nums">2</span>
                <span className="text-[#8B949E]/60">/</span>
                <span className="tabular-nums">4</span>
                <span className="ml-1 text-[#8B949E]/60">logged</span>
              </p>
            </div>
          </div>
          <div className="w-px bg-[#30363D]/40" />
          <div className="flex items-center px-2">
            <div className="flex h-11 min-w-[72px] items-center justify-center gap-1.5 rounded-md border border-[#30363D]/60 px-3 transition-colors hover:border-[#39FF14] hover:bg-[#39FF14] hover:text-[#0A0C10]">
              <Play className="h-3 w-3 text-[#C9D1D9]" />
              <span className="font-mono text-xs text-[#C9D1D9]">LOG</span>
            </div>
          </div>
        </div>

        {/* Idle protocol */}
        <div className="flex items-stretch rounded-lg border border-[#30363D]/40 bg-[#0D1117]/30">
          {/* Zone A */}
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <Circle className="h-5 w-5 text-[#8B949E]/40" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-medium text-[#C9D1D9]">
                Sleep Stack
              </p>
              <p className="font-mono text-[10px] text-[#8B949E]">
                <span className="tabular-nums">0</span>
                <span className="text-[#8B949E]/60">/</span>
                <span className="tabular-nums">3</span>
                <span className="ml-1 text-[#8B949E]/60">logged</span>
              </p>
            </div>
          </div>
          <div className="w-px bg-[#30363D]/40" />
          <div className="flex items-center px-2">
            <div className="flex h-11 min-w-[72px] items-center justify-center gap-1.5 rounded-md border border-[#30363D]/60 px-3 transition-colors hover:border-[#39FF14] hover:bg-[#39FF14] hover:text-[#0A0C10]">
              <Play className="h-3 w-3 text-[#C9D1D9]" />
              <span className="font-mono text-xs text-[#C9D1D9]">LOG</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
