"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Sparkles,
  Clock,
  Zap,
  AlertTriangle,
  Check,
  Loader2,
  BookOpen,
  User,
  Beaker,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { type StackTemplate } from "~/server/data/stack-templates";

type ProtocolDetailSheetProps = {
  template: StackTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (templateKey: string) => Promise<{ success: boolean; stackId?: string; error?: string }>;
  isAlreadyImported?: boolean;
};

const AUTHORITY_CONFIG = {
  high: {
    label: "Expert",
    icon: Sparkles,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  medium: {
    label: "Research-Backed",
    icon: BookOpen,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  community: {
    label: "Community",
    icon: User,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  },
};

export function ProtocolDetailSheet({
  template,
  open,
  onOpenChange,
  onImport,
  isAlreadyImported = false,
}: ProtocolDetailSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!template) return null;

  const authority = AUTHORITY_CONFIG[template.authority ?? "community"];
  const AuthorityIcon = authority.icon;
  const synergyCount = template.interactions.find((i) => i.type === "synergy")?.count ?? 0;
  const conflictCount = template.interactions.find((i) => i.type === "conflict")?.count ?? 0;

  function handleImport() {
    if (!template) return;
    setError(null);
    startTransition(async () => {
      const result = await onImport(template.key);
      if (result.success) {
        setImported(true);
        router.refresh();
        // Auto-close after success
        setTimeout(() => {
          onOpenChange(false);
          setImported(false);
        }, 1500);
      } else {
        setError(result.error ?? "Failed to import");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-3">
          {/* Authority badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("gap-1 font-mono text-xs", authority.className)}
            >
              <AuthorityIcon className="h-3 w-3" />
              {authority.label}
            </Badge>
            {template.isResearchStack && (
              <Badge
                variant="outline"
                className="gap-1 border-violet-500/30 bg-violet-500/10 font-mono text-xs text-violet-400"
              >
                <Beaker className="h-3 w-3" />
                Research
              </Badge>
            )}
          </div>

          <SheetTitle className="font-mono text-xl">{template.name}</SheetTitle>
          <SheetDescription className="text-base">
            {template.description}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-4">
          {/* Source attribution */}
          {template.source && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                Source
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{template.source}</span>
                {template.sourceUrl && (
                  <a
                    href={template.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Usage instructions */}
          {template.usage && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                How to Use
              </h3>
              <div className="rounded-lg border bg-white/[0.02] p-3">
                <div className="flex gap-2">
                  <Clock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">{template.usage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Interactions summary */}
          {(synergyCount > 0 || conflictCount > 0) && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                Interactions
              </h3>
              <div className="flex gap-2">
                {synergyCount > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  >
                    <Zap className="h-3 w-3" />
                    {synergyCount} synerg{synergyCount === 1 ? "y" : "ies"}
                  </Badge>
                )}
                {conflictCount > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {conflictCount} caution{conflictCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Supplements list */}
          <div className="space-y-2">
            <h3 className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
              Supplements ({template.supplements.length})
            </h3>
            <div className="space-y-2">
              {template.supplements.map((supp, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-white/[0.02] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{supp.supplementName}</span>
                    <span className="text-muted-foreground font-mono text-sm">
                      {supp.dosage} {supp.unit}
                    </span>
                  </div>
                  {supp.timing && (
                    <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                      <Clock className="h-3 w-3" />
                      {supp.timing}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Goals this targets */}
          {template.goals && template.goals.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                Target Goals
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {template.goals.map((goal) => (
                  <Badge key={goal} variant="secondary" className="capitalize">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t">
          {error && (
            <p className="text-destructive w-full text-center text-sm">{error}</p>
          )}
          <Button
            onClick={handleImport}
            disabled={isPending || imported || isAlreadyImported}
            className="w-full"
          >
            {imported || isAlreadyImported ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {isAlreadyImported ? "Already in Your Protocols" : "Added to Protocols"}
              </>
            ) : isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Add to My Protocols
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
