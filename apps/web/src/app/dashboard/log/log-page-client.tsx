"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  LogProvider,
  useLogContext,
  type LogEntry,
  type StackItem,
} from "~/components/log/log-context";
import { SafeCommandBar } from "~/components/log/safe-command-bar";
import { InteractionHeadsUp } from "~/components/dashboard/interaction-heads-up";
import { formatTime, formatRelativeDate } from "~/lib/utils";
import type {
  InteractionWarning,
  RatioWarning,
  TimingWarning,
} from "~/server/actions/interactions";

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: string | null;
};

type UserStack = {
  id: string;
  name: string;
  items: StackItem[];
};

type LogPageClientProps = {
  todayLogs: LogEntry[];
  recentLogs: LogEntry[];
  allSupplements: Supplement[];
  userStacks: UserStack[];
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
  initialCommand: string | null;
};

export function LogPageClient({
  todayLogs,
  recentLogs,
  allSupplements,
  userStacks,
  interactions,
  ratioWarnings,
  timingWarnings,
  initialCommand,
}: LogPageClientProps) {
  return (
    <LogProvider initialLogs={todayLogs}>
      <LogPageContent
        recentLogs={recentLogs}
        allSupplements={allSupplements}
        userStacks={userStacks}
        interactions={interactions}
        ratioWarnings={ratioWarnings}
        timingWarnings={timingWarnings}
        initialCommand={initialCommand}
      />
    </LogProvider>
  );
}

function LogPageContent({
  recentLogs,
  allSupplements,
  userStacks,
  interactions,
  ratioWarnings,
  timingWarnings,
  initialCommand,
}: Omit<LogPageClientProps, "todayLogs">) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    logs: todayLogs,
    deleteLogOptimistic,
    logStackOptimistic,
  } = useLogContext();
  const [loggingStackId, setLoggingStackId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialCommand) {
      return;
    }

    const currentParams = new URLSearchParams(searchParams.toString());
    if (!currentParams.has("coachCommand")) {
      return;
    }

    currentParams.delete("coachCommand");
    const nextQuery = currentParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [initialCommand, pathname, router, searchParams]);

  async function handleLogStack(stack: UserStack) {
    if (stack.items.length === 0) return;

    setLoggingStackId(stack.id);
    try {
      const result = await logStackOptimistic(stack.id, stack.items);
      if (result.success) {
        toast.success(`Logged ${stack.name}`);
      }
    } finally {
      setLoggingStackId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-lg font-medium tracking-tight">Log</h1>
        <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
          {todayLogs.length === 0
            ? "NO ENTRIES TODAY"
            : `${todayLogs.length} LOG${todayLogs.length !== 1 ? "S" : ""} TODAY`}
        </p>
      </div>

      {/* Interaction HUD - PRIMARY FEATURE at top */}
      {todayLogs.length > 0 && (
        <InteractionHeadsUp
          interactions={interactions}
          ratioWarnings={ratioWarnings}
          timingWarnings={timingWarnings}
        />
      )}

      {/* Command Bar */}
      <div className="glass-card p-3">
        {initialCommand && (
          <div className="mb-2 rounded-md border border-cyan-400/25 bg-cyan-500/10 px-3 py-2">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-cyan-200 uppercase">
              <Sparkles className="h-3 w-3" />
              Coach prep loaded
            </p>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              Command prefilled:{" "}
              <span className="text-foreground">{initialCommand}</span>
            </p>
          </div>
        )}
        <SafeCommandBar
          supplements={allSupplements}
          initialInput={initialCommand ?? undefined}
          isCoachPrimed={!!initialCommand}
        />
      </div>

      {/* Quick Log Stacks */}
      {userStacks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
            Quick Log
          </h2>
          <div className="flex flex-wrap gap-2">
            {userStacks.map((s) => {
              const isLogging = loggingStackId === s.id;
              return (
                <Button
                  key={s.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/[0.02] font-mono text-xs hover:border-white/20 hover:bg-white/[0.04]"
                  disabled={s.items.length === 0 || isLogging}
                  onClick={() => handleLogStack(s)}
                >
                  {isLogging && (
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  )}
                  {s.name}
                  <Badge
                    variant="secondary"
                    className="bg-muted/50 ml-2 font-mono text-[10px] tabular-nums"
                  >
                    {s.items.length}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Logs */}
      <div className="space-y-3">
        <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
          Today&apos;s Activity
        </h2>
        {todayLogs.length === 0 ? (
          <div className="glass-card border-dashed py-12 text-center">
            <p className="text-muted-foreground font-mono text-xs">
              No logs yet today
            </p>
            <p className="text-muted-foreground/60 mt-1 font-mono text-[10px]">
              Use command bar or tap a protocol
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {todayLogs.map((entry) => (
              <div
                key={entry.id}
                className="group glass-card flex items-center justify-between px-3 py-2 transition-colors"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-muted-foreground/60 shrink-0 font-mono text-[10px] tabular-nums">
                    {formatTime(new Date(entry.loggedAt))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm">
                      {entry.supplement.name}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {entry.dosage}
                    {entry.unit}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteLogOptimistic(entry)}
                    className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent History */}
      <div className="space-y-3">
        <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
          History
        </h2>
        <RecentLogsGrouped logs={recentLogs} />
      </div>
    </div>
  );
}

function RecentLogsGrouped({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="glass-card border-dashed py-8 text-center">
        <p className="text-muted-foreground font-mono text-xs">
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
    {} as Record<string, LogEntry[]>,
  );

  return (
    <div className="max-h-[400px] space-y-4 overflow-y-auto">
      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date}>
          <h4 className="text-muted-foreground/60 mb-2 font-mono text-[10px] tracking-wider uppercase">
            {date}
          </h4>
          <div className="space-y-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="glass-card flex items-center justify-between px-3 py-1.5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-muted-foreground/40 shrink-0 font-mono text-[10px] tabular-nums">
                    {formatTime(new Date(entry.loggedAt))}
                  </span>
                  <span className="text-muted-foreground truncate font-mono text-xs">
                    {entry.supplement.name}
                  </span>
                </div>
                <span className="text-muted-foreground/60 shrink-0 font-mono text-[10px] tabular-nums">
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
