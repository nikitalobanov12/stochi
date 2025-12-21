"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { dismissedSuggestion } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";

/**
 * Suggestion key format:
 * - Synergy suggestions: "synergy:{sourceId}:{targetId}" (IDs sorted alphabetically for consistency)
 * - Timing suggestions: "timing:{supplementId}"
 * - Balance suggestions: "balance:{sourceId}:{targetId}"
 *
 * Note: Key generation logic lives in biological-state.ts where suggestions are created.
 */

/**
 * Dismiss a suggestion so it won't appear again for this user.
 */
export async function dismissSuggestion(suggestionKey: string): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  // Check if already dismissed (avoid duplicates)
  const existing = await db.query.dismissedSuggestion.findFirst({
    where: and(
      eq(dismissedSuggestion.userId, session.user.id),
      eq(dismissedSuggestion.suggestionKey, suggestionKey),
    ),
  });

  if (!existing) {
    await db.insert(dismissedSuggestion).values({
      userId: session.user.id,
      suggestionKey,
    });
  }

  revalidatePath("/dashboard");
}

/**
 * Get all dismissed suggestion keys for the current user.
 * Returns a Set for O(1) lookup performance.
 */
export async function getDismissedSuggestionKeys(): Promise<Set<string>> {
  const session = await getSession();
  if (!session) {
    return new Set();
  }

  const dismissed = await db.query.dismissedSuggestion.findMany({
    where: eq(dismissedSuggestion.userId, session.user.id),
    columns: { suggestionKey: true },
  });

  return new Set(dismissed.map((d) => d.suggestionKey));
}

/**
 * Get count of dismissed suggestions for the current user.
 * Useful for displaying in settings.
 */
export async function getDismissedSuggestionsCount(): Promise<number> {
  const session = await getSession();
  if (!session) {
    return 0;
  }

  const dismissed = await db.query.dismissedSuggestion.findMany({
    where: eq(dismissedSuggestion.userId, session.user.id),
    columns: { id: true },
  });

  return dismissed.length;
}

/**
 * Reset all dismissed suggestions for the current user.
 * This brings back all previously dismissed suggestions.
 */
export async function resetDismissedSuggestions(): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  await db
    .delete(dismissedSuggestion)
    .where(eq(dismissedSuggestion.userId, session.user.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

/**
 * Restore a specific dismissed suggestion.
 */
export async function restoreSuggestion(suggestionKey: string): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in");
  }

  await db
    .delete(dismissedSuggestion)
    .where(
      and(
        eq(dismissedSuggestion.userId, session.user.id),
        eq(dismissedSuggestion.suggestionKey, suggestionKey),
      ),
    );

  revalidatePath("/dashboard");
}
