"use client";

import { X, FlaskConical, Syringe } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { useDemoContext } from "~/components/demo/demo-provider";
import { formatTime } from "~/lib/utils";
import type { LogEntry } from "~/components/log/log-context";

type DemoLogListProps = {
  maxVisible?: number;
};

function DemoLogRow({ entry }: { entry: LogEntry }) {
  const demo = useDemoContext();

  function handleDelete() {
    demo.removeLog(entry.id);
  }

  return (
    <div className="group flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3">
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
        <span className="font-mono text-sm text-[#00D4FF]/80">
          {entry.dosage}
          {entry.unit}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleDelete}
          title="Remove log"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function DemoLogList({ maxVisible = 8 }: DemoLogListProps) {
  const demo = useDemoContext();
  const visibleLogs = demo.logs.slice(0, maxVisible);
  const remainingCount = demo.logs.length - maxVisible;

  if (visibleLogs.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-8 text-center">
        <p className="text-muted-foreground text-sm">No logs yet</p>
        <p className="text-muted-foreground/60 mt-1 text-xs">
          Use the command bar above to log supplements
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0A0A0A]">
      {visibleLogs.map((entry, i) => (
        <div
          key={entry.id}
          className={i !== 0 ? "border-t border-white/5" : ""}
        >
          <DemoLogRow entry={entry} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="border-t border-white/5 px-4 py-2 text-center">
          <Link
            href="/demo/log"
            className="text-xs text-white/40 hover:text-white/60"
          >
            +{remainingCount} more
          </Link>
        </div>
      )}
    </div>
  );
}
