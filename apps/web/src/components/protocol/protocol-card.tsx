"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Sunset,
  Moon,
  Cloud,
  ChevronRight,
  Loader2,
  Clock,
  Calendar,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { logProtocolSlot } from "~/server/actions/protocol";
import { cn } from "~/lib/utils";
import {
  type timeSlotEnum,
  type frequencyEnum,
  type dosageUnitEnum,
} from "~/server/db/schema";

type TimeSlot = (typeof timeSlotEnum.enumValues)[number];
type Frequency = (typeof frequencyEnum.enumValues)[number];
type DosageUnit = (typeof dosageUnitEnum.enumValues)[number];

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

type ProtocolCardProps = {
  protocol: Protocol;
};

const TIME_SLOT_CONFIG: Record<
  TimeSlot,
  { label: string; icon: typeof Sun; gradient: string }
> = {
  morning: {
    label: "Morning",
    icon: Sun,
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  afternoon: {
    label: "Afternoon",
    icon: Cloud,
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  evening: {
    label: "Evening",
    icon: Sunset,
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  bedtime: {
    label: "Bedtime",
    icon: Moon,
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
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

// Get items scheduled for today
function getItemsForToday(items: ProtocolItem[]): ProtocolItem[] {
  const today = new Date();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayOfWeek = days[today.getDay()]!;

  return items.filter((item) => {
    if (item.frequency === "as_needed") return false;
    if (item.frequency === "specific_days") {
      return item.daysOfWeek?.includes(dayOfWeek) ?? false;
    }
    return true;
  });
}

export function ProtocolCard({ protocol }: ProtocolCardProps) {
  const router = useRouter();
  const [isNavigating, startNavTransition] = useTransition();
  const [loggingSlot, setLoggingSlot] = useState<TimeSlot | null>(null);

  // Group items by time slot
  const itemsBySlot: Record<TimeSlot, ProtocolItem[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    bedtime: [],
  };
  for (const item of protocol.items) {
    itemsBySlot[item.timeSlot].push(item);
  }

  // Get today's items per slot
  const todayBySlot: Record<TimeSlot, ProtocolItem[]> = {
    morning: getItemsForToday(itemsBySlot.morning),
    afternoon: getItemsForToday(itemsBySlot.afternoon),
    evening: getItemsForToday(itemsBySlot.evening),
    bedtime: getItemsForToday(itemsBySlot.bedtime),
  };

  const totalItems = protocol.items.length;
  const todayTotal = Object.values(todayBySlot).reduce(
    (sum, items) => sum + items.length,
    0
  );

  function handleNavigate() {
    startNavTransition(() => {
      router.push("/dashboard/protocol");
    });
  }

  async function handleLogSlot(e: React.MouseEvent, slot: TimeSlot) {
    e.stopPropagation();
    setLoggingSlot(slot);
    try {
      const result = await logProtocolSlot(slot);
      toast.success(
        `Logged ${result.logged} supplement${result.logged !== 1 ? "s" : ""}`
      );
      router.refresh();
    } catch (error) {
      console.error("Failed to log slot:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to log supplements"
      );
    } finally {
      setLoggingSlot(null);
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={handleNavigate}
        disabled={isNavigating}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Calendar className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="font-mono text-base font-medium">{protocol.name}</h2>
            <p className="text-muted-foreground font-mono text-xs">
              {todayTotal} supplements today • {totalItems} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {protocol.autoLogEnabled && (
            <Badge variant="secondary" className="font-mono text-xs">
              Auto-Log
            </Badge>
          )}
          {isNavigating ? (
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          ) : (
            <ChevronRight className="text-muted-foreground h-4 w-4" />
          )}
        </div>
      </button>

      {/* Time Slot Grid */}
      {totalItems > 0 && (
        <div className="grid grid-cols-2 gap-px bg-border/20 border-t border-border/20 sm:grid-cols-4">
          {(["morning", "afternoon", "evening", "bedtime"] as TimeSlot[]).map(
            (slot) => {
              const config = TIME_SLOT_CONFIG[slot];
              const Icon = config.icon;
              const items = todayBySlot[slot];
              const hasItems = items.length > 0;
              const isLogging = loggingSlot === slot;

              return (
                <div
                  key={slot}
                  className={cn(
                    "relative p-3 transition-colors",
                    hasItems ? "bg-white/5" : "bg-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {config.label}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatTime(getSlotTime(protocol, slot))}
                    </span>
                  </div>

                  {hasItems ? (
                    <>
                      <div className="space-y-1 mb-2">
                        {items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="font-mono text-xs truncate"
                          >
                            {item.supplement.name}
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="text-muted-foreground font-mono text-xs">
                            +{items.length - 3} more
                          </div>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full h-7 font-mono text-xs"
                        onClick={(e) => handleLogSlot(e, slot)}
                        disabled={isLogging}
                      >
                        {isLogging ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Log
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground/50 font-mono text-xs">
                      No supplements
                    </p>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="border-t border-border/20 p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full font-mono text-xs"
            onClick={handleNavigate}
            disabled={isNavigating}
          >
            <Settings2 className="mr-2 h-3 w-3" />
            Set Up Your Protocol
          </Button>
        </div>
      )}
    </div>
  );
}
