"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { userPreference } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";

export type UserPreferences = {
  showAddSuggestions: boolean;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  showAddSuggestions: true,
};

/**
 * Get the current user's preferences.
 * Creates default preferences if none exist.
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const session = await getSession();
  if (!session) {
    return DEFAULT_PREFERENCES;
  }

  const existing = await db.query.userPreference.findFirst({
    where: eq(userPreference.userId, session.user.id),
  });

  if (!existing) {
    return DEFAULT_PREFERENCES;
  }

  return {
    showAddSuggestions: existing.showAddSuggestions,
  };
}

/**
 * Set whether to show "add supplement" suggestions.
 */
export async function setShowAddSuggestions(value: boolean): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  const existing = await db.query.userPreference.findFirst({
    where: eq(userPreference.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(userPreference)
      .set({
        showAddSuggestions: value,
        updatedAt: new Date(),
      })
      .where(eq(userPreference.userId, session.user.id));
  } else {
    await db.insert(userPreference).values({
      userId: session.user.id,
      showAddSuggestions: value,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
