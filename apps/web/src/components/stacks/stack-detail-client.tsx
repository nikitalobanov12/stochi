"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Trash2,
  AlertTriangle,
  Zap,
  CheckCircle2,
  FlaskConical,
  Syringe,
  Loader2,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AddSupplementsDialog } from "~/components/stacks/add-supplements-dialog";
import { EditStackItemDialog } from "~/components/stacks/edit-stack-item-dialog";
import {
  InteractionCard,
  RatioCard,
} from "~/components/interactions/interaction-card";
import {
  useStackItemsContext,
  type StackItemEntry,
} from "~/components/stacks/stack-items-context";
import { logStack, updateStack, deleteStack } from "~/server/actions/stacks";
import type {
  InteractionWarning,
  RatioWarning,
} from "~/server/actions/interactions";

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: string | null;
  isResearchChemical?: boolean | null;
  route?: string | null;
};

type StackDetailClientProps = {
  stack: {
    id: string;
    name: string;
  };
  supplements: Supplement[];
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
};

export function StackDetailClient({
  stack,
  supplements,
  interactions,
  ratioWarnings,
}: StackDetailClientProps) {
  const router = useRouter();
  const { items, removeItemOptimistic, isPending } = useStackItemsContext();

  // Loading states for different actions
  const [isNavigatingBack, startBackTransition] = useTransition();
  const [isLoggingAll, startLogTransition] = useTransition();
  const [isRenaming, startRenameTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const warnings = interactions.filter((i) => i.type !== "synergy");
  const synergies = interactions.filter((i) => i.type === "synergy");

  function handleBack(e: React.MouseEvent) {
    e.preventDefault();
    startBackTransition(() => {
      router.push("/dashboard/stacks");
    });
  }

  function handleLogAll() {
    startLogTransition(async () => {
      await logStack(stack.id);
    });
  }

  function handleRename(formData: FormData) {
    startRenameTransition(async () => {
      await updateStack(stack.id, formData);
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteStack(stack.id);
    });
  }

  function handleRemoveItem(item: StackItemEntry) {
    removeItemOptimistic(item);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={isNavigatingBack}
          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isNavigatingBack ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1">
          <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
            Protocol
          </p>
          <h1 className="font-mono text-lg font-medium">{stack.name}</h1>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={items.length === 0 || isLoggingAll}
          onClick={handleLogAll}
          className="h-8 gap-1.5 font-mono text-xs"
        >
          {isLoggingAll ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {isLoggingAll ? "Logging..." : "Log All"}
        </Button>
      </div>

      {/* Supplements Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
            Compounds ({items.length})
          </p>
          <AddSupplementsDialog
            stackId={stack.id}
            supplements={supplements}
          />
        </div>

        <div className="glass-card">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground font-mono text-sm">
                No compounds added
              </p>
              <p className="text-muted-foreground/60 mt-1 text-[10px] tracking-wider uppercase">
                Add supplements to build your protocol
              </p>
            </div>
          ) : (
            <ul className="divide-border/40 divide-y">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-center gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-mono text-sm">
                        {item.supplement.name}
                      </p>
                      {item.supplement.isResearchChemical && (
                        <FlaskConical className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      )}
                      {item.supplement.route &&
                        item.supplement.route !== "oral" && (
                          <Syringe className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                        )}
                    </div>
                    {item.supplement.form && (
                      <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                        {item.supplement.form}
                      </p>
                    )}
                  </div>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {item.dosage}
                    {item.unit}
                  </span>
                  <EditStackItemDialog
                    itemId={item.id}
                    supplementName={item.supplement.name}
                    currentDosage={item.dosage}
                    currentUnit={item.unit as "mg" | "mcg" | "g" | "IU" | "ml"}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    disabled={isPending}
                    className="text-muted-foreground/50 hover:text-destructive p-1 opacity-0 transition-all group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Interactions Panel */}
      <InteractionsPanel
        warnings={warnings}
        synergies={synergies}
        ratioWarnings={ratioWarnings}
      />

      {/* Settings Section */}
      <section className="space-y-3">
        <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Settings
        </p>
        <div className="glass-card p-3">
          <form action={handleRename} className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="stack-name" className="sr-only">
                Protocol Name
              </label>
              <Input
                id="stack-name"
                name="name"
                defaultValue={stack.name}
                placeholder="Protocol name"
                disabled={isRenaming}
                className="border-border/40 h-8 bg-transparent font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isRenaming}
              className="h-8 gap-1.5 font-mono text-xs"
            >
              {isRenaming && <Loader2 className="h-3 w-3 animate-spin" />}
              {isRenaming ? "Saving..." : "Rename"}
            </Button>
          </form>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3">
        <p className="text-destructive/70 text-[10px] tracking-wider uppercase">
          Danger Zone
        </p>
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground font-mono text-xs">
              Permanently delete this protocol
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-7 gap-1.5 font-mono text-xs"
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InteractionsPanel({
  warnings,
  synergies,
  ratioWarnings,
}: {
  warnings: InteractionWarning[];
  synergies: InteractionWarning[];
  ratioWarnings: RatioWarning[];
}) {
  const hasInteractions =
    warnings.length > 0 || synergies.length > 0 || ratioWarnings.length > 0;
  const criticalCount =
    warnings.filter((w) => w.severity === "critical").length +
    ratioWarnings.filter((w) => w.severity === "critical").length;
  const mediumCount =
    warnings.filter((w) => w.severity === "medium").length +
    ratioWarnings.filter((w) => w.severity === "medium").length;

  if (!hasInteractions) {
    return (
      <section className="space-y-3">
        <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Interactions
        </p>
        <div className="glass-card p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground font-mono text-xs">
              No interactions detected
            </span>
          </div>
        </div>
      </section>
    );
  }

  const borderClass =
    criticalCount > 0
      ? "border-destructive/50"
      : mediumCount > 0
        ? "border-amber-500/50"
        : "border-white/10";

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Interactions
        </p>
        {warnings.length + ratioWarnings.length > 0 && (
          <span
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
              criticalCount > 0
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-500"
            }`}
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            {warnings.length + ratioWarnings.length}
          </span>
        )}
        {synergies.length > 0 && (
          <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
            <Zap className="h-2.5 w-2.5" />
            {synergies.length}
          </span>
        )}
      </div>

      <div className={`glass-card ${borderClass} p-3`}>
        <div className="space-y-2">
          {/* Ratio Warnings */}
          {ratioWarnings.map((warning) => (
            <RatioCard key={warning.id} warning={warning} />
          ))}

          {/* Interaction Warnings */}
          {warnings.map((warning) => (
            <InteractionCard key={warning.id} interaction={warning} />
          ))}

          {/* Synergies */}
          {synergies.map((synergy) => (
            <InteractionCard key={synergy.id} interaction={synergy} />
          ))}
        </div>
      </div>
    </section>
  );
}
