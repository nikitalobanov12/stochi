"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Sparkles,
  Moon,
  Brain,
  Zap,
  Heart,
  Shield,
  Dumbbell,
  Library,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { ProtocolLibraryDialog } from "./protocol-library-dialog";

type CreateStackDialogProps = {
  createStack: (formData: FormData) => Promise<void>;
  createStackFromTemplate: (
    templateKey: string,
  ) => Promise<{ success: boolean; stackId?: string; error?: string }>;
  children?: React.ReactNode;
};

// Curated quick-start templates with icons, grouped by use case
// These pull from the full template library in stack-templates.ts
const quickTemplates = [
  {
    key: "huberman-sleep",
    name: "Sleep Protocol",
    description: "Mag Threonate + Theanine + Apigenin",
    icon: Moon,
    color: "text-indigo-400",
  },
  {
    key: "huberman-focus",
    name: "Focus Protocol",
    description: "L-Tyrosine + Alpha-GPC",
    icon: Brain,
    color: "text-cyan-400",
  },
  {
    key: "caffeine-theanine",
    name: "Calm Energy",
    description: "Caffeine + L-Theanine (2:1 ratio)",
    icon: Zap,
    color: "text-yellow-400",
  },
  {
    key: "daily-essentials",
    name: "Daily Essentials",
    description: "Vitamin D3 + K2 + Magnesium",
    icon: Heart,
    color: "text-rose-400",
  },
  {
    key: "immune-support",
    name: "Immune Support",
    description: "Zinc + Vitamin C + Vitamin D",
    icon: Shield,
    color: "text-green-400",
  },
  {
    key: "workout-performance",
    name: "Pre-Workout",
    description: "Creatine + Beta-Alanine + Citrulline",
    icon: Dumbbell,
    color: "text-orange-400",
  },
];

export function CreateStackDialog({
  createStack,
  createStackFromTemplate,
  children,
}: CreateStackDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setSelectedTemplate(null);
    setError(null);
    startTransition(async () => {
      await createStack(formData);
      setOpen(false);
      router.refresh();
    });
  }

  function handleTemplateSelect(templateKey: string) {
    setSelectedTemplate(templateKey);
    setError(null);
    startTransition(async () => {
      const result = await createStackFromTemplate(templateKey);
      if (result.success && result.stackId) {
        setOpen(false);
        router.push(`/dashboard/stacks/${result.stackId}`);
      } else {
        setError(result.error ?? "Failed to create stack");
        setSelectedTemplate(null);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Stack
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">Create Protocol</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Start from a template or create your own
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-500/10 p-3 font-mono text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Quick Start Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-xs">
                Quick Start
              </Label>
              <ProtocolLibraryDialog createStackFromTemplate={createStackFromTemplate}>
                <button className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono text-[10px] transition-colors">
                  <Library className="h-3 w-3" />
                  View all protocols
                </button>
              </ProtocolLibraryDialog>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate === template.key;
                return (
                  <button
                    key={template.key}
                    onClick={() => handleTemplateSelect(template.key)}
                    disabled={isPending}
                    className={cn(
                      "border-white/5 bg-white/[0.02] group rounded-lg border p-3 text-left transition-all",
                      "hover:border-white/10 hover:bg-white/[0.04]",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      isSelected && isPending && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn("mt-0.5", template.color)}>
                        {isSelected && isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs font-medium">
                          {template.name}
                        </span>
                        <p className="text-muted-foreground mt-0.5 truncate font-mono text-[10px]">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="border-border/40 w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2 font-mono text-[10px]">
                or create empty
              </span>
            </div>
          </div>

          {/* Empty Stack Form */}
          <form action={handleSubmit} className="space-y-3">
            <Input
              id="name"
              name="name"
              placeholder="Protocol name..."
              required
              className="font-mono text-sm"
              disabled={isPending}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full font-mono text-xs"
              disabled={isPending}
            >
              {isPending && selectedTemplate === null ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-3 w-3" />
                  Create Empty Protocol
                </>
              )}
            </Button>
          </form>

          {/* Expert badge hint */}
          <p className="text-muted-foreground/60 flex items-center justify-center gap-1 font-mono text-[10px]">
            <Sparkles className="h-3 w-3 text-[#39FF14]" />
            Expert protocols from Huberman, Attia & more in library
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
