"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Library,
  Loader2,
  Sparkles,
  BookOpen,
  Users,
  ChevronRight,
  Check,
  Zap,
  AlertTriangle,
  Clock,
  ExternalLink,
  FlaskConical,
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
import { cn } from "~/lib/utils";
import {
  type StackTemplate,
  getTemplatesByAuthority,
} from "~/server/data/stack-templates";

// ============================================================================
// Types
// ============================================================================

type ProtocolLibraryDialogProps = {
  createStackFromTemplate: (
    templateKey: string,
  ) => Promise<{ success: boolean; stackId?: string; error?: string }>;
  children?: React.ReactNode;
};

// ============================================================================
// Authority Badge
// ============================================================================

function AuthorityBadge({
  authority,
}: {
  authority?: "high" | "medium" | "community";
}) {
  if (authority === "high") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#39FF14]/10 px-2 py-0.5 font-mono text-[9px] text-[#39FF14]">
        <Sparkles className="h-2.5 w-2.5" />
        EXPERT
      </span>
    );
  }
  if (authority === "medium") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#00D4FF]/10 px-2 py-0.5 font-mono text-[9px] text-[#00D4FF]">
        <BookOpen className="h-2.5 w-2.5" />
        RESEARCH
      </span>
    );
  }
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[9px]">
      <Users className="h-2.5 w-2.5" />
      COMMUNITY
    </span>
  );
}

// ============================================================================
// Interaction Badges
// ============================================================================

function InteractionBadges({
  interactions,
}: {
  interactions: Array<{ type: "synergy" | "conflict"; count: number }>;
}) {
  if (interactions.length === 0) return null;

  return (
    <div className="flex gap-1">
      {interactions.map((interaction, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px]",
            interaction.type === "synergy"
              ? "bg-[#39FF14]/10 text-[#39FF14]"
              : "bg-[#F0A500]/10 text-[#F0A500]",
          )}
        >
          {interaction.type === "synergy" ? (
            <Zap className="h-2 w-2" />
          ) : (
            <AlertTriangle className="h-2 w-2" />
          )}
          {interaction.count}
        </span>
      ))}
    </div>
  );
}

// ============================================================================
// Template Card
// ============================================================================

function TemplateCard({
  template,
  onSelect,
  isLoading,
  isImported,
}: {
  template: StackTemplate;
  onSelect: () => void;
  isLoading: boolean;
  isImported: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={isLoading || isImported}
      className={cn(
        "group w-full rounded-lg border border-white/5 bg-white/[0.02] p-4 text-left transition-all",
        "hover:border-white/10 hover:bg-white/[0.04]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isImported && "border-[#39FF14]/30 bg-[#39FF14]/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground font-mono text-sm font-medium">
              {template.name}
            </span>
            <AuthorityBadge authority={template.authority} />
            {template.isResearchStack && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] text-purple-400">
                <FlaskConical className="h-2.5 w-2.5" />
                RESEARCH
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground font-mono text-xs">
            {template.description}
          </p>

          {/* Usage notes */}
          {template.usage && (
            <div className="flex items-start gap-1.5 rounded bg-white/5 px-2 py-1.5">
              <Clock className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
              <p className="text-muted-foreground font-mono text-[10px] leading-relaxed">
                {template.usage}
              </p>
            </div>
          )}

          {/* Supplements preview */}
          <div className="flex flex-wrap gap-1">
            {template.supplements.map((supp, i) => (
              <span
                key={i}
                className="text-muted-foreground rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px]"
              >
                {supp.supplementName} {supp.dosage}
                {supp.unit}
              </span>
            ))}
          </div>

          {/* Footer: Source + Interactions */}
          <div className="flex items-center justify-between">
            {/* Source */}
            {template.source && (
              <p className="text-muted-foreground/60 font-mono text-[10px]">
                {template.sourceUrl ? (
                  <span className="inline-flex items-center gap-1">
                    {template.source}
                    <ExternalLink className="h-2 w-2" />
                  </span>
                ) : (
                  template.source
                )}
              </p>
            )}

            {/* Interactions */}
            <InteractionBadges interactions={template.interactions} />
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          {isImported ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#39FF14]/20">
              <Check className="h-4 w-4 text-[#39FF14]" />
            </div>
          ) : isLoading ? (
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
          ) : (
            <ChevronRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProtocolLibraryDialog({
  createStackFromTemplate,
  children,
}: ProtocolLibraryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [importedKeys, setImportedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const templates = getTemplatesByAuthority();

  // Group by authority, separating research stacks
  const highAuthority = templates.filter(
    (t) => t.authority === "high" && !t.isResearchStack,
  );
  const mediumAuthority = templates.filter(
    (t) => t.authority === "medium" && !t.isResearchStack,
  );
  const communityAuthority = templates.filter(
    (t) => (t.authority === "community" || !t.authority) && !t.isResearchStack,
  );
  const researchStacks = templates.filter((t) => t.isResearchStack);

  function handleSelect(templateKey: string) {
    setLoadingKey(templateKey);
    setError(null);
    startTransition(async () => {
      try {
        const result = await createStackFromTemplate(templateKey);
        if (result.success && result.stackId) {
          setImportedKeys((prev) => new Set([...prev, templateKey]));
          // Keep dialog open to allow importing multiple
          // User can close manually or click "View Stack"
        } else {
          setError(result.error ?? "Failed to import protocol");
        }
      } catch {
        setError("Failed to import protocol");
      } finally {
        setLoadingKey(null);
      }
    });
  }

  function handleViewStacks() {
    setOpen(false);
    router.push("/dashboard/stacks");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="font-mono">
            <Library className="mr-2 h-4 w-4" />
            Protocol Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <Library className="h-5 w-5" />
            Protocol Library
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Import research-backed supplement stacks in one click
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-500/10 p-3 font-mono text-xs text-red-400">
              {error}
            </div>
          )}

          {/* High Authority */}
          {highAuthority.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
                <Sparkles className="h-3 w-3 text-[#39FF14]" />
                Expert Protocols
              </h3>
              <div className="space-y-2">
                {highAuthority.map((template) => (
                  <TemplateCard
                    key={template.key}
                    template={template}
                    onSelect={() => handleSelect(template.key)}
                    isLoading={loadingKey === template.key && isPending}
                    isImported={importedKeys.has(template.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medium Authority */}
          {mediumAuthority.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
                <BookOpen className="h-3 w-3 text-[#00D4FF]" />
                Research-Backed
              </h3>
              <div className="space-y-2">
                {mediumAuthority.map((template) => (
                  <TemplateCard
                    key={template.key}
                    template={template}
                    onSelect={() => handleSelect(template.key)}
                    isLoading={loadingKey === template.key && isPending}
                    isImported={importedKeys.has(template.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Community */}
          {communityAuthority.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
                <Users className="h-3 w-3" />
                Community Stacks
              </h3>
              <div className="space-y-2">
                {communityAuthority.map((template) => (
                  <TemplateCard
                    key={template.key}
                    template={template}
                    onSelect={() => handleSelect(template.key)}
                    isLoading={loadingKey === template.key && isPending}
                    isImported={importedKeys.has(template.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Research/Peptide Stacks */}
          {researchStacks.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-purple-400 uppercase">
                <FlaskConical className="h-3 w-3" />
                Research Compounds
              </h3>
              <p className="text-muted-foreground/70 font-mono text-[10px]">
                Peptides and research chemicals. For experienced users only.
              </p>
              <div className="space-y-2">
                {researchStacks.map((template) => (
                  <TemplateCard
                    key={template.key}
                    template={template}
                    onSelect={() => handleSelect(template.key)}
                    isLoading={loadingKey === template.key && isPending}
                    isImported={importedKeys.has(template.key)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {importedKeys.size > 0 && (
          <div className="border-border/40 flex items-center justify-between border-t pt-4">
            <span className="text-muted-foreground font-mono text-xs">
              {importedKeys.size} protocol{importedKeys.size > 1 ? "s" : ""}{" "}
              imported
            </span>
            <Button
              onClick={handleViewStacks}
              className="font-mono text-xs"
              size="sm"
            >
              View Stacks
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
