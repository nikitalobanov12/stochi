"use client";

import Link from "next/link";
import { useDemoContext } from "~/components/demo/demo-provider";
import { Button } from "~/components/ui/button";
import { Layers, Loader2 } from "lucide-react";
import { useTransition } from "react";

export default function DemoStacksPage() {
  const demo = useDemoContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stacks</h1>
          <p className="text-muted-foreground text-sm">
            Your supplement bundles
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="opacity-50"
          title="Creating stacks is disabled in demo mode"
        >
          + New Stack
        </Button>
      </div>

      <div className="space-y-3">
        {demo.stacks.map((stack) => {
          const completion = demo.stackCompletion.find(
            (sc) => sc.stackId === stack.id,
          );
          return (
            <DemoStackCard
              key={stack.id}
              stack={stack}
              isComplete={completion?.isComplete ?? false}
            />
          );
        })}
      </div>

      {demo.stacks.length === 0 && (
        <div className="glass-card border-dashed py-12 text-center">
          <Layers className="text-muted-foreground/30 mx-auto mb-3 h-8 w-8" />
          <p className="text-muted-foreground font-mono text-sm">
            No stacks created
          </p>
        </div>
      )}
    </div>
  );
}

function DemoStackCard({
  stack,
  isComplete,
}: {
  stack: { id: string; name: string; items: Array<{ supplement: { name: string }; dosage: number; unit: string }> };
  isComplete: boolean;
}) {
  const demo = useDemoContext();
  const [isPending, startTransition] = useTransition();

  function handleLogStack() {
    startTransition(() => {
      demo.logStack(stack.id);
    });
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div>
          <Link
            href={`/demo/stacks/${stack.id}`}
            className="font-medium transition-colors hover:text-cyan-300"
          >
            {stack.name}
          </Link>
          <p className="text-muted-foreground text-xs">
            {stack.items.length} supplements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs"
          >
            <Link href={`/demo/stacks/${stack.id}`}>Details</Link>
          </Button>
          <Button
            size="sm"
            variant={isComplete ? "outline" : "default"}
            disabled={isPending || isComplete}
            onClick={handleLogStack}
            className={
              isComplete
                ? "border-emerald-500/30 text-emerald-400"
                : "bg-gradient-to-r from-emerald-500 to-cyan-500"
            }
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isComplete ? (
              "Logged Today"
            ) : (
              "Log Stack"
            )}
          </Button>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {stack.items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span className="text-white/80">{item.supplement.name}</span>
            <span className="font-mono text-[#00D4FF]/70">
              {item.dosage}
              {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
