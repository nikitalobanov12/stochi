"use client";

import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { Skeleton } from "~/components/ui/skeleton";

/**
 * BentoCard - Attio-inspired translucent card component for the Bento Grid
 * 
 * Features:
 * - Translucent background with backdrop blur
 * - Subtle top edge highlight for depth
 * - Optional radial gradient glow
 * - Skeleton loading state with feature preview transition
 * - CLS-safe with defined aspect ratios
 */

type BentoCardSpan = "full" | "two-thirds" | "one-third" | "half";
type BentoCardAspect = "auto" | "timeline" | "score" | "feed" | "stack";

type BentoCardProps = {
  children: React.ReactNode;
  span?: BentoCardSpan;
  aspect?: BentoCardAspect;
  showSkeleton?: boolean;
  skeletonDuration?: number;
  showGlow?: boolean;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
};

const SPAN_CLASSES: Record<BentoCardSpan, string> = {
  full: "col-span-1 md:col-span-2 lg:col-span-12",
  "two-thirds": "col-span-1 md:col-span-2 lg:col-span-8",
  "one-third": "col-span-1 md:col-span-1 lg:col-span-4",
  half: "col-span-1 md:col-span-1 lg:col-span-6",
};

const ASPECT_CLASSES: Record<BentoCardAspect, string> = {
  auto: "",
  timeline: "bento-aspect-timeline",
  score: "bento-aspect-score",
  feed: "bento-aspect-feed",
  stack: "bento-aspect-stack",
};

export function BentoCard({
  children,
  span = "one-third",
  aspect = "auto",
  showSkeleton = false,
  skeletonDuration = 800,
  showGlow = false,
  className,
  id,
  "aria-labelledby": ariaLabelledBy,
}: BentoCardProps) {
  const [isLoading, setIsLoading] = useState(showSkeleton);

  // Feature preview transition: show skeleton then content
  useEffect(() => {
    if (showSkeleton) {
      const timer = setTimeout(() => setIsLoading(false), skeletonDuration);
      return () => clearTimeout(timer);
    }
  }, [showSkeleton, skeletonDuration]);

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={ariaLabelledBy}
      className={cn(
        // Base styles - Surgical Precision
        "relative overflow-hidden rounded-xl",
        // Elevated black with high-luminance border
        "border border-white/10 bg-[#0A0A0A] transition-colors duration-200 hover:border-white/15",
        // Grid span
        SPAN_CLASSES[span],
        // Aspect ratio for CLS prevention
        ASPECT_CLASSES[aspect],
        className
      )}
    >
      {/* Top edge highlight for depth */}
      <div className="bento-card-highlight" aria-hidden="true" />

      {/* Optional radial gradient glow */}
      {showGlow && <div className="bento-card-glow" aria-hidden="true" />}

      {/* Content or skeleton */}
      {isLoading ? (
        <BentoCardSkeleton aspect={aspect} />
      ) : (
        <div className="relative h-full">{children}</div>
      )}
    </div>
  );
}

/**
 * BentoCardSkeleton - Loading placeholder for BentoCard
 */

// Deterministic heights for skeleton bars to avoid impure Math.random() during render
const SKELETON_BAR_HEIGHTS = [45, 72, 58, 38, 65, 52, 78, 42];

function BentoCardSkeleton({ aspect }: { aspect: BentoCardAspect }) {
  // Different skeleton layouts based on aspect
  if (aspect === "timeline") {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="h-[200px] rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex h-full items-end gap-2 p-4">
            {SKELETON_BAR_HEIGHTS.map((height, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
    );
  }

  if (aspect === "score") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 lg:p-6">
        <Skeleton className="mb-4 h-5 w-24" />
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="mt-4 h-4 w-20" />
        <Skeleton className="mt-6 h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (aspect === "feed") {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="space-y-2 rounded-lg bg-black/20 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (aspect === "stack") {
    return (
      <div className="p-4 lg:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton className="mb-4 h-4 w-full" />
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="p-4 lg:p-6">
      <Skeleton className="mb-4 h-5 w-32" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * BentoCardHeader - Standard header layout for BentoCard content
 */
type BentoCardHeaderProps = {
  title: string;
  badge?: string;
  icon?: React.ReactNode;
  id?: string;
};

export function BentoCardHeader({ title, badge, icon, id }: BentoCardHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 id={id} className="text-sm font-medium text-white/90">
        {title}
      </h3>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="font-mono text-[10px] text-white/50">{badge}</span>
        )}
        {icon}
      </div>
    </div>
  );
}
