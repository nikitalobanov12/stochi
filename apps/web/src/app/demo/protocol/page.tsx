"use client";

import { useDemoContext } from "~/components/demo/demo-provider";
import { Button } from "~/components/ui/button";
import { Clock, Loader2, Check } from "lucide-react";
import { useTransition } from "react";

const TIME_SLOTS = [
  { id: "morning", label: "Morning", time: "8:00 AM", icon: "🌅" },
  { id: "afternoon", label: "Afternoon", time: "12:00 PM", icon: "☀️" },
  { id: "evening", label: "Evening", time: "6:00 PM", icon: "🌆" },
  { id: "bedtime", label: "Bedtime", time: "10:00 PM", icon: "🌙" },
] as const;

export default function DemoProtocolPage() {
  const demo = useDemoContext();

  // Map stacks to time slots for demo
  const protocolSlots = [
    {
      slot: TIME_SLOTS[0]!,
      stack: demo.stacks[0],
      completion: demo.stackCompletion.find(
        (sc) => sc.stackId === demo.stacks[0]?.id,
      ),
    },
    {
      slot: TIME_SLOTS[3]!,
      stack: demo.stacks[1],
      completion: demo.stackCompletion.find(
        (sc) => sc.stackId === demo.stacks[1]?.id,
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Protocol</h1>
        <p className="text-muted-foreground text-sm">
          Your daily supplement schedule
        </p>
      </div>

      {/* Time Slot Cards */}
      <div className="space-y-4">
        {protocolSlots.map(({ slot, stack, completion }) => (
          <DemoProtocolSlot
            key={slot.id}
            slot={slot}
            stack={stack}
            isComplete={completion?.isComplete ?? false}
          />
        ))}
      </div>

      {/* Empty slots */}
      {TIME_SLOTS.filter(
        (slot) => !protocolSlots.find((ps) => ps.slot.id === slot.id),
      ).map((slot) => (
        <div
          key={slot.id}
          className="glass-card flex items-center justify-between border-dashed p-4 opacity-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{slot.icon}</span>
            <div>
              <p className="font-medium">{slot.label}</p>
              <p className="text-muted-foreground text-xs">{slot.time}</p>
            </div>
          </div>
          <span className="text-muted-foreground text-xs">No stack assigned</span>
        </div>
      ))}

      {/* Info Banner */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-center">
        <Clock className="mx-auto mb-2 h-5 w-5 text-white/30" />
        <p className="text-muted-foreground text-xs">
          In demo mode, you can execute protocols to see how one-tap logging
          works.
          <br />
          <span className="text-white/40">
            Sign up to customize your schedule and enable reminders.
          </span>
        </p>
      </div>
    </div>
  );
}

function DemoProtocolSlot({
  slot,
  stack,
  isComplete,
}: {
  slot: (typeof TIME_SLOTS)[number];
  stack?: { id: string; name: string; items: Array<{ supplement: { name: string }; dosage: number; unit: string }> };
  isComplete: boolean;
}) {
  const demo = useDemoContext();
  const [isPending, startTransition] = useTransition();

  if (!stack) return null;

  function handleExecute() {
    startTransition(() => {
      demo.logStack(stack!.id);
    });
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{slot.icon}</span>
          <div>
            <p className="font-medium">{slot.label}</p>
            <p className="text-muted-foreground text-xs">{slot.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs">{stack.name}</span>
          <Button
            size="sm"
            variant={isComplete ? "outline" : "default"}
            disabled={isPending || isComplete}
            onClick={handleExecute}
            className={
              isComplete
                ? "border-emerald-500/30 text-emerald-400"
                : "bg-gradient-to-r from-emerald-500 to-cyan-500"
            }
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isComplete ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Done
              </>
            ) : (
              "Execute"
            )}
          </Button>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {stack.items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-2 text-sm"
          >
            <span className={isComplete ? "text-white/50" : "text-white/80"}>
              {item.supplement.name}
            </span>
            <span className="font-mono text-[#00D4FF]/60">
              {item.dosage}
              {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
