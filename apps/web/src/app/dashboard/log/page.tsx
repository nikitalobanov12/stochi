import { db } from "~/server/db";
import { log, stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { eq, desc } from "drizzle-orm";
import { Trash2, Clock, Zap, Terminal, AlertTriangle, CheckCircle2 } from "lucide-react";

import { deleteLog } from "~/server/actions/logs";
import { logStack } from "~/server/actions/stacks";
import { checkInteractions, checkTimingWarnings, type InteractionWarning, type TimingWarning, type RatioWarning } from "~/server/actions/interactions";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { SafeCommandBar } from "~/components/log/safe-command-bar";
import { getWarningBorderClass } from "~/components/interactions/severity-badge";
import { InteractionCard, TimingCard, RatioCard } from "~/components/interactions/interaction-card";
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
  const dosageMap = new Map<string, { id: string; dosage: number; unit: string }>();
  for (const l of todaysLogs) {
    dosageMap.set(l.supplement.id, { id: l.supplement.id, dosage: l.dosage, unit: l.unit });
  }
  const dosages = Array.from(dosageMap.values());

  // Check interactions for today's logged supplements (with dosages for ratio checking)
  const todaySupplementIds = [...new Set(todaysLogs.map((l) => l.supplement.id))];
  const { interactions: todayInteractions, ratioWarnings } = await checkInteractions(todaySupplementIds, dosages);
  const warnings = todayInteractions.filter((i) => i.type !== "synergy");
  const synergies = todayInteractions.filter((i) => i.type === "synergy");

  // Check timing warnings for today's logs
  const timingWarningsPromises = todaysLogs.map((logEntry) =>
    checkTimingWarnings(session.user.id, logEntry.supplement.id, new Date(logEntry.loggedAt))
  );
  const timingWarningsArrays = await Promise.all(timingWarningsPromises);
  // Flatten and dedupe timing warnings (same pair might be flagged from both sides)
  const timingWarningsMap = new Map<string, TimingWarning>();
  for (const warnings of timingWarningsArrays) {
    for (const warning of warnings) {
      const key = [warning.source.id, warning.target.id].sort().join("-");
      if (!timingWarningsMap.has(key)) {
        timingWarningsMap.set(key, warning);
      }
    }
  }
  const timingWarnings = Array.from(timingWarningsMap.values());

  return (
    <div className="space-y-6 overflow-hidden">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight">Log</h1>
        <p className="text-sm text-muted-foreground">
          Track your supplement intake
        </p>
      </div>

      {/* Quick Entry Command Bar */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-base">
            <Terminal className="h-4 w-4 text-primary" />
            Quick Entry
          </CardTitle>
          <CardDescription>
            Type supplement name and dosage for fast logging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SafeCommandBar supplements={allSupplements} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Log from Stacks */}
          {userStacks.length > 0 && (
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono text-base">
                  <Zap className="h-4 w-4 text-primary" />
                  Quick Log Stacks
                </CardTitle>
                <CardDescription>
                  One-click logging for your stacks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userStacks.map((s) => (
                    <form key={s.id} action={logStack.bind(null, s.id)}>
                      <Button
                        type="submit"
                        variant="outline"
                        className="font-mono"
                        disabled={s.items.length === 0}
                      >
                        {s.name}
                        <Badge variant="secondary" className="ml-2 tabular-nums">
                          {s.items.length}
                        </Badge>
                      </Button>
                    </form>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Logs */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Today&apos;s Log
              </CardTitle>
              <CardDescription>
                <span className="tabular-nums">{todaysLogs.length}</span> entries today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todaysLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No logs yet today</p>
                  <p className="mt-1 text-sm">
                    Log a stack or supplement to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaysLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatTime(new Date(entry.loggedAt))}
                          </span>
                          <span className="truncate font-medium">
                            {entry.supplement.name}
                          </span>
                        </div>
                        {entry.supplement.form && (
                          <div className="text-xs text-muted-foreground">
                            {entry.supplement.form}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-sm">
                          {entry.dosage}
                          {entry.unit}
                        </span>
                        <form action={deleteLog.bind(null, entry.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Interactions */}
          <TodayInteractionsCard warnings={warnings} synergies={synergies} timingWarnings={timingWarnings} ratioWarnings={ratioWarnings} />

          {/* Recent History */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="font-mono text-base">
                Recent History
              </CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              <RecentLogsGrouped logs={recentLogs} />
            </CardContent>
          </Card>
        </div>
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
      <div className="py-8 text-center text-muted-foreground">
        <p>No recent logs</p>
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
    {} as Record<string, LogEntry[]>,
  );

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date}>
          <h4 className="mb-2 font-mono text-xs font-medium text-muted-foreground">
            {date}
          </h4>
          <div className="space-y-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {formatTime(new Date(entry.loggedAt))}
                  </span>
                  <span className="truncate">{entry.supplement.name}</span>
                </div>
                <span className="shrink-0 font-mono text-xs">
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

function TodayInteractionsCard({
  warnings,
  synergies,
  timingWarnings,
  ratioWarnings,
}: {
  warnings: InteractionWarning[];
  synergies: InteractionWarning[];
  timingWarnings: TimingWarning[];
  ratioWarnings: RatioWarning[];
}) {
  const hasInteractions = warnings.length > 0 || synergies.length > 0 || timingWarnings.length > 0 || ratioWarnings.length > 0;
  const criticalCount = warnings.filter((w) => w.severity === "critical").length +
    timingWarnings.filter((w) => w.severity === "critical").length +
    ratioWarnings.filter((w) => w.severity === "critical").length;
  const mediumCount = warnings.filter((w) => w.severity === "medium").length +
    timingWarnings.filter((w) => w.severity === "medium").length +
    ratioWarnings.filter((w) => w.severity === "medium").length;
  const totalWarnings = warnings.length + timingWarnings.length + ratioWarnings.length;

  return (
    <Card className={`rounded-xl ${getWarningBorderClass(criticalCount, mediumCount)}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-base">
          {!hasInteractions ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : totalWarnings > 0 ? (
            <AlertTriangle className={`h-4 w-4 ${
              criticalCount > 0 ? "text-destructive" : "text-yellow-500"
            }`} />
          ) : (
            <Zap className="h-4 w-4 text-primary" />
          )}
          Today&apos;s Interactions
        </CardTitle>
        {hasInteractions && (
          <CardDescription>
            {totalWarnings > 0 && `${totalWarnings} warning${totalWarnings > 1 ? "s" : ""}`}
            {totalWarnings > 0 && synergies.length > 0 && ", "}
            {synergies.length > 0 && `${synergies.length} synerg${synergies.length > 1 ? "ies" : "y"}`}
            {hasInteractions && " • tap to expand"}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {!hasInteractions ? (
          <p className="text-sm text-muted-foreground">
            No interactions detected in today&apos;s logs.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {/* Timing Warnings */}
            {timingWarnings.map((warning) => (
              <TimingCard key={warning.id} warning={warning} />
            ))}

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
        )}
      </CardContent>
    </Card>
  );
}
