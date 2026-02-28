import { SAFETY_LIMITS, type SafetyCategory } from "~/server/data/safety-limits";
import type { LogEntry } from "~/components/log/log-context";
import type {
  InteractionWarning,
  RatioEvaluationGap,
  RatioWarning,
  TimingWarning,
} from "~/server/actions/interactions";
import type {
  BiologicalState,
  TimelineDataPoint,
  ExclusionZone,
  OptimizationOpportunity,
  ActiveCompound,
} from "~/server/services/biological-state";
import type { SafetyHeadroom } from "~/components/dashboard/micro-kpi-row";

type Severity = "low" | "medium" | "critical";
type InteractionType = "inhibition" | "synergy" | "competition";

type SupplementSnapshot = {
  id: string;
  name: string;
  form: string | null;
  safetyCategory: string | null;
  peakMinutes: number | null;
  halfLifeMinutes: number | null;
  kineticsType: "first_order" | "michaelis_menten" | null;
  vmax: number | null;
  km: number | null;
  rdaAmount: number | null;
  bioavailabilityPercent: number | null;
  category: string | null;
};

type InteractionRuleSnapshot = {
  id: string;
  type: InteractionType;
  severity: Severity;
  mechanism: string | null;
  researchUrl: string | null;
  suggestion: string | null;
  sourceId: string;
  targetId: string;
  source: { id: string; name: string; form: string | null };
  target: { id: string; name: string; form: string | null };
};

type RatioRuleSnapshot = {
  id: string;
  sourceSupplementId: string;
  targetSupplementId: string;
  minRatio: number | null;
  maxRatio: number | null;
  optimalRatio: number | null;
  warningMessage: string;
  severity: Severity;
  researchUrl: string | null;
  sourceSupplement: { id: string; name: string; form: string | null };
  targetSupplement: { id: string; name: string; form: string | null };
};

type TimingRuleSnapshot = {
  id: string;
  sourceSupplementId: string;
  targetSupplementId: string;
  minHoursApart: number;
  reason: string;
  severity: Severity;
  researchUrl: string | null;
  sourceSupplement: { id: string; name: string };
  targetSupplement: { id: string; name: string };
};

export type DashboardRuleSnapshot = {
  supplements: SupplementSnapshot[];
  interactionRules: InteractionRuleSnapshot[];
  ratioRules: RatioRuleSnapshot[];
  timingRules: TimingRuleSnapshot[];
};

export type DerivedDashboardState = {
  todayLogCount: number;
  lastLogAt: Date | null;
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  ratioEvaluationGaps: RatioEvaluationGap[];
  timingWarnings: TimingWarning[];
  biologicalState: BiologicalState;
  timelineData: TimelineDataPoint[];
  safetyHeadroom: SafetyHeadroom[];
};

const DEFAULT_PEAK_MINUTES = 60;
const DEFAULT_HALF_LIFE_MINUTES = 240;

function convertUnit(amount: number, fromUnit: string, toUnit: "mg" | "mcg" | "g" | "IU"): number | null {
  if (!Number.isFinite(amount)) return null;
  if (fromUnit === toUnit) return amount;

  if (toUnit === "IU" || fromUnit === "IU") {
    return null;
  }

  if (fromUnit === "g" && toUnit === "mg") return amount * 1000;
  if (fromUnit === "mg" && toUnit === "g") return amount / 1000;
  if (fromUnit === "mg" && toUnit === "mcg") return amount * 1000;
  if (fromUnit === "mcg" && toUnit === "mg") return amount / 1000;
  if (fromUnit === "g" && toUnit === "mcg") return amount * 1000 * 1000;
  if (fromUnit === "mcg" && toUnit === "g") return amount / (1000 * 1000);

  return null;
}

function calculateConcentrationPercent(params: {
  minutesSinceIngestion: number;
  peakMinutes: number;
  halfLifeMinutes: number;
}): number {
  const { minutesSinceIngestion } = params;
  let { peakMinutes, halfLifeMinutes } = params;

  if (minutesSinceIngestion < 0) return 0;
  if (peakMinutes <= 0) peakMinutes = DEFAULT_PEAK_MINUTES;
  if (halfLifeMinutes <= 0) halfLifeMinutes = DEFAULT_HALF_LIFE_MINUTES;

  if (minutesSinceIngestion < peakMinutes) {
    return (minutesSinceIngestion / peakMinutes) * 100;
  }

  const k = Math.log(2) / halfLifeMinutes;
  const timeSincePeak = minutesSinceIngestion - peakMinutes;
  const concentration = 100 * Math.exp(-k * timeSincePeak);
  return concentration < 1 ? 0 : concentration;
}

function determinePhase(
  minutesSinceIngestion: number,
  peakMinutes: number,
  concentrationPercent: number,
): "absorbing" | "peak" | "eliminating" | "cleared" {
  if (concentrationPercent < 1) return "cleared";
  if (minutesSinceIngestion < peakMinutes) return "absorbing";
  if (minutesSinceIngestion <= peakMinutes + 30) return "peak";
  return "eliminating";
}

function calculateInteractionWarnings(
  logs: LogEntry[],
  rules: InteractionRuleSnapshot[],
): InteractionWarning[] {
  const presentIds = new Set(logs.map((l) => l.supplement.id));
  return rules
    .filter((rule) => presentIds.has(rule.sourceId) && presentIds.has(rule.targetId))
    .map((rule) => ({
      id: rule.id,
      type: rule.type,
      severity: rule.severity,
      mechanism: rule.mechanism,
      researchUrl: rule.researchUrl,
      suggestion: rule.suggestion,
      source: rule.source,
      target: rule.target,
    }));
}

function latestDosageBySupplement(logs: LogEntry[]): Map<string, { dosage: number; unit: string }> {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
  );
  const map = new Map<string, { dosage: number; unit: string }>();
  for (const log of sorted) {
    if (!map.has(log.supplement.id)) {
      map.set(log.supplement.id, { dosage: log.dosage, unit: log.unit });
    }
  }
  return map;
}

function calculateRatioWarnings(
  logs: LogEntry[],
  rules: RatioRuleSnapshot[],
): { ratioWarnings: RatioWarning[]; ratioEvaluationGaps: RatioEvaluationGap[] } {
  const dosageMap = latestDosageBySupplement(logs);
  const ratioWarnings: RatioWarning[] = [];

  for (const rule of rules) {
    const sourceDosage = dosageMap.get(rule.sourceSupplementId);
    const targetDosage = dosageMap.get(rule.targetSupplementId);
    if (!sourceDosage || !targetDosage) continue;

    const sourceMg = convertUnit(sourceDosage.dosage, sourceDosage.unit, "mg");
    const targetMg = convertUnit(targetDosage.dosage, targetDosage.unit, "mg");
    if (sourceMg === null || targetMg === null || targetMg === 0) {
      continue;
    }

    const ratio = sourceMg / targetMg;
    const toleranceFactor = 0.15;
    const effectiveMinRatio =
      rule.minRatio !== null ? rule.minRatio * (1 - toleranceFactor) : null;
    const effectiveMaxRatio =
      rule.maxRatio !== null ? rule.maxRatio * (1 + toleranceFactor) : null;

    const isBelowMin = effectiveMinRatio !== null && ratio < effectiveMinRatio;
    const isAboveMax = effectiveMaxRatio !== null && ratio > effectiveMaxRatio;
    if (!isBelowMin && !isAboveMax) continue;

    ratioWarnings.push({
      id: rule.id,
      severity: rule.severity,
      message: rule.warningMessage,
      currentRatio: Math.round(ratio * 10) / 10,
      optimalRatio: rule.optimalRatio,
      minRatio: rule.minRatio,
      maxRatio: rule.maxRatio,
      researchUrl: rule.researchUrl,
      source: {
        id: rule.sourceSupplement.id,
        name: rule.sourceSupplement.name,
        dosage: sourceDosage.dosage,
        unit: sourceDosage.unit,
      },
      target: {
        id: rule.targetSupplement.id,
        name: rule.targetSupplement.name,
        dosage: targetDosage.dosage,
        unit: targetDosage.unit,
      },
    });
  }

  return { ratioWarnings, ratioEvaluationGaps: [] };
}

function calculateTimingWarnings(logs: LogEntry[], rules: TimingRuleSnapshot[]): TimingWarning[] {
  const bySupplement = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const arr = bySupplement.get(log.supplement.id) ?? [];
    arr.push(log);
    bySupplement.set(log.supplement.id, arr);
  }

  const warnings: TimingWarning[] = [];
  for (const rule of rules) {
    const sourceLogs = bySupplement.get(rule.sourceSupplementId) ?? [];
    const targetLogs = bySupplement.get(rule.targetSupplementId) ?? [];
    if (sourceLogs.length === 0 || targetLogs.length === 0) continue;

    let best: { source: LogEntry; target: LogEntry; hours: number } | null = null;
    for (const sourceLog of sourceLogs) {
      for (const targetLog of targetLogs) {
        const hours =
          Math.abs(
            new Date(sourceLog.loggedAt).getTime() -
              new Date(targetLog.loggedAt).getTime(),
          ) /
          (1000 * 60 * 60);

        if (!best || hours < best.hours) {
          best = { source: sourceLog, target: targetLog, hours };
        }
      }
    }

    if (!best || best.hours >= rule.minHoursApart) continue;

    warnings.push({
      id: rule.id,
      severity: rule.severity,
      reason: rule.reason,
      minHoursApart: rule.minHoursApart,
      actualHoursApart: Math.round(best.hours * 10) / 10,
      source: {
        id: rule.sourceSupplementId,
        name: rule.sourceSupplement.name,
        loggedAt: new Date(best.source.loggedAt),
      },
      target: {
        id: rule.targetSupplementId,
        name: rule.targetSupplement.name,
        loggedAt: new Date(best.target.loggedAt),
      },
    });
  }

  const deduped = new Map<string, TimingWarning>();
  for (const warning of warnings) {
    const key = [warning.source.id, warning.target.id].sort().join("-");
    if (!deduped.has(key)) {
      deduped.set(key, warning);
    }
  }
  return [...deduped.values()];
}

function calculateActiveCompounds(
  logs: LogEntry[],
  supplementsById: Map<string, SupplementSnapshot>,
  now: Date,
): ActiveCompound[] {
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const active: ActiveCompound[] = [];

  for (const log of logs) {
    const loggedAt = new Date(log.loggedAt);
    if (loggedAt < windowStart || loggedAt > now) continue;

    const supplement = supplementsById.get(log.supplement.id);
    const peakMinutes = supplement?.peakMinutes ?? DEFAULT_PEAK_MINUTES;
    const halfLifeMinutes = supplement?.halfLifeMinutes ?? DEFAULT_HALF_LIFE_MINUTES;
    const minutesSinceIngestion = (now.getTime() - loggedAt.getTime()) / (1000 * 60);
    const concentrationPercent = calculateConcentrationPercent({
      minutesSinceIngestion,
      peakMinutes,
      halfLifeMinutes,
    });

    active.push({
      logId: log.id,
      supplementId: log.supplement.id,
      name: log.supplement.name,
      dosage: log.dosage,
      unit: log.unit,
      loggedAt,
      concentrationPercent: Math.round(concentrationPercent * 10) / 10,
      phase: determinePhase(minutesSinceIngestion, peakMinutes, concentrationPercent),
      peakMinutes,
      halfLifeMinutes,
      bioavailabilityPercent: supplement?.bioavailabilityPercent ?? null,
      category: supplement?.category ?? log.supplement.category ?? null,
    });
  }

  return active;
}

function calculateExclusionZones(
  logs: LogEntry[],
  rules: TimingRuleSnapshot[],
  now: Date,
): ExclusionZone[] {
  const bySupplement = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const arr = bySupplement.get(log.supplement.id) ?? [];
    arr.push(log);
    bySupplement.set(log.supplement.id, arr);
  }

  const zones: ExclusionZone[] = [];
  for (const rule of rules) {
    const sourceLogs = bySupplement.get(rule.sourceSupplementId) ?? [];
    const targetLogs = bySupplement.get(rule.targetSupplementId) ?? [];
    if (sourceLogs.length === 0 || targetLogs.length === 0) continue;

    const latestSource = [...sourceLogs].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
    )[0];
    if (!latestSource) continue;

    const endsAt = new Date(
      new Date(latestSource.loggedAt).getTime() +
        rule.minHoursApart * 60 * 60 * 1000,
    );
    if (endsAt <= now) continue;

    const minutesRemaining = Math.round((endsAt.getTime() - now.getTime()) / (1000 * 60));
    zones.push({
      ruleId: rule.id,
      sourceSupplementId: rule.sourceSupplementId,
      sourceSupplementName: rule.sourceSupplement.name,
      targetSupplementId: rule.targetSupplementId,
      targetSupplementName: rule.targetSupplement.name,
      endsAt,
      minutesRemaining,
      reason: rule.reason,
      severity: rule.severity,
      researchUrl: rule.researchUrl,
    });
  }

  return zones.sort((a, b) => a.minutesRemaining - b.minutesRemaining);
}

function calculateOptimizations(
  presentSupplementIds: Set<string>,
  rules: InteractionRuleSnapshot[],
): OptimizationOpportunity[] {
  const activeSynergies: OptimizationOpportunity[] = [];
  for (const rule of rules) {
    if (rule.type !== "synergy") continue;
    if (!presentSupplementIds.has(rule.sourceId) || !presentSupplementIds.has(rule.targetId)) {
      continue;
    }

    activeSynergies.push({
      type: "synergy",
      category: "synergy",
      supplementIds: [rule.sourceId, rule.targetId],
      title: `Active synergy: ${rule.source.name} + ${rule.target.name}`,
      description: rule.suggestion ?? "You are getting the benefit of this synergy.",
      priority: 1,
      suggestionKey: `synergy:${[rule.sourceId, rule.targetId].sort().join(":")}`,
      timingExplanation: null,
    });
  }

  return activeSynergies;
}

function calculateBioScore(
  activeCompounds: ActiveCompound[],
  exclusionZones: ExclusionZone[],
  optimizations: OptimizationOpportunity[],
): number {
  let score = 100;

  for (const zone of exclusionZones) {
    if (zone.severity === "critical") score -= 50;
    else if (zone.severity === "medium") score -= 25;
    else score -= 15;
  }

  const activeSynergyCount = optimizations.filter((o) => o.title.startsWith("Active synergy")).length;
  score += Math.min(activeSynergyCount * 5, 20);

  if (activeCompounds.length === 0) score = 50;
  return Math.max(0, Math.min(100, score));
}

function calculateTimeline(
  logs: LogEntry[],
  supplementsById: Map<string, SupplementSnapshot>,
  now: Date,
): TimelineDataPoint[] {
  if (logs.length === 0) return [];
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const intervalMinutes = 15;
  const totalMinutes = (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60);
  const points: TimelineDataPoint[] = [];

  for (let minutes = 0; minutes <= totalMinutes; minutes += intervalMinutes) {
    const timestamp = new Date(windowStart.getTime() + minutes * 60 * 1000);
    const concentrations: Record<string, number> = {};

    for (const log of logs) {
      const supplement = supplementsById.get(log.supplement.id);
      const peakMinutes = supplement?.peakMinutes ?? DEFAULT_PEAK_MINUTES;
      const halfLifeMinutes = supplement?.halfLifeMinutes ?? DEFAULT_HALF_LIFE_MINUTES;
      const minutesSinceIngestion =
        (timestamp.getTime() - new Date(log.loggedAt).getTime()) / (1000 * 60);
      if (minutesSinceIngestion < 0) continue;

      const concentration = calculateConcentrationPercent({
        minutesSinceIngestion,
        peakMinutes,
        halfLifeMinutes,
      });

      const current = concentrations[log.supplement.id] ?? 0;
      concentrations[log.supplement.id] = Math.min(current + concentration, 150);
    }

    points.push({
      minutesFromStart: minutes,
      timestamp: timestamp.toISOString(),
      concentrations,
    });
  }

  return points;
}

function calculateSafetyHeadroom(
  logs: LogEntry[],
  supplementsById: Map<string, SupplementSnapshot>,
): SafetyHeadroom[] {
  const totals = new Map<SafetyCategory, number>();

  for (const log of logs) {
    const supplement = supplementsById.get(log.supplement.id);
    const category = supplement?.safetyCategory as SafetyCategory | null;
    if (!category || !SAFETY_LIMITS[category]) continue;

    const limit = SAFETY_LIMITS[category];
    const converted = convertUnit(log.dosage, log.unit, limit.unit);
    if (converted === null) continue;

    totals.set(category, (totals.get(category) ?? 0) + converted);
  }

  const result: SafetyHeadroom[] = [];
  for (const [category, current] of totals) {
    const limit = SAFETY_LIMITS[category];
    if (!limit || current <= 0) continue;

    const label = category
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    result.push({
      category,
      label,
      current,
      limit: limit.limit,
      unit: limit.unit,
      percentUsed: (current / limit.limit) * 100,
    });
  }

  return result.sort((a, b) => b.percentUsed - a.percentUsed);
}

export function deriveOptimisticDashboardState(input: {
  logs: LogEntry[];
  snapshot: DashboardRuleSnapshot;
  now?: Date;
}): DerivedDashboardState {
  const now = input.now ?? new Date();
  const logs = [...input.logs].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
  );
  const supplementsById = new Map(
    input.snapshot.supplements.map((supplement) => [supplement.id, supplement]),
  );

  const interactions = calculateInteractionWarnings(logs, input.snapshot.interactionRules);
  const { ratioWarnings, ratioEvaluationGaps } = calculateRatioWarnings(
    logs,
    input.snapshot.ratioRules,
  );
  const timingWarnings = calculateTimingWarnings(logs, input.snapshot.timingRules);

  const activeCompounds = calculateActiveCompounds(logs, supplementsById, now);
  const exclusionZones = calculateExclusionZones(logs, input.snapshot.timingRules, now);
  const presentSupplementIds = new Set(logs.map((log) => log.supplement.id));
  const optimizations = calculateOptimizations(
    presentSupplementIds,
    input.snapshot.interactionRules,
  );
  const bioScore = calculateBioScore(activeCompounds, exclusionZones, optimizations);
  const timelineData = calculateTimeline(logs, supplementsById, now);
  const safetyHeadroom = calculateSafetyHeadroom(logs, supplementsById);

  const biologicalState: BiologicalState = {
    activeCompounds,
    exclusionZones,
    optimizations,
    bioScore,
    calculatedAt: now,
  };

  return {
    todayLogCount: logs.length,
    lastLogAt: logs[0] ? new Date(logs[0].loggedAt) : null,
    interactions,
    ratioWarnings,
    ratioEvaluationGaps,
    timingWarnings,
    biologicalState,
    timelineData,
    safetyHeadroom,
  };
}
