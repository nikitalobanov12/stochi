/**
 * Static demo data for demo mode.
 * All data is ephemeral and resets on page refresh.
 */

import type { LogEntry, StackItem } from "~/components/log/log-context";
import type {
  InteractionWarning,
  RatioWarning,
  TimingWarning,
} from "~/server/actions/interactions";
import type {
  BiologicalState,
  TimelineDataPoint,
} from "~/server/services/biological-state";
import type { StackCompletionStatus } from "~/server/services/analytics";
import type { SafetyHeadroom } from "~/components/dashboard/micro-kpi-row";

// ============================================================================
// Supplements
// ============================================================================

export type DemoSupplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: string | null;
  category?: string | null;
  isResearchChemical?: boolean;
  route?: string | null;
};

export const DEMO_SUPPLEMENTS: DemoSupplement[] = [
  { id: "supp-1", name: "Vitamin D3", form: "softgel", defaultUnit: "IU", category: "vitamin" },
  { id: "supp-2", name: "Magnesium Glycinate", form: "capsule", defaultUnit: "mg", category: "mineral" },
  { id: "supp-3", name: "Zinc Picolinate", form: "capsule", defaultUnit: "mg", category: "mineral" },
  { id: "supp-4", name: "Omega-3 Fish Oil", form: "softgel", defaultUnit: "mg", category: "omega" },
  { id: "supp-5", name: "Vitamin K2 (MK-7)", form: "capsule", defaultUnit: "mcg", category: "vitamin" },
  { id: "supp-6", name: "Copper Bisglycinate", form: "capsule", defaultUnit: "mg", category: "mineral" },
  { id: "supp-7", name: "L-Theanine", form: "capsule", defaultUnit: "mg", category: "amino-acid" },
  { id: "supp-8", name: "Ashwagandha KSM-66", form: "capsule", defaultUnit: "mg", category: "adaptogen" },
  { id: "supp-9", name: "Melatonin", form: "tablet", defaultUnit: "mg", category: "other" },
  { id: "supp-10", name: "Caffeine", form: "tablet", defaultUnit: "mg", category: "nootropic" },
  { id: "supp-11", name: "Iron Bisglycinate", form: "capsule", defaultUnit: "mg", category: "mineral" },
  { id: "supp-12", name: "Vitamin B12", form: "sublingual", defaultUnit: "mcg", category: "vitamin" },
  { id: "supp-13", name: "L-Tyrosine", form: "capsule", defaultUnit: "mg", category: "amino-acid" },
  { id: "supp-14", name: "5-HTP", form: "capsule", defaultUnit: "mg", category: "amino-acid" },
];

// ============================================================================
// Stacks
// ============================================================================

export type DemoStack = {
  id: string;
  name: string;
  items: StackItem[];
};

export const DEMO_STACKS: DemoStack[] = [
  {
    id: "stack-1",
    name: "Morning Essentials",
    items: [
      {
        supplementId: "supp-1",
        dosage: 5000,
        unit: "IU",
        supplement: {
          id: "supp-1",
          name: "Vitamin D3",
          isResearchChemical: false,
          route: "oral",
          form: "softgel",
        },
      },
      {
        supplementId: "supp-5",
        dosage: 200,
        unit: "mcg",
        supplement: {
          id: "supp-5",
          name: "Vitamin K2 (MK-7)",
          isResearchChemical: false,
          route: "oral",
          form: "capsule",
        },
      },
      {
        supplementId: "supp-4",
        dosage: 2000,
        unit: "mg",
        supplement: {
          id: "supp-4",
          name: "Omega-3 Fish Oil",
          isResearchChemical: false,
          route: "oral",
          form: "softgel",
        },
      },
      {
        supplementId: "supp-10",
        dosage: 100,
        unit: "mg",
        supplement: {
          id: "supp-10",
          name: "Caffeine",
          isResearchChemical: false,
          route: "oral",
          form: "tablet",
        },
      },
      {
        supplementId: "supp-7",
        dosage: 200,
        unit: "mg",
        supplement: {
          id: "supp-7",
          name: "L-Theanine",
          isResearchChemical: false,
          route: "oral",
          form: "capsule",
        },
      },
    ],
  },
  {
    id: "stack-2",
    name: "Sleep & Recovery",
    items: [
      {
        supplementId: "supp-2",
        dosage: 400,
        unit: "mg",
        supplement: {
          id: "supp-2",
          name: "Magnesium Glycinate",
          isResearchChemical: false,
          route: "oral",
          form: "capsule",
        },
      },
      {
        supplementId: "supp-3",
        dosage: 30,
        unit: "mg",
        supplement: {
          id: "supp-3",
          name: "Zinc Picolinate",
          isResearchChemical: false,
          route: "oral",
          form: "capsule",
        },
      },
      {
        supplementId: "supp-6",
        dosage: 2,
        unit: "mg",
        supplement: {
          id: "supp-6",
          name: "Copper Bisglycinate",
          isResearchChemical: false,
          route: "oral",
          form: "capsule",
        },
      },
      {
        supplementId: "supp-8",
        dosage: 600,
        unit: "mg",
        supplement: {
          id: "supp-8",
          name: "Ashwagandha KSM-66",
          isResearchChemical: false,
          route: "oral",
          form: "capsule",
        },
      },
    ],
  },
];

// ============================================================================
// Logs (Today's activity)
// ============================================================================

function getRelativeTime(hoursAgo: number): Date {
  const now = new Date();
  now.setHours(now.getHours() - hoursAgo);
  return now;
}

export function generateDemoLogs(): LogEntry[] {
  return [
    {
      id: "log-1",
      loggedAt: getRelativeTime(0.5),
      dosage: 100,
      unit: "mg",
      supplement: {
        id: "supp-10",
        name: "Caffeine",
        isResearchChemical: false,
        route: "oral",
        category: "nootropic",
      },
    },
    {
      id: "log-2",
      loggedAt: getRelativeTime(0.5),
      dosage: 200,
      unit: "mg",
      supplement: {
        id: "supp-7",
        name: "L-Theanine",
        isResearchChemical: false,
        route: "oral",
        category: "amino-acid",
      },
    },
    {
      id: "log-3",
      loggedAt: getRelativeTime(1),
      dosage: 5000,
      unit: "IU",
      supplement: {
        id: "supp-1",
        name: "Vitamin D3",
        isResearchChemical: false,
        route: "oral",
        category: "vitamin",
      },
    },
    {
      id: "log-4",
      loggedAt: getRelativeTime(1),
      dosage: 200,
      unit: "mcg",
      supplement: {
        id: "supp-5",
        name: "Vitamin K2 (MK-7)",
        isResearchChemical: false,
        route: "oral",
        category: "vitamin",
      },
    },
    {
      id: "log-5",
      loggedAt: getRelativeTime(1),
      dosage: 2000,
      unit: "mg",
      supplement: {
        id: "supp-4",
        name: "Omega-3 Fish Oil",
        isResearchChemical: false,
        route: "oral",
        category: "omega",
      },
    },
  ];
}

// ============================================================================
// Interactions & Warnings
// ============================================================================

export const DEMO_INTERACTIONS: InteractionWarning[] = [
  {
    id: "int-1",
    type: "synergy",
    severity: "low",
    mechanism: "K2 directs calcium to bones, prevents arterial calcification",
    researchUrl: null,
    suggestion: "Always take D3 and K2 together",
    source: { id: "supp-1", name: "Vitamin D3", form: "softgel" },
    target: { id: "supp-5", name: "Vitamin K2 (MK-7)", form: "capsule" },
  },
  {
    id: "int-2",
    type: "synergy",
    severity: "low",
    mechanism: "L-Theanine smooths caffeine jitters, enhances focus",
    researchUrl: null,
    suggestion: "Classic nootropic pairing",
    source: { id: "supp-10", name: "Caffeine", form: "tablet" },
    target: { id: "supp-7", name: "L-Theanine", form: "capsule" },
  },
  {
    id: "int-3",
    type: "competition",
    severity: "medium",
    mechanism: "Zinc and Iron compete for DMT1 transporter absorption",
    researchUrl: "https://examine.com/supplements/zinc/",
    suggestion: "Space zinc and iron by 2-4 hours",
    source: { id: "supp-3", name: "Zinc Picolinate", form: "capsule" },
    target: { id: "supp-11", name: "Iron Bisglycinate", form: "capsule" },
  },
  {
    id: "int-4",
    type: "inhibition",
    severity: "medium",
    mechanism: "Caffeine increases renal magnesium excretion by up to 30%",
    researchUrl: "https://examine.com/supplements/caffeine/",
    suggestion: "Take magnesium 2+ hours after caffeine",
    source: { id: "supp-10", name: "Caffeine", form: "tablet" },
    target: { id: "supp-2", name: "Magnesium Glycinate", form: "capsule" },
  },
  {
    id: "int-5",
    type: "competition",
    severity: "critical",
    mechanism: "L-Tyrosine and 5-HTP compete for LNAAT transporter; concurrent use may reduce serotonin/dopamine synthesis",
    researchUrl: null,
    suggestion: "Never take simultaneously — space by 4+ hours or use on alternating days",
    source: { id: "supp-13", name: "L-Tyrosine", form: "capsule" },
    target: { id: "supp-14", name: "5-HTP", form: "capsule" },
  },
];

export const DEMO_RATIO_WARNINGS: RatioWarning[] = [
  {
    id: "ratio-1",
    source: { id: "supp-3", name: "Zinc Picolinate", dosage: 30, unit: "mg" },
    target: { id: "supp-6", name: "Copper Bisglycinate", dosage: 2, unit: "mg" },
    currentRatio: 15,
    minRatio: 8,
    maxRatio: 15,
    optimalRatio: 10,
    severity: "medium",
    researchUrl: null,
    message: "Zn:Cu ratio at upper limit. Consider reducing zinc or adding copper.",
  },
];

export const DEMO_TIMING_WARNINGS: TimingWarning[] = [
  {
    id: "timing-1",
    severity: "medium",
    reason: "Caffeine increases renal magnesium excretion — space by 2h minimum",
    minHoursApart: 2,
    actualHoursApart: 0.5,
    source: { id: "supp-10", name: "Caffeine", loggedAt: getRelativeTime(0.5) },
    target: { id: "supp-2", name: "Magnesium Glycinate", loggedAt: getRelativeTime(1) },
  },
  {
    id: "timing-2",
    severity: "medium",
    reason: "Iron and Zinc compete for DMT1 transporter — space by 2h minimum",
    minHoursApart: 2,
    actualHoursApart: 0,
    source: { id: "supp-11", name: "Iron Bisglycinate", loggedAt: getRelativeTime(1) },
    target: { id: "supp-3", name: "Zinc Picolinate", loggedAt: getRelativeTime(1) },
  },
];

// ============================================================================
// Biological State (for timeline visualization)
// ============================================================================

export function generateDemoBiologicalState(): BiologicalState {
  return {
    bioScore: 87,
    calculatedAt: new Date(),
    activeCompounds: [
      {
        logId: "log-1",
        supplementId: "supp-10",
        name: "Caffeine",
        dosage: 100,
        unit: "mg",
        phase: "eliminating",
        concentrationPercent: 85,
        loggedAt: getRelativeTime(0.5),
        peakMinutes: 45,
        halfLifeMinutes: 300,
        bioavailabilityPercent: 99,
        category: "nootropic",
      },
      {
        logId: "log-2",
        supplementId: "supp-7",
        name: "L-Theanine",
        dosage: 200,
        unit: "mg",
        phase: "eliminating",
        concentrationPercent: 90,
        loggedAt: getRelativeTime(0.5),
        peakMinutes: 60,
        halfLifeMinutes: 180,
        bioavailabilityPercent: 90,
        category: "amino-acid",
      },
      {
        logId: "log-3",
        supplementId: "supp-1",
        name: "Vitamin D3",
        dosage: 5000,
        unit: "IU",
        phase: "absorbing",
        concentrationPercent: 95,
        loggedAt: getRelativeTime(1),
        peakMinutes: 720,
        halfLifeMinutes: 20160, // 14 days
        bioavailabilityPercent: 80,
        category: "vitamin",
      },
    ],
    exclusionZones: [
      {
        ruleId: "timing-rule-1",
        sourceSupplementId: "supp-10",
        sourceSupplementName: "Caffeine",
        targetSupplementId: "supp-2",
        targetSupplementName: "Magnesium Glycinate",
        endsAt: new Date(Date.now() + 90 * 60 * 1000), // 90 min from now
        minutesRemaining: 90,
        reason: "Caffeine increases renal magnesium excretion",
        severity: "medium",
        researchUrl: null,
      },
    ],
    optimizations: [
      {
        type: "timing",
        category: "timing",
        supplementIds: ["supp-2"],
        title: "Optimal Magnesium Timing",
        description: "Take Magnesium before bed for optimal sleep",
        priority: 1,
        suggestionKey: "timing:supp-2",
      },
      {
        type: "timing",
        category: "timing",
        supplementIds: ["supp-3", "supp-11"],
        title: "Space Zinc & Iron",
        description: "DMT1 transporter competition — take 2+ hours apart for optimal absorption",
        priority: 2,
        suggestionKey: "spacing:supp-3:supp-11",
      },
    ],
  };
}

export function generateDemoTimelineData(): TimelineDataPoint[] {
  const now = new Date();
  const data: TimelineDataPoint[] = [];

  // Generate 24 hours of timeline data (in minutes from window start)
  // Window starts 12 hours ago
  
  for (let i = -12; i <= 12; i++) {
    const time = new Date(now);
    time.setHours(time.getHours() + i);
    
    // Simulate compound levels
    let caffeineLevel = 0;
    let theanineLevel = 0;
    
    if (i >= -0.5) {
      // Caffeine decay over time
      caffeineLevel = Math.max(0, 100 * Math.exp(-0.15 * (i + 0.5)));
      theanineLevel = Math.max(0, 100 * Math.exp(-0.2 * (i + 0.5)));
    }
    
    const minutesFromStart = (i + 12) * 60; // Convert hours to minutes from start
    
    data.push({
      minutesFromStart,
      timestamp: time.toISOString(),
      concentrations: {
        "supp-10": caffeineLevel,
        "supp-7": theanineLevel,
      },
    });
  }
  
  return data;
}

// ============================================================================
// Stack Completion Status
// ============================================================================

export function generateDemoStackCompletion(): StackCompletionStatus[] {
  return [
    {
      stackId: "stack-1",
      stackName: "Morning Essentials",
      totalItems: 5,
      loggedItems: 5,
      isComplete: true,
      items: [
        { supplementId: "supp-1", supplementName: "Vitamin D3", expectedDosage: 5000, expectedUnit: "IU", logged: true },
        { supplementId: "supp-5", supplementName: "Vitamin K2 (MK-7)", expectedDosage: 200, expectedUnit: "mcg", logged: true },
        { supplementId: "supp-4", supplementName: "Omega-3 Fish Oil", expectedDosage: 2000, expectedUnit: "mg", logged: true },
        { supplementId: "supp-10", supplementName: "Caffeine", expectedDosage: 100, expectedUnit: "mg", logged: true },
        { supplementId: "supp-7", supplementName: "L-Theanine", expectedDosage: 200, expectedUnit: "mg", logged: true },
      ],
    },
    {
      stackId: "stack-2",
      stackName: "Sleep & Recovery",
      totalItems: 4,
      loggedItems: 0,
      isComplete: false,
      items: [
        { supplementId: "supp-2", supplementName: "Magnesium Glycinate", expectedDosage: 400, expectedUnit: "mg", logged: false },
        { supplementId: "supp-3", supplementName: "Zinc Picolinate", expectedDosage: 30, expectedUnit: "mg", logged: false },
        { supplementId: "supp-6", supplementName: "Copper Bisglycinate", expectedDosage: 2, expectedUnit: "mg", logged: false },
        { supplementId: "supp-8", supplementName: "Ashwagandha KSM-66", expectedDosage: 600, expectedUnit: "mg", logged: false },
      ],
    },
  ];
}

// ============================================================================
// Safety Headroom
// ============================================================================

export const DEMO_SAFETY_HEADROOM: SafetyHeadroom[] = [
  {
    category: "zinc",
    label: "Zinc",
    current: 30,
    limit: 40,
    unit: "mg",
    percentUsed: 75,
  },
  {
    category: "vitamin_d",
    label: "Vitamin D",
    current: 5000,
    limit: 10000,
    unit: "IU",
    percentUsed: 50,
  },
  {
    category: "magnesium",
    label: "Magnesium",
    current: 400,
    limit: 500,
    unit: "mg",
    percentUsed: 80,
  },
  {
    category: "caffeine",
    label: "Caffeine",
    current: 100,
    limit: 400,
    unit: "mg",
    percentUsed: 25,
  },
];

// ============================================================================
// All-in-one demo data generator
// ============================================================================

export function generateDemoData() {
  return {
    supplements: DEMO_SUPPLEMENTS,
    stacks: DEMO_STACKS,
    logs: generateDemoLogs(),
    interactions: DEMO_INTERACTIONS,
    ratioWarnings: DEMO_RATIO_WARNINGS,
    timingWarnings: DEMO_TIMING_WARNINGS,
    biologicalState: generateDemoBiologicalState(),
    timelineData: generateDemoTimelineData(),
    stackCompletion: generateDemoStackCompletion(),
    safetyHeadroom: DEMO_SAFETY_HEADROOM,
    streak: 7,
    lastLogAt: getRelativeTime(0.5),
  };
}
