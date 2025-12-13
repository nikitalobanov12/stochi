"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Loader2, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { type SelectedSupplement } from "./supplements-step";

type SaveStackStepProps = {
  supplements: SelectedSupplement[];
  onComplete: (stackName: string) => Promise<void>;
  onBack: () => void;
};

export function SaveStackStep({ supplements, onComplete, onBack }: SaveStackStepProps) {
  const [stackName, setStackName] = useState("My Supplements");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stackName.trim()) return;

    startTransition(async () => {
      await onComplete(stackName.trim());
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6">
        <div className="space-y-2">
          <h2 className="font-mono text-xl font-bold">Save as a Stack</h2>
          <p className="text-sm text-muted-foreground">
            Stacks let you log multiple supplements with one tap.
          </p>
        </div>

        {/* Stack concept explainer */}
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers className="h-4 w-4 text-primary" />
            How Stacks Work
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>Group supplements you take together</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>One tap logs everything in the stack</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>Create multiple stacks for different times of day</span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground italic">
            Example: &quot;Morning Protocol&quot;, &quot;Pre-Workout&quot;, &quot;Evening Wind-down&quot;
          </p>
        </div>

        {/* Name input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="stack-name" className="text-sm font-medium">
              Name your stack
            </label>
            <Input
              id="stack-name"
              value={stackName}
              onChange={(e) => setStackName(e.target.value)}
              placeholder="e.g., Morning Protocol"
              className="font-mono"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {supplements.length} supplement{supplements.length !== 1 ? "s" : ""} will be saved
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              size="sm"
              disabled={isPending}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <div className="flex-1" />
            <Button
              type="submit"
              disabled={!stackName.trim() || isPending}
              className="min-w-[140px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
