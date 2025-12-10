"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { log } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";

export async function createLog(
  supplementId: string,
  dosage: number,
  unit: "mg" | "mcg" | "g" | "IU" | "ml",
  loggedAt?: Date,
) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
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
