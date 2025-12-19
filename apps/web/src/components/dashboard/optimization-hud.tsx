"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Zap, AlertTriangle, ChevronRight, Bell, Check, BellRing } from "lucide-react";
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
      <DialogContent className="border-border/50 bg-card max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm">
            <BellRing className="h-4 w-4 text-[#00D4FF]" />
            Enable Bio-Sync
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono text-xs">
            Receive precision alerts when absorption windows open
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Value proposition */}
          <div className="rounded-lg bg-black/20 p-4">
            <div className="text-foreground font-mono text-xs">
              Your next window for{" "}
              <span className="text-[#00D4FF]">{targetSupplementName}</span>{" "}
              opens in{" "}
              <span className="tabular-nums text-[#39FF14]">
                {formatTime(minutesRemaining)}
              </span>
            </div>
            <div className="text-muted-foreground mt-2 font-mono text-[10px]">
              Bio-Sync will notify you at the optimal moment to maximize
              bioavailability and avoid transporter competition.
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#39FF14]" />
              <span className="text-muted-foreground font-mono text-[10px]">
                Precision timing based on pharmacokinetic half-life
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#39FF14]" />
              <span className="text-muted-foreground font-mono text-[10px]">
                Automatic exclusion zone tracking
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#39FF14]" />
              <span className="text-muted-foreground font-mono text-[10px]">
                One-tap logging from notification
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-mono text-xs"
              onClick={() => onOpenChange(false)}
            >
              NOT NOW
            </Button>
            <Button
              className="flex-1 bg-[#00D4FF] font-mono text-xs text-black hover:bg-[#00D4FF]/90"
              onClick={onEnable}
            >
              <Bell className="mr-1.5 h-3 w-3" />
              ENABLE
            </Button>
          </div>

          {/* Privacy note */}
          <div className="text-muted-foreground/60 text-center font-mono text-[9px]">
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
  permission,
  onRequestPermission,
}: {
  zone: ExclusionZone;
  onLogSupplement?: (supplementId: string) => void;
  permission: NotificationPermissionState;
  onRequestPermission: (zone: ExclusionZone) => void;
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
        {permission === "denied" ? (
          <div className="text-muted-foreground/50" title="Notifications blocked">
            <Bell className="h-3 w-3" />
          </div>
        ) : !reminded ? (
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
          <div className="text-[#00D4FF]" title="Reminder set">
            <Bell className="h-3 w-3" />
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
  const { permission, requestPermission } = useNotificationPermission();
  const [bioSyncModalOpen, setBioSyncModalOpen] = useState(false);
  const [pendingZone, setPendingZone] = useState<ExclusionZone | null>(null);

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
                  permission={permission}
                  onRequestPermission={handleRequestPermission}
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
