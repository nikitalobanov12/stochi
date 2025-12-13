import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Layers, AlertTriangle, Zap, Clock, ChevronRight } from "lucide-react";

import { db } from "~/server/db";
import { stack, log, supplement } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { logStack } from "~/server/actions/stacks";
import { createLog } from "~/server/actions/logs";
import { checkInteractions, type InteractionWarning } from "~/server/actions/interactions";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { WelcomeFlow } from "~/components/onboarding/welcome-flow";
import { CommandBar } from "~/components/log/command-bar";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [userStacks, todayLogs, allSupplements] = await Promise.all([
    db.query.stack.findMany({
      where: eq(stack.userId, session.user.id),
      with: {
        items: {
          with: {
            supplement: true,
          },
        },
      },
      orderBy: [desc(stack.updatedAt)],
      limit: 5,
    }),
    db.query.log.findMany({
      where: eq(log.userId, session.user.id),
      with: {
        supplement: true,
      },
      orderBy: [desc(log.loggedAt)],
    }),
    db.query.supplement.findMany({
      columns: {
        id: true,
        name: true,
        form: true,
        defaultUnit: true,
      },
      orderBy: [supplement.name],
    }),
  ]);

  // Filter to today's logs
  const todaysLogs = todayLogs.filter(
    (l) => new Date(l.loggedAt) >= todayStart,
  );

  // Get interactions for today's supplements
  const todaySupplementIds = [...new Set(todaysLogs.map((l) => l.supplement.id))];
  const interactions = await checkInteractions(todaySupplementIds);
  const warnings = interactions.filter((i) => i.type !== "synergy");
  const synergies = interactions.filter((i) => i.type === "synergy");

  // Check if user needs onboarding (no stacks)
  const needsOnboarding = userStacks.length === 0;

  return (
    <>
      <WelcomeFlow open={needsOnboarding} supplements={allSupplements} />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-mono text-2xl font-bold">
            Hey, {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {todaysLogs.length === 0
              ? "Nothing logged yet today"
              : `${todaysLogs.length} supplement${todaysLogs.length !== 1 ? "s" : ""} logged today`}
          </p>
        </div>

        {/* Quick Log Input */}
        <div className="rounded-lg border bg-card p-4">
          <DashboardCommandBar supplements={allSupplements} />
        </div>

        {/* Stack Quick Actions */}
        {userStacks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-medium text-muted-foreground">
                Log Stack
              </h2>
              <Button variant="ghost" size="sm" asChild className="h-auto py-1 text-xs">
                <Link href="/dashboard/stacks">
                  Manage
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {userStacks.map((s) => (
                <form key={s.id} action={logStack.bind(null, s.id)}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="font-mono"
                    disabled={s.items.length === 0}
                  >
                    <Layers className="mr-1.5 h-3 w-3" />
                    {s.name}
                    <Badge variant="secondary" className="ml-2 font-mono text-[10px]">
                      {s.items.length}
                    </Badge>
                  </Button>
                </form>
              ))}
            </div>
          </div>
        )}

        {/* Today's Activity & Interactions */}
        {todaysLogs.length > 0 && (
          <div className="space-y-4">
            {/* Interactions Alert */}
            {(warnings.length > 0 || synergies.length > 0) && (
              <div className="space-y-2">
                {warnings.map((warning) => (
                  <InteractionCard key={warning.id} interaction={warning} />
                ))}
                {synergies.map((synergy) => (
                  <InteractionCard key={synergy.id} interaction={synergy} />
                ))}
              </div>
            )}

            {/* Today's Log */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-sm font-medium text-muted-foreground">
                  Today
                </h2>
                <Button variant="ghost" size="sm" asChild className="h-auto py-1 text-xs">
                  <Link href="/dashboard/log">
                    View all
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="rounded-lg border bg-card">
                {todaysLogs.slice(0, 8).map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      i !== 0 ? "border-t" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatTime(new Date(entry.loggedAt))}
                      </span>
                      <span className="text-sm font-medium">
                        {entry.supplement.name}
                      </span>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">
                      {entry.dosage}{entry.unit}
                    </span>
                  </div>
                ))}
                {todaysLogs.length > 8 && (
                  <div className="border-t px-4 py-2 text-center">
                    <Link
                      href="/dashboard/log"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      +{todaysLogs.length - 8} more
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {todaysLogs.length === 0 && userStacks.length > 0 && (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Log your first supplement of the day
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the search above or tap a stack button
            </p>
          </div>
        )}

        {/* No Stacks State */}
        {userStacks.length === 0 && !needsOnboarding && (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No stacks configured
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/dashboard/stacks">Create a Stack</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function InteractionCard({ interaction }: { interaction: InteractionWarning }) {
  const isSynergy = interaction.type === "synergy";

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        isSynergy
          ? "border-green-500/30 bg-green-500/5"
          : interaction.severity === "critical"
            ? "border-destructive/30 bg-destructive/5"
            : "border-yellow-500/30 bg-yellow-500/5"
      }`}
    >
      {isSynergy ? (
        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <AlertTriangle
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            interaction.severity === "critical"
              ? "text-destructive"
              : "text-yellow-500"
          }`}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {interaction.source.name}
          </span>
          <span className="text-muted-foreground">
            {isSynergy ? "+" : "→"}
          </span>
          <span className="text-sm font-medium">
            {interaction.target.name}
          </span>
          <Badge
            variant="secondary"
            className={`ml-auto text-[10px] ${
              isSynergy
                ? "bg-green-500/10 text-green-600"
                : interaction.severity === "critical"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-yellow-500/10 text-yellow-600"
            }`}
          >
            {isSynergy ? "synergy" : interaction.severity}
          </Badge>
        </div>
        {interaction.mechanism && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {interaction.mechanism}
          </p>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function DashboardCommandBar({
  supplements,
}: {
  supplements: Array<{ id: string; name: string; form: string | null }>;
}) {
  async function handleLog(
    supplementId: string,
    dosage: number,
    unit: "mg" | "mcg" | "g" | "IU" | "ml",
  ) {
    "use server";
    await createLog(supplementId, dosage, unit);
  }

  return <CommandBar supplements={supplements} onLog={handleLog} />;
}
