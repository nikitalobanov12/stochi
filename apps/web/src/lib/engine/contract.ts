type BasicEntity = {
  id: string;
  name: string;
};

type BasicInteraction = {
  id: string;
  type: string;
  severity: string;
  source: BasicEntity;
  target: BasicEntity;
};

type BasicRatioWarning = {
  id: string;
  severity: string;
  currentRatio: number;
  source: BasicEntity;
  target: BasicEntity;
};

type BasicTimingWarning = {
  id: string;
  severity: string;
  minHoursApart: number;
  source: BasicEntity;
  target: BasicEntity;
};

type SafetyContractPayload = {
  warnings?: BasicInteraction[] | null;
  synergies?: BasicInteraction[] | null;
  ratioWarnings?: BasicRatioWarning[] | null;
  timingWarnings?: BasicTimingWarning[] | null;
};

function normalizeInteractions(payload: SafetyContractPayload): string[] {
  const directWarnings = payload.warnings ?? [];
  const synergies = payload.synergies ?? [];
  const combined = [...directWarnings, ...synergies];

  return combined
    .map(
      (warning) =>
        [
          warning.id,
          warning.type,
          warning.severity,
          warning.source.id,
          warning.target.id,
        ].join("|"),
    )
    .sort();
}

function normalizeRatioWarnings(payload: SafetyContractPayload): string[] {
  const warnings = payload.ratioWarnings ?? [];
  return warnings
    .map((warning) => {
      const normalizedRatio = Number.isFinite(warning.currentRatio)
        ? Number(warning.currentRatio.toFixed(3))
        : warning.currentRatio;
      return [
        warning.id,
        warning.severity,
        normalizedRatio,
        warning.source.id,
        warning.target.id,
      ].join("|");
    })
    .sort();
}

function normalizeTimingWarnings(payload: SafetyContractPayload): string[] {
  const warnings = payload.timingWarnings ?? [];
  return warnings
    .map((warning) => {
      const normalizedMinHoursApart = Number.isFinite(warning.minHoursApart)
        ? Number(warning.minHoursApart.toFixed(3))
        : warning.minHoursApart;
      return [
        warning.id,
        warning.severity,
        normalizedMinHoursApart,
        warning.source.id,
        warning.target.id,
      ].join("|");
    })
    .sort();
}

function isArrayEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export function areSafetyContractsEquivalent(
  tsPayload: SafetyContractPayload,
  goPayload: SafetyContractPayload,
): boolean {
  const tsInteractions = normalizeInteractions(tsPayload);
  const goInteractions = normalizeInteractions(goPayload);
  if (!isArrayEqual(tsInteractions, goInteractions)) {
    return false;
  }

  const tsRatioWarnings = normalizeRatioWarnings(tsPayload);
  const goRatioWarnings = normalizeRatioWarnings(goPayload);
  if (!isArrayEqual(tsRatioWarnings, goRatioWarnings)) {
    return false;
  }

  const tsTimingWarnings = normalizeTimingWarnings(tsPayload);
  const goTimingWarnings = normalizeTimingWarnings(goPayload);
  return isArrayEqual(tsTimingWarnings, goTimingWarnings);
}
