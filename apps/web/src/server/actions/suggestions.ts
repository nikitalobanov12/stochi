"use server";

import { inArray, or } from "drizzle-orm";
import { db } from "~/server/db";
import { interaction, ratioRule } from "~/server/db/schema";

export type Suggestion = {
  type: "balance" | "synergy";
  supplementId: string;
  supplementName: string;
  reason: string;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
  priority: "high" | "medium" | "low";
};

/**
 * Get proactive suggestions based on current supplements.
 * Suggests:
 * 1. Balance supplements (e.g., Copper if taking high-dose Zinc)
 * 2. Synergy partners (e.g., K2 if taking D3)
 */
export async function getSuggestions(supplementIds: string[]): Promise<Suggestion[]> {
  if (supplementIds.length === 0) {
    return [];
  }

  const suggestions: Suggestion[] = [];
  const alreadyHas = new Set(supplementIds);

  // Check ratio rules - suggest balance supplements
  const ratioRules = await db.query.ratioRule.findMany({
    where: or(
      inArray(ratioRule.sourceSupplementId, supplementIds),
      inArray(ratioRule.targetSupplementId, supplementIds),
    ),
    with: {
      sourceSupplement: true,
      targetSupplement: true,
    },
  });

  for (const rule of ratioRules) {
    const hasSource = alreadyHas.has(rule.sourceSupplementId);
    const hasTarget = alreadyHas.has(rule.targetSupplementId);

    // If user has source but not target, suggest target for balance
    if (hasSource && !hasTarget) {
      const targetSupp = rule.targetSupplement;
      suggestions.push({
        type: "balance",
        supplementId: targetSupp.id,
        supplementName: targetSupp.name,
        reason: `Balance your ${rule.sourceSupplement.name} intake (recommended ratio: ${rule.optimalRatio ?? rule.minRatio}-${rule.maxRatio}:1)`,
        dosage: rule.optimalRatio ? Math.round(30 / rule.optimalRatio) : 2, // Default calculation based on common zinc dose
        unit: targetSupp.defaultUnit ?? "mg",
        priority: rule.severity === "critical" ? "high" : "medium",
      });
    }

    // If user has target but not source, and it's a critical balance
    if (hasTarget && !hasSource && rule.severity === "critical") {
      const sourceSupp = rule.sourceSupplement;
      suggestions.push({
        type: "balance",
        supplementId: sourceSupp.id,
        supplementName: sourceSupp.name,
        reason: `Often taken with ${rule.targetSupplement.name} for optimal balance`,
        dosage: 30, // Common zinc dose
        unit: sourceSupp.defaultUnit ?? "mg",
        priority: "medium",
      });
    }
  }

  // Check synergies - suggest synergy partners
  const synergies = await db.query.interaction.findMany({
    where: or(
      inArray(interaction.sourceId, supplementIds),
      inArray(interaction.targetId, supplementIds),
    ),
    with: {
      source: true,
      target: true,
    },
  });

  for (const syn of synergies) {
    if (syn.type !== "synergy") continue;

    const hasSource = alreadyHas.has(syn.sourceId);
    const hasTarget = alreadyHas.has(syn.targetId);

    // Suggest the missing partner
    if (hasSource && !hasTarget) {
      suggestions.push({
        type: "synergy",
        supplementId: syn.targetId,
        supplementName: syn.target.name,
        reason: syn.mechanism ?? `Works synergistically with ${syn.source.name}`,
        dosage: getDefaultDosage(syn.target.name),
        unit: syn.target.defaultUnit ?? "mg",
        priority: "low",
      });
    } else if (hasTarget && !hasSource) {
      suggestions.push({
        type: "synergy",
        supplementId: syn.sourceId,
        supplementName: syn.source.name,
        reason: syn.mechanism ?? `Works synergistically with ${syn.target.name}`,
        dosage: getDefaultDosage(syn.source.name),
        unit: syn.source.defaultUnit ?? "mg",
        priority: "low",
      });
    }
  }

  // Deduplicate by supplement ID, keeping highest priority
  const seen = new Map<string, Suggestion>();
  for (const suggestion of suggestions) {
    const existing = seen.get(suggestion.supplementId);
    if (!existing || priorityValue(suggestion.priority) > priorityValue(existing.priority)) {
      seen.set(suggestion.supplementId, suggestion);
    }
  }

  // Sort by priority
  return Array.from(seen.values()).sort(
    (a, b) => priorityValue(b.priority) - priorityValue(a.priority),
  );
}

function priorityValue(priority: "high" | "medium" | "low"): number {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function getDefaultDosage(supplementName: string): number {
  // Common default dosages
  const defaults: Record<string, number> = {
    "Vitamin D3": 5000,
    "Vitamin K2 MK-7": 100,
    "Magnesium Glycinate": 400,
    "Magnesium Citrate": 400,
    "Zinc Picolinate": 30,
    "Copper Bisglycinate": 2,
    "Iron Bisglycinate": 18,
    "L-Theanine": 200,
    "L-Tyrosine": 500,
    Caffeine: 100,
    "Vitamin C": 500,
    Piperine: 10,
    Curcumin: 500,
  };
  return defaults[supplementName] ?? 100;
}
