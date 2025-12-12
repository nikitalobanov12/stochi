"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { stackTemplates, type StackTemplate } from "~/server/data/stack-templates";
import { instantiateTemplate, createEmptyStack } from "~/server/actions/onboarding";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type SelectConfigModalProps = {
  open: boolean;
};

export function SelectConfigModal({ open }: SelectConfigModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  function handleSelectTemplate(templateKey: string) {
    setSelectedKey(templateKey);
    startTransition(async () => {
      const result = await instantiateTemplate(templateKey);
      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleSkip() {
    setSelectedKey("empty");
    startTransition(async () => {
      const result = await createEmptyStack();
      if (result.success && result.stackId) {
        router.push(`/dashboard/stacks/${result.stackId}`);
      }
    });
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg border-border bg-background sm:max-w-xl"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-lg">
            <span className="text-muted-foreground">$</span> select default protocol
            <span className="animate-pulse">_</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a starter stack to see the interaction engine in action
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {stackTemplates.map((template) => (
            <TemplateCard
              key={template.key}
              template={template}
              isLoading={isPending && selectedKey === template.key}
              isDisabled={isPending}
              onSelect={() => handleSelectTemplate(template.key)}
            />
          ))}
        </div>

        <button
          onClick={handleSkip}
          disabled={isPending}
          className={cn(
            "mt-4 w-full text-left font-mono text-sm text-muted-foreground transition-colors hover:text-primary",
            isPending && "cursor-not-allowed opacity-50"
          )}
        >
          {isPending && selectedKey === "empty" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              initializing...
            </span>
          ) : (
            "init empty stack"
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  isLoading,
  isDisabled,
  onSelect,
}: {
  template: StackTemplate;
  isLoading: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(
        "group w-full rounded-lg border border-border bg-card p-4 text-left transition-all",
        "hover:border-primary/50 hover:bg-accent/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDisabled && "cursor-not-allowed opacity-50",
        isLoading && "border-primary"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-primary group-hover:text-primary">
              {isLoading ? "" : ">"}
            </span>
            <h3 className="font-mono font-medium">{template.name}</h3>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          <p className="pl-4 text-sm text-muted-foreground">{template.description}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 pl-4">
        {template.interactions.map((interaction, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className={cn(
              "font-mono text-[10px]",
              interaction.type === "synergy"
                ? "bg-green-500/10 text-green-500"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {interaction.count} {interaction.type}
            {interaction.count > 1 ? "s" : ""}
          </Badge>
        ))}
      </div>
    </button>
  );
}
