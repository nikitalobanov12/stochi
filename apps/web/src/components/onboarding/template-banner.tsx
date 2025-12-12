"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";

import { forkStack, clearTemplateData } from "~/server/actions/onboarding";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type TemplateBannerProps = {
  stackId: string;
  stackName: string;
  className?: string;
};

export function TemplateBanner({ stackId, stackName, className }: TemplateBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleFork() {
    startTransition(async () => {
      const result = await forkStack(stackId);
      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleClear() {
    startTransition(async () => {
      const result = await clearTemplateData(stackId);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed border-yellow-500/50 bg-yellow-500/5 px-4 py-3 sm:flex-row sm:items-center",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="font-mono text-muted-foreground">
          Viewing <span className="text-foreground">{stackName}</span> template.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFork}
          disabled={isPending}
          className="font-mono text-xs"
        >
          {isPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : null}
          Fork Stack
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={isPending}
          className="font-mono text-xs text-muted-foreground hover:text-destructive"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
