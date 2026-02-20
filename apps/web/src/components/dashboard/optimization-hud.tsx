"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Clock,
  Zap,
  AlertTriangle,
  ChevronDown,
  Bell,
  Check,
  BellRing,
  X,
  ShieldAlert,
  ExternalLink,
  Scale,
  Settings,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import type {
  ExclusionZone,
  OptimizationOpportunity,
  SuggestionCategory,
} from "~/server/services/biological-state";
import { dismissSuggestion } from "~/server/actions/dismissed-suggestions";
import { useCategoryPreferences } from "~/lib/use-category-preferences";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

type OptimizationHUDProps = {
  exclusionZones: ExclusionZone[];
  optimizations: OptimizationOpportunity[];
  onLogSupplement?: (supplementId: string) => void;
};

type NotificationPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

// ============================================================================
// Category Configuration
// ============================================================================

const CATEGORY_CONFIG: Record<
  SuggestionCategory,
  {
    label: string;
    icon: typeof AlertTriangle;
    colorClass: string;
    priority: number;
  }
> = {
  safety: {
    label: "Safety Warnings",
    icon: ShieldAlert,
    colorClass: "status-critical",
    priority: 1,
  },
  timing: {
    label: "Timing Tips",
    icon: Clock,
    colorClass: "status-conflict",
    priority: 2,
  },
  synergy: {
    label: "Synergy Opportunities",
    icon: Zap,
    colorClass: "status-info",
    priority: 3,
  },
  balance: {
    label: "Balance Suggestions",
    icon: Scale,
    colorClass: "status-conflict",
    priority: 4,
  },
};

// ============================================================================
// Notification Permission Hook
// ============================================================================

function useNotificationPermission(): {
  permission: NotificationPermissionState;
  requestPermission: () => Promise<boolean>;
} {
  // Initialize state lazily to avoid SSR issues
  const [permission, setPermission] = useState<NotificationPermissionState>(
    () => {
      if (typeof window === "undefined") return "default";
      if (!("Notification" in window)) return "unsupported";
      return Notification.permission as NotificationPermissionState;
    },
  );

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
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-sans text-base font-medium">
            <BellRing className="status-info h-5 w-5" />
            Enable Bio-Sync
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-sans text-sm">
            Receive precision alerts when absorption windows open
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Value proposition */}
          <div className="bg-secondary/50 border-border/40 rounded-lg border p-4">
            <div className="text-foreground font-sans text-sm">
              Your next window for{" "}
              <span className="status-info">{targetSupplementName}</span> opens
              in{" "}
              <span className="status-optimized font-mono tabular-nums">
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
              <div className="bg-status-optimized h-2 w-2 rounded-full" />
              <span className="text-muted-foreground font-sans text-xs">
                Precision timing based on pharmacokinetic half-life
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="bg-status-optimized h-2 w-2 rounded-full" />
              <span className="text-muted-foreground font-sans text-xs">
                Automatic exclusion zone tracking
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="bg-status-optimized h-2 w-2 rounded-full" />
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

function useCountdown(targetDate: Date): {
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
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

// Semantic color classes for severity levels
function getSeverityColorClass(
  severity: "critical" | "medium" | "low",
): string {
  switch (severity) {
    case "critical":
      return "status-critical";
    case "medium":
      return "status-conflict";
    case "low":
      return "text-muted-foreground";
  }
}

// Border classes using semantic system
function getSeverityBorderClass(
  severity: "critical" | "medium" | "low",
): string {
  switch (severity) {
    case "critical":
      return "border-status-critical";
    case "medium":
      return "border-status-conflict";
    case "low":
      return "border-border/40";
  }
}

// Background classes using semantic system
function getSeverityBgClass(severity: "critical" | "medium" | "low"): string {
  switch (severity) {
    case "critical":
      return "bg-status-critical";
    case "medium":
      return "bg-status-conflict";
    case "low":
      return "bg-white/[0.02]";
  }
}

// ============================================================================
// Exclusion Zone Card - with severity borders
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
  const bgClass = getSeverityBgClass(zone.severity);
  const colorClass = getSeverityColorClass(zone.severity);

  // Determine if window is imminent (<30min) for emerald highlight
  const isImminent = minutes < 30;

  if (isExpired) {
    return (
      <div className="border-status-optimized bg-status-optimized rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="status-optimized h-5 w-5" />
            <div>
              <div className="text-foreground font-sans text-sm font-medium">
                {zone.targetSupplementName}
              </div>
              <div className="status-optimized font-mono text-[10px] tracking-wider uppercase">
                WINDOW OPEN
              </div>
            </div>
          </div>
          {onLogSupplement && (
            <Button
              size="sm"
              className="h-8 bg-emerald-500 font-mono text-xs text-black hover:bg-emerald-400"
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
    <div
      className={`rounded-2xl border ${borderClass} ${bgClass} ${isHero ? "p-5" : "p-3"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {isHero ? (
            // Hero card layout - "Next Window" prompt with prominent countdown
            <div className="relative">
              {/* Ambient glow for imminent windows */}
              {isImminent && (
                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
              )}

              <div className="relative">
                {/* Label - Sans-serif for prose */}
                <div className="font-sans text-sm text-white/50">
                  Optimal Window Opens In
                </div>

                {/* Countdown - Large, prominent, JetBrains Mono for precision */}
                <div
                  className={`mt-2 font-mono text-4xl font-bold tabular-nums ${isImminent ? "status-optimized" : colorClass}`}
                >
                  {formatCountdown(minutes, seconds)}
                </div>

                {/* Target supplement - Sans-serif */}
                <div className="mt-3 font-sans text-lg font-medium text-white/90">
                  {zone.targetSupplementName}
                </div>

                {/* Mechanistic reason - Sans-serif prose */}
                <div className="mt-2 font-sans text-sm leading-relaxed text-white/50">
                  {zone.reason}
                </div>

                {/* Set Alert button - Soft permission flow */}
                {permission !== "denied" && !reminded && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 h-9 w-full border-emerald-400/30 bg-emerald-500/10 font-mono text-xs text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                    onClick={handleRemind}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    SET ALERT
                  </Button>
                )}
                {permission !== "denied" && reminded && (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 py-2.5 font-mono text-xs text-emerald-400">
                    <Bell className="h-4 w-4" />
                    ALERT SET
                  </div>
                )}
                {permission === "denied" && (
                  <div className="mt-4 text-center font-sans text-xs text-white/30">
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
                <span className="text-foreground font-sans text-sm">
                  {zone.targetSupplementName}
                </span>
                <span
                  className={`font-mono text-xs tabular-nums ${colorClass}`}
                >
                  {formatCountdown(minutes, seconds)}
                </span>
              </div>
              {/* Mechanistic reason - Sans-serif prose */}
              <div className="text-muted-foreground mt-1.5 font-sans text-xs leading-relaxed">
                {zone.reason}
              </div>
            </>
          )}
        </div>
        {/* Only show side button for non-hero cards */}
        {!isHero &&
          (permission === "denied" ? (
            <div
              className="text-muted-foreground/50"
              title="Notifications blocked"
            >
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
            <div className="status-info" title="Reminder set">
              <Bell className="h-3 w-3" />
            </div>
          ))}
      </div>
    </div>
  );
}

// ============================================================================
// Timing Suggestion Card - for suboptimal timing alerts
// ============================================================================

function TimingCard({
  optimization,
  onDismiss,
}: {
  optimization: OptimizationOpportunity;
  onDismiss?: () => void;
}) {
  return (
    <div className="group border-status-conflict bg-status-conflict relative rounded-2xl border p-3">
      {/* Dismiss button - visible on hover */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground/50 hover:bg-muted/30 hover:text-muted-foreground absolute top-1 right-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
          title="Dismiss suggestion"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <div className="flex items-start gap-2">
        <Clock className="status-conflict mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 pr-4">
          <div className="font-sans text-sm text-white">
            {optimization.title}
          </div>
          <div className="mt-0.5 font-sans text-xs leading-relaxed text-white/70">
            {optimization.description}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Synergy Card - with improved contrast, dismiss button, and expandable details
// ============================================================================

function SynergyCard({
  optimization,
  onDismiss,
}: {
  optimization: OptimizationOpportunity;
  onDismiss?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = optimization.title.startsWith("Active synergy");
  const hasSafetyWarning = !!optimization.safetyWarning;
  const suggestedSupp = optimization.suggestedSupplement;
  const hasDetails =
    !isActive &&
    suggestedSupp &&
    (suggestedSupp.mechanism || suggestedSupp.description);

  return (
    <div
      className={`group relative rounded-2xl border p-3 ${
        hasSafetyWarning
          ? "border-status-conflict bg-status-conflict"
          : isActive
            ? "border-status-optimized bg-status-optimized"
            : "border-status-info bg-status-info"
      }`}
    >
      {/* Dismiss button - visible on hover for suggestions */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground/50 hover:bg-muted/30 hover:text-muted-foreground absolute top-1 right-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
          title="Dismiss suggestion"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <div className="flex items-start gap-2">
        {hasSafetyWarning ? (
          <ShieldAlert className="status-conflict mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <Zap
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              isActive ? "status-optimized" : "status-info"
            }`}
          />
        )}
        <div className="min-w-0 flex-1 pr-4">
          <div className="font-sans text-sm text-white">
            {isActive
              ? optimization.title.replace("Active synergy: ", "")
              : optimization.title.replace(/^Enhance .+ with /, "Add ")}
          </div>
          <div className="mt-0.5 font-sans text-xs leading-relaxed text-white/70">
            {optimization.description}
          </div>
          {hasSafetyWarning && (
            <div className="bg-status-conflict mt-1.5 flex items-start gap-1.5 rounded-lg px-2 py-1">
              <AlertTriangle className="status-conflict mt-0.5 h-3 w-3 shrink-0" />
              <span className="status-conflict font-sans text-[10px] leading-relaxed">
                {optimization.safetyWarning}
              </span>
            </div>
          )}

          {/* Expandable details section */}
          {hasDetails && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-[10px] font-medium text-white/50 hover:text-white/70"
              >
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
                {isExpanded ? "Less" : "More about"} {suggestedSupp.name}
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-2 rounded-lg bg-black/20 p-2.5">
                  {/* Mechanism */}
                  {suggestedSupp.mechanism && (
                    <div>
                      <div className="font-mono text-[9px] tracking-wider text-white/40 uppercase">
                        Mechanism
                      </div>
                      <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-white/80">
                        {suggestedSupp.mechanism}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {suggestedSupp.description && (
                    <div>
                      <div className="font-mono text-[9px] tracking-wider text-white/40 uppercase">
                        Why Take It
                      </div>
                      <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-white/80">
                        {suggestedSupp.description}
                      </p>
                    </div>
                  )}

                  {/* Research link */}
                  {suggestedSupp.researchUrl && (
                    <a
                      href={suggestedSupp.researchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 font-mono text-[10px] text-emerald-400 hover:text-emerald-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Research
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
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
  // Track optimistically dismissed suggestions (by suggestionKey)
  const [optimisticallyDismissed, setOptimisticallyDismissed] = useState<
    Set<string>
  >(new Set());
  const [, startTransition] = useTransition();

  // Category preferences from localStorage
  const { preferences: categoryPrefs, isHydrated } = useCategoryPreferences();

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
          new Notification(
            `Ready to take ${pendingZone.targetSupplementName}`,
            {
              body: `${pendingZone.sourceSupplementName} is no longer blocking absorption.`,
              icon: "/icon-192.png",
              tag: `bio-sync-${pendingZone.ruleId}`,
            },
          );
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

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce<
    Record<SuggestionCategory, OptimizationOpportunity[]>
  >(
    (acc, opt) => {
      const category = opt.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(opt);
      return acc;
    },
    { safety: [], synergy: [], timing: [], balance: [] },
  );

  // Filter out dismissed suggestions and apply category visibility
  const visibleGroupedSuggestions = Object.entries(groupedSuggestions)
    .filter(([category]) =>
      isHydrated ? categoryPrefs[category as SuggestionCategory] : true,
    )
    .map(([category, opts]) => ({
      category: category as SuggestionCategory,
      suggestions: opts.filter(
        (opt) =>
          opt.suggestionKey && !optimisticallyDismissed.has(opt.suggestionKey),
      ),
    }))
    .filter(({ suggestions: s }) => s.length > 0)
    .sort(
      (a, b) =>
        CATEGORY_CONFIG[a.category].priority -
        CATEGORY_CONFIG[b.category].priority,
    );

  // Check if all categories are hidden
  const allCategoriesHidden =
    isHydrated &&
    Object.values(categoryPrefs).every((v) => !v) &&
    suggestions.length > 0;

  // Sort exclusion zones by time remaining
  const sortedZones = [...exclusionZones].sort(
    (a, b) => a.minutesRemaining - b.minutesRemaining,
  );

  const hasContent =
    sortedZones.length > 0 ||
    activeSynergies.length > 0 ||
    visibleGroupedSuggestions.length > 0;

  if (!hasContent && !allCategoriesHidden) {
    return (
      <div className="bg-card border-border rounded-xl border p-4 text-center shadow-[var(--elevation-1)]">
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="status-conflict h-3 w-3" />
              <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                Other Windows
              </span>
            </div>
            <div className="space-y-2">
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="status-optimized h-3 w-3" />
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

        {/* Empty state when all categories are hidden */}
        {allCategoriesHidden && (
          <div className="bg-card border-border rounded-xl border p-4 text-center shadow-[var(--elevation-1)]">
            <div className="text-muted-foreground font-mono text-xs">
              All suggestion categories are hidden
            </div>
            <Link
              href="/dashboard/settings"
              className="text-muted-foreground/60 hover:text-muted-foreground mt-1 flex items-center justify-center gap-1 font-mono text-[10px]"
            >
              <Settings className="h-3 w-3" />
              Manage in Settings
            </Link>
          </div>
        )}

        {/* Grouped Suggestions by Category */}
        {visibleGroupedSuggestions.map(
          ({ category, suggestions: categorysuggestions }) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3 w-3 ${config.colorClass}`} />
                  <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                    {config.label}
                  </span>
                  <span className="text-muted-foreground/50 font-mono text-[10px]">
                    ({categorysuggestions.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {categorysuggestions.slice(0, 3).map((opt) => {
                    const handleDismiss = () => {
                      const key = opt.suggestionKey;
                      if (!key) return;
                      // Optimistic update: hide immediately
                      setOptimisticallyDismissed((prev) =>
                        new Set(prev).add(key),
                      );
                      // Persist to server in background
                      startTransition(() => {
                        void dismissSuggestion(key);
                      });
                    };

                    // Use TimingCard for timing suggestions, SynergyCard for others
                    if (opt.type === "timing") {
                      return (
                        <TimingCard
                          key={opt.suggestionKey}
                          optimization={opt}
                          onDismiss={handleDismiss}
                        />
                      );
                    }

                    return (
                      <SynergyCard
                        key={opt.suggestionKey}
                        optimization={opt}
                        onDismiss={handleDismiss}
                      />
                    );
                  })}
                </div>
              </div>
            );
          },
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
            <div
              key={i}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
            >
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
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
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
