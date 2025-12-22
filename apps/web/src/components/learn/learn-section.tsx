"use client";

/**
 * Learn Section Component
 *
 * Main container for supplement education content with
 * collapsible sections and AI-powered Q&A.
 */

import { useState, useCallback } from "react";
import {
  ChevronDown,
  ExternalLink,
  Loader2,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { AskQuestion } from "./ask-question";
import { AnswerCard } from "./answer-card";
import type {
  SupplementKnowledgeResult,
  AskQuestionResult,
} from "~/server/actions/supplement-learn";

// ============================================================================
// Types
// ============================================================================

type LearnSectionProps = {
  knowledge: SupplementKnowledgeResult;
  onAskQuestion: (question: string) => Promise<AskQuestionResult>;
};

// ============================================================================
// Section Icons & Colors
// ============================================================================

const sectionConfig: Record<string, { icon: string; color: string }> = {
  overview: { icon: "📋", color: "text-blue-400" },
  benefits: { icon: "✨", color: "text-green-400" },
  mechanism: { icon: "🔬", color: "text-purple-400" },
  dosing: { icon: "💊", color: "text-amber-400" },
  timing: { icon: "⏰", color: "text-cyan-400" },
  risks: { icon: "⚠️", color: "text-red-400" },
  interactions: { icon: "🔄", color: "text-orange-400" },
  faq: { icon: "❓", color: "text-indigo-400" },
};

// ============================================================================
// Component
// ============================================================================

export function LearnSection({ knowledge, onAskQuestion }: LearnSectionProps) {
  const [answer, setAnswer] = useState<AskQuestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["overview", "benefits"]), // Open first two by default
  );

  const handleAskQuestion = useCallback(
    async (question: string) => {
      setIsLoading(true);
      setAnswer(null);
      try {
        const result = await onAskQuestion(question);
        setAnswer(result);
      } finally {
        setIsLoading(false);
      }
    },
    [onAskQuestion],
  );

  const toggleSection = useCallback((sectionType: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
  }, []);

  // If no knowledge available
  if (!knowledge.hasKnowledge) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-medium">No Research Data Available</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          We don&apos;t have detailed research information for{" "}
          {knowledge.supplementName} yet.
        </p>
        {knowledge.sourceUrl && (
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <a
              href={knowledge.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Examine.com
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-lg font-semibold">
            Learn: {knowledge.supplementName}
          </h2>
          <p className="text-muted-foreground text-sm">
            Research-backed information
          </p>
        </div>
        {knowledge.sourceUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a
              href={knowledge.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Source
            </a>
          </Button>
        )}
      </div>

      {/* Knowledge Sections */}
      <div className="space-y-3">
        {knowledge.sections.map((section) => {
          const config = sectionConfig[section.type] ?? {
            icon: "📄",
            color: "text-gray-400",
          };
          const isOpen = openSections.has(section.type);

          return (
            <Collapsible
              key={section.type}
              open={isOpen}
              onOpenChange={() => toggleSection(section.type)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors",
                    "hover:bg-muted/50",
                    isOpen && "bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{config.icon}</span>
                    <span className="font-medium">{section.title}</span>
                    {section.chunks.some((c) => c.evidenceRating) && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Evidence-based
                      </Badge>
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      "text-muted-foreground h-5 w-5 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-muted space-y-4 rounded-b-lg border-x border-b p-4">
                  {section.chunks.map((chunk, index) => (
                    <div key={chunk.id ?? index}>
                      {chunk.title && !chunk.title.includes("(continued)") && (
                        <h4
                          className={cn(
                            "mb-2 text-sm font-semibold",
                            config.color,
                          )}
                        >
                          {chunk.title}
                        </h4>
                      )}
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {chunk.content}
                      </p>
                      {chunk.evidenceRating && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Evidence: {chunk.evidenceRating}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Q&A Section */}
      <div className="border-t pt-6">
        <h3 className="mb-4 flex items-center gap-2 font-medium">
          <span className="text-lg">💬</span>
          Ask a Question
        </h3>

        <AskQuestion
          supplementName={knowledge.supplementName}
          onSubmit={handleAskQuestion}
          isLoading={isLoading}
        />

        {isLoading && (
          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching research and generating answer...
          </div>
        )}

        {answer && !isLoading && (
          <div className="mt-4">
            {answer.error ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{answer.error}</p>
              </div>
            ) : (
              <AnswerCard answer={answer} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
