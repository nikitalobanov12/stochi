import type { LogEntry } from "~/components/log/log-context";
import type {
  InteractionWarning,
  RatioWarning,
  TimingWarning,
} from "~/server/actions/interactions";

type ComputeDemoWarningsInput = {
  logs: LogEntry[];
};

type ComputeDemoWarningsResult = {
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
};

const SUPP = {
  zinc: "supp-3",
  copper: "supp-6",
  caffeine: "supp-10",
  theanine: "supp-7",
  tyrosine: "supp-13",
  htp5: "supp-14",
} as const;

function hoursApart(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60);
}

function sumDosage(
  logs: LogEntry[],
  supplementId: string,
): {
  amount: number;
  unit: string;
  name: string;
} {
  let amount = 0;
  let unit = "mg";
  let name = supplementId;

  for (const l of logs) {
    if (l.supplement.id !== supplementId) continue;
    amount += l.dosage;
    unit = l.unit;
    name = l.supplement.name;
  }

  return { amount, unit, name };
}

function latestLog(logs: LogEntry[], supplementId: string): LogEntry | null {
  let best: LogEntry | null = null;
  for (const l of logs) {
    if (l.supplement.id !== supplementId) continue;
    if (
      !best ||
      new Date(l.loggedAt).getTime() > new Date(best.loggedAt).getTime()
    ) {
      best = l;
    }
  }
  return best;
}

export function computeDemoWarnings(
  input: ComputeDemoWarningsInput,
): ComputeDemoWarningsResult {
  const logs = input.logs;
  const present = new Set(logs.map((l) => l.supplement.id));

  const interactions: InteractionWarning[] = [];
  const ratioWarnings: RatioWarning[] = [];
  const timingWarnings: TimingWarning[] = [];

  // Interactions (small demo subset)
  if (present.has(SUPP.caffeine) && present.has(SUPP.theanine)) {
    const caffeine = latestLog(logs, SUPP.caffeine)!;
    const theanine = latestLog(logs, SUPP.theanine)!;
    interactions.push({
      id: "demo-int-caffeine-theanine",
      type: "synergy",
      severity: "low",
      mechanism: "Theanine can smooth subjective caffeine jitters.",
      researchUrl: null,
      suggestion: "Common pairing. Start low and adjust.",
      source: {
        id: caffeine.supplement.id,
        name: caffeine.supplement.name,
        form: null,
      },
      target: {
        id: theanine.supplement.id,
        name: theanine.supplement.name,
        form: null,
      },
    });
  }

  // Ratio warnings (Zn:Cu)
  if (present.has(SUPP.zinc)) {
    const zinc = sumDosage(logs, SUPP.zinc);
    const copper = sumDosage(logs, SUPP.copper);

    const hasCopper = copper.amount > 0;
    const ratio = hasCopper
      ? zinc.amount / copper.amount
      : Number.POSITIVE_INFINITY;
    const minRatio = 8;
    const maxRatio = 15;

    const outOfRange = ratio < minRatio || ratio > maxRatio;
    const copperMissing = !hasCopper;

    if (copperMissing || outOfRange) {
      ratioWarnings.push({
        id: "demo-ratio-zn-cu",
        severity: copperMissing ? "critical" : "medium",
        message: copperMissing
          ? "Zinc without copper can drive copper depletion over time."
          : `Current ratio is outside the recommended ${minRatio}:1–${maxRatio}:1 range.`,
        currentRatio: ratio,
        optimalRatio: null,
        minRatio,
        maxRatio,
        researchUrl: "https://pubmed.ncbi.nlm.nih.gov/9701160/",
        source: {
          id: SUPP.zinc,
          name: zinc.name,
          dosage: zinc.amount,
          unit: zinc.unit,
        },
        target: {
          id: SUPP.copper,
          name: copper.name === SUPP.copper ? "Copper" : copper.name,
          dosage: copper.amount,
          unit: copper.unit,
        },
      });
    }
  }

  // Timing warnings (demo subset)
  if (present.has(SUPP.tyrosine) && present.has(SUPP.htp5)) {
    const t = latestLog(logs, SUPP.tyrosine)!;
    const h = latestLog(logs, SUPP.htp5)!;
    const a = new Date(t.loggedAt);
    const b = new Date(h.loggedAt);

    const minHoursApart = 4;
    const actualHoursApart = hoursApart(a, b);
    if (actualHoursApart < minHoursApart) {
      const [source, target] = a.getTime() <= b.getTime() ? [t, h] : [h, t];
      timingWarnings.push({
        id: "demo-timing-tyr-5htp",
        severity: "medium",
        reason: "Transporter competition (LNAAT) - separate dosing.",
        minHoursApart,
        actualHoursApart,
        source: {
          id: source.supplement.id,
          name: source.supplement.name,
          loggedAt: new Date(source.loggedAt),
        },
        target: {
          id: target.supplement.id,
          name: target.supplement.name,
          loggedAt: new Date(target.loggedAt),
        },
      });
    }
  }

  return { interactions, ratioWarnings, timingWarnings };
}
