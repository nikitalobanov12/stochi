"use server";

import { revalidatePath } from "next/cache";
import { eq, and, inArray, gte } from "drizzle-orm";

import { db } from "~/server/db";
import { stack, stackItem, log, supplement } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { getTemplateByKey } from "~/server/data/stack-templates";

/**
 * Instantiate a template stack for the user.
 * Creates: stack + stack items + today's logs for each supplement.
 */
export async function instantiateTemplate(templateKey: string): Promise<{ success: boolean; stackId?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const template = getTemplateByKey(templateKey);
  if (!template) {
    return { success: false, error: "Template not found" };
  }

  // Get supplement IDs by name
  const supplementNames = template.supplements.map((s) => s.supplementName);
  const supplements = await db.query.supplement.findMany({
    where: inArray(supplement.name, supplementNames),
  });

  const supplementMap = new Map(supplements.map((s) => [s.name, s.id]));

  // Verify all supplements exist
  const missingSupplements = supplementNames.filter((name) => !supplementMap.has(name));
  if (missingSupplements.length > 0) {
    return { success: false, error: `Missing supplements: ${missingSupplements.join(", ")}` };
  }

  // Create stack
  const [newStack] = await db
    .insert(stack)
    .values({
      userId: session.user.id,
      name: template.name,
    })
    .returning();

  if (!newStack) {
    return { success: false, error: "Failed to create stack" };
  }

  // Create stack items
  const stackItems = template.supplements.map((s) => ({
    stackId: newStack.id,
    supplementId: supplementMap.get(s.supplementName)!,
    dosage: s.dosage,
    unit: s.unit,
  }));

  await db.insert(stackItem).values(stackItems);

  // Create today's logs (8:00 AM)
  const today = new Date();
  today.setHours(8, 0, 0, 0);

  const logs = template.supplements.map((s) => ({
    userId: session.user.id,
    supplementId: supplementMap.get(s.supplementName)!,
    dosage: s.dosage,
    unit: s.unit,
    loggedAt: today,
  }));

  await db.insert(log).values(logs);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard/log");

  return { success: true, stackId: newStack.id };
}

/**
 * Create an empty stack for users who want to start from scratch.
 */
export async function createEmptyStack(): Promise<{ success: boolean; stackId?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const [newStack] = await db
    .insert(stack)
    .values({
      userId: session.user.id,
      name: "My Stack",
    })
    .returning();

  if (!newStack) {
    return { success: false, error: "Failed to create stack" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stacks");

  return { success: true, stackId: newStack.id };
}

/**
 * Fork a template stack (rename it to remove template detection).
 * Just renames the stack by appending "(Custom)".
 */
export async function forkStack(stackId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const userStack = await db.query.stack.findFirst({
    where: and(eq(stack.id, stackId), eq(stack.userId, session.user.id)),
  });

  if (!userStack) {
    return { success: false, error: "Stack not found" };
  }

  // Rename to break template detection
  await db
    .update(stack)
    .set({ 
      name: `${userStack.name} (Custom)`,
      updatedAt: new Date(),
    })
    .where(eq(stack.id, stackId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stacks");
  revalidatePath(`/dashboard/stacks/${stackId}`);

  return { success: true };
}

/**
 * Clear template data (nuclear option).
 * Deletes the stack AND all logs from today for its supplements.
 */
export async function clearTemplateData(stackId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the stack with its items
  const userStack = await db.query.stack.findFirst({
    where: and(eq(stack.id, stackId), eq(stack.userId, session.user.id)),
    with: {
      items: true,
    },
  });

  if (!userStack) {
    return { success: false, error: "Stack not found" };
  }

  // Get today's start timestamp
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get supplement IDs from the stack
  const supplementIds = userStack.items.map((item) => item.supplementId);

  // Delete today's logs for these supplements
  if (supplementIds.length > 0) {
    await db
      .delete(log)
      .where(
        and(
          eq(log.userId, session.user.id),
          inArray(log.supplementId, supplementIds),
          gte(log.loggedAt, todayStart)
        )
      );
  }

  // Delete the stack (cascade deletes stack items)
  await db.delete(stack).where(eq(stack.id, stackId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stacks");
  revalidatePath("/dashboard/log");

  return { success: true };
}

/**
 * Check if user needs onboarding (has no stacks).
 */
export async function checkNeedsOnboarding(): Promise<boolean> {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const userStacks = await db.query.stack.findMany({
    where: eq(stack.userId, session.user.id),
    limit: 1,
  });

  return userStacks.length === 0;
}

/**
 * Create a stack from template WITHOUT creating logs.
 * Used for the "New Stack" dialog on the stacks page.
 */
export async function createStackFromTemplate(templateKey: string): Promise<{ success: boolean; stackId?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const template = getTemplateByKey(templateKey);
  if (!template) {
    return { success: false, error: "Template not found" };
  }

  // Get supplement IDs by name
  const supplementNames = template.supplements.map((s) => s.supplementName);
  const supplements = await db.query.supplement.findMany({
    where: inArray(supplement.name, supplementNames),
  });

  const supplementMap = new Map(supplements.map((s) => [s.name, s.id]));

  // Verify all supplements exist
  const missingSupplements = supplementNames.filter((name) => !supplementMap.has(name));
  if (missingSupplements.length > 0) {
    return { success: false, error: `Missing supplements: ${missingSupplements.join(", ")}` };
  }

  // Create stack
  const [newStack] = await db
    .insert(stack)
    .values({
      userId: session.user.id,
      name: template.name,
    })
    .returning();

  if (!newStack) {
    return { success: false, error: "Failed to create stack" };
  }

  // Create stack items
  const stackItems = template.supplements.map((s) => ({
    stackId: newStack.id,
    supplementId: supplementMap.get(s.supplementName)!,
    dosage: s.dosage,
    unit: s.unit,
  }));

  await db.insert(stackItem).values(stackItems);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stacks");

  return { success: true, stackId: newStack.id };
}
