"use client";

import { useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { deleteLog } from "~/server/actions/logs";

type LogEntry = {
  id: string;
  loggedAt: Date;
  dosage: number;
  unit: string;
  supplement: {
    id: string;
    name: string;
  };
};

type TodayLogListProps = {
  logs: LogEntry[];
  maxVisible?: number;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteLog(entry.id);
        toast.success(`Removed ${entry.supplement.name} from log`);
      } catch {
        toast.error("Failed to delete log");
      }
    });
  }

  return (
    <div
      className={`group flex items-center justify-between px-4 py-2.5 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {formatTime(new Date(entry.loggedAt))}
        </span>
        <span className="text-sm font-medium">{entry.supplement.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">
          {entry.dosage}
          {entry.unit}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleDelete}
          disabled={isPending}
          title="Remove log"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function TodayLogList({ logs, maxVisible = 8 }: TodayLogListProps) {
  const visibleLogs = logs.slice(0, maxVisible);
  const remainingCount = logs.length - maxVisible;

  return (
    <div className="rounded-lg border bg-card">
      {visibleLogs.map((entry, i) => (
        <div key={entry.id} className={i !== 0 ? "border-t" : ""}>
          <LogRow entry={entry} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="border-t px-4 py-2 text-center">
          <Link
            href="/dashboard/log"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            +{remainingCount} more
          </Link>
        </div>
      )}
    </div>
  );
}
