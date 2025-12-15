"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { log, supplement } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";

const VALID_UNITS = ["mg", "mcg", "g", "IU", "ml"] as const;
type DosageUnit = (typeof VALID_UNITS)[number];

export async function createLog(
  supplementId: string,
  dosage: number,
  unit: DosageUnit,
  loggedAt?: Date,
) {
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

  // Verify supplement exists
  const supp = await db.query.supplement.findFirst({
    where: eq(supplement.id, supplementId),
    columns: { id: true },
  });

  if (!supp) {
    throw new Error("Supplement not found");
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
