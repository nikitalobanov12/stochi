import { eq, desc, asc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Layers, ChevronRight, Upload } from "lucide-react";

import { db } from "~/server/db";
import { stack, userGoal } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { createStack } from "~/server/actions/stacks";
import { createStackFromTemplate } from "~/server/actions/onboarding";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CreateStackDialog } from "~/components/stacks/create-stack-dialog";
import { ImportStackDialog } from "~/components/stacks/import-stack-dialog";
import { LogStackButton } from "~/components/stacks/log-stack-button";
import { StackTimingBadge } from "~/components/stacks/stack-timing-badge";
import { RecommendedProtocols } from "~/components/stacks/recommended-protocols";
import { formatRelativeTime } from "~/lib/utils";
import { type GoalKey } from "~/server/data/goal-recommendations";

export default async function StacksPage() {
  const session = await getSession();
  if (!session) return null;

  // Fetch stacks and user goals in parallel
  const [userStacks, userGoals] = await Promise.all([
    db.query.stack.findMany({
      where: eq(stack.userId, session.user.id),
      with: {
        items: {
          with: {
            supplement: {
              columns: {
                id: true,
                name: true,
                optimalTimeOfDay: true,
              },
            },
          },
        },
      },
      orderBy: [desc(stack.lastLoggedAt), desc(stack.updatedAt)],
    }),
    db.query.userGoal.findMany({
      where: eq(userGoal.userId, session.user.id),
      orderBy: [asc(userGoal.priority)],
    }),
  ]);

  const goalKeys = userGoals.map((g) => g.goal as GoalKey);
  const existingStackNames = userStacks.map((s) => s.name);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-medium tracking-tight">
            Protocols
          </h1>
          <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            {userStacks.length === 0
              ? "NO PROTOCOLS"
              : `${userStacks.length} PROTOCOL${userStacks.length !== 1 ? "S" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportStackDialog />
          <CreateStackDialog
            createStack={createStack}
            createStackFromTemplate={createStackFromTemplate}
          />
        </div>
      </div>

      {/* Active Stacks Section */}
      <section className="space-y-3">
        {userStacks.length > 0 && (
          <h2 className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            Your Protocols
          </h2>
        )}

        {userStacks.length === 0 ? (
          <div className="glass-card border-dashed py-16 text-center">
            <Layers className="text-muted-foreground/50 mx-auto mb-4 h-10 w-10" />
            <p className="text-muted-foreground font-mono text-sm">
              No protocols yet
            </p>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              Create your first protocol or import from another app
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <ImportStackDialog>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/40 font-mono text-xs"
                >
                  <Upload className="mr-2 h-3 w-3" />
                  Import
                </Button>
              </ImportStackDialog>
              <CreateStackDialog
                createStack={createStack}
                createStackFromTemplate={createStackFromTemplate}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/40 font-mono text-xs"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Create Protocol
                </Button>
              </CreateStackDialog>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {userStacks.map((s) => (
              <div
                key={s.id}
                className="group glass-card flex items-center justify-between px-4 py-3 transition-colors"
              >
                {/* Left side - Stack info (clickable link) */}
                <Link
                  href={`/dashboard/stacks/${s.id}`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-medium">
                      {s.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-muted/50 font-mono text-xs tabular-nums"
                    >
                      {s.items.length}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {/* Timing badge */}
                    <StackTimingBadge items={s.items} />

                    {/* Supplements preview */}
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {s.items.length === 0
                        ? "Empty protocol"
                        : s.items
                            .slice(0, 3)
                            .map((item) => item.supplement.name)
                            .join(" • ") + (s.items.length > 3 ? " ..." : "")}
                    </p>
                  </div>
                </Link>

                {/* Right side - Actions */}
                <div className="flex shrink-0 items-center gap-3">
                  {/* Last logged indicator */}
                  <span className="text-muted-foreground font-mono text-xs">
                    {s.lastLoggedAt
                      ? formatRelativeTime(new Date(s.lastLoggedAt))
                      : "Never logged"}
                  </span>

                  {/* Log button */}
                  <LogStackButton stackId={s.id} itemCount={s.items.length} />

                  {/* Navigate arrow */}
                  <Link href={`/dashboard/stacks/${s.id}`}>
                    <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Protocols Section */}
      <RecommendedProtocols
        userGoals={goalKeys}
        existingStackNames={existingStackNames}
        createStackFromTemplate={createStackFromTemplate}
      />
    </div>
  );
}
