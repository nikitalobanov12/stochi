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
  /** User's supplement experience level for filtering advanced suggestions */
  experienceLevel: "beginner" | "intermediate" | "advanced";
  /** Synergy strength filter level */
  suggestionFilterLevel: "critical_only" | "strong" | "moderate" | "all";
  /** Whether to show supplements that require specific conditions (deficiency, etc.) */
  showConditionalSupplements: boolean;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  showAddSuggestions: true,
  timezone: null,
  experienceLevel: "beginner",
  suggestionFilterLevel: "strong",
  showConditionalSupplements: false,
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
    experienceLevel:
      existing.experienceLevel ?? DEFAULT_PREFERENCES.experienceLevel,
    suggestionFilterLevel:
      existing.suggestionFilterLevel ??
      DEFAULT_PREFERENCES.suggestionFilterLevel,
    showConditionalSupplements:
      existing.showConditionalSupplements ??
      DEFAULT_PREFERENCES.showConditionalSupplements,
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

/**
 * Set the user's experience level for filtering advanced supplement suggestions.
 */
export async function setExperienceLevel(
  value: "beginner" | "intermediate" | "advanced",
): Promise<void> {
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
        experienceLevel: value,
        updatedAt: new Date(),
      })
      .where(eq(userPreference.userId, session.user.id));
  } else {
    await db.insert(userPreference).values({
      userId: session.user.id,
      experienceLevel: value,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

/**
 * Set the user's suggestion filter level for synergy strength.
 */
export async function setSuggestionFilterLevel(
  value: "critical_only" | "strong" | "moderate" | "all",
): Promise<void> {
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
        suggestionFilterLevel: value,
        updatedAt: new Date(),
      })
      .where(eq(userPreference.userId, session.user.id));
  } else {
    await db.insert(userPreference).values({
      userId: session.user.id,
      suggestionFilterLevel: value,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

/**
 * Set whether to show conditional supplements (deficiency-required, etc.).
 */
export async function setShowConditionalSupplements(
  value: boolean,
): Promise<void> {
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
        showConditionalSupplements: value,
        updatedAt: new Date(),
      })
      .where(eq(userPreference.userId, session.user.id));
  } else {
    await db.insert(userPreference).values({
      userId: session.user.id,
      showConditionalSupplements: value,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
