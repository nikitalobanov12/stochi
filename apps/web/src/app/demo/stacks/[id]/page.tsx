"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  FlaskConical,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useTransition } from "react";
import { useDemoContext } from "~/components/demo/demo-provider";
import { Button } from "~/components/ui/button";

export default function DemoStackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const demo = useDemoContext();
  const [isPending, startTransition] = useTransition();

  const stack = demo.stacks.find((s) => s.id === id);
  const completion = demo.stackCompletion.find((sc) => sc.stackId === id);

  if (!stack) {
    return (
      <div className="space-y-4">
        <Link
          href="/demo/stacks"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Stacks
        </Link>
        <div className="glass-card py-12 text-center">
          <p className="text-muted-foreground font-mono text-sm">
            Stack not found
          </p>
        </div>
      </div>
    );
  }

  // Filter interactions relevant to this stack
  const stackSupplementIds = new Set(
    stack.items.map((item) => item.supplementId),
  );
  const relevantInteractions = demo.interactions.filter(
    (int) =>
      stackSupplementIds.has(int.source.id) &&
      stackSupplementIds.has(int.target.id),
  );
  const relevantRatioWarnings = demo.ratioWarnings.filter(
    (rw) =>
      stackSupplementIds.has(rw.source.id) &&
      stackSupplementIds.has(rw.target.id),
  );

  const synergies = relevantInteractions.filter((i) => i.type === "synergy");
  const warnings = relevantInteractions.filter((i) => i.type !== "synergy");

  function handleLogStack() {
    startTransition(() => {
      demo.logStack(stack!.id);
    });
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/demo/stacks"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs transition-colors"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Stacks
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{stack.name}</h1>
          <p className="text-muted-foreground text-sm">
            {stack.items.length} supplements
          </p>
        </div>
        <Button
          size="sm"
          variant={completion?.isComplete ? "outline" : "default"}
          disabled={isPending || completion?.isComplete}
          onClick={handleLogStack}
          className={
            completion?.isComplete
              ? "border-emerald-500/30 text-emerald-400"
              : "bg-gradient-to-r from-emerald-500 to-cyan-500"
          }
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : completion?.isComplete ? (
            "Logged Today"
          ) : (
            "Log Stack"
          )}
        </Button>
      </div>

      {/* Stack Items */}
      <div>
        <h2 className="text-muted-foreground mb-3 font-mono text-[10px] uppercase tracking-wider">
          Supplements
        </h2>
        <div className="glass-card divide-y divide-white/5">
          {stack.items.map((item) => (
            <div
              key={item.supplementId}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <FlaskConical className="h-4 w-4 text-cyan-400/50" />
                <div>
                  <p className="text-sm font-medium text-white/90">
                    {item.supplement.name}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {item.supplement.form}
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm text-cyan-400/70">
                {item.dosage}
                {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interaction Analysis */}
      {(warnings.length > 0 ||
        synergies.length > 0 ||
        relevantRatioWarnings.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
            Interaction Analysis
          </h2>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning) => (
                <div
                  key={warning.id}
                  className="glass-card border-l-2 border-l-amber-500/50 p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                        warning.severity === "critical"
                          ? "bg-red-500/10 text-red-400"
                          : warning.severity === "medium"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-white/5 text-white/50"
                      }`}
                    >
                      {warning.severity}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] uppercase text-white/40">
                      {warning.type}
                    </span>
                  </div>
                  <p className="text-sm text-white/80">
                    <span className="text-cyan-300">{warning.source.name}</span>
                    {" -> "}
                    <span className="text-cyan-300">{warning.target.name}</span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {warning.mechanism}
                  </p>
                  {warning.suggestion && (
                    <p className="mt-2 text-xs text-emerald-400/80">
                      Tip: {warning.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Synergies */}
          {synergies.length > 0 && (
            <div className="space-y-2">
              {synergies.map((synergy) => (
                <div
                  key={synergy.id}
                  className="glass-card border-l-2 border-l-emerald-500/50 p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-emerald-400">
                      synergy
                    </span>
                  </div>
                  <p className="text-sm text-white/80">
                    <span className="text-cyan-300">{synergy.source.name}</span>
                    {" + "}
                    <span className="text-cyan-300">{synergy.target.name}</span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {synergy.mechanism}
                  </p>
                  {synergy.suggestion && (
                    <p className="mt-2 text-xs text-emerald-400/80">
                      {synergy.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ratio Warnings */}
          {relevantRatioWarnings.length > 0 && (
            <div className="space-y-2">
              {relevantRatioWarnings.map((rw) => (
                <div
                  key={rw.id}
                  className="glass-card border-l-2 border-l-violet-500/50 p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                        rw.severity === "critical"
                          ? "bg-red-500/10 text-red-400"
                          : rw.severity === "medium"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-white/5 text-white/50"
                      }`}
                    >
                      {rw.severity}
                    </span>
                    <span className="rounded bg-violet-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-violet-400">
                      ratio
                    </span>
                  </div>
                  <p className="text-sm text-white/80">
                    <span className="text-cyan-300">{rw.source.name}</span>
                    {" : "}
                    <span className="text-cyan-300">{rw.target.name}</span>
                    <span className="text-muted-foreground ml-2 font-mono text-xs">
                      {rw.currentRatio}:1
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {rw.message}
                  </p>
                  {rw.optimalRatio && (
                    <p className="mt-1 font-mono text-[11px] text-violet-400/60">
                      Optimal: {rw.optimalRatio}:1 (range {rw.minRatio}-
                      {rw.maxRatio}:1)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No interactions state */}
      {warnings.length === 0 &&
        synergies.length === 0 &&
        relevantRatioWarnings.length === 0 && (
          <div className="glass-card border-dashed py-8 text-center">
            <p className="text-muted-foreground font-mono text-xs">
              No interactions detected between supplements in this stack
            </p>
          </div>
        )}
    </div>
  );
}
