import {
  type InteractionWarning,
  type RatioEvaluationGap,
  type RatioWarning,
  type TimingWarning,
} from "~/server/actions/interactions";
import { formatRatioGapReason } from "~/lib/engine/ratio-gaps";

export type SafetyActionBuckets = {
  doNow: string[];
  avoidNow: string[];
  optimizeLater: string[];
};

type BuildSafetyActionBucketsInput = {
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
  ratioEvaluationGaps?: RatioEvaluationGap[];
};

function pushUnique(list: string[], value: string): void {
  if (!list.includes(value)) {
    list.push(value);
  }
}

export function buildSafetyActionBuckets(
  input: BuildSafetyActionBucketsInput,
): SafetyActionBuckets {
  const buckets: SafetyActionBuckets = {
    doNow: [],
    avoidNow: [],
    optimizeLater: [],
  };

  for (const interaction of input.interactions) {
    const pair = `${interaction.source.name} + ${interaction.target.name}`;
    if (interaction.type === "synergy") {
      pushUnique(buckets.doNow, `Consider pairing ${pair} together today.`);
      continue;
    }

    if (interaction.severity === "critical") {
      pushUnique(
        buckets.avoidNow,
        `Avoid combining ${pair} right now due to a critical interaction.`,
      );
      continue;
    }

    pushUnique(
      buckets.optimizeLater,
      `Separate ${pair} to reduce ${interaction.type} effects.`,
    );
  }

  for (const warning of input.ratioWarnings) {
    const pair = `${warning.source.name}:${warning.target.name}`;
    const action = `Adjust ${pair} ratio (currently ${warning.currentRatio}:1).`;

    if (warning.severity === "critical") {
      pushUnique(buckets.avoidNow, `Avoid current ${pair} ratio until corrected.`);
      continue;
    }

    pushUnique(buckets.optimizeLater, action);
  }

  for (const warning of input.timingWarnings) {
    const action = `Separate ${warning.source.name} and ${warning.target.name} by ${warning.minHoursApart}h.`;

    if (warning.severity === "critical") {
      pushUnique(buckets.avoidNow, `Avoid taking them together: ${action}`);
      continue;
    }

    pushUnique(buckets.optimizeLater, action);
  }

  for (const gap of input.ratioEvaluationGaps ?? []) {
    pushUnique(
      buckets.optimizeLater,
      `Add missing ratio inputs (${formatRatioGapReason(gap.reason)}).`,
    );
  }

  return buckets;
}
