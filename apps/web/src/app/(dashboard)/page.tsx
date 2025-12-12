import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Layers, PlusCircle, Activity, AlertTriangle } from "lucide-react";

import { db } from "~/server/db";
import { stack, log } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { logStack } from "~/server/actions/stacks";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const userStacks = await db.query.stack.findMany({
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
  });

  const recentLogs = await db.query.log.findMany({
    where: eq(log.userId, session.user.id),
    with: {
      supplement: true,
    },
    orderBy: [desc(log.loggedAt)],
    limit: 10,
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLogs = recentLogs.filter(
    (l) => new Date(l.loggedAt) >= todayStart,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {session.user.name.split(" ")[0]}
          </p>
        </div>
        <Button asChild>
          <Link href="/log">
            <PlusCircle className="mr-2 h-4 w-4" />
            Quick Log
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{todayLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              supplements logged today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stacks</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{userStacks.length}</div>
            <p className="text-xs text-muted-foreground">
              configured stack bundles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">0</div>
            <p className="text-xs text-muted-foreground">
              warnings detected
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono">Quick Actions</CardTitle>
            </div>
            <CardDescription>
              Log your stacks with one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userStacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layers className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="mb-4 text-sm text-muted-foreground">
                  No stacks configured yet
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/stacks">Create your first stack</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {userStacks.map((s) => (
                  <QuickStackButton key={s.id} stack={s} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono">Recent Activity</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/log">View all</Link>
              </Button>
            </div>
            <CardDescription>Your latest supplement logs</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="mb-4 text-sm text-muted-foreground">
                  No logs yet
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/log">Log your first supplement</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.slice(0, 5).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium">{l.supplement.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {l.dosage}
                        {l.unit}
                      </span>
                    </div>
                    <time className="text-xs text-muted-foreground font-mono">
                      {formatRelativeTime(l.loggedAt)}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickStackButton({
  stack,
}: {
  stack: {
    id: string;
    name: string;
    items: Array<{
      supplement: { name: string };
      dosage: number;
      unit: string;
    }>;
  };
}) {
  const logStackWithId = logStack.bind(null, stack.id);

  return (
    <form action={logStackWithId}>
      <Button
        type="submit"
        variant="outline"
        className="w-full justify-between"
        disabled={stack.items.length === 0}
      >
        <span className="font-mono">{stack.name}</span>
        <Badge variant="secondary" className="font-mono">
          {stack.items.length} items
        </Badge>
      </Button>
    </form>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
}
