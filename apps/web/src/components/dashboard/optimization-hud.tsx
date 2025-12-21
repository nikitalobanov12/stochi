"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Zap, AlertTriangle, ChevronRight, Bell, Check, BellRing, X, ShieldAlert } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import type { ExclusionZone, OptimizationOpportunity } from "~/server/services/biological-state";

// ============================================================================
// Types
// ============================================================================

type OptimizationHUDProps = {
  exclusionZones: ExclusionZone[];
  optimizations: OptimizationOpportunity[];
  onLogSupplement?: (supplementId: string) => void;
};

type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

// ============================================================================
// Notification Permission Hook
// ============================================================================

function useNotificationPermission(): {
  permission: NotificationPermissionState;
  requestPermission: () => Promise<boolean>;
} {
  // Initialize state lazily to avoid SSR issues
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission as NotificationPermissionState;
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);
      return result === "granted";
    } catch {
      return false;
    }
  }, []);

  return { permission, requestPermission };
}

// ============================================================================
// Bio-Sync Permission Modal
// ============================================================================

type BioSyncModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => void;
  targetSupplementName: string;
  minutesRemaining: number;
};

function BioSyncModal({
  open,
  onOpenChange,
  onEnable,
  targetSupplementName,
  minutesRemaining,
}: BioSyncModalProps) {
  const formatTime = (mins: number) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const m = mins % 60;
      return `${hours}h ${m}m`;
    }
    return `${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/50 bg-card max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-sans text-base font-medium">
            <BellRing className="h-5 w-5 status-info" />
            Enable Bio-Sync
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-sans text-sm">
            Receive precision alerts when absorption windows open
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Value proposition */}
          <div className="rounded-lg bg-black/20 p-4">
            <div className="text-foreground font-sans text-sm">
              Your next window for{" "}
              <span className="status-info">{targetSupplementName}</span>{" "}
              opens in{" "}
              <span className="font-mono tabular-nums status-optimized">
                {formatTime(minutesRemaining)}
              </span>
            </div>
            <div className="text-muted-foreground mt-2 font-sans text-xs leading-relaxed">
              Bio-Sync will notify you at the optimal moment to maximize
              bioavailability and avoid transporter competition.
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-status-optimized" />
              <span className="text-muted-foreground font-sans text-xs">
                Precision timing based on pharmacokinetic half-life
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-status-optimized" />
              <span className="text-muted-foreground font-sans text-xs">
                Automatic exclusion zone tracking
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-status-optimized" />
              <span className="text-muted-foreground font-sans text-xs">
                One-tap logging from notification
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 font-mono text-sm"
              onClick={() => onOpenChange(false)}
            >
              NOT NOW
            </Button>
            <Button
              className="flex-1 bg-emerald-500 font-mono text-sm text-black hover:bg-emerald-400"
              onClick={onEnable}
            >
              <Bell className="mr-2 h-4 w-4" />
              ENABLE
            </Button>
          </div>

          {/* Privacy note */}
          <div className="text-muted-foreground/70 text-center font-sans text-xs">
            Notifications are processed locally. No data leaves your device.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
// Helper Functions - Semantic Color System (Spec Section 5)
// ============================================================================

function formatCountdown(minutes: number, seconds: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

// Semantic color classes for severity levels
function getSeverityColorClass(severity: "critical" | "medium" | "low"): string {
  switch (severity) {
    case "critical":
      return "status-critical"; // Red - lethal interactions
    case "medium":
      return "status-conflict"; // Amber - timing conflicts
    case "low":
      return "text-muted-foreground";
  }
}

// Border classes using semantic system
function getSeverityBorderClass(severity: "critical" | "medium" | "low"): string {
  switch (severity) {
    case "critical":
      return "border-status-critical";
    case "medium":
      return "border-status-conflict";
    case "low":
      return "border-white/[0.08]";
  }
}

// ============================================================================
// Exclusion Zone Card - Glass Card with Severity Borders (Spec Section 2)
// ============================================================================

function ExclusionZoneCard({
  zone,
  onLogSupplement,
  permission,
  onRequestPermission,
  isHero = false,
}: {
  zone: ExclusionZone;
  onLogSupplement?: (supplementId: string) => void;
  permission: NotificationPermissionState;
  onRequestPermission: (zone: ExclusionZone) => void;
  isHero?: boolean;
}) {
  const { minutes, seconds, isExpired } = useCountdown(zone.endsAt);
  const [reminded, setReminded] = useState(false);

  const handleRemind = useCallback(() => {
    // If permission not granted, trigger the soft modal flow
    if (permission !== "granted") {
      onRequestPermission(zone);
      return;
    }

    // Permission granted - schedule the notification
    setReminded(true);
    const delayMs = minutes * 60 * 1000 + seconds * 1000;
    
    setTimeout(() => {
      new Notification(`Ready to take ${zone.targetSupplementName}`, {
        body: `${zone.sourceSupplementName} is no longer blocking absorption.`,
        icon: "/icon-192.png",
        tag: `bio-sync-${zone.ruleId}`,
      });
    }, delayMs);
  }, [zone, minutes, seconds, permission, onRequestPermission]);

  // Severity-based styling classes
  const borderClass = getSeverityBorderClass(zone.severity);
  const colorClass = getSeverityColorClass(zone.severity);

  // Determine if window is imminent (<30min) for emerald highlight
  const isImminent = minutes < 30;

  // Window is now open - show "LOG NOW" state
  if (isExpired) {
    return (
      <div className="glass-card border-status-optimized bg-status-optimized p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 status-optimized" />
            <div>
              <div className="type-header text-sm">
                {zone.targetSupplementName}
              </div>
              <div className="type-technical text-[10px] uppercase tracking-wider">
                WINDOW OPEN
              </div>
            </div>
          </div>
          {onLogSupplement && (
            <Button
              size="sm"
              className="h-9 bg-emerald-500 font-mono text-xs text-black hover:bg-emerald-400"
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
    <div className={`glass-card ${borderClass} ${isHero ? "p-6" : "p-4"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {isHero ? (
            // Hero card layout - "Next Window" prompt with prominent countdown
            <div className="relative">
              {/* Ambient glow for imminent windows */}
              {isImminent && (
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
              )}
              
              <div className="relative">
                {/* Label - Body prose per spec section 3 */}
                <div className="type-prose text-sm">
                  Optimal window opens in
                </div>
                
                {/* Countdown - Critical Alerts: JetBrains Mono Bold per spec */}
                <div className={`mt-2 font-mono text-4xl font-bold tabular-nums ${isImminent ? "status-optimized" : "type-alert"}`}>
                  {formatCountdown(minutes, seconds)}
                </div>
                
                {/* Target supplement - Primary header */}
                <div className="type-header mt-4 text-lg">
                  {zone.targetSupplementName}
                </div>
                
                {/* Mechanistic reason - Body prose */}
                <div className="type-prose mt-2 text-sm leading-relaxed">
                  {zone.reason}
                </div>
                
                {/* Set Alert button - Soft permission flow */}
                {permission !== "denied" && !reminded && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-5 h-10 w-full border-emerald-400/30 bg-emerald-500/10 font-mono text-xs text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                    onClick={handleRemind}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    SET ALERT
                  </Button>
                )}
                {permission !== "denied" && reminded && (
                  <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 py-3 font-mono text-xs text-emerald-400">
                    <Bell className="h-4 w-4" />
                    ALERT SET
                  </div>
                )}
                {permission === "denied" && (
                  <div className="type-prose mt-5 text-center text-xs">
                    Notifications blocked in browser settings
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Compact card layout - for additional windows
            <>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${colorClass}`} />
                <span className="type-header text-sm">
                  {zone.targetSupplementName}
                </span>
                {/* Countdown timer - Technical data */}
                <span className={`type-alert text-xs tabular-nums`}>
                  {formatCountdown(minutes, seconds)}
                </span>
              </div>
              {/* Mechanistic reason - Body prose */}
              <div className="type-prose mt-2 text-xs leading-relaxed">
                {zone.reason}
              </div>
            </>
          )}
        </div>
        {/* Only show side button for non-hero cards */}
        {!isHero && (
          permission === "denied" ? (
            <div className="text-muted-foreground/50" title="Notifications blocked">
              <Bell className="h-3.5 w-3.5" />
            </div>
          ) : !reminded ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-8 px-2"
              onClick={handleRemind}
              title="Remind me when available"
            >
              <Bell className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="status-info" title="Reminder set">
              <Bell className="h-3.5 w-3.5" />
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Synergy Card - Glass Card with Status Borders (Spec Section 2)
// ============================================================================

function SynergyCard({
  optimization,
  onDismiss,
}: {
  optimization: OptimizationOpportunity;
  onDismiss?: () => void;
}) {
  const isActive = optimization.title.startsWith("Active synergy");
  const hasSafetyWarning = !!optimization.safetyWarning;

  return (
    <div
      className={`glass-card group relative p-4 ${
        hasSafetyWarning
          ? "border-status-conflict"
          : isActive 
            ? "border-status-optimized" 
            : "border-status-info"
      }`}
    >
      {/* Dismiss button - visible on hover for suggestions */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded p-1.5 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-white/5 hover:text-muted-foreground group-hover:opacity-100"
          title="Dismiss suggestion"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="flex items-start gap-3">
        {hasSafetyWarning ? (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 status-conflict" />
        ) : (
          <Zap
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              isActive ? "status-optimized" : "status-info"
            }`}
          />
        )}
        <div className="min-w-0 pr-5">
          {/* Title - Primary header */}
          <div className="type-header text-sm">
            {isActive 
              ? optimization.title.replace("Active synergy: ", "")
              : optimization.title.replace(/^Enhance .+ with /, "Add ")}
          </div>
          {/* Description - Body prose */}
          <div className="type-prose mt-1 text-xs leading-relaxed">
            {optimization.description}
          </div>
          {hasSafetyWarning && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-status-conflict px-3 py-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 status-conflict" />
              <span className="type-prose text-[10px] leading-relaxed status-conflict">
                {optimization.safetyWarning}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component - Optimization HUD (4 Cols per Spec Section 4)
// ============================================================================

export function OptimizationHUD({
  exclusionZones,
  optimizations,
  onLogSupplement,
}: OptimizationHUDProps) {
  const { permission, requestPermission } = useNotificationPermission();
  const [bioSyncModalOpen, setBioSyncModalOpen] = useState(false);
  const [pendingZone, setPendingZone] = useState<ExclusionZone | null>(null);
  // Track dismissed suggestion indices (persists only for this session)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(new Set());

  // Handle permission request from a zone card
  const handleRequestPermission = useCallback((zone: ExclusionZone) => {
    setPendingZone(zone);
    setBioSyncModalOpen(true);
  }, []);

  // Handle the "Enable" button in the soft modal
  const handleEnableBioSync = useCallback(async () => {
    const granted = await requestPermission();
    setBioSyncModalOpen(false);

    if (granted && pendingZone) {
      // Permission granted - schedule the notification
      const now = Date.now();
      const delayMs = pendingZone.endsAt.getTime() - now;
      
      if (delayMs > 0) {
        setTimeout(() => {
          new Notification(`Ready to take ${pendingZone.targetSupplementName}`, {
            body: `${pendingZone.sourceSupplementName} is no longer blocking absorption.`,
            icon: "/icon-192.png",
            tag: `bio-sync-${pendingZone.ruleId}`,
          });
        }, delayMs);
      }
    }

    setPendingZone(null);
  }, [requestPermission, pendingZone]);

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
      <div className="glass-card p-5 text-center">
        <div className="type-prose text-xs">
          No active optimizations
        </div>
        <div className="type-prose mt-1 text-[10px] opacity-60">
          Log supplements to see timing suggestions
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Bio-Sync Permission Modal */}
      {pendingZone && (
        <BioSyncModal
          open={bioSyncModalOpen}
          onOpenChange={setBioSyncModalOpen}
          onEnable={handleEnableBioSync}
          targetSupplementName={pendingZone.targetSupplementName}
          minutesRemaining={pendingZone.minutesRemaining}
        />
      )}

      <div className="space-y-5">
        {/* Hero: Next Optimal Event */}
        {sortedZones.length > 0 && sortedZones[0] && (
          <ExclusionZoneCard
            zone={sortedZones[0]}
            onLogSupplement={onLogSupplement}
            permission={permission}
            onRequestPermission={handleRequestPermission}
            isHero={true}
          />
        )}

        {/* Additional Timing Windows (if more than 1) */}
        {sortedZones.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 status-conflict" />
              <span className="type-label">
                Other Windows
              </span>
            </div>
            <div className="space-y-3">
              {sortedZones.slice(1, 4).map((zone) => (
                <ExclusionZoneCard
                  key={zone.ruleId}
                  zone={zone}
                  onLogSupplement={onLogSupplement}
                  permission={permission}
                  onRequestPermission={handleRequestPermission}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Synergies */}
        {activeSynergies.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 status-optimized" />
              <span className="type-label">
                Active Synergies
              </span>
            </div>
            <div className="space-y-3">
              {activeSynergies.map((opt, i) => (
                <SynergyCard key={i} optimization={opt} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 status-info" />
              <span className="type-label">
                Suggestions
              </span>
            </div>
            <div className="space-y-3">
              {suggestions.slice(0, 3).map((opt, i) => {
                if (dismissedSuggestions.has(i)) return null;
                return (
                  <SynergyCard
                    key={i}
                    optimization={opt}
                    onDismiss={() => {
                      setDismissedSuggestions((prev) => new Set(prev).add(i));
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Skeleton Component
// ============================================================================

export function OptimizationHUDSkeleton() {
  return (
    <div className="space-y-4">
      {/* Timing Windows Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="border-border/40 bg-card/30 rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Synergies Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="border-border/40 bg-card/30 rounded-lg border p-3">
          <div className="flex items-start gap-2">
            <Skeleton className="mt-0.5 h-4 w-4 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
