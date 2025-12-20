"use client";

import { useMemo } from "react";
import { BiologicalTimeline } from "~/components/dashboard/biological-timeline";
import { BentoCardHeader } from "./bento-card";
import type { TimelineDataPoint, ActiveCompound } from "~/server/services/biological-state";

/**
 * LandingTimeline - Demo version of the BiologicalTimeline for the landing page
 * 
 * Features:
 * - Uses mocked data with human-readable supplement names (NO UUID leak)
 * - Implements accurate first-order kinetics: k = ln(2) / t½
 * - Demonstrates the "Ability" proposition with curated compounds
 */

// ============================================================================
// Curated Demo Data - Human-readable IDs, NO UUIDs
// ============================================================================

const DEMO_SUPPLEMENTS = [
  {
    id: "vitamin-d3",
    name: "Vitamin D3",
    dosage: 5000,
    unit: "IU",
    peakHours: 6,      // Tmax = 6 hours
    halfLifeHours: 24, // t½ = 24 hours (long-acting)
    hoursAgo: 5,       // Logged 5 hours ago → approaching peak
  },
  {
    id: "magnesium-glycinate",
    name: "Magnesium Glycinate",
    dosage: 400,
    unit: "mg",
    peakHours: 4,      // Tmax = 4 hours
    halfLifeHours: 8,  // t½ = 8 hours
    hoursAgo: 3,       // Logged 3 hours ago → pre-peak
  },
  {
    id: "zinc-picolinate",
    name: "Zinc Picolinate",
    dosage: 30,
    unit: "mg",
    peakHours: 2,      // Tmax = 2 hours
    halfLifeHours: 4,  // t½ = 4 hours (faster elimination)
    hoursAgo: 6,       // Logged 6 hours ago → eliminating
  },
] as const;

// ============================================================================
// Pharmacokinetic Calculations
// ============================================================================

/**
 * Calculate concentration using first-order kinetics.
 * 
 * k = ln(2) / t½ (elimination rate constant)
 * 
 * Absorption phase (t < Tmax):
 *   C(t) = Cmax * (t / Tmax)
 * 
 * Elimination phase (t ≥ Tmax):
 *   C(t) = Cmax * e^(-k * (t - Tmax))
 */
function calculateConcentration(
  minutesSinceIngestion: number,
  peakMinutes: number,
  halfLifeMinutes: number
): number {
  // Before ingestion
  if (minutesSinceIngestion < 0) return 0;
  
  // Absorption phase: linear rise to peak
  if (minutesSinceIngestion < peakMinutes) {
    return (minutesSinceIngestion / peakMinutes) * 100;
  }
  
  // Elimination phase: exponential decay
  const k = Math.log(2) / halfLifeMinutes;
  const timeSincePeak = minutesSinceIngestion - peakMinutes;
  const concentration = 100 * Math.exp(-k * timeSincePeak);
  
  // Below 1% is effectively cleared
  return concentration < 1 ? 0 : concentration;
}

/**
 * Determine pharmacokinetic phase based on concentration and timing.
 */
function determinePhase(
  minutesSinceIngestion: number,
  peakMinutes: number,
  concentrationPercent: number
): ActiveCompound["phase"] {
  if (concentrationPercent < 1) return "cleared";
  if (minutesSinceIngestion < peakMinutes) return "absorbing";
  if (minutesSinceIngestion < peakMinutes * 1.1) return "peak"; // Within 10% of peak time
  return "eliminating";
}

// ============================================================================
// Data Generation
// ============================================================================

/**
 * Generate 24-hour timeline data with 15-minute intervals.
 * Uses the current time as reference to show realistic "live" data.
 */
function generateTimelineData(): TimelineDataPoint[] {
  const now = new Date();
  const points: TimelineDataPoint[] = [];
  
  // 24 hours of data, 15-minute intervals = 96 data points
  // Start from 24 hours ago
  for (let i = 0; i <= 96; i++) {
    const minutesFromStart = i * 15;
    const timestamp = new Date(now.getTime() - (24 * 60 - minutesFromStart) * 60 * 1000);
    
    const concentrations: Record<string, number> = {};
    
    for (const supp of DEMO_SUPPLEMENTS) {
      // Calculate minutes since this supplement was ingested
      const ingestionTime = new Date(now.getTime() - supp.hoursAgo * 60 * 60 * 1000);
      const minutesSinceIngestion = (timestamp.getTime() - ingestionTime.getTime()) / (1000 * 60);
      
      const concentration = calculateConcentration(
        minutesSinceIngestion,
        supp.peakHours * 60,    // Convert to minutes
        supp.halfLifeHours * 60 // Convert to minutes
      );
      
      concentrations[supp.id] = concentration;
    }
    
    points.push({
      minutesFromStart,
      timestamp: timestamp.toISOString(),
      concentrations,
    });
  }
  
  return points;
}

/**
 * Generate active compounds list with current concentrations.
 */
function generateActiveCompounds(): ActiveCompound[] {
  const now = new Date();
  
  return DEMO_SUPPLEMENTS.map((supp) => {
    const minutesSinceIngestion = supp.hoursAgo * 60;
    const peakMinutes = supp.peakHours * 60;
    const halfLifeMinutes = supp.halfLifeHours * 60;
    
    const concentrationPercent = calculateConcentration(
      minutesSinceIngestion,
      peakMinutes,
      halfLifeMinutes
    );
    
    const phase = determinePhase(minutesSinceIngestion, peakMinutes, concentrationPercent);
    
    const loggedAt = new Date(now.getTime() - supp.hoursAgo * 60 * 60 * 1000);
    
    return {
      logId: `demo-${supp.id}`,
      supplementId: supp.id,
      name: supp.name,
      dosage: supp.dosage,
      unit: supp.unit,
      loggedAt,
      concentrationPercent,
      phase,
      peakMinutes,
      halfLifeMinutes,
      bioavailabilityPercent: null,
      category: null,
    };
  });
}

// ============================================================================
// Component
// ============================================================================

export function LandingTimeline() {
  // Memoize data generation to avoid recalculating on every render
  const timelineData = useMemo(() => generateTimelineData(), []);
  const activeCompounds = useMemo(() => generateActiveCompounds(), []);
  const currentTime = useMemo(() => new Date().toISOString(), []);

  return (
    <div className="h-full p-4 lg:p-6">
      <BentoCardHeader 
        title="24-Hour Biological Timeline" 
        badge="LIVE DEMO"
        id="timeline-heading"
      />
      
      <BiologicalTimeline
        timelineData={timelineData}
        activeCompounds={activeCompounds}
        currentTime={currentTime}
        defaultVisibleCount={3}
      />
      
      {/* Pharmacokinetic formula footnote */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="font-mono text-[10px] text-white/30">
          Decay curves: C(t) = C<sub>max</sub> · e<sup>-kt</sup> where k = ln(2)/t<sub>½</sub>
        </p>
      </div>
    </div>
  );
}
