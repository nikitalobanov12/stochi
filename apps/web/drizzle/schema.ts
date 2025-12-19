import {
  pgTable,
  index,
  foreignKey,
  check,
  uuid,
  text,
  timestamp,
  unique,
  real,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const dosageUnit = pgEnum("dosage_unit", ["mg", "mcg", "g", "IU", "ml"]);
export const interactionType = pgEnum("interaction_type", [
  "inhibition",
  "synergy",
  "competition",
]);
export const severity = pgEnum("severity", ["low", "medium", "critical"]);
export const supplementCategory = pgEnum("supplement_category", [
  "mineral",
  "vitamin",
  "amino-acid",
  "adaptogen",
  "nootropic",
  "antioxidant",
  "omega",
  "other",
]);

export const interaction = pgTable(
  "interaction",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    sourceId: uuid("source_id").notNull(),
    targetId: uuid("target_id").notNull(),
    type: interactionType().notNull(),
    mechanism: text(),
    severity: severity().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("interaction_source_idx").using(
      "btree",
      table.sourceId.asc().nullsLast().op("uuid_ops"),
    ),
    index("interaction_target_idx").using(
      "btree",
      table.targetId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [supplement.id],
      name: "interaction_source_id_supplement_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.targetId],
      foreignColumns: [supplement.id],
      name: "interaction_target_id_supplement_id_fk",
    }).onDelete("cascade"),
    check("interaction_id_not_null", sql`NOT NULL id`),
    check("interaction_source_id_not_null", sql`NOT NULL source_id`),
    check("interaction_target_id_not_null", sql`NOT NULL target_id`),
    check("interaction_type_not_null", sql`NOT NULL type`),
    check("interaction_severity_not_null", sql`NOT NULL severity`),
    check("interaction_created_at_not_null", sql`NOT NULL created_at`),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
    check("session_id_not_null", sql`NOT NULL id`),
    check("session_expires_at_not_null", sql`NOT NULL expires_at`),
    check("session_token_not_null", sql`NOT NULL token`),
    check("session_created_at_not_null", sql`NOT NULL created_at`),
    check("session_updated_at_not_null", sql`NOT NULL updated_at`),
    check("session_user_id_not_null", sql`NOT NULL user_id`),
  ],
);

export const stackItem = pgTable(
  "stack_item",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    stackId: uuid("stack_id").notNull(),
    supplementId: uuid("supplement_id").notNull(),
    dosage: real().notNull(),
    unit: dosageUnit().notNull(),
  },
  (table) => [
    index("stack_item_stack_idx").using(
      "btree",
      table.stackId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.stackId],
      foreignColumns: [stack.id],
      name: "stack_item_stack_id_stack_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.supplementId],
      foreignColumns: [supplement.id],
      name: "stack_item_supplement_id_supplement_id_fk",
    }).onDelete("cascade"),
    check("stack_item_id_not_null", sql`NOT NULL id`),
    check("stack_item_stack_id_not_null", sql`NOT NULL stack_id`),
    check("stack_item_supplement_id_not_null", sql`NOT NULL supplement_id`),
    check("stack_item_dosage_not_null", sql`NOT NULL dosage`),
    check("stack_item_unit_not_null", sql`NOT NULL unit`),
  ],
);

export const log = pgTable(
  "log",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    supplementId: uuid("supplement_id").notNull(),
    dosage: real().notNull(),
    unit: dosageUnit().notNull(),
    loggedAt: timestamp("logged_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("log_logged_at_idx").using(
      "btree",
      table.loggedAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("log_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "log_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.supplementId],
      foreignColumns: [supplement.id],
      name: "log_supplement_id_supplement_id_fk",
    }).onDelete("cascade"),
    check("log_id_not_null", sql`NOT NULL id`),
    check("log_user_id_not_null", sql`NOT NULL user_id`),
    check("log_supplement_id_not_null", sql`NOT NULL supplement_id`),
    check("log_dosage_not_null", sql`NOT NULL dosage`),
    check("log_unit_not_null", sql`NOT NULL unit`),
    check("log_logged_at_not_null", sql`NOT NULL logged_at`),
    check("log_created_at_not_null", sql`NOT NULL created_at`),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }),
  },
  (table) => [
    check("verification_id_not_null", sql`NOT NULL id`),
    check("verification_identifier_not_null", sql`NOT NULL identifier`),
    check("verification_value_not_null", sql`NOT NULL value`),
    check("verification_expires_at_not_null", sql`NOT NULL expires_at`),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    unique("user_email_unique").on(table.email),
    check("user_id_not_null", sql`NOT NULL id`),
    check("user_name_not_null", sql`NOT NULL name`),
    check("user_email_not_null", sql`NOT NULL email`),
    check("user_email_verified_not_null", sql`NOT NULL email_verified`),
    check("user_created_at_not_null", sql`NOT NULL created_at`),
    check("user_updated_at_not_null", sql`NOT NULL updated_at`),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
    check("account_id_not_null", sql`NOT NULL id`),
    check("account_account_id_not_null", sql`NOT NULL account_id`),
    check("account_provider_id_not_null", sql`NOT NULL provider_id`),
    check("account_user_id_not_null", sql`NOT NULL user_id`),
    check("account_created_at_not_null", sql`NOT NULL created_at`),
    check("account_updated_at_not_null", sql`NOT NULL updated_at`),
  ],
);

export const stack = pgTable(
  "stack",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    isPublic: boolean("is_public").default(false),
  },
  (table) => [
    index("stack_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "stack_user_id_user_id_fk",
    }).onDelete("cascade"),
    check("stack_id_not_null", sql`NOT NULL id`),
    check("stack_user_id_not_null", sql`NOT NULL user_id`),
    check("stack_name_not_null", sql`NOT NULL name`),
    check("stack_created_at_not_null", sql`NOT NULL created_at`),
    check("stack_updated_at_not_null", sql`NOT NULL updated_at`),
  ],
);

export const userGoal = pgTable(
  "user_goal",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    goal: text().notNull(),
    priority: integer().default(1).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    check("user_goal_id_not_null", sql`NOT NULL id`),
    check("user_goal_user_id_not_null", sql`NOT NULL user_id`),
    check("user_goal_goal_not_null", sql`NOT NULL goal`),
    check("user_goal_priority_not_null", sql`NOT NULL priority`),
    check("user_goal_created_at_not_null", sql`NOT NULL created_at`),
  ],
);

export const ratioRule = pgTable(
  "ratio_rule",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    sourceSupplementId: uuid("source_supplement_id").notNull(),
    targetSupplementId: uuid("target_supplement_id").notNull(),
    minRatio: real("min_ratio"),
    maxRatio: real("max_ratio"),
    optimalRatio: real("optimal_ratio"),
    warningMessage: text("warning_message").notNull(),
    severity: severity().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    check("ratio_rule_id_not_null", sql`NOT NULL id`),
    check(
      "ratio_rule_source_supplement_id_not_null",
      sql`NOT NULL source_supplement_id`,
    ),
    check(
      "ratio_rule_target_supplement_id_not_null",
      sql`NOT NULL target_supplement_id`,
    ),
    check("ratio_rule_warning_message_not_null", sql`NOT NULL warning_message`),
    check("ratio_rule_severity_not_null", sql`NOT NULL severity`),
    check("ratio_rule_created_at_not_null", sql`NOT NULL created_at`),
  ],
);

export const timingRule = pgTable(
  "timing_rule",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    sourceSupplementId: uuid("source_supplement_id").notNull(),
    targetSupplementId: uuid("target_supplement_id").notNull(),
    minHoursApart: real("min_hours_apart").notNull(),
    reason: text().notNull(),
    severity: severity().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    check("timing_rule_id_not_null", sql`NOT NULL id`),
    check(
      "timing_rule_source_supplement_id_not_null",
      sql`NOT NULL source_supplement_id`,
    ),
    check(
      "timing_rule_target_supplement_id_not_null",
      sql`NOT NULL target_supplement_id`,
    ),
    check(
      "timing_rule_min_hours_apart_not_null",
      sql`NOT NULL min_hours_apart`,
    ),
    check("timing_rule_reason_not_null", sql`NOT NULL reason`),
    check("timing_rule_severity_not_null", sql`NOT NULL severity`),
    check("timing_rule_created_at_not_null", sql`NOT NULL created_at`),
  ],
);

export const supplement = pgTable(
  "supplement",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    form: text(),
    elementalWeight: real("elemental_weight"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    defaultUnit: dosageUnit("default_unit").default("mg"),
    description: text(),
    mechanism: text(),
    researchUrl: text("research_url"),
    category: supplementCategory(),
    commonGoals: text("common_goals").array(),
  },
  (table) => [
    index("supplement_name_idx").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops"),
    ),
    unique("supplement_name_unique").on(table.name),
    check("supplement_id_not_null", sql`NOT NULL id`),
    check("supplement_name_not_null", sql`NOT NULL name`),
    check("supplement_created_at_not_null", sql`NOT NULL created_at`),
    check("supplement_updated_at_not_null", sql`NOT NULL updated_at`),
  ],
);
