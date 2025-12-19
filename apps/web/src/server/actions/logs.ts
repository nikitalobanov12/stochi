"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { log, supplement } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  checkSafetyLimit,
  type SafetyCheckResult,
  type SupplementWithSafety,
} from "~/server/services/safety";

const VALID_UNITS = ["mg", "mcg", "g", "IU", "ml"] as const;
type DosageUnit = (typeof VALID_UNITS)[number];

export type CreateLogResult =
  | { success: true }
  | { success: false; safetyCheck: SafetyCheckResult };

/**
 * Create a supplement log entry.
 *
 * @param supplementId - The supplement to log
 * @param dosage - The dosage amount
 * @param unit - The unit of measurement
 * @param loggedAt - Optional timestamp (defaults to now)
 * @param forceOverride - If true, bypass soft limit warnings (hard limits still block)
 */
export async function createLog(
  supplementId: string,
  dosage: number,
  unit: DosageUnit,
  loggedAt?: Date,
  forceOverride?: boolean,
): Promise<CreateLogResult> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Validate dosage
  if (!Number.isFinite(dosage) || dosage <= 0) {
    throw new Error("Dosage must be a positive number");
  }

  // Validate unit
  if (!VALID_UNITS.includes(unit)) {
    throw new Error("Invalid dosage unit");
  }

  // Validate supplementId format (UUID)
  if (!supplementId || typeof supplementId !== "string") {
    throw new Error("Invalid supplement ID");
  }

  // Verify supplement exists and get safety data
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
    throw new Error("Supplement not found");
  }

  // Perform safety check
  const safetyCheck = await checkSafetyLimit(
    session.user.id,
    supp as SupplementWithSafety,
    dosage,
    unit,
  );

  // If not safe, check if we should block or warn
  if (!safetyCheck.isSafe) {
    // Hard limits always block - no override allowed
    if (safetyCheck.isHardLimit) {
      return { success: false, safetyCheck };
    }

    // Soft limits can be overridden by user
    if (!forceOverride) {
      return { success: false, safetyCheck };
    }
    // If forceOverride is true, continue with the log
  }

  await db.insert(log).values({
    userId: session.user.id,
    supplementId,
    dosage,
    unit,
    loggedAt: loggedAt ?? new Date(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/log");

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
