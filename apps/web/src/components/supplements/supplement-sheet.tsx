"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  ExternalLink,
  Syringe,
  Thermometer,
  FlaskConical,
  BookOpen,
  Loader2,
  Sparkles,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { LearnSection } from "~/components/learn";
import {
  getSupplementKnowledge,
  askSupplementQuestion,
  getOrGenerateResearchSummary,
  type SupplementKnowledgeResult,
  type AskQuestionResult,
  type ResearchSummaryResult,
} from "~/server/actions/supplement-learn";

type SupplementData = {
  id: string;
  name: string;
  form: string | null;
  description: string | null;
  mechanism: string | null;
  researchUrl: string | null;
  category: string | null;
  commonGoals: string[] | null;
  defaultUnit: string | null;
  // Peptide/research chemical fields
  isResearchChemical?: boolean;
  route?: string | null;
  storageInstructions?: string | null;
};

type SupplementSheetContextValue = {
  openSheet: (supplement: SupplementData) => void;
  closeSheet: () => void;
};

const SupplementSheetContext =
  createContext<SupplementSheetContextValue | null>(null);

export function useSupplementSheet() {
  const context = useContext(SupplementSheetContext);
  if (!context) {
    throw new Error(
      "useSupplementSheet must be used within SupplementSheetProvider",
    );
  }
  return context;
}

const categoryColors: Record<string, string> = {
  mineral: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  vitamin: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "amino-acid": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  adaptogen: "bg-green-500/10 text-green-500 border-green-500/20",
  nootropic: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  antioxidant: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  omega: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  peptide: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const routeLabels: Record<string, string> = {
  oral: "Oral",
  subq_injection: "Subcutaneous Injection",
  im_injection: "Intramuscular Injection",
  intranasal: "Intranasal",
  transdermal: "Transdermal",
  topical: "Topical",
};

const goalLabels: Record<string, string> = {
  focus: "Focus",
  sleep: "Sleep",
  energy: "Energy",
  stress: "Stress",
  health: "Health",
  longevity: "Longevity",
};

// ============================================================================
// Overview Tab Content
// ============================================================================

function OverviewContent({ supplement }: { supplement: SupplementData }) {
  const [summaryResult, setSummaryResult] =
    useState<ResearchSummaryResult | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      setIsLoadingSummary(true);
      try {
        const result = await getOrGenerateResearchSummary(supplement.id);
        if (mounted) {
          setSummaryResult(result);
        }
      } catch (err) {
        if (mounted) {
          // On error, we'll just show fallback content
          setSummaryResult({
            summary: null,
            generatedAt: null,
            isAIGenerated: false,
            error: err instanceof Error ? err.message : "Failed to load",
          });
        }
      } finally {
        if (mounted) {
          setIsLoadingSummary(false);
        }
      }
    }

    void loadSummary();

    return () => {
      mounted = false;
    };
  }, [supplement.id]);

  return (
    <div className="space-y-6">
      {/* Route & Storage Section (for peptides/research chemicals) */}
      {(supplement.route && supplement.route !== "oral") ||
      supplement.storageInstructions ? (
        <div className="bg-muted/50 space-y-3 rounded-lg p-4">
          {supplement.route && supplement.route !== "oral" && (
            <div className="flex items-center gap-2 text-sm">
              <Syringe className="h-4 w-4 text-violet-400" />
              <span className="font-medium">Route:</span>
              <span className="text-muted-foreground">
                {routeLabels[supplement.route] ?? supplement.route}
              </span>
            </div>
          )}
          {supplement.storageInstructions && (
            <div className="flex items-start gap-2 text-sm">
              <Thermometer className="mt-0.5 h-4 w-4 text-blue-400" />
              <span className="font-medium">Storage:</span>
              <span className="text-muted-foreground">
                {supplement.storageInstructions}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {/* Research Summary Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">
            Research Summary
          </h3>
          {summaryResult?.isAIGenerated && (
            <Badge
              variant="outline"
              className="border-violet-500/30 bg-violet-500/10 text-violet-400 text-[9px] px-1.5 py-0"
            >
              <Sparkles className="mr-1 h-2.5 w-2.5" />
              AI
            </Badge>
          )}
        </div>
        {isLoadingSummary ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Generating summary...
            </span>
          </div>
        ) : summaryResult?.summary ? (
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {summaryResult.summary}
          </div>
        ) : (
          // Fallback to description + mechanism if no summary available
          <div className="space-y-4">
            {supplement.mechanism && (
              <p className="text-sm leading-relaxed">{supplement.mechanism}</p>
            )}
            {supplement.description && (
              <p className="text-sm leading-relaxed">{supplement.description}</p>
            )}
            {!supplement.mechanism && !supplement.description && (
              <p className="text-sm text-muted-foreground">
                No research summary available for this supplement.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Goals Section */}
      {supplement.commonGoals && supplement.commonGoals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">
            Common Goals
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {supplement.commonGoals.map((goal) => (
              <Badge key={goal} variant="secondary" className="text-xs">
                {goalLabels[goal] ?? goal}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Research Link */}
      {supplement.researchUrl && (
        <div className="border-t pt-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a
              href={supplement.researchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Examine.com
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Learn Tab Content (Lazy Loaded)
// ============================================================================

function LearnTabContent({ supplementId }: { supplementId: string }) {
  const [knowledge, setKnowledge] = useState<SupplementKnowledgeResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadKnowledge() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getSupplementKnowledge(supplementId);
        if (mounted) {
          setKnowledge(result);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load content",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadKnowledge();

    return () => {
      mounted = false;
    };
  }, [supplementId]);

  const handleAskQuestion = useCallback(
    async (question: string): Promise<AskQuestionResult> => {
      return askSupplementQuestion(supplementId, question);
    },
    [supplementId],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        {error}
      </div>
    );
  }

  if (!knowledge) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        No content available
      </div>
    );
  }

  return (
    <LearnSection knowledge={knowledge} onAskQuestion={handleAskQuestion} />
  );
}

// ============================================================================
// Main Provider
// ============================================================================

export function SupplementSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [supplement, setSupplement] = useState<SupplementData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const openSheet = useCallback((data: SupplementData) => {
    setSupplement(data);
    setActiveTab("overview"); // Reset to overview when opening
    setIsOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SupplementSheetContext.Provider value={{ openSheet, closeSheet }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col overflow-hidden">
          {supplement && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <SheetTitle className="font-mono text-lg">
                      {supplement.name}
                    </SheetTitle>
                    {supplement.form && (
                      <SheetDescription className="mt-1">
                        {supplement.form}
                      </SheetDescription>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {supplement.category && (
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${categoryColors[supplement.category] ?? categoryColors.other}`}
                      >
                        {supplement.category}
                      </Badge>
                    )}
                    {supplement.isResearchChemical && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-amber-500/20 bg-amber-500/10 text-amber-500"
                      >
                        <FlaskConical className="mr-1 h-3 w-3" />
                        Research Compound
                      </Badge>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mt-4 flex flex-1 flex-col overflow-hidden"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="learn" className="flex-1">
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    Learn
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="overview" className="mt-6">
                    <OverviewContent supplement={supplement} />
                  </TabsContent>

                  <TabsContent value="learn" className="mt-6">
                    <LearnTabContent supplementId={supplement.id} />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SupplementSheetContext.Provider>
  );
}
