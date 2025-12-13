import { relations } from "drizzle-orm";
import {
  boolean,
  index,
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

export const supplement = pgTable(
  "supplement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    form: text("form"),
    elementalWeight: real("elemental_weight"),
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
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("stack_user_idx").on(t.userId)],
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
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// ============================================================================
// Relations
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  stacks: many(stack),
  logs: many(log),
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
