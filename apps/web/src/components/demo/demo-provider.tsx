"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  generateDemoData,
  DEMO_SUPPLEMENTS,
  DEMO_STACKS,
  type DemoSupplement,
  type DemoStack,
} from "./demo-data";
import type { LogEntry } from "~/components/log/log-context";
import type {
  InteractionWarning,
  RatioWarning,
  TimingWarning,
} from "~/server/actions/interactions";
import type {
  BiologicalState,
  TimelineDataPoint,
} from "~/server/services/biological-state";
import type { StackCompletionStatus } from "~/server/services/analytics";
import type { SafetyHeadroom } from "~/components/dashboard/micro-kpi-row";

// ============================================================================
// Types
// ============================================================================

type DemoContextValue = {
  // Data
  supplements: DemoSupplement[];
  stacks: DemoStack[];
  logs: LogEntry[];
  interactions: InteractionWarning[];
  ratioWarnings: RatioWarning[];
  timingWarnings: TimingWarning[];
  biologicalState: BiologicalState;
  timelineData: TimelineDataPoint[];
  stackCompletion: StackCompletionStatus[];
  safetyHeadroom: SafetyHeadroom[];
  streak: number;
  lastLogAt: Date | null;

  // Actions
  addLog: (
    supplementId: string,
    dosage: number,
    unit: string,
    supplementData: { name: string; category?: string | null },
  ) => void;
  removeLog: (logId: string) => void;
  logStack: (stackId: string) => void;
  
  // State
  isPending: boolean;
  isDemo: true;
};

// ============================================================================
// Context
// ============================================================================

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemoContext() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoContext must be used within a DemoProvider");
  }
  return context;
}

/**
 * Optional hook that returns null if not in demo mode.
 * Useful for components that need to check if they're in demo mode.
 */
export function useMaybeDemoContext() {
  return useContext(DemoContext);
}

// ============================================================================
// Provider
// ============================================================================

type DemoProviderProps = {
  children: ReactNode;
};

export function DemoProvider({ children }: DemoProviderProps) {
  // Initialize with demo data
  const initialData = generateDemoData();
  
  const [logs, setLogs] = useState<LogEntry[]>(initialData.logs);
  const [stackCompletion, setStackCompletion] = useState<StackCompletionStatus[]>(
    initialData.stackCompletion,
  );
  const [lastLogAt, setLastLogAt] = useState<Date | null>(initialData.lastLogAt);
  const [streak] = useState(initialData.streak);
  const [isPending, setIsPending] = useState(false);

  const addLog = useCallback(
    (
      supplementId: string,
      dosage: number,
      unit: string,
      supplementData: { name: string; category?: string | null },
    ) => {
      setIsPending(true);
      
      // Simulate a brief delay for realism
      setTimeout(() => {
        const newLog: LogEntry = {
          id: `demo-log-${Date.now()}`,
          loggedAt: new Date(),
          dosage,
          unit,
          supplement: {
            id: supplementId,
            name: supplementData.name,
            isResearchChemical: false,
            route: "oral",
            category: supplementData.category,
          },
        };

        setLogs((prev) => [newLog, ...prev]);
        setLastLogAt(new Date());
        setIsPending(false);
        toast.success(`Logged ${supplementData.name}`, {
          description: "Demo mode - data not saved",
        });
      }, 150);
    },
    [],
  );

  const removeLog = useCallback((logId: string) => {
    setIsPending(true);
    
    setTimeout(() => {
      setLogs((prev) => {
        const log = prev.find((l) => l.id === logId);
        if (log) {
          toast.success(`Removed ${log.supplement.name}`, {
            description: "Demo mode - data not saved",
          });
        }
        return prev.filter((l) => l.id !== logId);
      });
      setIsPending(false);
    }, 100);
  }, []);

  const logStack = useCallback((stackId: string) => {
    setIsPending(true);
    
    const stack = DEMO_STACKS.find((s) => s.id === stackId);
    if (!stack) {
      setIsPending(false);
      return;
    }

    setTimeout(() => {
      const now = new Date();
      
      // Add logs for each item in the stack
      const newLogs: LogEntry[] = stack.items.map((item, index) => ({
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

      setLogs((prev) => [...newLogs, ...prev]);
      setLastLogAt(now);

      // Update stack completion
      setStackCompletion((prev) =>
        prev.map((sc) =>
          sc.stackId === stackId
            ? {
                ...sc,
                loggedItems: sc.totalItems,
                isComplete: true,
                items: sc.items.map((item) => ({ ...item, logged: true })),
              }
            : sc,
        ),
      );

      setIsPending(false);
      toast.success(`Logged ${stack.name}`, {
        description: `${stack.items.length} supplements • Demo mode`,
      });
    }, 300);
  }, []);



  const value: DemoContextValue = {
    // Static data
    supplements: DEMO_SUPPLEMENTS,
    stacks: DEMO_STACKS,
    interactions: initialData.interactions,
    ratioWarnings: initialData.ratioWarnings,
    timingWarnings: initialData.timingWarnings,
    biologicalState: initialData.biologicalState,
    timelineData: initialData.timelineData,
    safetyHeadroom: initialData.safetyHeadroom,
    
    // Dynamic data
    logs,
    stackCompletion,
    streak,
    lastLogAt,

    // Actions
    addLog,
    removeLog,
    logStack,

    // State
    isPending,
    isDemo: true,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
