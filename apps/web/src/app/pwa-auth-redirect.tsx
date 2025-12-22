"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Detects if the app is running in PWA standalone mode and redirects
 * unauthenticated users directly to the sign-in page instead of showing
 * the marketing landing page.
 */
export function PWAAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if running in standalone mode (PWA installed on home screen)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari standalone mode
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone);

    if (isStandalone) {
      router.replace("/auth/sign-in");
    }
  }, [router]);

  return null;
}
