"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { updateProtocol } from "~/server/actions/protocol";

type Protocol = {
  id: string;
  name: string;
  autoLogEnabled: boolean;
  morningTime: string;
  afternoonTime: string;
  eveningTime: string;
  bedtimeTime: string;
};

type ProtocolSettingsDialogProps = {
  protocol: Protocol;
  children?: React.ReactNode;
};

const TIME_SLOTS = [
  { key: "morningTime", label: "Morning", icon: "morning" },
  { key: "afternoonTime", label: "Afternoon", icon: "afternoon" },
  { key: "eveningTime", label: "Evening", icon: "evening" },
  { key: "bedtimeTime", label: "Bedtime", icon: "bedtime" },
] as const;

export function ProtocolSettingsDialog({
  protocol,
  children,
}: ProtocolSettingsDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState(protocol.name);
  const [autoLogEnabled, setAutoLogEnabled] = useState(protocol.autoLogEnabled);
  const [times, setTimes] = useState({
    morningTime: protocol.morningTime,
    afternoonTime: protocol.afternoonTime,
    eveningTime: protocol.eveningTime,
    bedtimeTime: protocol.bedtimeTime,
  });

  function handleTimeChange(key: keyof typeof times, value: string) {
    setTimes((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Protocol name is required");
      return;
    }

    startTransition(async () => {
      try {
        await updateProtocol({
          name: name.trim(),
          autoLogEnabled,
          ...times,
        });
        toast.success("Settings saved");
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to update protocol:", error);
        toast.error("Failed to save settings");
      }
    });
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      // Reset to current values when opening
      setName(protocol.name);
      setAutoLogEnabled(protocol.autoLogEnabled);
      setTimes({
        morningTime: protocol.morningTime,
        afternoonTime: protocol.afternoonTime,
        eveningTime: protocol.eveningTime,
        bedtimeTime: protocol.bedtimeTime,
      });
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Protocol Settings</DialogTitle>
          <DialogDescription>
            Configure your protocol name, timing, and auto-log preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Protocol Name */}
          <div className="space-y-2">
            <Label htmlFor="protocol-name" className="text-xs">
              Protocol Name
            </Label>
            <Input
              id="protocol-name"
              placeholder="My Protocol"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Time Slot Configuration */}
          <div className="space-y-3">
            <Label className="text-xs">Time Slots</Label>
            <p className="text-muted-foreground text-xs">
              Set your preferred times for each slot
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TIME_SLOTS.map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key} className="text-xs font-normal">
                    {label}
                  </Label>
                  <div className="relative">
                    <Clock className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                    <Input
                      id={key}
                      type="time"
                      value={times[key]}
                      onChange={(e) => handleTimeChange(key, e.target.value)}
                      className="pl-9 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-Log Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-log" className="text-sm font-medium">
                Auto-Log
              </Label>
              <p className="text-muted-foreground text-xs">
                Automatically log supplements at scheduled times
              </p>
            </div>
            <Switch
              id="auto-log"
              checked={autoLogEnabled}
              onCheckedChange={setAutoLogEnabled}
            />
          </div>

          {autoLogEnabled && (
            <p className="text-muted-foreground text-xs">
              Supplements will be logged automatically at the times configured
              above. You can still manually log or skip as needed.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="font-mono"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
