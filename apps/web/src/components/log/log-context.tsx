"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteLog, createLog, type CreateLogOptions } from "~/server/actions/logs";
import { logStack } from "~/server/actions/stacks";
import { retryWithBackoff } from "~/lib/retry";

// ============================================================================
// Types
// ============================================================================

export type LogEntry = {
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

export type StackItem = {
  supplementId: string;
  dosage: number;
  unit: string;
  supplement: {
    id: string;
    name: string;
    isResearchChemical?: boolean;
    route?: string | null;
    form?: string | null;
  };
};

type OptimisticAction =
  | { type: "add"; log: LogEntry }
  | { type: "remove"; id: string }
  | { type: "add_many"; logs: LogEntry[] };

type LogContextValue = {
  /** Current logs (including optimistic entries) */
  logs: LogEntry[];
  /** Whether a mutation is in progress */
  isPending: boolean;
  /** Add a single log entry optimistically, then persist to server */
  createLogOptimistic: (
    options: CreateLogOptions,
    supplementData: {
      name: string;
      isResearchChemical?: boolean;
      route?: string | null;
      category?: string | null;
    },
  ) => Promise<{ success: boolean; needsSafetyCheck?: boolean }>;
  /** Remove a log entry optimistically, then delete from server */
  deleteLogOptimistic: (entry: LogEntry) => void;
  /** Log an entire stack optimistically */
  logStackOptimistic: (stackId: string, items: StackItem[]) => void;
};

// ============================================================================
// Context
// ============================================================================

const LogContext = createContext<LogContextValue | null>(null);

export function useLogContext() {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error("useLogContext must be used within a LogProvider");
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

type LogProviderProps = {
  children: ReactNode;
  initialLogs: LogEntry[];
};

function optimisticReducer(
  state: LogEntry[],
  action: OptimisticAction,
): LogEntry[] {
  switch (action.type) {
    case "add":
      // Insert at beginning, sorted by loggedAt desc
      return [action.log, ...state].sort(
        (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
      );
    case "remove":
      return state.filter((log) => log.id !== action.id);
    case "add_many":
      // Insert all at beginning, sorted by loggedAt desc
      return [...action.logs, ...state].sort(
        (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
      );
    default:
      return state;
  }
}

export function LogProvider({ children, initialLogs }: LogProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticLogs, dispatchOptimistic] = useOptimistic(
    initialLogs,
    optimisticReducer,
  );

  const createLogOptimistic: LogContextValue["createLogOptimistic"] = (
    options,
    supplementData,
  ) => {
    const optimisticEntry: LogEntry = {
      id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      loggedAt: options.loggedAt ?? new Date(),
      dosage: options.dosage,
      unit: options.unit,
      supplement: {
        id: options.supplementId,
        name: supplementData.name,
        isResearchChemical: supplementData.isResearchChemical,
        route: supplementData.route,
        category: supplementData.category,
      },
    };

    // Return a promise that resolves when the server action completes
    return new Promise<{ success: boolean; needsSafetyCheck?: boolean }>((resolve) => {
      startTransition(async () => {
        // Optimistic update - show immediately (must be inside startTransition)
        dispatchOptimistic({ type: "add", log: optimisticEntry });

        // Persist to server
        const result = await createLog(options);

        if (!result.success) {
          // Safety check failed - let the caller handle the warning dialog
          // Don't rollback yet - user might override
          resolve({ success: false, needsSafetyCheck: true });
          return;
        }

        toast.success(`Logged ${supplementData.name}`);
        resolve({ success: true });
      });
    });
  };

  const deleteLogOptimistic: LogContextValue["deleteLogOptimistic"] = (entry) => {
    startTransition(async () => {
      // Optimistic update - remove immediately (must be inside startTransition)
      dispatchOptimistic({ type: "remove", id: entry.id });

      const result = await retryWithBackoff(() => deleteLog(entry.id));

      if (!result.success) {
        toast.error(`Failed to remove ${entry.supplement.name}`);
        // Sync with server to restore the entry
        router.refresh();
      } else {
        toast.success(`Removed ${entry.supplement.name}`);
      }
    });
  };

  const logStackOptimistic: LogContextValue["logStackOptimistic"] = (
    stackId,
    items,
  ) => {
    const now = new Date();

    // Create optimistic entries for all items in the stack
    const optimisticLogs: LogEntry[] = items.map((item) => ({
      id: `optimistic-stack-${stackId}-${item.supplementId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      loggedAt: now,
      dosage: item.dosage,
      unit: item.unit,
      supplement: {
        id: item.supplement.id,
        name: item.supplement.name,
        isResearchChemical: item.supplement.isResearchChemical,
        route: item.supplement.route,
        category: null,
      },
    }));

    startTransition(async () => {
      // Optimistic update - show all entries immediately (must be inside startTransition)
      dispatchOptimistic({ type: "add_many", logs: optimisticLogs });

      const result = await retryWithBackoff(() => logStack(stackId));

      if (!result.success) {
        toast.error("Failed to log stack");
        // Sync with server to remove optimistic entries
        router.refresh();
      }
      // Success toast is handled by the LogStackButton component
    });
  };

  return (
    <LogContext.Provider
      value={{
        logs: optimisticLogs,
        isPending,
        createLogOptimistic,
        deleteLogOptimistic,
        logStackOptimistic,
      }}
    >
      {children}
    </LogContext.Provider>
  );
}
