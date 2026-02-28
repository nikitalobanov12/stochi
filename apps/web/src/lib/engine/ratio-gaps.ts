import { type RatioEvaluationGap } from "~/server/actions/interactions";

export function formatRatioGapReason(reason: RatioEvaluationGap["reason"]): string {
  switch (reason) {
    case "missing_dosage":
      return "missing dosage";
    case "missing_supplement_data":
      return "missing supplement data";
    case "normalization_failed":
      return "unit normalization failed";
    default:
      return "unknown reason";
  }
}

export function buildRatioGapMessage(gap: RatioEvaluationGap): string {
  return `Ratio check could not evaluate one supplement pair: ${formatRatioGapReason(gap.reason)}.`;
}
