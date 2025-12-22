"use client";

import { useEffect, useRef } from "react";
import { setTimezone } from "~/server/actions/preferences";

/**
 * Client component that automatically detects and syncs the user's timezone.
 *
 * Uses the browser's Intl API to detect the IANA timezone identifier
 * (e.g., "America/Los_Angeles") and syncs it to the server.
 *
 * Only syncs once per session unless the timezone changes.
 */
export function TimezoneSync() {
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once per component mount
    if (hasSynced.current) return;
    hasSynced.current = true;

    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Fire and forget - we don't need to wait for this
    void setTimezone(detectedTimezone);
  }, []);

  // This component renders nothing
  return null;
}
