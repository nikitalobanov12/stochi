"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { userPreference } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";

export type UserPreferences = {
  showAddSuggestions: boolean;
  /** IANA timezone identifier (e.g., "America/Los_Angeles") */
  timezone: string | null;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  showAddSuggestions: true,
  timezone: null,
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
    timezone: existing.timezone,
  };
}

/**
 * Get just the user's timezone preference.
 * Returns null if not set or not authenticated.
 */
export async function getUserTimezone(): Promise<string | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const existing = await db.query.userPreference.findFirst({
    where: eq(userPreference.userId, session.user.id),
    columns: { timezone: true },
  });

  return existing?.timezone ?? null;
}

/**
 * Set the user's timezone preference.
 * Called automatically by the client-side timezone sync component.
 * Only updates if the timezone is different from the current one.
 *
 * @param timezone - IANA timezone identifier (e.g., "America/Los_Angeles")
 * @returns true if timezone was updated, false if unchanged
 */
export async function setTimezone(timezone: string): Promise<boolean> {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const existing = await db.query.userPreference.findFirst({
    where: eq(userPreference.userId, session.user.id),
  });

  // Skip update if timezone is already the same
  if (existing?.timezone === timezone) {
    return false;
  }

  if (existing) {
    await db
      .update(userPreference)
      .set({
        timezone,
        updatedAt: new Date(),
      })
      .where(eq(userPreference.userId, session.user.id));
  } else {
    await db.insert(userPreference).values({
      userId: session.user.id,
      timezone,
    });
  }

  // Revalidate dashboard since timing tips may change
  revalidatePath("/dashboard");
  return true;
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
