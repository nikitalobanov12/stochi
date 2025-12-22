"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "~/server/better-auth/client";
import { SupplementSheetProvider } from "~/components/supplements/supplement-sheet";
import { TimezoneSync } from "~/components/timezone-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
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
      <SupplementSheetProvider>{children}</SupplementSheetProvider>
    </AuthUIProvider>
  );
}
