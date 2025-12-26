"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "~/components/ui/button";

export function BackToDashboardButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleBack() {
    startTransition(() => {
      router.push("/dashboard");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ArrowLeft className="mr-2 h-4 w-4" />
      )}
      Back to Dashboard
    </Button>
  );
}
