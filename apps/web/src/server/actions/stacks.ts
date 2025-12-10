"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { stack, stackItem, log } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";

export async function createStack(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const name = formData.get("name") as string;
  if (!name || name.trim().length === 0) {
    throw new Error("Stack name is required");
  }

  await db
    .insert(stack)
    .values({
      userId: session.user.id,
      name: name.trim(),
    });

  revalidatePath("/stacks");
  revalidatePath("/dashboard");
}

export async function updateStack(stackId: string, formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const name = formData.get("name") as string;
  if (!name || name.trim().length === 0) {
    throw new Error("Stack name is required");
  }

  await db
    .update(stack)
    .set({
      name: name.trim(),
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
  unit: "mg" | "mcg" | "g" | "IU" | "ml",
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

  if (!item || item.stack.userId !== session.user.id) {
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
