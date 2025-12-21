"use client";

import { useTransition } from "react";
import Link from "next/link";
import { X, FlaskConical, Syringe } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { deleteLog } from "~/server/actions/logs";
import { formatTime } from "~/lib/utils";

type LogEntry = {
  id: string;
  loggedAt: Date;
  dosage: number;
  unit: string;
  supplement: {
    id: string;
    name: string;
    isResearchChemical?: boolean;
    route?: string | null;
    category?: string | null;
  };
};

type TodayLogListProps = {
  logs: LogEntry[];
  maxVisible?: number;
};

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
        {/* Timestamps use Cyan (--chart-2) for neutral info display */}
        <span className="font-mono text-xs text-[#00D4FF]">
          {formatTime(new Date(entry.loggedAt))}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{entry.supplement.name}</span>
          {entry.supplement.isResearchChemical && (
            <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
          )}
          {entry.supplement.route && entry.supplement.route !== "oral" && (
            <Syringe className="h-3.5 w-3.5 text-violet-400" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Dosage values use Cyan for neutral data display */}
        <span className="font-mono text-sm text-[#00D4FF]/80">
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
    <div className="rounded-xl border border-white/10 bg-[#0A0A0A]">
      {visibleLogs.map((entry, i) => (
        <div key={entry.id} className={i !== 0 ? "border-t border-white/5" : ""}>
          <LogRow entry={entry} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="border-t border-white/5 px-4 py-2 text-center">
          <Link
            href="/dashboard/log"
            className="text-xs text-white/40 hover:text-white/60"
          >
            +{remainingCount} more
          </Link>
        </div>
      )}
    </div>
  );
}
