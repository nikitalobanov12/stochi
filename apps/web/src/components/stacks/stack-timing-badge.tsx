import { Sun, Moon, Sunset, Coffee, Utensils } from "lucide-react";
import { type optimalTimeOfDayEnum } from "~/server/db/schema";
import { cn } from "~/lib/utils";

type OptimalTimeOfDay = (typeof optimalTimeOfDayEnum.enumValues)[number];

type StackTimingBadgeProps = {
  items: Array<{
    supplement: {
      optimalTimeOfDay: OptimalTimeOfDay | null;
    };
  }>;
  className?: string;
};

type TimingDisplay = {
  label: string;
  icon: typeof Sun;
  colorClass: string;
};

const TIMING_DISPLAY: Record<OptimalTimeOfDay, TimingDisplay> = {
  morning: {
    label: "Morning",
    icon: Sun,
    colorClass: "text-amber-400",
  },
  afternoon: {
    label: "Afternoon",
    icon: Sun,
    colorClass: "text-yellow-400",
  },
  evening: {
    label: "Evening",
    icon: Sunset,
    colorClass: "text-orange-400",
  },
  bedtime: {
    label: "Bedtime",
    icon: Moon,
    colorClass: "text-indigo-400",
  },
  with_meals: {
    label: "With Food",
    icon: Utensils,
    colorClass: "text-emerald-400",
  },
  any: {
    label: "Any Time",
    icon: Coffee,
    colorClass: "text-muted-foreground",
  },
};

/**
 * Determines the dominant timing for a stack based on 70% consensus heuristic.
 * Returns null if no clear consensus exists.
 */
function getDominantTiming(
  items: StackTimingBadgeProps["items"],
): OptimalTimeOfDay | null {
  const timings = items
    .map((item) => item.supplement.optimalTimeOfDay)
    .filter((t): t is OptimalTimeOfDay => t !== null && t !== "any");

  if (timings.length === 0) return null;

  // Count occurrences
  const counts: Record<string, number> = {};
  for (const timing of timings) {
    counts[timing] = (counts[timing] ?? 0) + 1;
  }

  // Find the most common timing
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = entries[0];

  if (!dominant) return null;

  // Only show if >70% consensus
  const consensusRatio = dominant[1] / timings.length;
  if (consensusRatio >= 0.7) {
    return dominant[0] as OptimalTimeOfDay;
  }

  return null;
}

/**
 * Displays the optimal timing badge for a stack.
 * Only shows if >70% of supplements share the same optimal time.
 */
export function StackTimingBadge({ items, className }: StackTimingBadgeProps) {
  const dominantTiming = getDominantTiming(items);

  if (!dominantTiming) return null;

  const display = TIMING_DISPLAY[dominantTiming];
  const Icon = display.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px]",
        display.colorClass,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {display.label}
    </span>
  );
}
