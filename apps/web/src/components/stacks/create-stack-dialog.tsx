"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

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

type CreateStackDialogProps = {
  createStack: (formData: FormData) => Promise<void>;
  createStackFromTemplate: (
    templateKey: string,
  ) => Promise<{ success: boolean; stackId?: string }>;
  children?: React.ReactNode;
};

const quickTemplates = [
  {
    key: "focus",
    name: "Focus Protocol",
    description: "Caffeine + L-Theanine + L-Tyrosine",
  },
  {
    key: "mineral",
    name: "Mineral Balance",
    description: "Magnesium + Zinc + Iron",
  },
  {
    key: "essentials",
    name: "Daily Essentials",
    description: "Vitamin D3 + K2 + Magnesium",
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

  function handleSubmit(formData: FormData) {
    setSelectedTemplate(null);
    startTransition(async () => {
      await createStack(formData);
      setOpen(false);
      router.refresh();
    });
  }

  function handleTemplateSelect(templateKey: string) {
    setSelectedTemplate(templateKey);
    startTransition(async () => {
      const result = await createStackFromTemplate(templateKey);
      if (result.success && result.stackId) {
        setOpen(false);
        router.push(`/dashboard/stacks/${result.stackId}`);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Create Stack</DialogTitle>
          <DialogDescription>
            Start from a template or create an empty stack
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">
              Quick Start Templates
            </Label>
            <div className="space-y-2">
              {quickTemplates.map((template) => (
                <button
                  key={template.key}
                  onClick={() => handleTemplateSelect(template.key)}
                  disabled={isPending}
                  className={cn(
                    "border-muted-foreground/20 w-full rounded-md border-2 p-3 text-left transition-colors",
                    "hover:border-primary hover:bg-primary/5",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    isPending &&
                      selectedTemplate === template.key &&
                      "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">
                      {isPending && selectedTemplate === template.key
                        ? ""
                        : ">"}
                    </span>
                    <span className="font-mono text-sm font-medium">
                      {template.name}
                    </span>
                    {isPending && selectedTemplate === template.key && (
                      <Loader2 className="text-primary h-3 w-3 animate-spin" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 pl-5 text-xs">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                or
              </span>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Empty Stack</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Morning Protocol"
                required
                className="font-mono"
                disabled={isPending}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={isPending}
            >
              {isPending && selectedTemplate === null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Empty Stack"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
