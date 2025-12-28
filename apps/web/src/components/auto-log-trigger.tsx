"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { triggerAutoLog } from "~/server/actions/auto-log";

/**
 * Client component that triggers auto-log when the app is opened.
 * Uses a ref to ensure it only runs once per mount, and sessionStorage
 * to prevent running multiple times in the same session.
 */
export function AutoLogTrigger() {
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Prevent running multiple times
    if (hasTriggered.current) return;

    // Check if we've already auto-logged in this session
    const sessionKey = `auto-log-${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    hasTriggered.current = true;

    async function runAutoLog() {
      try {
        const result = await triggerAutoLog();

        if (result.success && result.logged > 0) {
          toast.success(
            `Auto-logged ${result.logged} supplement${result.logged !== 1 ? "s" : ""} from your protocol`,
          );
        }

        // Mark as done for this session
        sessionStorage.setItem(sessionKey, "true");
      } catch (error) {
        console.error("Auto-log failed:", error);
      }
    }

    // Small delay to not block initial render
    const timeout = setTimeout(() => {
      void runAutoLog();
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}
