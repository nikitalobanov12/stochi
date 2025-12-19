import { db } from "~/server/db";
import { log, stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { eq, desc } from "drizzle-orm";
import { Trash2 } from "lucide-react";

import { deleteLog } from "~/server/actions/logs";
import { logStack } from "~/server/actions/stacks";
import {
  checkInteractions,
  checkTimingWarnings,
  type TimingWarning,
} from "~/server/actions/interactions";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { SafeCommandBar } from "~/components/log/safe-command-bar";
import { InteractionHeadsUp } from "~/components/dashboard/interaction-heads-up";
import { formatTime, formatRelativeDate } from "~/lib/utils";

export default async function LogPage() {
  const session = await getSession();
  if (!session) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [allSupplements, userStacks, recentLogs] = await Promise.all([
    db.query.supplement.findMany({
      orderBy: (s, { asc }) => [asc(s.name)],
    }),
    db.query.stack.findMany({
      where: eq(stack.userId, session.user.id),
      with: {
        items: {
          with: {
            supplement: true,
          },
        },
      },
      orderBy: (s, { desc }) => [desc(s.updatedAt)],
    }),
    db.query.log.findMany({
      where: eq(log.userId, session.user.id),
      with: {
        supplement: true,
      },
      orderBy: [desc(log.loggedAt)],
      limit: 50,
    }),
  ]);

  const todaysLogs = recentLogs.filter((l) => new Date(l.loggedAt) >= today);

  // Build dosage data for ratio calculations
  const dosageMap = new Map<
    string,
    { id: string; dosage: number; unit: string }
  >();
  for (const l of todaysLogs) {
    dosageMap.set(l.supplement.id, {
      id: l.supplement.id,
      dosage: l.dosage,
      unit: l.unit,
    });
  }
  const dosages = Array.from(dosageMap.values());

  // Check interactions for today's logged supplements (with dosages for ratio checking)
  const todaySupplementIds = [
    ...new Set(todaysLogs.map((l) => l.supplement.id)),
  ];
  const { interactions, ratioWarnings } = await checkInteractions(
    todaySupplementIds,
    dosages
  );

  // Check timing warnings for today's logs
  const timingWarningsPromises = todaysLogs.map((logEntry) =>
    checkTimingWarnings(
      session.user.id,
      logEntry.supplement.id,
      new Date(logEntry.loggedAt)
    )
  );
  const timingWarningsArrays = await Promise.all(timingWarningsPromises);

  // Flatten and dedupe timing warnings (same pair might be flagged from both sides)
  const timingWarningsMap = new Map<string, TimingWarning>();
  for (const warningsArr of timingWarningsArrays) {
    for (const warning of warningsArr) {
      const key = [warning.source.id, warning.target.id].sort().join("-");
      if (!timingWarningsMap.has(key)) {
        timingWarningsMap.set(key, warning);
      }
    }
  }
  const timingWarnings = Array.from(timingWarningsMap.values());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-lg font-medium tracking-tight">Log</h1>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {todaysLogs.length === 0
            ? "NO ENTRIES TODAY"
            : `${todaysLogs.length} LOG${todaysLogs.length !== 1 ? "S" : ""} TODAY`}
        </p>
      </div>

      {/* Interaction HUD - PRIMARY FEATURE at top */}
      {todaysLogs.length > 0 && (
        <InteractionHeadsUp
          interactions={interactions}
          ratioWarnings={ratioWarnings}
          timingWarnings={timingWarnings}
        />
      )}

      {/* Command Bar */}
      <div className="rounded-lg border border-border/40 bg-card/30 p-3">
        <SafeCommandBar supplements={allSupplements} />
      </div>

      {/* Quick Log Stacks */}
      {userStacks.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Quick Log
          </h2>
          <div className="flex flex-wrap gap-2">
            {userStacks.map((s) => (
              <form key={s.id} action={logStack.bind(null, s.id)}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="border-border/40 bg-card/30 font-mono text-xs hover:border-border/60 hover:bg-card/50"
                  disabled={s.items.length === 0}
                >
                  {s.name}
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-muted/50 font-mono text-[10px] tabular-nums"
                  >
                    {s.items.length}
                  </Badge>
                </Button>
              </form>
            ))}
          </div>
        </div>
      )}

      {/* Today's Logs */}
      <div className="space-y-3">
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Today&apos;s Activity
        </h2>
        {todaysLogs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/40 bg-card/30 py-12 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              No logs yet today
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
              Use command bar or tap a protocol
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {todaysLogs.map((entry) => (
              <div
                key={entry.id}
                className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2 transition-colors hover:border-border/60"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                    {formatTime(new Date(entry.loggedAt))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm">
                      {entry.supplement.name}
                    </span>
                    {entry.supplement.form && (
                      <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">
                        {entry.supplement.form}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {entry.dosage}
                    {entry.unit}
                  </span>
                  <form action={deleteLog.bind(null, entry.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive/70 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent History */}
      <div className="space-y-3">
        <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          History
        </h2>
        <RecentLogsGrouped logs={recentLogs} />
      </div>
    </div>
  );
}

type LogEntry = {
  id: string;
  loggedAt: Date;
  dosage: number;
  unit: "mg" | "mcg" | "g" | "IU" | "ml";
  supplement: {
    id: string;
    name: string;
    form: string | null;
  };
};

function RecentLogsGrouped({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/40 bg-card/30 py-8 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          No recent logs
        </p>
      </div>
    );
  }

  const grouped = logs.reduce(
    (acc, entry) => {
      const date = formatRelativeDate(new Date(entry.loggedAt));
      acc[date] ??= [];
      acc[date].push(entry);
      return acc;
    },
    {} as Record<string, LogEntry[]>
  );

  return (
    <div className="max-h-[400px] space-y-4 overflow-y-auto">
      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date}>
          <h4 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {date}
          </h4>
          <div className="space-y-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-border/20 bg-card/20 px-3 py-1.5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/40">
                    {formatTime(new Date(entry.loggedAt))}
                  </span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {entry.supplement.name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                  {entry.dosage}
                  {entry.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
