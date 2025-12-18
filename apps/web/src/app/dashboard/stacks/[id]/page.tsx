import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Trash2,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from "lucide-react";

import { db } from "~/server/db";
import { stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import {
  updateStack,
  deleteStack,
  addStackItems,
  removeStackItem,
  logStack,
} from "~/server/actions/stacks";
import {
  checkInteractions,
  type InteractionWarning,
  type RatioWarning,
} from "~/server/actions/interactions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AddSupplementsDialog } from "~/components/stacks/add-supplements-dialog";
import {
  InteractionCard,
  RatioCard,
} from "~/components/interactions/interaction-card";

export default async function StackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const userStack = await db.query.stack.findFirst({
    where: and(eq(stack.id, id), eq(stack.userId, session.user.id)),
    with: {
      items: {
        with: {
          supplement: true,
        },
      },
    },
  });

  if (!userStack) {
    notFound();
  }

  const allSupplements = await db.query.supplement.findMany({
    orderBy: (s, { asc }) => [asc(s.name)],
  });

  // Check for interactions in this stack (with dosages for ratio checking)
  const supplementIds = userStack.items.map((item) => item.supplementId);
  const supplementsWithDosage = userStack.items.map((item) => ({
    id: item.supplementId,
    dosage: item.dosage,
    unit: item.unit,
  }));
  const { interactions, ratioWarnings } = await checkInteractions(
    supplementIds,
    supplementsWithDosage,
  );
  const warnings = interactions.filter((i) => i.type !== "synergy");
  const synergies = interactions.filter((i) => i.type === "synergy");

  const logStackWithId = logStack.bind(null, userStack.id);
  const deleteStackWithId = deleteStack.bind(null, userStack.id);
  const updateStackWithId = updateStack.bind(null, userStack.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/stacks"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Protocol
          </p>
          <h1 className="font-mono text-lg font-medium">{userStack.name}</h1>
        </div>
        <form action={logStackWithId}>
          <Button
            type="submit"
            size="sm"
            disabled={userStack.items.length === 0}
            className="h-8 gap-1.5 font-mono text-xs"
          >
            <Play className="h-3 w-3" />
            Log All
          </Button>
        </form>
      </div>

      {/* Supplements Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Compounds ({userStack.items.length})
          </p>
          <AddSupplementsDialog
            stackId={userStack.id}
            supplements={allSupplements}
            addStackItems={addStackItems}
          />
        </div>

        <div className="rounded-lg border border-border/40 bg-card/30">
          {userStack.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                No compounds added
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Add supplements to build your protocol
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {userStack.items.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-center gap-3 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">
                      {item.supplement.name}
                    </p>
                    {item.supplement.form && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.supplement.form}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {item.dosage}
                    {item.unit}
                  </span>
                  <form action={removeStackItem.bind(null, item.id)}>
                    <button
                      type="submit"
                      className="p-1 text-muted-foreground/50 opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
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
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Settings
        </p>
        <div className="rounded-lg border border-border/40 bg-card/30 p-3">
          <form action={updateStackWithId} className="flex gap-2">
            <div className="flex-1">
              <label
                htmlFor="stack-name"
                className="sr-only"
              >
                Protocol Name
              </label>
              <Input
                id="stack-name"
                name="name"
                defaultValue={userStack.name}
                placeholder="Protocol name"
                className="h-8 border-border/40 bg-transparent font-mono text-sm"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-8 font-mono text-xs"
            >
              Rename
            </Button>
          </form>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-destructive/70">
          Danger Zone
        </p>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <form action={deleteStackWithId} className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              Permanently delete this protocol
            </p>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 font-mono text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </form>
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
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Interactions
        </p>
        <div className="rounded-lg border border-border/40 bg-card/30 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-mono text-xs text-muted-foreground">
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
        : "border-border/40";

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
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

      <div className={`rounded-lg border ${borderClass} bg-card/30 p-3`}>
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
