import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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
    // Research chemical / peptide support
    isResearchChemical: boolean("is_research_chemical")
      .default(false)
      .notNull(),
    route: routeEnum("route").default("oral").notNull(),
    storageInstructions: text("storage_instructions"),
    // Pharmacokinetic fields (sourced from Examine.com/PubMed)
    // Used for biological state timeline visualization
    peakMinutes: integer("peak_minutes"), // Time to Cmax (peak plasma concentration)
    halfLifeMinutes: integer("half_life_minutes"), // Elimination half-life (t½)
    absorptionWindowMinutes: integer("absorption_window_minutes"), // Active absorption period
    bioavailabilityPercent: real("bioavailability_percent"), // % systemic availability
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
  "substrate",   // Metabolized by this enzyme
  "inhibitor",   // Inhibits this enzyme (slows metabolism of substrates)
  "inducer",     // Induces this enzyme (speeds up metabolism of substrates)
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
// Relations
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  stacks: many(stack),
  logs: many(log),
  goals: many(userGoal),
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
