import { db } from "~/server/db";
import { log, stack } from "~/server/db/schema";
import { getSession } from "~/server/better-auth/server";
import { eq, desc } from "drizzle-orm";
import { Trash2, Clock, Zap, Terminal, AlertTriangle, CheckCircle2 } from "lucide-react";

import { createLog, deleteLog } from "~/server/actions/logs";
import { logStack } from "~/server/actions/stacks";
import { checkInteractions, checkTimingWarnings, type InteractionWarning, type TimingWarning } from "~/server/actions/interactions";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { CommandBar } from "~/components/log/command-bar";
import {
  SeverityBadge,
  getWarningBackgroundClass,
  getWarningBorderClass,
} from "~/components/interactions/severity-badge";
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

  // Check interactions for today's logged supplements
  const todaySupplementIds = [...new Set(todaysLogs.map((l) => l.supplement.id))];
  const todayInteractions = await checkInteractions(todaySupplementIds);
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
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold">Log</h1>
        <p className="text-sm text-muted-foreground">
          Track your supplement intake
        </p>
      </div>

      {/* Quick Entry Command Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-base">
            <Terminal className="h-4 w-4" />
            Quick Entry
          </CardTitle>
          <CardDescription>
            Type supplement name and dosage for fast logging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommandBarWrapper supplements={allSupplements} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Log from Stacks */}
          {userStacks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono text-base">
                  <Zap className="h-4 w-4" />
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
                        <Badge variant="secondary" className="ml-2">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-base">
                <Clock className="h-4 w-4" />
                Today&apos;s Log
              </CardTitle>
              <CardDescription>
                {todaysLogs.length} entries today
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Supplement</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaysLogs.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-muted-foreground">
                          {formatTime(new Date(entry.loggedAt))}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {entry.supplement.name}
                          </div>
                          {entry.supplement.form && (
                            <div className="text-xs text-muted-foreground">
                              {entry.supplement.form}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono">
                          {entry.dosage}
                          {entry.unit}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Interactions */}
          <TodayInteractionsCard warnings={warnings} synergies={synergies} timingWarnings={timingWarnings} />

          {/* Recent History */}
          <Card>
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

function CommandBarWrapper({
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
                className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(new Date(entry.loggedAt))}
                  </span>
                  <span>{entry.supplement.name}</span>
                </div>
                <span className="font-mono text-xs">
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
}: {
  warnings: InteractionWarning[];
  synergies: InteractionWarning[];
  timingWarnings: TimingWarning[];
}) {
  const hasInteractions = warnings.length > 0 || synergies.length > 0 || timingWarnings.length > 0;
  const criticalCount = warnings.filter((w) => w.severity === "critical").length +
    timingWarnings.filter((w) => w.severity === "critical").length;
  const mediumCount = warnings.filter((w) => w.severity === "medium").length +
    timingWarnings.filter((w) => w.severity === "medium").length;
  const totalWarnings = warnings.length + timingWarnings.length;

  return (
    <Card className={getWarningBorderClass(criticalCount, mediumCount)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-base">
          {!hasInteractions ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : totalWarnings > 0 ? (
            <AlertTriangle className={`h-4 w-4 ${
              criticalCount > 0 ? "text-destructive" : "text-yellow-500"
            }`} />
          ) : (
            <Zap className="h-4 w-4 text-green-500" />
          )}
          Today&apos;s Interactions
        </CardTitle>
        {hasInteractions && (
          <CardDescription>
            {totalWarnings > 0 && `${totalWarnings} warning${totalWarnings > 1 ? "s" : ""}`}
            {totalWarnings > 0 && synergies.length > 0 && ", "}
            {synergies.length > 0 && `${synergies.length} synerg${synergies.length > 1 ? "ies" : "y"}`}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {!hasInteractions ? (
          <p className="text-sm text-muted-foreground">
            No interactions detected in today&apos;s logs.
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {/* Timing Warnings */}
            {timingWarnings.map((warning) => (
              <div
                key={warning.id}
                className={`rounded-md p-2 text-xs ${getWarningBackgroundClass(warning.severity)}`}
              >
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={warning.severity} />
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    timing
                  </span>
                </div>
                <p className="mt-1">
                  <span className="font-medium">{warning.source.name}</span>
                  {" ↔ "}
                  <span className="font-medium">{warning.target.name}</span>
                  <span className="ml-2 font-mono text-muted-foreground">
                    ({warning.actualHoursApart}h apart, need {warning.minHoursApart}h+)
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                  {warning.reason}
                </p>
              </div>
            ))}

            {warnings.map((warning) => (
              <div
                key={warning.id}
                className={`rounded-md p-2 text-xs ${getWarningBackgroundClass(warning.severity)}`}
              >
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={warning.severity} />
                </div>
                <p className="mt-1">
                  <span className="font-medium">{warning.source.name}</span>
                  {" → "}
                  <span className="font-medium">{warning.target.name}</span>
                </p>
                {warning.mechanism && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                    {warning.mechanism}
                  </p>
                )}
              </div>
            ))}

            {synergies.map((synergy) => (
              <div
                key={synergy.id}
                className="rounded-md bg-green-500/10 p-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-600 text-[10px]">
                    synergy
                  </Badge>
                </div>
                <p className="mt-1">
                  <span className="font-medium">{synergy.source.name}</span>
                  {" + "}
                  <span className="font-medium">{synergy.target.name}</span>
                </p>
                {synergy.mechanism && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                    {synergy.mechanism}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
