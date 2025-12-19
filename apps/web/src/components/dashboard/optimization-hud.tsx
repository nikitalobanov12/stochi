"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Zap, AlertTriangle, ChevronRight, Bell, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { ExclusionZone, OptimizationOpportunity } from "~/server/services/biological-state";

// ============================================================================
// Types
// ============================================================================

type OptimizationHUDProps = {
  exclusionZones: ExclusionZone[];
  optimizations: OptimizationOpportunity[];
  onLogSupplement?: (supplementId: string) => void;
};

// ============================================================================
// Countdown Hook
// ============================================================================

function useCountdown(targetDate: Date): { minutes: number; seconds: number; isExpired: boolean } {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = targetDate.getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      const diff = targetDate.getTime() - Date.now();
      setTimeLeft(Math.max(0, diff));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, timeLeft]);

  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { minutes, seconds, isExpired: timeLeft <= 0 };
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCountdown(minutes: number, seconds: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function getSeverityColor(severity: "critical" | "medium" | "low"): string {
  switch (severity) {
    case "critical":
      return "#FF6B6B";
    case "medium":
      return "#F0A500";
    case "low":
      return "#A8B1BB";
  }
}

// ============================================================================
// Exclusion Zone Card
// ============================================================================

function ExclusionZoneCard({
  zone,
  onLogSupplement,
}: {
  zone: ExclusionZone;
  onLogSupplement?: (supplementId: string) => void;
}) {
  const { minutes, seconds, isExpired } = useCountdown(zone.endsAt);
  const [reminded, setReminded] = useState(false);

  const handleRemind = useCallback(() => {
    // In a real app, this would schedule a notification
    setReminded(true);
    // Could integrate with browser notifications or push API
    if ("Notification" in window && Notification.permission === "granted") {
      setTimeout(() => {
        new Notification(`Ready to take ${zone.targetSupplementName}`, {
          body: `${zone.sourceSupplementName} is no longer blocking absorption.`,
          icon: "/icon-192.png",
        });
      }, minutes * 60 * 1000 + seconds * 1000);
    }
  }, [zone, minutes, seconds]);

  if (isExpired) {
    return (
      <div className="border-border/40 bg-card/30 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#39FF14]" />
            <div>
              <div className="text-foreground font-mono text-xs">
                {zone.targetSupplementName}
              </div>
              <div className="font-mono text-[10px] text-[#39FF14]">
                AVAILABLE NOW
              </div>
            </div>
          </div>
          {onLogSupplement && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 font-mono text-[10px]"
              onClick={() => onLogSupplement(zone.targetSupplementId)}
            >
              LOG NOW
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-border/40 bg-card/30 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Clock
              className="h-4 w-4"
              style={{ color: getSeverityColor(zone.severity) }}
            />
            <span className="text-foreground font-mono text-xs">
              {zone.targetSupplementName}
            </span>
            <span
              className="font-mono text-[10px] tabular-nums"
              style={{ color: getSeverityColor(zone.severity) }}
            >
              {formatCountdown(minutes, seconds)}
            </span>
          </div>
          <div className="text-muted-foreground mt-1 font-mono text-[10px] leading-relaxed">
            {zone.reason}
          </div>
        </div>
        {!reminded ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-7 px-2"
            onClick={handleRemind}
            title="Remind me when available"
          >
            <Bell className="h-3 w-3" />
          </Button>
        ) : (
          <div className="text-muted-foreground font-mono text-[10px]">
            <Bell className="h-3 w-3 text-[#00D4FF]" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Synergy Card
// ============================================================================

function SynergyCard({ optimization }: { optimization: OptimizationOpportunity }) {
  const isActive = optimization.title.startsWith("Active synergy");

  return (
    <div
      className={`border-border/40 rounded-lg border p-3 ${
        isActive ? "bg-[#39FF14]/5 border-[#39FF14]/20" : "bg-card/30"
      }`}
    >
      <div className="flex items-start gap-2">
        <Zap
          className={`mt-0.5 h-4 w-4 ${
            isActive ? "text-[#39FF14]" : "text-[#00D4FF]"
          }`}
        />
        <div>
          <div className="text-foreground font-mono text-xs">
            {optimization.title}
          </div>
          <div className="text-muted-foreground mt-0.5 font-mono text-[10px] leading-relaxed">
            {optimization.description}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function OptimizationHUD({
  exclusionZones,
  optimizations,
  onLogSupplement,
}: OptimizationHUDProps) {
  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Don't auto-request, let user trigger it
    }
  }, []);

  // Separate active synergies from suggestions
  const activeSynergies = optimizations.filter(
    (o) => o.type === "synergy" && o.title.startsWith("Active synergy"),
  );
  const suggestions = optimizations.filter(
    (o) => !(o.type === "synergy" && o.title.startsWith("Active synergy")),
  );

  // Sort exclusion zones by time remaining
  const sortedZones = [...exclusionZones].sort(
    (a, b) => a.minutesRemaining - b.minutesRemaining,
  );

  const hasContent =
    sortedZones.length > 0 || activeSynergies.length > 0 || suggestions.length > 0;

  if (!hasContent) {
    return (
      <div className="border-border/40 bg-card/30 rounded-lg border p-4 text-center">
        <div className="text-muted-foreground font-mono text-xs">
          No active optimizations
        </div>
        <div className="text-muted-foreground/60 mt-1 font-mono text-[10px]">
          Log supplements to see timing suggestions
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timing Countdowns */}
      {sortedZones.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-[#F0A500]" />
            <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
              Timing Windows
            </span>
          </div>
          <div className="space-y-2">
            {sortedZones.slice(0, 5).map((zone) => (
              <ExclusionZoneCard
                key={zone.ruleId}
                zone={zone}
                onLogSupplement={onLogSupplement}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Synergies */}
      {activeSynergies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-[#39FF14]" />
            <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
              Active Synergies
            </span>
          </div>
          <div className="space-y-2">
            {activeSynergies.map((opt, i) => (
              <SynergyCard key={i} optimization={opt} />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3 text-[#00D4FF]" />
            <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
              Suggestions
            </span>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((opt, i) => (
              <SynergyCard key={i} optimization={opt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
