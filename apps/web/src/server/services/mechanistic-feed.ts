import { type mealContextEnum, type routeEnum } from "~/server/db/schema";
import { checkMealContext } from "~/server/services/safety";
import { checkCYP450Interaction, getCYP450Pathways } from "~/server/data/cyp450-pathways";
import type { ExclusionZone, OptimizationOpportunity } from "~/server/services/biological-state";

type MealContext = (typeof mealContextEnum.enumValues)[number];
type RouteOfAdministration = (typeof routeEnum.enumValues)[number];

// ============================================================================
// Types
// ============================================================================

export type FeedModule =
  | "KINETICS"
  | "RECEPTOR"
  | "PATHWAY"
  | "SYNERGY"
  | "CLEARANCE"
  | "ABSORPTION"
  | "SAFETY"
  | "TIMING";

export type FeedStatus = "OK" | "WARN" | "INFO" | "CRITICAL";

export type MechanisticFeedEntry = {
  /** Timestamp display (e.g., "08:15") */
  timestamp: string;
  /** Module category */
  module: FeedModule;
  /** The pharmacology-jargon message */
  message: string;
  /** Status indicator */
  status: FeedStatus;
  /** Supplement name(s) involved */
  supplements?: string[];
  /** Research URL if available */
  researchUrl?: string;
};

export type SupplementLogData = {
  supplementName: string;
  dosage: number;
  unit: string;
  loggedAt: Date;
  route?: RouteOfAdministration | null;
  mealContext?: MealContext | null;
  safetyCategory?: string | null;
  peakMinutes?: number | null;
  halfLifeMinutes?: number | null;
  bioavailabilityPercent?: number | null;
};

// ============================================================================
// Entry Generators
// ============================================================================

/**
 * Generate absorption-related feed entries based on meal context
 */
export function generateAbsorptionEntries(
  log: SupplementLogData,
): MechanisticFeedEntry[] {
  const entries: MechanisticFeedEntry[] = [];
  const timestamp = formatTime(log.loggedAt);
  
  // Check meal context optimization
  const mealResult = checkMealContext(
    log.supplementName,
    log.mealContext,
    log.safetyCategory,
  );
  
  if (mealResult.rule) {
    if (mealResult.isOptimal) {
      const percentBoost = Math.round((mealResult.multiplier - 1) * 100);
      entries.push({
        timestamp,
        module: "ABSORPTION",
        message: `${log.supplementName} lipophilic matrix detected → fat co-ingestion +${percentBoost}% bioavail`,
        status: "OK",
        supplements: [log.supplementName],
        researchUrl: mealResult.researchUrl,
      });
    } else if (mealResult.warning) {
      entries.push({
        timestamp,
        module: "ABSORPTION",
        message: `${log.supplementName} suboptimal absorption → ${mealResult.rule.optimalContexts.join("/")} recommended`,
        status: "WARN",
        supplements: [log.supplementName],
        researchUrl: mealResult.researchUrl,
      });
    }
  }
  
  // Route-specific entries for non-oral supplements
  if (log.route && log.route !== "oral") {
    const routeMessages: Record<RouteOfAdministration, string> = {
      oral: "",
      sublingual: "bypassing hepatic first-pass → rapid onset",
      subq_injection: "subcutaneous depot → sustained release kinetics",
      im_injection: "intramuscular depot → bioavailability ~100%",
      intranasal: "olfactory epithelium absorption → CNS delivery",
      transdermal: "dermal penetration → steady-state plasma levels",
      topical: "local tissue concentration → minimal systemic exposure",
      rectal: "portal bypass → hepatic first-pass avoidance",
    };
    
    const routeMsg = routeMessages[log.route];
    if (routeMsg) {
      entries.push({
        timestamp,
        module: "ABSORPTION",
        message: `${log.supplementName} ${log.route.replace("_", " ")} → ${routeMsg}`,
        status: "INFO",
        supplements: [log.supplementName],
      });
    }
  }
  
  // Bioavailability percentage entry
  if (log.bioavailabilityPercent && log.bioavailabilityPercent < 50) {
    entries.push({
      timestamp,
      module: "ABSORPTION",
      message: `${log.supplementName} oral bioavailability ${log.bioavailabilityPercent}% → consider alternative formulation`,
      status: "INFO",
      supplements: [log.supplementName],
    });
  }
  
  return entries;
}

/**
 * Generate pharmacokinetic (KINETICS) entries based on PK parameters
 */
export function generateKineticsEntries(
  log: SupplementLogData,
): MechanisticFeedEntry[] {
  const entries: MechanisticFeedEntry[] = [];
  const timestamp = formatTime(log.loggedAt);
  
  // Peak time entry
  if (log.peakMinutes) {
    const peakHours = (log.peakMinutes / 60).toFixed(1);
    entries.push({
      timestamp,
      module: "KINETICS",
      message: `${log.supplementName} Cmax reached (t=${peakHours}h) → peak plasma concentration`,
      status: "INFO",
      supplements: [log.supplementName],
    });
  }
  
  // Half-life and clearance entry
  if (log.halfLifeMinutes) {
    const halfLifeHours = (log.halfLifeMinutes / 60).toFixed(1);
    const clearanceTime = new Date(log.loggedAt.getTime() + log.halfLifeMinutes * 5 * 60 * 1000);
    const clearanceStr = formatTime(clearanceTime);
    
    entries.push({
      timestamp,
      module: "CLEARANCE",
      message: `${log.supplementName} t½ = ${halfLifeHours}h → ~97% clearance by ${clearanceStr}`,
      status: "INFO",
      supplements: [log.supplementName],
    });
  }
  
  return entries;
}

/**
 * Generate CYP450 pathway entries for enzyme interactions
 */
export function generatePathwayEntries(
  supplementNames: string[],
): MechanisticFeedEntry[] {
  const entries: MechanisticFeedEntry[] = [];
  const timestamp = formatTime(new Date());
  
  // Check for CYP450 interactions between supplements
  for (let i = 0; i < supplementNames.length; i++) {
    for (let j = i + 1; j < supplementNames.length; j++) {
      const supp1 = supplementNames[i];
      const supp2 = supplementNames[j];
      if (!supp1 || !supp2) continue;
      
      const interactions = checkCYP450Interaction(supp1, supp2);
      
      for (const interaction of interactions) {
        entries.push({
          timestamp,
          module: "PATHWAY",
          message: `${interaction.enzyme} ${interaction.effect} detected → ${interaction.description}`,
          status: interaction.strength === "strong" ? "WARN" : "INFO",
          supplements: [supp1, supp2],
          researchUrl: interaction.researchUrl,
        });
      }
    }
  }
  
  // Check for individual CYP450 substrate/inhibitor info
  for (const supplementName of supplementNames) {
    const pathways = getCYP450Pathways(supplementName);
    
    for (const pathway of pathways) {
      if (pathway.effect === "substrate") {
        entries.push({
          timestamp,
          module: "PATHWAY",
          message: `${pathway.enzyme} substrate detected (${supplementName}) → monitor enzyme inhibitors`,
          status: "INFO",
          supplements: [supplementName],
          researchUrl: pathway.researchUrl,
        });
      }
    }
  }
  
  return entries;
}

/**
 * Generate synergy entries from optimization opportunities
 */
export function generateSynergyEntries(
  optimizations: OptimizationOpportunity[],
): MechanisticFeedEntry[] {
  const entries: MechanisticFeedEntry[] = [];
  const timestamp = formatTime(new Date());
  
  const activeSynergies = optimizations.filter(
    (o) => o.type === "synergy" && o.title.startsWith("Active synergy"),
  );
  
  for (const synergy of activeSynergies) {
    // Parse supplement names from title like "Active synergy: Caffeine + L-Theanine"
    const match = synergy.title.match(/Active synergy: (.+) \+ (.+)/);
    const supplements = match ? [match[1]!, match[2]!] : [];
    
    entries.push({
      timestamp,
      module: "SYNERGY",
      message: synergy.description,
      status: "OK",
      supplements,
    });
  }
  
  return entries;
}

/**
 * Generate timing entries from exclusion zones
 */
export function generateTimingEntries(
  exclusionZones: ExclusionZone[],
): MechanisticFeedEntry[] {
  const entries: MechanisticFeedEntry[] = [];
  const timestamp = formatTime(new Date());
  
  for (const zone of exclusionZones) {
    const status: FeedStatus = 
      zone.severity === "critical" ? "CRITICAL" :
      zone.severity === "medium" ? "WARN" : "INFO";
    
    entries.push({
      timestamp,
      module: "TIMING",
      message: `${zone.sourceSupplementName} → ${zone.targetSupplementName} exclusion (${zone.minutesRemaining}min remaining)`,
      status,
      supplements: [zone.sourceSupplementName, zone.targetSupplementName],
      researchUrl: zone.researchUrl ?? undefined,
    });
  }
  
  return entries;
}

/**
 * Generate receptor-level mechanism entries
 */
export function generateReceptorEntries(
  supplementNames: string[],
): MechanisticFeedEntry[] {
  const entries: MechanisticFeedEntry[] = [];
  const timestamp = formatTime(new Date());
  
  // Known receptor mechanisms
  const receptorMechanisms: Record<string, { mechanism: string; receptor: string }> = {
    "Magnesium": { mechanism: "NMDA receptor: Mg²⁺ block active → glutamate modulation", receptor: "NMDA" },
    "Caffeine": { mechanism: "Adenosine A1/A2A antagonism → cortisol/alertness modulation", receptor: "Adenosine" },
    "L-Theanine": { mechanism: "AMPA receptor modulation → α-wave enhancement", receptor: "AMPA" },
    "Ashwagandha": { mechanism: "GABAergic modulation → anxiolytic effect", receptor: "GABA-A" },
    "Melatonin": { mechanism: "MT1/MT2 receptor agonism → circadian entrainment", receptor: "Melatonin" },
    "GABA": { mechanism: "GABA-A receptor agonism → inhibitory tone increased", receptor: "GABA-A" },
    "Phenibut": { mechanism: "GABA-B receptor agonism → anxiolytic/sedative effect", receptor: "GABA-B" },
    "Bacopa": { mechanism: "Cholinergic modulation → acetylcholine increase", receptor: "Muscarinic" },
    "Alpha-GPC": { mechanism: "Cholinergic precursor → ACh synthesis upregulated", receptor: "Nicotinic" },
    "Lion's Mane": { mechanism: "NGF synthesis induction → neuroplasticity enhancement", receptor: "TrkA" },
  };
  
  for (const supplementName of supplementNames) {
    // Find matching receptor mechanism (case-insensitive partial match)
    for (const [key, value] of Object.entries(receptorMechanisms)) {
      if (supplementName.toLowerCase().includes(key.toLowerCase())) {
        entries.push({
          timestamp,
          module: "RECEPTOR",
          message: value.mechanism,
          status: "OK",
          supplements: [supplementName],
        });
        break; // Only one receptor entry per supplement
      }
    }
  }
  
  return entries;
}

// ============================================================================
// Main Entry Point
// ============================================================================

export type GenerateFeedOptions = {
  recentLogs?: SupplementLogData[];
  exclusionZones?: ExclusionZone[];
  optimizations?: OptimizationOpportunity[];
  /** Max entries to return (default: 10) */
  maxEntries?: number;
};

/**
 * Generate a complete mechanistic feed from biological state data
 */
export function generateMechanisticFeed(
  options: GenerateFeedOptions,
): MechanisticFeedEntry[] {
  const {
    recentLogs = [],
    exclusionZones = [],
    optimizations = [],
    maxEntries = 10,
  } = options;
  
  const allEntries: MechanisticFeedEntry[] = [];
  
  // Generate entries from recent logs
  for (const log of recentLogs) {
    allEntries.push(...generateAbsorptionEntries(log));
    allEntries.push(...generateKineticsEntries(log));
  }
  
  // Generate CYP450 pathway entries
  const supplementNames = recentLogs.map((l) => l.supplementName);
  allEntries.push(...generatePathwayEntries(supplementNames));
  
  // Generate receptor mechanism entries
  allEntries.push(...generateReceptorEntries(supplementNames));
  
  // Generate synergy entries
  allEntries.push(...generateSynergyEntries(optimizations));
  
  // Generate timing entries
  allEntries.push(...generateTimingEntries(exclusionZones));
  
  // Sort by timestamp and limit
  const sorted = allEntries.sort((a, b) => {
    // Parse timestamps for sorting
    const timeA = parseTimeToMinutes(a.timestamp);
    const timeB = parseTimeToMinutes(b.timestamp);
    return timeA - timeB;
  });
  
  // Deduplicate similar messages
  const seen = new Set<string>();
  const deduplicated = sorted.filter((entry) => {
    const key = `${entry.module}:${entry.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return deduplicated.slice(0, maxEntries);
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Get module display color class
 */
export function getModuleColorClass(module: FeedModule): string {
  const colors: Record<FeedModule, string> = {
    KINETICS: "text-cyan-400",
    RECEPTOR: "text-violet-400",
    PATHWAY: "text-amber-400",
    SYNERGY: "text-emerald-400",
    CLEARANCE: "text-rose-400",
    ABSORPTION: "text-blue-400",
    SAFETY: "text-red-400",
    TIMING: "text-orange-400",
  };
  return colors[module];
}

/**
 * Get status display color class
 */
export function getStatusColorClass(status: FeedStatus): string {
  const colors: Record<FeedStatus, string> = {
    OK: "text-emerald-500",
    WARN: "text-amber-500",
    INFO: "text-white/50",
    CRITICAL: "text-red-500",
  };
  return colors[status];
}
