"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Activity, AlertTriangle, Zap, ChevronDown, X } from "lucide-react";
import { BentoCardHeader } from "./bento-card";

/**
 * LandingBioScore - Demo version of the Bio-Score gauge for the landing page
 * 
 * Features:
 * - Scroll-triggered animation (0 → target score)
 * - Hoverable breakdown modal showing weighted penalty model
 * - Dismissible suggestions (local state, Endowment Effect)
 * - Respects prefers-reduced-motion
 */

// ============================================================================
// Demo Data
// ============================================================================

type BreakdownItem = {
  id: string;
  type: "penalty" | "bonus";
  label: string;
  value: number;
  dismissible?: boolean;
};

const DEMO_BREAKDOWN: BreakdownItem[] = [
  { id: "zn-mg", type: "penalty", label: "Zinc/Magnesium competition", value: -15, dismissible: false },
  { id: "d3-k2", type: "bonus", label: "D3 + K2 synergy", value: +5, dismissible: false },
  { id: "caff-thea", type: "bonus", label: "Caffeine + L-Theanine", value: +5, dismissible: false },
  { id: "timing-sug", type: "bonus", label: "Optimal timing window", value: +3, dismissible: true },
];

const BASE_SCORE = 100;
const TARGET_SCORE = 78; // 100 - 15 + 5 + 5 - 17 (other minor factors)

// ============================================================================
// Utility Hooks
// ============================================================================

function usePrefersReducedMotion(): boolean {
  // Initialize with SSR-safe false, then update on client
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) callback(entry.isIntersecting);
      },
      { threshold: 0.5, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
}

// ============================================================================
// Sub-Components
// ============================================================================

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-[10px] text-white/50">% OPTIMIZED</span>
      </div>
    </div>
  );
}

function BreakdownPanel({
  items,
  dismissedIds,
  onDismiss,
}: {
  items: BreakdownItem[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
}) {
  const visibleItems = items.filter((item) => !dismissedIds.has(item.id));

  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
          Score Factors
        </span>
        <span className="font-mono text-[10px] text-white/30">
          Base: {BASE_SCORE}
        </span>
      </div>

      {visibleItems.map((item) => (
        <div
          key={item.id}
          className="group flex items-center justify-between rounded-lg bg-white/[0.02] px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
        >
          <div className="flex items-center gap-2">
            {item.type === "penalty" ? (
              <AlertTriangle className="h-3 w-3 text-amber-400" />
            ) : (
              <Zap className="h-3 w-3 text-emerald-400" />
            )}
            <span className="text-xs text-white/80">{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-xs tabular-nums"
              style={{ color: item.type === "penalty" ? "rgb(251 191 36)" : "rgb(52 211 153)" }}
            >
              {item.value > 0 ? "+" : ""}
              {item.value}
            </span>
            {item.dismissible && (
              <button
                onClick={() => onDismiss(item.id)}
                className="rounded p-0.5 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                aria-label={`Dismiss ${item.label}`}
              >
                <X className="h-3 w-3 text-white/50" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Formula reference */}
      <div className="mt-2 border-t border-white/5 pt-2">
        <p className="font-mono text-[9px] text-white/30">
          Critical: -50 | Medium: -25 | Low: -15 | Synergy: +5 (max +20)
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LandingBioScore() {
  const [displayScore, setDisplayScore] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const prefersReducedMotion = usePrefersReducedMotion();

  // Animate score on scroll into view
  const animateScore = useCallback(() => {
    if (hasAnimated) return;
    setHasAnimated(true);

    if (prefersReducedMotion) {
      // Skip animation for reduced motion
      setDisplayScore(TARGET_SCORE);
      return;
    }

    const duration = 1500;
    const startTime = performance.now();

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * TARGET_SCORE));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [hasAnimated, prefersReducedMotion]);

  const ref = useIntersectionObserver((isIntersecting) => {
    if (isIntersecting && !hasAnimated) {
      animateScore();
    }
  });

  // Dismiss handler (Endowment Effect - local state ownership)
  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  // Color based on score
  const color =
    displayScore >= 70
      ? "rgb(52 211 153)" // emerald-400
      : displayScore >= 50
        ? "rgb(34 211 238)" // cyan-400
        : displayScore >= 30
          ? "rgb(251 191 36)" // amber-400
          : "rgb(248 113 113)"; // red-400

  const label =
    displayScore >= 90
      ? "OPTIMAL"
      : displayScore >= 70
        ? "GOOD"
        : displayScore >= 50
          ? "MODERATE"
          : displayScore >= 30
            ? "SUBOPTIMAL"
            : "CRITICAL";

  return (
    <div ref={ref} className="flex h-full flex-col p-4 lg:p-6">
      <BentoCardHeader
        title="Bio-Score"
        icon={<Activity className="h-4 w-4" style={{ color }} />}
        id="bioscore-heading"
      />

      {/* Gauge */}
      <div className="flex flex-1 items-center justify-center py-4">
        <ScoreGauge score={displayScore} color={color} />
      </div>

      {/* Status label */}
      <div className="mb-4 text-center">
        <span className="font-mono text-xs" style={{ color }}>
          {label}
        </span>
      </div>

      {/* Breakdown Toggle */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
        aria-expanded={showBreakdown}
        aria-controls="bioscore-breakdown"
      >
        <span className="text-xs text-white/50">View breakdown</span>
        <ChevronDown
          className={`h-4 w-4 text-white/50 transition-transform ${showBreakdown ? "rotate-180" : ""}`}
        />
      </button>

      {/* Breakdown Panel (collapsible) */}
      {showBreakdown && (
        <div id="bioscore-breakdown">
          <BreakdownPanel
            items={DEMO_BREAKDOWN}
            dismissedIds={dismissedIds}
            onDismiss={handleDismiss}
          />
        </div>
      )}
    </div>
  );
}
