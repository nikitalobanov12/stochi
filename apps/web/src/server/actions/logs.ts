"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import {
  log,
  supplement,
  type routeEnum,
  type mealContextEnum,
} from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  checkSafetyLimit,
  checkMealContext,
  type SafetyCheckResult,
  type SupplementWithSafety,
  type MealContextCheckResult,
} from "~/server/services/safety";

const VALID_UNITS = ["mg", "mcg", "g", "IU", "ml"] as const;
type DosageUnit = (typeof VALID_UNITS)[number];
type RouteOfAdministration = (typeof routeEnum.enumValues)[number];
type MealContext = (typeof mealContextEnum.enumValues)[number];

export type CreateLogResult =
  | { success: true; mealContextWarning?: MealContextCheckResult }
  | { success: false; safetyCheck: SafetyCheckResult };

export type CreateLogOptions = {
  supplementId: string;
  dosage: number;
  unit: DosageUnit;
  loggedAt?: Date;
  forceOverride?: boolean;
  /** Route of administration (defaults to supplement's default) */
  route?: RouteOfAdministration;
  /** Meal context for bioavailability optimization */
  mealContext?: MealContext;
};

/**
 * Create a supplement log entry.
 *
 * @param options - Log creation options
 */
export async function createLog(
  options: CreateLogOptions,
): Promise<CreateLogResult>;

/**
 * Create a supplement log entry (legacy signature for backwards compatibility).
 *
 * @deprecated Use the options object signature instead
 */
export async function createLog(
  supplementId: string,
  dosage: number,
  unit: DosageUnit,
  loggedAt?: Date,
  forceOverride?: boolean,
): Promise<CreateLogResult>;

export async function createLog(
  optionsOrSupplementId: CreateLogOptions | string,
  dosage?: number,
  unit?: DosageUnit,
  loggedAt?: Date,
  forceOverride?: boolean,
): Promise<CreateLogResult> {
  // Handle both old and new signatures
  const options: CreateLogOptions =
    typeof optionsOrSupplementId === "string"
      ? {
          supplementId: optionsOrSupplementId,
          dosage: dosage!,
          unit: unit!,
          loggedAt,
          forceOverride,
        }
      : optionsOrSupplementId;

  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Validate dosage
  if (!Number.isFinite(options.dosage) || options.dosage <= 0) {
    throw new Error("Dosage must be a positive number");
  }

  // Validate unit
  if (!VALID_UNITS.includes(options.unit)) {
    throw new Error("Invalid dosage unit");
  }

  // Validate supplementId format (UUID)
  if (!options.supplementId || typeof options.supplementId !== "string") {
    throw new Error("Invalid supplement ID");
  }

  // Verify supplement exists and get safety data
  const supp = await db.query.supplement.findFirst({
    where: eq(supplement.id, options.supplementId),
    columns: {
      id: true,
      name: true,
      elementalWeight: true,
      safetyCategory: true,
      defaultUnit: true,
      route: true,
      isResearchChemical: true,
      bioavailabilityPercent: true,
    },
  });

  if (!supp) {
    throw new Error("Supplement not found");
  }

  // Perform safety check
  const safetyCheck = await checkSafetyLimit(
    session.user.id,
    supp as SupplementWithSafety,
    options.dosage,
    options.unit,
  );

  // If not safe, check if we should block or warn
  if (!safetyCheck.isSafe) {
    // Hard limits always block - no override allowed
    if (safetyCheck.isHardLimit) {
      return { success: false, safetyCheck };
    }

    // Soft limits can be overridden by user
    if (!options.forceOverride) {
      return { success: false, safetyCheck };
    }
    // If forceOverride is true, continue with the log
  }

  // Check meal context for bioavailability optimization
  const mealContextCheck = checkMealContext(
    supp.name,
    options.mealContext,
    supp.safetyCategory,
  );

  // Use supplement's default route if not specified
  const routeToUse = options.route ?? supp.route ?? "oral";

  await db.insert(log).values({
    userId: session.user.id,
    supplementId: options.supplementId,
    dosage: options.dosage,
    unit: options.unit,
    route: routeToUse,
    mealContext: options.mealContext ?? null,
    loggedAt: options.loggedAt ?? new Date(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/log");

  // Return success with optional meal context warning
  if (!mealContextCheck.isOptimal && mealContextCheck.warning) {
    return { success: true, mealContextWarning: mealContextCheck };
  }

  return { success: true };
}

export async function deleteLog(logId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  await db
    .delete(log)
    .where(and(eq(log.id, logId), eq(log.userId, session.user.id)));

  revalidatePath("/dashboard");
  revalidatePath("/log");
}

export async function getLogs(options?: { startDate?: Date; endDate?: Date }) {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const conditions = [eq(log.userId, session.user.id)];

  if (options?.startDate) {
    conditions.push(gte(log.loggedAt, options.startDate));
  }
  if (options?.endDate) {
    conditions.push(lte(log.loggedAt, options.endDate));
  }

  return db.query.log.findMany({
    where: and(...conditions),
    with: {
      supplement: true,
    },
    orderBy: [desc(log.loggedAt)],
  });
}

/**
 * Pre-check if a dosage would be safe before showing the log form.
 * Useful for real-time validation in the UI.
 */
export async function preCheckSafety(
  supplementId: string,
  dosage: number,
  unit: DosageUnit,
): Promise<SafetyCheckResult | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const supp = await db.query.supplement.findFirst({
    where: eq(supplement.id, supplementId),
    columns: {
      id: true,
      name: true,
      elementalWeight: true,
      safetyCategory: true,
      defaultUnit: true,
    },
  });

  if (!supp) {
    return null;
  }

  return checkSafetyLimit(
    session.user.id,
    supp as SupplementWithSafety,
    dosage,
    unit,
  );
}
