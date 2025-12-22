"use client";

import { useCallback, useSyncExternalStore } from "react";

export type SuggestionCategory = "safety" | "synergy" | "timing" | "balance";

export type CategoryPreferences = Record<SuggestionCategory, boolean>;

const STORAGE_KEY = "stochi-category-prefs";

const DEFAULT_PREFERENCES: CategoryPreferences = {
  safety: true,
  synergy: true,
  timing: true,
  balance: true,
};

// Listeners for the store
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getStoredPreferences(): CategoryPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(stored) as Partial<CategoryPreferences>;
    // Merge with defaults to handle new categories added in future
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function setStoredPreferences(prefs: CategoryPreferences): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    emitChange();
  } catch {
    // localStorage might be full or disabled - fail silently
  }
}

function getSnapshot(): CategoryPreferences {
  return getStoredPreferences();
}

function getServerSnapshot(): CategoryPreferences {
  return DEFAULT_PREFERENCES;
}

/**
 * Hook for managing suggestion category visibility preferences.
 * Uses localStorage for instant, snappy toggles without server roundtrips.
 * Uses useSyncExternalStore for proper React 18 hydration handling.
 */
export function useCategoryPreferences() {
  const preferences = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggleCategory = useCallback((category: SuggestionCategory) => {
    const current = getStoredPreferences();
    const next = { ...current, [category]: !current[category] };
    setStoredPreferences(next);
  }, []);

  const setCategory = useCallback(
    (category: SuggestionCategory, enabled: boolean) => {
      const current = getStoredPreferences();
      const next = { ...current, [category]: enabled };
      setStoredPreferences(next);
    },
    [],
  );

  const resetAll = useCallback(() => {
    setStoredPreferences(DEFAULT_PREFERENCES);
  }, []);

  const enabledCount = Object.values(preferences).filter(Boolean).length;
  const allHidden = enabledCount === 0;

  // isHydrated is always true with useSyncExternalStore pattern
  // since it handles SSR/client mismatch automatically
  const isHydrated = true;

  return {
    preferences,
    toggleCategory,
    setCategory,
    resetAll,
    isHydrated,
    enabledCount,
    allHidden,
  };
}
