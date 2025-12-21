"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { X, FlaskConical, Syringe, Clock, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { deleteLog, updateLogTime } from "~/server/actions/logs";
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

/**
 * Format a Date to HH:MM for input[type="time"] value
 */
function formatTimeForInput(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Parse HH:MM input value and combine with original date
 */
function parseTimeInput(timeValue: string, originalDate: Date): Date {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const newDate = new Date(originalDate);
  newDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return newDate;
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [isPending, startTransition] = useTransition();
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState(() =>
    formatTimeForInput(new Date(entry.loggedAt)),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingTime && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTime]);

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

  function handleTimeClick() {
    setTimeValue(formatTimeForInput(new Date(entry.loggedAt)));
    setIsEditingTime(true);
  }

  function handleTimeCancel() {
    setIsEditingTime(false);
    setTimeValue(formatTimeForInput(new Date(entry.loggedAt)));
  }

  function handleTimeSave() {
    const newDate = parseTimeInput(timeValue, new Date(entry.loggedAt));
    const originalDate = new Date(entry.loggedAt);

    // Don't save if time hasn't changed
    if (
      newDate.getHours() === originalDate.getHours() &&
      newDate.getMinutes() === originalDate.getMinutes()
    ) {
      setIsEditingTime(false);
      return;
    }

    startTransition(async () => {
      try {
        await updateLogTime(entry.id, newDate);
        toast.success(`Updated time for ${entry.supplement.name}`);
        setIsEditingTime(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update time",
        );
        // Reset to original value on error
        setTimeValue(formatTimeForInput(originalDate));
      }
    });
  }

  function handleTimeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTimeSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleTimeCancel();
    }
  }

  return (
    <div
      className={`group flex items-center justify-between px-4 py-2.5 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Editable timestamp */}
        {isEditingTime ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              onKeyDown={handleTimeKeyDown}
              onBlur={handleTimeSave}
              className="h-6 w-20 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 font-mono text-xs text-[#00D4FF] focus:border-emerald-500 focus:outline-none"
              disabled={isPending}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleTimeSave}
              disabled={isPending}
            >
              <Check className="h-3 w-3 text-emerald-500" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleTimeClick}
            className="group/time flex items-center gap-1 rounded px-1 py-0.5 font-mono text-xs text-[#00D4FF] transition-colors hover:bg-white/5"
            title="Click to edit time"
          >
            <Clock className="h-3 w-3 opacity-0 transition-opacity group-hover/time:opacity-60" />
            {formatTime(new Date(entry.loggedAt))}
          </button>
        )}
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
