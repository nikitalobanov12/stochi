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

import {
  removeStackItem,
  updateStackItem,
  addStackItems,
} from "~/server/actions/stacks";
import { retryWithBackoff } from "~/lib/retry";

// ============================================================================
// Types
// ============================================================================

export type StackItemEntry = {
  id: string;
  stackId: string;
  supplementId: string;
  dosage: number;
  unit: string;
  supplement: {
    id: string;
    name: string;
    form: string | null;
    isResearchChemical?: boolean | null;
    route?: string | null;
  };
};

type OptimisticAction =
  | { type: "add"; items: StackItemEntry[] }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; dosage: number; unit: string };

type StackItemsContextValue = {
  /** Current stack items (including optimistic entries) */
  items: StackItemEntry[];
  /** Whether a mutation is in progress */
  isPending: boolean;
  /** Remove an item optimistically, then delete from server */
  removeItemOptimistic: (item: StackItemEntry) => void;
  /** Update an item's dosage/unit optimistically, then persist to server */
  updateItemOptimistic: (
    itemId: string,
    dosage: number,
    unit: string,
    supplementName: string,
  ) => void;
  /** Add items optimistically, then persist to server */
  addItemsOptimistic: (
    stackId: string,
    newItems: Array<{
      supplementId: string;
      dosage: number;
      unit: string;
      supplement: StackItemEntry["supplement"];
    }>,
  ) => void;
};

// ============================================================================
// Context
// ============================================================================

const StackItemsContext = createContext<StackItemsContextValue | null>(null);

export function useStackItemsContext() {
  const context = useContext(StackItemsContext);
  if (!context) {
    throw new Error(
      "useStackItemsContext must be used within a StackItemsProvider",
    );
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

type StackItemsProviderProps = {
  children: ReactNode;
  initialItems: StackItemEntry[];
  stackId: string;
};

function optimisticReducer(
  state: StackItemEntry[],
  action: OptimisticAction,
): StackItemEntry[] {
  switch (action.type) {
    case "add":
      return [...state, ...action.items];
    case "remove":
      return state.filter((item) => item.id !== action.id);
    case "update":
      return state.map((item) =>
        item.id === action.id
          ? { ...item, dosage: action.dosage, unit: action.unit }
          : item,
      );
    default:
      return state;
  }
}

export function StackItemsProvider({
  children,
  initialItems,
  stackId: _stackId,
}: StackItemsProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, dispatchOptimistic] = useOptimistic(
    initialItems,
    optimisticReducer,
  );

  const removeItemOptimistic: StackItemsContextValue["removeItemOptimistic"] = (
    item,
  ) => {
    // Optimistic update - remove immediately
    dispatchOptimistic({ type: "remove", id: item.id });

    startTransition(async () => {
      const result = await retryWithBackoff(() => removeStackItem(item.id));

      if (!result.success) {
        toast.error(`Failed to remove ${item.supplement.name}`);
        // Sync with server to restore the item
        router.refresh();
      } else {
        toast.success(`Removed ${item.supplement.name}`);
      }
    });
  };

  const updateItemOptimistic: StackItemsContextValue["updateItemOptimistic"] = (
    itemId,
    dosage,
    unit,
    supplementName,
  ) => {
    // Optimistic update - update immediately
    dispatchOptimistic({ type: "update", id: itemId, dosage, unit });

    startTransition(async () => {
      const result = await retryWithBackoff(() =>
        updateStackItem(itemId, dosage, unit),
      );

      if (!result.success) {
        toast.error(`Failed to update ${supplementName}`);
        // Sync with server to restore original values
        router.refresh();
      } else {
        toast.success(`Updated ${supplementName}`);
      }
    });
  };

  const addItemsOptimistic: StackItemsContextValue["addItemsOptimistic"] = (
    targetStackId,
    newItems,
  ) => {
    // Create optimistic entries with temporary IDs
    const optimisticEntries: StackItemEntry[] = newItems.map((item, index) => ({
      id: `optimistic-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
      stackId: targetStackId,
      supplementId: item.supplementId,
      dosage: item.dosage,
      unit: item.unit,
      supplement: item.supplement,
    }));

    // Optimistic update - add immediately
    dispatchOptimistic({ type: "add", items: optimisticEntries });

    startTransition(async () => {
      const itemsForServer = newItems.map((item) => ({
        supplementId: item.supplementId,
        dosage: item.dosage,
        unit: item.unit,
      }));

      const result = await retryWithBackoff(() =>
        addStackItems(targetStackId, itemsForServer),
      );

      if (!result.success) {
        toast.error("Failed to add supplements");
        // Sync with server to remove optimistic entries
        router.refresh();
      } else {
        const count = newItems.length;
        toast.success(
          `Added ${count} supplement${count !== 1 ? "s" : ""} to stack`,
        );
        // Refresh to get real IDs from server
        router.refresh();
      }
    });
  };

  return (
    <StackItemsContext.Provider
      value={{
        items: optimisticItems,
        isPending,
        removeItemOptimistic,
        updateItemOptimistic,
        addItemsOptimistic,
      }}
    >
      {children}
    </StackItemsContext.Provider>
  );
}
