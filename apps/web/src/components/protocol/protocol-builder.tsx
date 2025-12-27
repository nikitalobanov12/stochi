"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Sunset,
  Moon,
  Cloud,
  Plus,
  Clock,
  Calendar,
  Loader2,
  Trash2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { AddProtocolItemDialog } from "~/components/protocol/add-protocol-item-dialog";
import { EditProtocolItemDialog } from "~/components/protocol/edit-protocol-item-dialog";
import {
  removeProtocolItem,
  logProtocolSlot,
} from "~/server/actions/protocol";
import { cn } from "~/lib/utils";
import {
  type timeSlotEnum,
  type frequencyEnum,
  type dosageUnitEnum,
} from "~/server/db/schema";

type TimeSlot = (typeof timeSlotEnum.enumValues)[number];
type Frequency = (typeof frequencyEnum.enumValues)[number];
type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];

type Supplement = {
  id: string;
  name: string;
  form: string | null;
  defaultUnit: DosageUnit | null;
  optimalTimeOfDay: string | null;
  isResearchChemical: boolean | null;
  route: string | null;
  suggestedFrequency: Frequency | null;
  frequencyNotes: string | null;
};

type ProtocolItem = {
  id: string;
  supplementId: string;
  dosage: number;
  unit: DosageUnit;
  timeSlot: TimeSlot;
  frequency: Frequency;
  daysOfWeek: string[] | null;
  groupName: string | null;
  sortOrder: number;
  supplement: {
    id: string;
    name: string;
    form: string | null;
    optimalTimeOfDay: string | null;
  };
};

type Protocol = {
  id: string;
  name: string;
  autoLogEnabled: boolean;
  morningTime: string;
  afternoonTime: string;
  eveningTime: string;
  bedtimeTime: string;
  items: ProtocolItem[];
};

type ProtocolBuilderProps = {
  protocol: Protocol;
  supplements: Supplement[];
};

const TIME_SLOTS: { slot: TimeSlot; label: string; icon: typeof Sun }[] = [
  { slot: "morning", label: "Morning", icon: Sun },
  { slot: "afternoon", label: "Afternoon", icon: Cloud },
  { slot: "evening", label: "Evening", icon: Sunset },
  { slot: "bedtime", label: "Bedtime", icon: Moon },
];

const DAYS_SHORT: Record<string, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "Th",
  friday: "F",
  saturday: "S",
  sunday: "Su",
};

function getSlotTime(protocol: Protocol, slot: TimeSlot): string {
  switch (slot) {
    case "morning":
      return protocol.morningTime;
    case "afternoon":
      return protocol.afternoonTime;
    case "evening":
      return protocol.eveningTime;
    case "bedtime":
      return protocol.bedtimeTime;
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function ProtocolBuilder({ protocol, supplements }: ProtocolBuilderProps) {
  const router = useRouter();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [loggingSlot, setLoggingSlot] = useState<TimeSlot | null>(null);

  // Group items by time slot
  const itemsBySlot = useMemo(() => {
    const grouped: Record<TimeSlot, ProtocolItem[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      bedtime: [],
    };
    for (const item of protocol.items) {
      grouped[item.timeSlot].push(item);
    }
    // Sort by group name then sort order within each slot
    for (const slot of Object.keys(grouped) as TimeSlot[]) {
      grouped[slot].sort((a, b) => {
        // Group items together
        if (a.groupName && b.groupName) {
          if (a.groupName !== b.groupName) {
            return a.groupName.localeCompare(b.groupName);
          }
        } else if (a.groupName) {
          return -1;
        } else if (b.groupName) {
          return 1;
        }
        return a.sortOrder - b.sortOrder;
      });
    }
    return grouped;
  }, [protocol.items]);

  // Get existing supplement IDs
  const existingSupplementIds = useMemo(
    () => new Set(protocol.items.map((item) => item.supplementId)),
    [protocol.items]
  );

  async function handleDeleteItem(itemId: string) {
    setDeletingItemId(itemId);
    try {
      await removeProtocolItem(itemId);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error("Failed to remove supplement");
    } finally {
      setDeletingItemId(null);
    }
  }

  async function handleLogSlot(slot: TimeSlot) {
    setLoggingSlot(slot);
    try {
      const result = await logProtocolSlot(slot);
      toast.success(`Logged ${result.logged} supplement${result.logged !== 1 ? "s" : ""}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to log slot:", error);
      toast.error(error instanceof Error ? error.message : "Failed to log supplements");
    } finally {
      setLoggingSlot(null);
    }
  }

  return (
    <div className="space-y-6">
      {TIME_SLOTS.map(({ slot, label, icon: Icon }) => {
        const items = itemsBySlot[slot];
        const slotTime = getSlotTime(protocol, slot);

        return (
          <section key={slot} className="space-y-3">
            {/* Slot Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-muted/50 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-mono text-sm font-medium">{label}</h2>
                  <p className="text-muted-foreground font-mono text-xs">
                    {formatTime(slotTime)}
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {items.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => handleLogSlot(slot)}
                    disabled={loggingSlot === slot}
                  >
                    {loggingSlot === slot ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Clock className="mr-2 h-3 w-3" />
                    )}
                    Log {label}
                  </Button>
                )}
                <AddProtocolItemDialog
                  _protocolId={protocol.id}
                  timeSlot={slot}
                  supplements={supplements}
                  existingSupplementIds={existingSupplementIds}
                >
                  <Button variant="ghost" size="sm" className="font-mono text-xs">
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </AddProtocolItemDialog>
              </div>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <div className="border-border/40 rounded-lg border border-dashed py-8 text-center">
                <p className="text-muted-foreground font-mono text-xs">
                  No supplements scheduled for {label.toLowerCase()}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <ProtocolItemCard
                    key={item.id}
                    item={item}
                    onDelete={() => handleDeleteItem(item.id)}
                    isDeleting={deletingItemId === item.id}
                    supplements={supplements}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Empty state when protocol has no items at all */}
      {protocol.items.length === 0 && (
        <div className="glass-card border-dashed py-12 text-center">
          <Calendar className="text-muted-foreground/50 mx-auto mb-4 h-10 w-10" />
          <p className="text-muted-foreground font-mono text-sm">
            Your protocol is empty
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Add supplements to each time slot to build your daily routine
          </p>
        </div>
      )}
    </div>
  );
}

// Individual item card
function ProtocolItemCard({
  item,
  onDelete,
  isDeleting,
  supplements,
}: {
  item: ProtocolItem;
  onDelete: () => void;
  isDeleting: boolean;
  supplements: Supplement[];
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="glass-card group flex items-center gap-3 px-4 py-3">
      {/* Drag handle (visual only for now) */}
      <GripVertical className="text-muted-foreground/30 h-4 w-4 shrink-0" />

      {/* Main content - clickable to edit */}
      <button
        type="button"
        onClick={() => setIsEditOpen(true)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">
            {item.supplement.name}
          </span>
          {item.groupName && (
            <Badge variant="outline" className="font-mono text-xs">
              {item.groupName}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Dosage */}
          <span className="text-muted-foreground font-mono text-xs">
            {item.dosage} {item.unit}
          </span>

          {/* Frequency badge */}
          {item.frequency !== "daily" && (
            <Badge
              variant="secondary"
              className={cn(
                "font-mono text-xs",
                item.frequency === "as_needed" && "bg-amber-500/10 text-amber-600"
              )}
            >
              {item.frequency === "specific_days"
                ? item.daysOfWeek?.map((d) => DAYS_SHORT[d]).join("/")
                : "As needed"}
            </Badge>
          )}
        </div>
      </button>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0 p-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>

      {/* Edit dialog */}
      <EditProtocolItemDialog
        item={item}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        supplements={supplements}
      />
    </div>
  );
}
