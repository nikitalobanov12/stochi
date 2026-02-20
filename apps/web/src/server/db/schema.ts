import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================================
// Custom Types (pgvector)
// ============================================================================

/**
 * Custom vector type for pgvector extension.
 * Stores embeddings as float arrays with specified dimensions.
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    const dimensions = (config as { dimensions?: number })?.dimensions ?? 1536;
    return `vector(${dimensions})`;
  },
  fromDriver(value: string): number[] {
    // Parse "[0.1,0.2,0.3]" format from Postgres
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => parseFloat(v));
  },
  toDriver(value: number[]): string {
    // Convert to "[0.1,0.2,0.3]" format for Postgres
    return `[${value.join(",")}]`;
  },
});

// ============================================================================
// Enums
// ============================================================================

export const interactionTypeEnum = pgEnum("interaction_type", [
  "inhibition",
  "synergy",
  "competition",
]);

export const severityEnum = pgEnum("severity", ["low", "medium", "critical"]);

export const dosageUnitEnum = pgEnum("dosage_unit", [
  "mg",
  "mcg",
  "g",
  "IU",
  "ml",
]);

export const routeEnum = pgEnum("route_of_administration", [
  "oral",
  "sublingual",
  "subq_injection",
  "im_injection",
  "intranasal",
  "transdermal",
  "topical",
  "rectal",
]);

export const mealContextEnum = pgEnum("meal_context", [
  "fasted",
  "with_meal",
  "with_fat",
  "post_meal",
]);

// Pharmacokinetic model type - determines which absorption model to use
export const kineticsTypeEnum = pgEnum("kinetics_type", [
  "first_order", // Standard exponential decay (default)
  "michaelis_menten", // Capacity-limited saturable transport
]);

// Biomarker type for blood-work calibration
export const biomarkerTypeEnum = pgEnum("biomarker_type", [
  "25_oh_d", // Vitamin D - 25-hydroxyvitamin D
  "ferritin", // Iron storage
  "serum_iron", // Iron (serum)
  "rbc_magnesium", // Magnesium (RBC)
  "serum_zinc", // Zinc (serum)
  "serum_copper", // Copper (serum)
  "b12", // Vitamin B12
  "folate", // Folate/Folic acid
]);

// CYP450 evidence type for confidence scoring
export const cyp450EvidenceTypeEnum = pgEnum("cyp450_evidence_type", [
  "in_vivo_human", // Human clinical trials (highest confidence)
  "in_vitro_microsomes", // Human liver microsomes (medium confidence)
  "animal_model", // Animal studies (low confidence)
  "theoretical", // Computational/theoretical prediction (lowest confidence)
]);

// Optimal time of day for supplement intake
export const optimalTimeOfDayEnum = pgEnum("optimal_time_of_day", [
  "morning", // Best taken in the morning (e.g., Vitamin D, Iron, Caffeine)
  "afternoon", // Best taken midday
  "evening", // Best taken in the evening (e.g., Magnesium Glycinate, Ashwagandha)
  "bedtime", // Best taken right before sleep (e.g., Melatonin, Glycine)
  "with_meals", // Best taken with food, timing flexible
  "any", // No specific timing preference
]);

// ============================================================================
// Protocol Enums (Master Protocol feature)
// ============================================================================

// Time slots for protocol scheduling (user-configurable times)
export const timeSlotEnum = pgEnum("time_slot", [
  "morning", // Default: 8:00 AM
  "afternoon", // Default: 12:00 PM
  "evening", // Default: 6:00 PM
  "bedtime", // Default: 10:00 PM
]);

// Frequency of supplement intake
export const frequencyEnum = pgEnum("frequency", [
  "daily", // Take every day
  "specific_days", // Take only on selected days (uses daysOfWeek array)
  "as_needed", // PRN / situational use (not auto-logged)
]);

// ============================================================================
// Suggestion Quality Enums (Smart filtering for suggestions)
// ============================================================================

// Synergy strength - determines which synergies to show by default
export const synergyStrengthEnum = pgEnum("synergy_strength", [
  "critical", // Y won't work properly without X (D3+K2, Curcumin+Piperine)
  "strong", // Significant enhancement, backed by strong evidence (Caffeine+Theanine)
  "moderate", // Helpful synergy, moderate evidence
  "weak", // Nice-to-have, limited or theoretical benefit
]);

// User experience level - controls which supplements are suggested
export const experienceLevelEnum = pgEnum("experience_level", [
  "beginner", // New to supplements - show only well-established options
  "intermediate", // Comfortable with supplements - include those requiring careful usage
  "advanced", // Familiar with research compounds - show everything
]);

// Suggestion filter level - user preference for synergy quality threshold
export const suggestionFilterLevelEnum = pgEnum("suggestion_filter_level", [
  "critical_only", // Only show critical synergies
  "strong", // Show critical + strong (DEFAULT)
  "moderate", // Show critical + strong + moderate
  "all", // Show everything including weak
]);

// ============================================================================
// Ratio Rules (for stoichiometric imbalance detection)
// ============================================================================

export const ratioRule = pgTable("ratio_rule", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceSupplementId: uuid("source_supplement_id")
    .notNull()
    .references(() => supplement.id, { onDelete: "cascade" }),
  targetSupplementId: uuid("target_supplement_id")
    .notNull()
    .references(() => supplement.id, { onDelete: "cascade" }),
  minRatio: real("min_ratio"), // source:target min (e.g., 8:1 for Zn:Cu)
  maxRatio: real("max_ratio"), // source:target max (e.g., 15:1 for Zn:Cu)
  optimalRatio: real("optimal_ratio"), // optimal ratio (e.g., 10:1 for Zn:Cu)
  warningMessage: text("warning_message").notNull(),
  severity: severityEnum("severity").notNull(),
  researchUrl: text("research_url"), // Link to Examine.com or study for grounding
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// ============================================================================
// Auth Tables (BetterAuth)
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// ============================================================================
// Stochi Domain Tables
// ============================================================================

// Supplement categories for UI grouping
export const supplementCategoryEnum = pgEnum("supplement_category", [
  "mineral",
  "vitamin",
  "amino-acid",
  "adaptogen",
  "nootropic",
  "antioxidant",
  "omega",
  "peptide",
  "other",
]);

/**
 * Suggestion profile metadata for smart filtering.
 * Controls when a supplement should be suggested based on user context.
 */
export type SuggestionProfile = {
  /** Only suggest if user has deficiency in relevant biomarkers */
  requiresDeficiency: boolean;
  /** Biomarker types to check for deficiency (e.g., "ferritin", "b12") */
  relevantBiomarkers: string[];
  /** Warning shown when suggesting to potentially non-deficient users */
  deficiencyWarning: string | null;
  /** Risk level for chronic/long-term use */
  chronicUseRisk: "none" | "low" | "moderate" | "high";
  /** Warning about chronic use risks */
  chronicUseWarning: string | null;
  /** Minimum experience level required to see this supplement in suggestions */
  minExperienceLevel: "beginner" | "intermediate" | "advanced";
};

export const supplement = pgTable(
  "supplement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    form: text("form"),
    elementalWeight: real("elemental_weight"),
    defaultUnit: dosageUnitEnum("default_unit").default("mg"),
    // New fields for Supplement Intelligence
    description: text("description"), // Bio-hacker benefit (1 sentence)
    mechanism: text("mechanism"), // Scientific mechanism (1 sentence)
    researchUrl: text("research_url"), // Link to Examine.com
    category: supplementCategoryEnum("category"), // For UI grouping
    commonGoals: text("common_goals").array(), // ["sleep", "focus", "longevity"]
    // Safety tracking - maps to SAFETY_LIMITS keys (e.g., "zinc", "magnesium", "iron")
    safetyCategory: text("safety_category"),
    // Optimal timing for suggestions
    optimalTimeOfDay: optimalTimeOfDayEnum("optimal_time_of_day"),
    // Research chemical / peptide support
    isResearchChemical: boolean("is_research_chemical")
      .default(false)
      .notNull(),
    route: routeEnum("route").default("oral").notNull(),
    storageInstructions: text("storage_instructions"),
    // AI-generated research summary (cached from Llama 3.1 8B)
    // Built from supplementKnowledge chunks on first view
    researchSummary: text("research_summary"),
    researchSummaryGeneratedAt: timestamp("research_summary_generated_at"),
    // Pharmacokinetic fields (sourced from Examine.com/PubMed)
    // Used for biological state timeline visualization
    peakMinutes: integer("peak_minutes"), // Time to Cmax (peak plasma concentration)
    halfLifeMinutes: integer("half_life_minutes"), // Elimination half-life (t½)
    absorptionWindowMinutes: integer("absorption_window_minutes"), // Active absorption period
    bioavailabilityPercent: real("bioavailability_percent"), // % systemic availability
    // Michaelis-Menten kinetics parameters (for saturable transporters)
    // Used for Vitamin C, Magnesium, Iron, and other capacity-limited supplements
    kineticsType: kineticsTypeEnum("kinetics_type").default("first_order"),
    vmax: real("vmax"), // Maximum velocity (mg/min) - Michaelis-Menten
    km: real("km"), // Michaelis constant (mg) - substrate concentration at half Vmax
    absorptionSaturationDose: real("absorption_saturation_dose"), // Dose (mg) above which absorption efficiency drops
    rdaAmount: real("rda_amount"), // Recommended Daily Allowance (mg) - for heuristic dampening
    // Protocol frequency suggestions (for Master Protocol feature)
    // System recommendation for how often to take this supplement
    suggestedFrequency: frequencyEnum("suggested_frequency"),
    // Notes about dosing frequency (e.g., "Consider cycling 8 weeks on, 2-4 off")
    frequencyNotes: text("frequency_notes"),
    // Smart suggestion filtering profile
    // Controls when this supplement appears in suggestions based on user context
    suggestionProfile: jsonb("suggestion_profile").$type<SuggestionProfile>(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("supplement_name_idx").on(t.name)],
);

export const interaction = pgTable(
  "interaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => supplement.id, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => supplement.id, { onDelete: "cascade" }),
    type: interactionTypeEnum("type").notNull(),
    mechanism: text("mechanism"),
    severity: severityEnum("severity").notNull(),
    // New fields for enhanced interaction info
    researchUrl: text("research_url"), // Link to Examine.com or study
    suggestion: text("suggestion"), // Actionable fix (e.g., "Take 2h apart")
    // Synergy strength for filtering (only applies to type="synergy")
    // Used to filter suggestions by quality threshold
    synergyStrength: synergyStrengthEnum("synergy_strength"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("interaction_source_idx").on(t.sourceId),
    index("interaction_target_idx").on(t.targetId),
  ],
);

export const stack = pgTable(
  "stack",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isPublic: boolean("is_public").default(false), // true for system protocols
    // Denormalized field for O(1) read performance on list view
    // Updated transactionally when stack is logged
    lastLoggedAt: timestamp("last_logged_at", { withTimezone: true }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("stack_user_idx").on(t.userId)],
);

// User goals for personalized recommendations
export const userGoal = pgTable(
  "user_goal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    goal: text("goal").notNull(), // "sleep" | "focus" | "energy" | "stress" | "health" | "longevity"
    priority: integer("priority").default(1).notNull(), // 1 = primary goal
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("user_goal_user_idx").on(t.userId)],
);

export const stackItem = pgTable(
  "stack_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stackId: uuid("stack_id")
      .notNull()
      .references(() => stack.id, { onDelete: "cascade" }),
    supplementId: uuid("supplement_id")
      .notNull()
      .references(() => supplement.id, { onDelete: "cascade" }),
    dosage: real("dosage").notNull(),
    unit: dosageUnitEnum("unit").notNull(),
  },
  (t) => [index("stack_item_stack_idx").on(t.stackId)],
);

export const log = pgTable(
  "log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    supplementId: uuid("supplement_id")
      .notNull()
      .references(() => supplement.id, { onDelete: "cascade" }),
    dosage: real("dosage").notNull(),
    unit: dosageUnitEnum("unit").notNull(),
    // Route of administration (defaults to supplement's default route)
    route: routeEnum("route").default("oral"),
    // Meal context for bioavailability optimization
    mealContext: mealContextEnum("meal_context"),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("log_user_idx").on(t.userId),
    index("log_logged_at_idx").on(t.loggedAt),
  ],
);

// Timing rules for spacing warnings (e.g., Tyrosine and 5-HTP need 4h apart)
export const timingRule = pgTable("timing_rule", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceSupplementId: uuid("source_supplement_id")
    .notNull()
    .references(() => supplement.id, { onDelete: "cascade" }),
  targetSupplementId: uuid("target_supplement_id")
    .notNull()
    .references(() => supplement.id, { onDelete: "cascade" }),
  minHoursApart: real("min_hours_apart").notNull(), // minimum hours between doses
  reason: text("reason").notNull(),
  severity: severityEnum("severity").notNull(),
  // PubMed/Examine.com citation for Authority validation
  researchUrl: text("research_url"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// CYP450 enzyme pathway enum
export const cyp450EnzymeEnum = pgEnum("cyp450_enzyme", [
  "CYP1A2",
  "CYP2C9",
  "CYP2C19",
  "CYP2D6",
  "CYP3A4",
  "CYP2E1",
]);

export const cyp450EffectEnum = pgEnum("cyp450_effect", [
  "substrate", // Metabolized by this enzyme
  "inhibitor", // Inhibits this enzyme (slows metabolism of substrates)
  "inducer", // Induces this enzyme (speeds up metabolism of substrates)
]);

// CYP450 enzyme pathway interactions
// Used for detecting drug/supplement interactions via shared metabolic pathways
export const cyp450Pathway = pgTable(
  "cyp450_pathway",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplementId: uuid("supplement_id")
      .notNull()
      .references(() => supplement.id, { onDelete: "cascade" }),
    enzyme: cyp450EnzymeEnum("enzyme").notNull(),
    effect: cyp450EffectEnum("effect").notNull(),
    // Strength of the effect (e.g., strong inhibitor vs weak)
    strength: text("strength"), // "strong" | "moderate" | "weak"
    // Clinical significance note
    clinicalNote: text("clinical_note"),
    // Research citation
    researchUrl: text("research_url"),
    // Confidence scoring for alert fatigue prevention (Phase 4)
    // Score 0-1: 1.0 = in vivo human, 0.5 = in vitro, 0.1 = animal/theoretical
    confidenceScore: real("confidence_score").default(0.5),
    evidenceType: cyp450EvidenceTypeEnum("evidence_type").default(
      "in_vitro_microsomes",
    ),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("cyp450_supplement_idx").on(t.supplementId),
    index("cyp450_enzyme_idx").on(t.enzyme),
  ],
);

// ============================================================================
// User Biomarker Calibration (Phase 3)
// Allows users to input blood test results for personalized PK model calibration
// ============================================================================

export const userBiomarker = pgTable(
  "user_biomarker",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Optional link to specific supplement (for supplement-specific calibration)
    supplementId: uuid("supplement_id").references(() => supplement.id, {
      onDelete: "set null",
    }),
    // Type of biomarker measured
    biomarkerType: biomarkerTypeEnum("biomarker_type").notNull(),
    // Measured value from blood test
    value: real("value").notNull(),
    // Unit of measurement (ng/mL, nmol/L, mg/dL, mcg/dL)
    unit: text("unit").notNull(),
    // When the blood test was taken
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
    // Calibration results - Individual Absorption Factor (IAF)
    // If user's measured level is 50ng/mL but predicted was 30ng/mL, IAF = 1.66
    calibratedF: real("calibrated_f"), // Adjusted bioavailability coefficient
    calibratedCL: real("calibrated_cl"), // Adjusted clearance rate
    // Notes from user (e.g., "fasted blood draw", "morning sample")
    notes: text("notes"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("user_biomarker_user_idx").on(t.userId),
    index("user_biomarker_type_idx").on(t.biomarkerType),
  ],
);

// ============================================================================
// User Preferences (Smart Suggestions settings)
// ============================================================================

export const userPreference = pgTable("user_preference", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  // Toggle for "add supplement" suggestions (synergies, balance recommendations)
  showAddSuggestions: boolean("show_add_suggestions").default(true).notNull(),
  // IANA timezone identifier (e.g., "America/Los_Angeles", "Europe/London")
  // Used for timezone-aware timing suggestions
  timezone: text("timezone"),
  // Smart suggestion filtering preferences
  // User's experience level with supplements (controls which supplements are suggested)
  experienceLevel: experienceLevelEnum("experience_level").default("beginner"),
  // Synergy quality threshold (controls which synergies are shown)
  suggestionFilterLevel: suggestionFilterLevelEnum(
    "suggestion_filter_level",
  ).default("strong"),
  // Show supplements that require specific conditions (deficiency, etc.)
  showConditionalSupplements: boolean("show_conditional_supplements")
    .default(false)
    .notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// ============================================================================
// Dismissed Suggestions (Persistent per-pair dismissals)
// ============================================================================

export const dismissedSuggestion = pgTable(
  "dismissed_suggestion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Format: "synergy:{sourceId}:{targetId}" or "timing:{supplementId}"
    // This allows context-aware dismissals per supplement pair
    suggestionKey: text("suggestion_key").notNull(),
    dismissedAt: timestamp("dismissed_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("dismissed_suggestion_user_idx").on(t.userId),
    index("dismissed_suggestion_key_idx").on(t.userId, t.suggestionKey),
  ],
);

// ============================================================================
// Supplement Knowledge RAG (Learn Section)
// ============================================================================

export const chunkTypeEnum = pgEnum("chunk_type", [
  "overview",
  "benefits",
  "risks",
  "dosing",
  "timing",
  "interactions",
  "mechanism",
  "faq",
]);

/**
 * Metadata stored as JSON for each knowledge chunk.
 * Includes evidence ratings and other enrichment data.
 */
export type SupplementKnowledgeMetadata = {
  evidenceRating?: string; // e.g., "Strong", "Moderate", "Limited"
  studyCount?: number;
  lastUpdated?: string;
};

export const supplementKnowledge = pgTable(
  "supplement_knowledge",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplementId: uuid("supplement_id")
      .notNull()
      .references(() => supplement.id, { onDelete: "cascade" }),
    // Content chunk
    chunkType: chunkTypeEnum("chunk_type").notNull(),
    title: text("title"), // Optional section title within chunk
    content: text("content").notNull(),
    // Vector embedding (OpenAI text-embedding-3-small = 1536 dims)
    embedding: vector("embedding", { dimensions: 1536 }),
    // Metadata for UI display (evidence ratings, etc.)
    metadata: text("metadata").$type<SupplementKnowledgeMetadata>(),
    // Source tracking
    sourceUrl: text("source_url"),
    scrapedAt: timestamp("scraped_at").$defaultFn(() => new Date()),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("supplement_knowledge_supplement_idx").on(t.supplementId),
    index("supplement_knowledge_chunk_type_idx").on(t.chunkType),
  ],
);

// ============================================================================
// Protocol Tables (Master Protocol feature)
// ============================================================================

/**
 * Master Protocol - A user's complete supplement regimen with scheduling.
 * One protocol per user, containing all their scheduled supplements.
 */
export const protocol = pgTable("protocol", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(), // One protocol per user
  name: text("name").default("My Protocol").notNull(),
  // Auto-logging: when enabled, logs are created automatically at scheduled times
  autoLogEnabled: boolean("auto_log_enabled").default(false).notNull(),
  // User-configurable times for each slot (stored as "HH:MM" in 24h format)
  morningTime: text("morning_time").default("08:00").notNull(),
  afternoonTime: text("afternoon_time").default("12:00").notNull(),
  eveningTime: text("evening_time").default("18:00").notNull(),
  bedtimeTime: text("bedtime_time").default("22:00").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

/**
 * Protocol Item - Individual supplement in a protocol with scheduling info.
 * Includes timing, frequency, and optional grouping.
 */
export const protocolItem = pgTable(
  "protocol_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    protocolId: uuid("protocol_id")
      .notNull()
      .references(() => protocol.id, { onDelete: "cascade" }),
    supplementId: uuid("supplement_id")
      .notNull()
      .references(() => supplement.id, { onDelete: "cascade" }),
    dosage: real("dosage").notNull(),
    unit: dosageUnitEnum("unit").notNull(),
    // Timing
    timeSlot: timeSlotEnum("time_slot").notNull(),
    // Frequency
    frequency: frequencyEnum("frequency").default("daily").notNull(),
    // Days of week when frequency = 'specific_days' (e.g., ["monday", "wednesday", "friday"])
    daysOfWeek: text("days_of_week").array(),
    // Optional grouping (e.g., "Morning Stack", "Pre-Workout")
    // NULL means ungrouped (standalone item)
    groupName: text("group_name"),
    // Display order within the time slot
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("protocol_item_protocol_idx").on(t.protocolId),
    index("protocol_item_time_slot_idx").on(t.protocolId, t.timeSlot),
  ],
);

// ============================================================================
// Relations
// ============================================================================

export const userRelations = relations(user, ({ many, one }) => ({
  accounts: many(account),
  sessions: many(session),
  stacks: many(stack),
  logs: many(log),
  goals: many(userGoal),
  biomarkers: many(userBiomarker),
  preference: one(userPreference),
  dismissedSuggestions: many(dismissedSuggestion),
  protocol: one(protocol),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const supplementRelations = relations(supplement, ({ many }) => ({
  sourceInteractions: many(interaction, { relationName: "source" }),
  targetInteractions: many(interaction, { relationName: "target" }),
  sourceRatioRules: many(ratioRule, { relationName: "ratioSource" }),
  targetRatioRules: many(ratioRule, { relationName: "ratioTarget" }),
  sourceTimingRules: many(timingRule, { relationName: "timingSource" }),
  targetTimingRules: many(timingRule, { relationName: "timingTarget" }),
  cyp450Pathways: many(cyp450Pathway),
  stackItems: many(stackItem),
  logs: many(log),
  knowledge: many(supplementKnowledge),
  protocolItems: many(protocolItem),
}));

export const interactionRelations = relations(interaction, ({ one }) => ({
  source: one(supplement, {
    fields: [interaction.sourceId],
    references: [supplement.id],
    relationName: "source",
  }),
  target: one(supplement, {
    fields: [interaction.targetId],
    references: [supplement.id],
    relationName: "target",
  }),
}));

export const stackRelations = relations(stack, ({ one, many }) => ({
  user: one(user, { fields: [stack.userId], references: [user.id] }),
  items: many(stackItem),
}));

export const stackItemRelations = relations(stackItem, ({ one }) => ({
  stack: one(stack, { fields: [stackItem.stackId], references: [stack.id] }),
  supplement: one(supplement, {
    fields: [stackItem.supplementId],
    references: [supplement.id],
  }),
}));

export const logRelations = relations(log, ({ one }) => ({
  user: one(user, { fields: [log.userId], references: [user.id] }),
  supplement: one(supplement, {
    fields: [log.supplementId],
    references: [supplement.id],
  }),
}));

export const ratioRuleRelations = relations(ratioRule, ({ one }) => ({
  sourceSupplement: one(supplement, {
    fields: [ratioRule.sourceSupplementId],
    references: [supplement.id],
    relationName: "ratioSource",
  }),
  targetSupplement: one(supplement, {
    fields: [ratioRule.targetSupplementId],
    references: [supplement.id],
    relationName: "ratioTarget",
  }),
}));

export const timingRuleRelations = relations(timingRule, ({ one }) => ({
  sourceSupplement: one(supplement, {
    fields: [timingRule.sourceSupplementId],
    references: [supplement.id],
    relationName: "timingSource",
  }),
  targetSupplement: one(supplement, {
    fields: [timingRule.targetSupplementId],
    references: [supplement.id],
    relationName: "timingTarget",
  }),
}));

export const userGoalRelations = relations(userGoal, ({ one }) => ({
  user: one(user, { fields: [userGoal.userId], references: [user.id] }),
}));

export const cyp450PathwayRelations = relations(cyp450Pathway, ({ one }) => ({
  supplement: one(supplement, {
    fields: [cyp450Pathway.supplementId],
    references: [supplement.id],
  }),
}));

export const userBiomarkerRelations = relations(userBiomarker, ({ one }) => ({
  user: one(user, { fields: [userBiomarker.userId], references: [user.id] }),
  supplement: one(supplement, {
    fields: [userBiomarker.supplementId],
    references: [supplement.id],
  }),
}));

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
  user: one(user, { fields: [userPreference.userId], references: [user.id] }),
}));

export const dismissedSuggestionRelations = relations(
  dismissedSuggestion,
  ({ one }) => ({
    user: one(user, {
      fields: [dismissedSuggestion.userId],
      references: [user.id],
    }),
  }),
);

export const supplementKnowledgeRelations = relations(
  supplementKnowledge,
  ({ one }) => ({
    supplement: one(supplement, {
      fields: [supplementKnowledge.supplementId],
      references: [supplement.id],
    }),
  }),
);

export const protocolRelations = relations(protocol, ({ one, many }) => ({
  user: one(user, { fields: [protocol.userId], references: [user.id] }),
  items: many(protocolItem),
}));

export const protocolItemRelations = relations(protocolItem, ({ one }) => ({
  protocol: one(protocol, {
    fields: [protocolItem.protocolId],
    references: [protocol.id],
  }),
  supplement: one(supplement, {
    fields: [protocolItem.supplementId],
    references: [supplement.id],
  }),
}));
