"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type { LogEntry, StackItem } from "~/components/log/log-context";
import type { SafetyCheckResult } from "~/server/services/safety";

// ============================================================================
// Types (same interface as real LogContext)
// ============================================================================

type DemoLogContextValue = {
  logs: LogEntry[];
  isPending: boolean;
  createLogOptimistic: (
    options: {
      supplementId: string;
      dosage: number;
      unit: string;
      loggedAt?: Date;
    },
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
  deleteLogOptimistic: (entry: LogEntry) => void;
  logStackOptimistic: (
    stackId: string,
    items: StackItem[],
    loggedAt?: Date,
  ) => Promise<{ success: boolean }>;
};

// ============================================================================
// Context
// ============================================================================

const DemoLogContext = createContext<DemoLogContextValue | null>(null);

export function useDemoLogContext() {
  const context = useContext(DemoLogContext);
  if (!context) {
    throw new Error("useDemoLogContext must be used within a DemoLogProvider");
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

type DemoLogProviderProps = {
  children: ReactNode;
  initialLogs: LogEntry[];
  onLogsChange?: (logs: LogEntry[]) => void;
};

export function DemoLogProvider({
  children,
  initialLogs,
  onLogsChange,
}: DemoLogProviderProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [isPending, setIsPending] = useState(false);

  const _updateLogs = useCallback(
    (newLogs: LogEntry[]) => {
      setLogs(newLogs);
      onLogsChange?.(newLogs);
    },
    [onLogsChange],
  );

  const createLogOptimistic: DemoLogContextValue["createLogOptimistic"] =
    useCallback(
      async (options, supplementData) => {
        setIsPending(true);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 150));

        const newLog: LogEntry = {
          id: `demo-log-${Date.now()}`,
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

        setLogs((prev) => {
          const newLogs = [newLog, ...prev].sort(
            (a, b) =>
              new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
          );
          onLogsChange?.(newLogs);
          return newLogs;
        });

        setIsPending(false);
        toast.success(`Logged ${supplementData.name}`, {
          description: "Demo mode - data not saved",
        });

        return { success: true };
      },
      [onLogsChange],
    );

  const deleteLogOptimistic: DemoLogContextValue["deleteLogOptimistic"] =
    useCallback(
      (entry) => {
        setIsPending(true);

        setTimeout(() => {
          setLogs((prev) => {
            const newLogs = prev.filter((l) => l.id !== entry.id);
            onLogsChange?.(newLogs);
            return newLogs;
          });
          setIsPending(false);
          toast.success(`Removed ${entry.supplement.name}`, {
            description: "Demo mode - data not saved",
          });
        }, 100);
      },
      [onLogsChange],
    );

  const logStackOptimistic: DemoLogContextValue["logStackOptimistic"] =
    useCallback(
      async (stackId, items, loggedAt) => {
        setIsPending(true);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const now = loggedAt ?? new Date();
        const newLogs: LogEntry[] = items.map((item, index) => ({
          id: `demo-log-${Date.now()}-${index}`,
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

        setLogs((prev) => {
          const combined = [...newLogs, ...prev].sort(
            (a, b) =>
              new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
          );
          onLogsChange?.(combined);
          return combined;
        });

        setIsPending(false);
        toast.success(`Logged ${items.length} supplements`, {
          description: "Demo mode - data not saved",
        });

        return { success: true };
      },
      [onLogsChange],
    );

  return (
    <DemoLogContext.Provider
      value={{
        logs,
        isPending,
        createLogOptimistic,
        deleteLogOptimistic,
        logStackOptimistic,
      }}
    >
      {children}
    </DemoLogContext.Provider>
  );
}
