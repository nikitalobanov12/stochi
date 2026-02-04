"use client";

import { useDemoContext } from "~/components/demo/demo-provider";
import { DemoDashboardClient } from "./demo-dashboard-client";

export default function DemoPage() {
  const demo = useDemoContext();

  // Format logs for dashboard
  const formattedLogs = demo.logs.map((l) => ({
    id: l.id,
    loggedAt: l.loggedAt,
    dosage: l.dosage,
    unit: l.unit,
    supplement: {
      id: l.supplement.id,
      name: l.supplement.name,
      isResearchChemical: l.supplement.isResearchChemical ?? false,
      route: l.supplement.route,
      category: l.supplement.category,
    },
  }));

  // Format stacks for dashboard
  const userStacksWithItems = demo.stacks.map((s) => ({
    id: s.id,
    name: s.name,
    items: s.items,
  }));

  return (
    <DemoDashboardClient
      todayLogs={formattedLogs}
      allSupplements={demo.supplements}
      stackCompletion={demo.stackCompletion}
      userStacksWithItems={userStacksWithItems}
      streak={demo.streak}
      lastLogAt={demo.lastLogAt}
      needsOnboarding={false}
      hasStacks={true}
      biologicalState={demo.biologicalState}
      timelineData={demo.timelineData}
      safetyHeadroom={demo.safetyHeadroom}
      interactions={demo.interactions}
      ratioWarnings={demo.ratioWarnings}
      timingWarnings={demo.timingWarnings}
    />
  );
}
