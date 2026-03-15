"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";

import { setTimezone } from "~/server/actions/preferences";
import { authClient } from "~/server/better-auth/client";

/**
 * Client component that automatically detects and syncs the user's timezone,
 * and identifies the authenticated user in PostHog.
 *
 * Uses the browser's Intl API to detect the IANA timezone identifier
 * (e.g., "America/Los_Angeles") and syncs it to the server.
 *
 * Only syncs once per session unless the timezone changes.
 */
export function TimezoneSync() {
  const hasSynced = useRef(false);
  const hasIdentified = useRef(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    // Only sync once per component mount
    if (hasSynced.current) return;
    hasSynced.current = true;

    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Fire and forget - we don't need to wait for this
    void setTimezone(detectedTimezone);
  }, []);

  useEffect(() => {
    if (hasIdentified.current) return;
    if (!session?.user) return;

    hasIdentified.current = true;
    posthog.identify(session.user.id, {
      email: session.user.email,
      name: session.user.name,
    });
  }, [session]);

  // This component renders nothing
  return null;
}
