"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "~/server/better-auth/client";

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
      {children}
    </AuthUIProvider>
  );
}
