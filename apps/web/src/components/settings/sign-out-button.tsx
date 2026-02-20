"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { authClient } from "~/server/better-auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="text-muted-foreground hover:text-foreground w-full justify-start gap-2 border-white/10"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
