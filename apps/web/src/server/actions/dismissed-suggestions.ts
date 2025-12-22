"use server";

import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { dismissedSuggestion, supplement } from "~/server/db/schema";
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
  revalidatePath("/dashboard/settings");
}

/**
 * Dismissed suggestion with parsed context for display.
 */
export type DismissedSuggestionWithContext = {
  id: string;
  suggestionKey: string;
  type: "synergy" | "timing" | "balance" | "unknown";
  /** For synergy/balance: both supplement names. For timing: single supplement name */
  supplementNames: string[];
  dismissedAt: Date;
};

/**
 * Parse a suggestion key into its type and supplement IDs.
 * Key format: "type:id1:id2" or "type:id1"
 */
function parseSuggestionKey(key: string): { type: string; supplementIds: string[] } {
  const parts = key.split(":");
  const type = parts[0] ?? "unknown";
  const supplementIds = parts.slice(1);
  return { type, supplementIds };
}

/**
 * Get all dismissed suggestions with full context (supplement names).
 * This is used for the Settings page to show what was dismissed.
 */
export async function getDismissedSuggestionsWithContext(): Promise<DismissedSuggestionWithContext[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const dismissed = await db.query.dismissedSuggestion.findMany({
    where: eq(dismissedSuggestion.userId, session.user.id),
    orderBy: (d, { desc }) => [desc(d.dismissedAt)],
  });

  if (dismissed.length === 0) {
    return [];
  }

  // Collect all unique supplement IDs from all dismissed suggestions
  const allSupplementIds = new Set<string>();
  for (const d of dismissed) {
    const { supplementIds } = parseSuggestionKey(d.suggestionKey);
    for (const id of supplementIds) {
      allSupplementIds.add(id);
    }
  }

  // Batch fetch all supplements
  const supplements = allSupplementIds.size > 0
    ? await db.query.supplement.findMany({
        where: inArray(supplement.id, Array.from(allSupplementIds)),
        columns: { id: true, name: true },
      })
    : [];

  const supplementMap = new Map(supplements.map((s) => [s.id, s.name]));

  // Build the result with supplement names
  return dismissed.map((d) => {
    const { type, supplementIds } = parseSuggestionKey(d.suggestionKey);
    const supplementNames = supplementIds
      .map((id) => supplementMap.get(id))
      .filter((name): name is string => name !== undefined);

    return {
      id: d.id,
      suggestionKey: d.suggestionKey,
      type: type as DismissedSuggestionWithContext["type"],
      supplementNames,
      dismissedAt: d.dismissedAt,
    };
  });
}
