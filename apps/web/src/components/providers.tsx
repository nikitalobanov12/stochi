"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import { authClient } from "~/server/better-auth/client";
import { PostHogPageView } from "~/components/posthog-pageview";
import { PostHogProvider } from "~/components/posthog-provider";
import { SupplementSheetProvider } from "~/components/supplements/supplement-sheet";
import { ThemeProvider } from "~/components/theme-provider";
import { TimezoneSync } from "~/components/timezone-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <PostHogProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthUIProvider
          authClient={authClient}
          navigate={(path) => router.push(path)}
          replace={(path) => router.replace(path)}
          Link={Link}
          basePath="/auth"
          redirectTo="/dashboard"
          credentials={false}
          social={{
            providers: ["google", "github"],
          }}
        >
          <TimezoneSync />
          <Suspense>
            <PostHogPageView />
          </Suspense>
          <SupplementSheetProvider>{children}</SupplementSheetProvider>
        </AuthUIProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}
