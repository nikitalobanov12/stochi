"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { stack, stackItem, log } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";

const VALID_UNITS = ["mg", "mcg", "g", "IU", "ml"] as const;
type DosageUnit = (typeof VALID_UNITS)[number];

function validateFormDataString(
  formData: FormData,
  key: string,
): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidUnit(unit: unknown): unit is DosageUnit {
  return typeof unit === "string" && VALID_UNITS.includes(unit as DosageUnit);
}

export async function createStack(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const name = validateFormDataString(formData, "name");
  if (!name) {
    throw new Error("Stack name is required");
  }

  await db
    .insert(stack)
    .values({
      userId: session.user.id,
      name,
    });

  revalidatePath("/stacks");
  revalidatePath("/dashboard");
}

export async function updateStack(stackId: string, formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const name = validateFormDataString(formData, "name");
  if (!name) {
    throw new Error("Stack name is required");
  }

  await db
    .update(stack)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(and(eq(stack.id, stackId), eq(stack.userId, session.user.id)));

  revalidatePath("/stacks");
  revalidatePath(`/stacks/${stackId}`);
  revalidatePath("/dashboard");
}

export async function deleteStack(stackId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  await db
    .delete(stack)
    .where(and(eq(stack.id, stackId), eq(stack.userId, session.user.id)));

  revalidatePath("/stacks");
  revalidatePath("/dashboard");
  redirect("/stacks");
}

export async function addStackItem(
  stackId: string,
  supplementId: string,
  dosage: number,
  unit: DosageUnit,
) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const userStack = await db.query.stack.findFirst({
    where: and(eq(stack.id, stackId), eq(stack.userId, session.user.id)),
  });

  if (!userStack) {
    throw new Error("Stack not found");
  }

  await db.insert(stackItem).values({
    stackId,
    supplementId,
    dosage,
    unit,
  });

  await db
    .update(stack)
    .set({ updatedAt: new Date() })
    .where(eq(stack.id, stackId));

  revalidatePath(`/stacks/${stackId}`);
  revalidatePath("/dashboard");
}

export async function addStackItems(
  stackId: string,
  items: Array<{ supplementId: string; dosage: number; unit: string }>,
) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const userStack = await db.query.stack.findFirst({
    where: and(eq(stack.id, stackId), eq(stack.userId, session.user.id)),
  });

  if (!userStack) {
    throw new Error("Stack not found");
  }

  if (items.length === 0) {
    return;
  }

  // Validate all items before inserting
  const validatedItems: Array<{
    stackId: string;
    supplementId: string;
    dosage: number;
    unit: DosageUnit;
  }> = [];

  for (const item of items) {
    if (!isValidUnit(item.unit)) {
      throw new Error(`Invalid unit: ${item.unit}`);
    }
    if (!Number.isFinite(item.dosage) || item.dosage <= 0) {
      throw new Error("Dosage must be a positive number");
    }
    validatedItems.push({
      stackId,
      supplementId: item.supplementId,
      dosage: item.dosage,
      unit: item.unit,
    });
  }

  // Verify all supplements exist
  const supplementIds = validatedItems.map((i) => i.supplementId);
  const existingSupplements = await db.query.supplement.findMany({
    where: (s, { inArray }) => inArray(s.id, supplementIds),
    columns: { id: true },
  });

  if (existingSupplements.length !== supplementIds.length) {
    throw new Error("One or more supplements not found");
  }

  await db.insert(stackItem).values(validatedItems);

  await db
    .update(stack)
    .set({ updatedAt: new Date() })
    .where(eq(stack.id, stackId));

  revalidatePath(`/stacks/${stackId}`);
  revalidatePath("/dashboard");
}

export async function removeStackItem(itemId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const item = await db.query.stackItem.findFirst({
    where: eq(stackItem.id, itemId),
    with: {
      stack: true,
    },
  });

  if (!item?.stack || item.stack.userId !== session.user.id) {
    throw new Error("Item not found");
  }

  await db.delete(stackItem).where(eq(stackItem.id, itemId));

  await db
    .update(stack)
    .set({ updatedAt: new Date() })
    .where(eq(stack.id, item.stackId));

  revalidatePath(`/stacks/${item.stackId}`);
  revalidatePath("/dashboard");
}

export async function logStack(stackId: string) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const userStack = await db.query.stack.findFirst({
    where: and(eq(stack.id, stackId), eq(stack.userId, session.user.id)),
    with: {
      items: true,
    },
  });

  if (!userStack) {
    throw new Error("Stack not found");
  }

  if (userStack.items.length === 0) {
    throw new Error("Stack has no items to log");
  }

  const now = new Date();

  await db.insert(log).values(
    userStack.items.map((item) => ({
      userId: session.user.id,
      supplementId: item.supplementId,
      dosage: item.dosage,
      unit: item.unit,
      loggedAt: now,
    })),
  );

  revalidatePath("/dashboard");
  revalidatePath("/log");
}
