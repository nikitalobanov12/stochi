import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Layers, Clock, ChevronRight } from "lucide-react";

import { db } from "~/server/db";
import { stack, log, supplement } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { logStack } from "~/server/actions/stacks";
import { createLog } from "~/server/actions/logs";
import { checkInteractions } from "~/server/actions/interactions";
import { getGoalProgress } from "~/server/actions/goals";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { WelcomeFlow } from "~/components/onboarding/welcome-flow";
import { CommandBar } from "~/components/log/command-bar";
import { TodayLogList } from "~/components/log/today-log-list";
import { InteractionCard } from "~/components/interactions/interaction-card";
import { GoalProgressCard } from "~/components/dashboard/goal-progress-card";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [userStacks, todayLogs, allSupplements, goalProgress] = await Promise.all([
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
    getGoalProgress(),
  ]);

  // Filter to today's logs
  const todaysLogs = todayLogs.filter(
    (l) => new Date(l.loggedAt) >= todayStart,
  );

  // Get interactions for today's supplements
  const todaySupplementIds = [...new Set(todaysLogs.map((l) => l.supplement.id))];
  const { interactions } = await checkInteractions(todaySupplementIds);
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
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            Hey, {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {todaysLogs.length === 0
              ? "Nothing logged yet today"
              : `${todaysLogs.length} supplement${todaysLogs.length !== 1 ? "s" : ""} logged today`}
          </p>
        </div>

        {/* Goal Progress - Only show if user has stacks (not during onboarding) */}
        {userStacks.length > 0 && <GoalProgressCard progress={goalProgress} />}

        {/* Quick Log Input */}
        <div className="rounded-xl border border-border bg-card p-4">
          <DashboardCommandBar supplements={allSupplements} />
        </div>

        {/* Stack Quick Actions */}
        {userStacks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Quick Log
              </h2>
              <Button variant="ghost" size="sm" asChild className="h-auto py-1 text-xs text-muted-foreground hover:text-foreground">
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
                    className="font-mono text-xs"
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Today
                </h2>
                <Button variant="ghost" size="sm" asChild className="h-auto py-1 text-xs text-muted-foreground hover:text-foreground">
                  <Link href="/dashboard/log">
                    View all
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <TodayLogList logs={todaysLogs} maxVisible={8} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {todaysLogs.length === 0 && userStacks.length > 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-12 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="font-mono text-sm text-muted-foreground">
              Log your first supplement of the day
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Use the search above or tap a stack button
            </p>
          </div>
        )}

        {/* No Stacks State */}
        {userStacks.length === 0 && !needsOnboarding && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-12 text-center">
            <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="font-mono text-sm text-muted-foreground">
              No stacks configured
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 font-mono">
              <Link href="/dashboard/stacks">Create a Stack</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
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
