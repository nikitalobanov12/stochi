"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "~/lib/utils";

/**
 * MechanisticFeed - Terminal-style scrolling feed for landing page
 *
 * Features:
 * - Pre-scripted pharmacology jargon entries that cycle automatically
 * - Typewriter effect for each entry
 * - Auto-scroll to bottom
 * - Respects prefers-reduced-motion
 * - No UUIDs or real user data exposed
 */

type FeedEntry = {
  timestamp: string;
  module:
    | "KINETICS"
    | "RECEPTOR"
    | "PATHWAY"
    | "SYNERGY"
    | "CLEARANCE"
    | "ABSORPTION";
  message: string;
  status: "OK" | "WARN" | "INFO";
};

// Pre-scripted demo entries with pharmacological jargon
const DEMO_ENTRIES: FeedEntry[] = [
  {
    timestamp: "08:15",
    module: "ABSORPTION",
    message:
      "Vitamin D3 lipophilic matrix detected → fat co-ingestion +47% bioavail",
    status: "OK",
  },
  {
    timestamp: "08:15",
    module: "KINETICS",
    message:
      "Magnesium glycinate Cmax reached (t=1.2h) → steady-state in 4 doses",
    status: "INFO",
  },
  {
    timestamp: "08:16",
    module: "RECEPTOR",
    message:
      "NMDA receptor: Mg²⁺ block active (Vm=-65mV) → glutamate modulation",
    status: "OK",
  },
  {
    timestamp: "08:45",
    module: "SYNERGY",
    message:
      "Zinc + Copper competitive inhibition → Cu:Zn ratio 1:15 (optimal)",
    status: "OK",
  },
  {
    timestamp: "09:00",
    module: "PATHWAY",
    message: "CYP3A4 substrate detected → grapefruit interaction flagged",
    status: "WARN",
  },
  {
    timestamp: "09:30",
    module: "CLEARANCE",
    message:
      "Caffeine t½ = 5.2h (CYP1A2 fast metabolizer) → clearance by 14:30",
    status: "INFO",
  },
  {
    timestamp: "10:00",
    module: "ABSORPTION",
    message:
      "Iron + Vitamin C chelation → Fe³⁺ reduction to Fe²⁺ (+67% uptake)",
    status: "OK",
  },
  {
    timestamp: "10:30",
    module: "KINETICS",
    message: "Omega-3 (EPA/DHA) flip-flop kinetics → absorption rate-limiting",
    status: "INFO",
  },
  {
    timestamp: "11:00",
    module: "RECEPTOR",
    message: "Adenosine A1 antagonism (caffeine) → cortisol timing optimal",
    status: "OK",
  },
  {
    timestamp: "12:00",
    module: "PATHWAY",
    message: "NAD+ precursor (NMN) → salvage pathway activation confirmed",
    status: "OK",
  },
  {
    timestamp: "13:00",
    module: "SYNERGY",
    message: "L-Theanine + Caffeine α-wave modulation → 2:1 ratio maintained",
    status: "OK",
  },
  {
    timestamp: "14:00",
    module: "CLEARANCE",
    message: "Vitamin B12 renal excretion → excess cleared (>1000μg threshold)",
    status: "INFO",
  },
];

const MODULE_COLORS: Record<FeedEntry["module"], string> = {
  KINETICS: "text-cyan-400",
  RECEPTOR: "text-violet-400",
  PATHWAY: "text-amber-400",
  SYNERGY: "text-emerald-400",
  CLEARANCE: "text-rose-400",
  ABSORPTION: "text-blue-400",
};

const STATUS_COLORS: Record<FeedEntry["status"], string> = {
  OK: "text-emerald-500",
  WARN: "text-amber-500",
  INFO: "text-white/50",
};

type MechanisticFeedProps = {
  className?: string;
  /** Interval between new entries in ms (default: 2500) */
  intervalMs?: number;
  /** Whether to auto-play the feed (default: true) */
  autoPlay?: boolean;
  /** Max visible entries (default: 6) */
  maxVisible?: number;
};

export function MechanisticFeed({
  className,
  intervalMs = 2500,
  autoPlay = true,
  maxVisible = 6,
}: MechanisticFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>(() =>
    DEMO_ENTRIES.slice(0, 3),
  );
  const [isPaused, setIsPaused] = useState(false);
  // Initialize with SSR-safe false, then update on client
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  // Track current index in a ref since we only use it for cycling, not rendering
  const currentIndexRef = useRef(3);

  // Subscribe to reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Memoized scroll function
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });
    }
  }, [prefersReducedMotion]);

  // Auto-advance entries
  useEffect(() => {
    if (!autoPlay || isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => {
      currentIndexRef.current =
        (currentIndexRef.current + 1) % DEMO_ENTRIES.length;
      const nextEntry = DEMO_ENTRIES[currentIndexRef.current];

      if (nextEntry) {
        setEntries((prevEntries) => {
          const newEntries = [...prevEntries, nextEntry];
          // Keep only last N entries for performance
          return newEntries.slice(-maxVisible);
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, intervalMs, maxVisible, prefersReducedMotion]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!prefersReducedMotion) {
      scrollToBottom();
    }
  }, [entries.length, prefersReducedMotion, scrollToBottom]);

  return (
    <div className={cn("h-full", className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/90">Mechanistic Feed</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/50">LIVE</span>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isPaused ? "bg-amber-500" : "animate-pulse bg-emerald-500",
            )}
            aria-label={isPaused ? "Paused" : "Running"}
          />
        </div>
      </div>

      {/* Terminal feed */}
      <div
        ref={containerRef}
        className="h-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-3 font-mono text-[10px] leading-relaxed hover:overflow-y-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="log"
        aria-live="polite"
        aria-label="Pharmacokinetic analysis feed"
      >
        {entries.map((entry, index) => (
          <div
            key={`${entry.timestamp}-${entry.module}-${index}`}
            className={cn(
              "flex flex-wrap gap-x-2 gap-y-0.5 py-0.5",
              "animate-in fade-in slide-in-from-bottom-1 duration-300",
            )}
          >
            <span className="shrink-0 text-white/25">[{entry.timestamp}]</span>
            <span className={cn("shrink-0", MODULE_COLORS[entry.module])}>
              {entry.module}:
            </span>
            <span className="text-white/60">{entry.message}</span>
            <span className={cn("shrink-0", STATUS_COLORS[entry.status])}>
              [{entry.status}]
            </span>
          </div>
        ))}

        {/* Blinking cursor */}
        <div className="mt-1 flex items-center gap-1">
          <span className="text-white/25">&gt;</span>
          <span
            className={cn(
              "h-3 w-1.5 bg-emerald-500/70",
              !prefersReducedMotion && "animate-pulse",
            )}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Footer hint */}
      <p className="mt-2 text-center text-[10px] text-white/30">
        Hover to pause • Real-time pharmacokinetic analysis
      </p>
    </div>
  );
}
