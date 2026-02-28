type EngineTimingWarningInput = {
  id: string;
  severity: "low" | "medium" | "critical";
  minHoursApart: number;
  actualHoursApart: number;
  reason: string;
  source: {
    id: string;
    name: string;
    form?: string;
  };
  target: {
    id: string;
    name: string;
    form?: string;
  };
  sourceLoggedAt?: string;
  targetLoggedAt?: string;
};

type AppTimingWarning = {
  id: string;
  severity: "low" | "medium" | "critical";
  reason: string;
  minHoursApart: number;
  actualHoursApart: number;
  source: {
    id: string;
    name: string;
    loggedAt: Date;
  };
  target: {
    id: string;
    name: string;
    loggedAt: Date;
  };
};

function parseEngineTimestamp(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function mapEngineTimingWarnings(
  fallbackLoggedAt: Date,
  warnings: EngineTimingWarningInput[],
): AppTimingWarning[] {
  return warnings.map((warning) => ({
    id: warning.id,
    severity: warning.severity,
    reason: warning.reason,
    minHoursApart: warning.minHoursApart,
    actualHoursApart: warning.actualHoursApart,
    source: {
      id: warning.source.id,
      name: warning.source.name,
      loggedAt: parseEngineTimestamp(warning.sourceLoggedAt) ?? fallbackLoggedAt,
    },
    target: {
      id: warning.target.id,
      name: warning.target.name,
      loggedAt: parseEngineTimestamp(warning.targetLoggedAt) ?? fallbackLoggedAt,
    },
  }));
}

export type { EngineTimingWarningInput };
