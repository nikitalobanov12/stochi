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

import { deleteLog, createLog, type CreateLogOptions, type CreateLogResult } from "~/server/actions/logs";
import { logStack } from "~/server/actions/stacks";
import { retryWithBackoff } from "~/lib/retry";
import type { SafetyCheckResult } from "~/server/services/safety";

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
  ) => Promise<{
    success: boolean;
    needsSafetyCheck?: boolean;
    safetyCheck?: SafetyCheckResult;
  }>;
  /** Remove a log entry optimistically, then delete from server */
  deleteLogOptimistic: (entry: LogEntry) => void;
  /** Log an entire stack optimistically, returns success status */
  logStackOptimistic: (
    stackId: string,
    items: StackItem[],
  ) => Promise<{ success: boolean }>;
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
    case "add": {
      // Use binary search for O(log n) insertion instead of O(n log n) sort
      const newTime = new Date(action.log.loggedAt).getTime();
      // Find insertion point (logs are sorted desc by loggedAt)
      let low = 0;
      let high = state.length;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (new Date(state[mid]!.loggedAt).getTime() > newTime) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return [...state.slice(0, low), action.log, ...state.slice(low)];
    }
    case "remove":
      return state.filter((log) => log.id !== action.id);
    case "add_many": {
      // For multiple additions, sort once is more efficient
      return [...action.logs, ...state].sort(
        (a, b) =>
          new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
      );
    }
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
      id: crypto.randomUUID(),
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
    return new Promise<{
      success: boolean;
      needsSafetyCheck?: boolean;
      safetyCheck?: SafetyCheckResult;
    }>((resolve) => {
      startTransition(async () => {
        // Optimistic update - show immediately (must be inside startTransition)
        dispatchOptimistic({ type: "add", log: optimisticEntry });

        // Persist to server
        const result: CreateLogResult = await createLog(options);

        if (!result.success) {
          // Safety check failed - return the safety data for the caller to handle
          resolve({
            success: false,
            needsSafetyCheck: true,
            safetyCheck: result.safetyCheck,
          });
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
      id: crypto.randomUUID(),
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

    return new Promise<{ success: boolean }>((resolve) => {
      startTransition(async () => {
        // Optimistic update - show all entries immediately (must be inside startTransition)
        dispatchOptimistic({ type: "add_many", logs: optimisticLogs });

        const result = await retryWithBackoff(() => logStack(stackId));

        if (!result.success) {
          toast.error("Failed to log stack");
          // Sync with server to remove optimistic entries
          router.refresh();
          resolve({ success: false });
        } else {
          resolve({ success: true });
        }
      });
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
