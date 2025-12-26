"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Library,
  Sparkles,
  BookOpen,
  User,
  Beaker,
  Search,
  Filter,
  Loader2,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import {
  type StackTemplate,
  stackTemplates,
  getTemplatesByAuthority,
} from "~/server/data/stack-templates";
import { type GoalKey, goals } from "~/server/data/goal-recommendations";
import { ProtocolDetailSheet } from "~/components/stacks/protocol-detail-sheet";
import { createStackFromTemplate } from "~/server/actions/onboarding";

const AUTHORITY_CONFIG = {
  high: {
    label: "Expert",
    icon: Sparkles,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  medium: {
    label: "Research",
    icon: BookOpen,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  community: {
    label: "Community",
    icon: User,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  },
};

export default function ProtocolLibraryPage() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] =
    useState<StackTemplate | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<GoalKey | "all">("all");
  const [showResearch, setShowResearch] = useState(false);

  function handleBack() {
    startTransition(() => {
      router.push("/dashboard/stacks");
    });
  }

  // Get all templates sorted by authority
  const allTemplates = getTemplatesByAuthority();

  // Filter templates based on search, goal, and research toggle
  const filteredTemplates = allTemplates.filter((template) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = template.name.toLowerCase().includes(query);
      const matchesDescription = template.description
        .toLowerCase()
        .includes(query);
      const matchesSupplements = template.supplements.some((s) =>
        s.supplementName.toLowerCase().includes(query),
      );
      if (!matchesName && !matchesDescription && !matchesSupplements) {
        return false;
      }
    }

    // Goal filter
    if (selectedGoal !== "all") {
      if (!template.goals?.includes(selectedGoal)) {
        return false;
      }
    }

    // Research filter
    if (!showResearch && template.isResearchStack) {
      return false;
    }

    return true;
  });

  // Group templates by authority
  const expertTemplates = filteredTemplates.filter(
    (t) => t.authority === "high",
  );
  const researchTemplates = filteredTemplates.filter(
    (t) => t.authority === "medium",
  );
  const communityTemplates = filteredTemplates.filter(
    (t) => t.authority === "community",
  );

  function handleCardClick(template: StackTemplate) {
    setSelectedTemplate(template);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleBack}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 text-amber-400" />
            <h1 className="font-mono text-xl font-medium tracking-tight">
              Protocol Library
            </h1>
          </div>
          <p className="text-muted-foreground font-mono text-xs">
            {stackTemplates.length} protocols from experts, research, and
            community
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 font-mono text-sm"
          />
        </div>

        {/* Goal filter */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={selectedGoal === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedGoal("all")}
            className="font-mono text-xs"
          >
            <Filter className="mr-1.5 h-3 w-3" />
            All
          </Button>
          {goals.map((goal) => (
            <Button
              key={goal.key}
              variant={selectedGoal === goal.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedGoal(goal.key)}
              className="font-mono text-xs"
            >
              {goal.name}
            </Button>
          ))}
        </div>

        {/* Research toggle */}
        <Button
          variant={showResearch ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setShowResearch(!showResearch)}
          className={cn(
            "font-mono text-xs",
            showResearch &&
              "border-violet-500/30 bg-violet-500/10 text-violet-400",
          )}
        >
          <Beaker className="mr-1.5 h-3 w-3" />
          Research
        </Button>
      </div>

      {/* Results count */}
      <p className="text-muted-foreground font-mono text-xs">
        {filteredTemplates.length} protocol
        {filteredTemplates.length !== 1 ? "s" : ""} found
      </p>

      {/* No results */}
      {filteredTemplates.length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <Library className="text-muted-foreground/50 mx-auto mb-3 h-8 w-8" />
          <p className="text-muted-foreground font-mono text-sm">
            No protocols match your filters
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedGoal("all");
            }}
            className="mt-2 font-mono text-xs"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Expert Protocols */}
      {expertTemplates.length > 0 && (
        <ProtocolSection
          title="Expert Protocols"
          subtitle="From leading researchers and practitioners"
          icon={<Sparkles className="h-4 w-4 text-amber-400" />}
          templates={expertTemplates}
          onCardClick={handleCardClick}
        />
      )}

      {/* Research-Backed Protocols */}
      {researchTemplates.length > 0 && (
        <ProtocolSection
          title="Research-Backed"
          subtitle="Based on clinical evidence and studies"
          icon={<BookOpen className="h-4 w-4 text-blue-400" />}
          templates={researchTemplates}
          onCardClick={handleCardClick}
        />
      )}

      {/* Community Protocols */}
      {communityTemplates.length > 0 && (
        <ProtocolSection
          title="Community"
          subtitle="Popular combinations from the community"
          icon={<User className="h-4 w-4 text-zinc-400" />}
          templates={communityTemplates}
          onCardClick={handleCardClick}
        />
      )}

      {/* Protocol detail sheet */}
      <ProtocolDetailSheet
        template={selectedTemplate}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onImport={createStackFromTemplate}
      />
    </div>
  );
}

// ============================================================================
// Protocol Section
// ============================================================================

function ProtocolSection({
  title,
  subtitle,
  icon,
  templates,
  onCardClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  templates: StackTemplate[];
  onCardClick: (template: StackTemplate) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h2 className="font-mono text-sm font-medium">{title}</h2>
          <p className="text-muted-foreground font-mono text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <ProtocolCard
            key={template.key}
            template={template}
            onClick={() => onCardClick(template)}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Protocol Card
// ============================================================================

function ProtocolCard({
  template,
  onClick,
}: {
  template: StackTemplate;
  onClick: () => void;
}) {
  const authority = AUTHORITY_CONFIG[template.authority ?? "community"];
  const AuthorityIcon = authority.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded-lg border p-4 text-left transition-all",
        "hover:border-border hover:bg-white/[0.02]",
        template.isResearchStack && "border-violet-500/20 bg-violet-500/[0.02]",
      )}
    >
      {/* Header with badges */}
      <div className="mb-2 flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn("gap-1 font-mono text-[10px]", authority.className)}
        >
          <AuthorityIcon className="h-2.5 w-2.5" />
          {authority.label}
        </Badge>
        {template.isResearchStack && (
          <Badge
            variant="outline"
            className="gap-1 border-violet-500/30 bg-violet-500/10 font-mono text-[10px] text-violet-400"
          >
            <Beaker className="h-2.5 w-2.5" />
            Research
          </Badge>
        )}
      </div>

      {/* Name */}
      <h3 className="font-mono text-sm font-medium">{template.name}</h3>

      {/* Description */}
      <p className="text-muted-foreground mt-1 line-clamp-2 font-mono text-xs">
        {template.description}
      </p>

      {/* Supplements preview */}
      <div className="mt-3 flex flex-wrap gap-1">
        {template.supplements.slice(0, 3).map((supp, i) => (
          <span
            key={i}
            className="text-muted-foreground rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px]"
          >
            {supp.supplementName}
          </span>
        ))}
        {template.supplements.length > 3 && (
          <span className="text-muted-foreground rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px]">
            +{template.supplements.length - 3}
          </span>
        )}
      </div>

      {/* Source */}
      {template.source && (
        <p className="text-muted-foreground mt-2 font-mono text-[10px]">
          Source: {template.source}
        </p>
      )}
    </button>
  );
}
