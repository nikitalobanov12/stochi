"use client";

/**
 * Answer Card Component
 *
 * Displays AI-generated answers with source citations.
 */

import { ExternalLink, BookOpen, Sparkles } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import type { AskQuestionResult } from "~/server/actions/supplement-learn";

type AnswerCardProps = {
  answer: AskQuestionResult;
};

const CHUNK_TYPE_LABELS: Record<string, string> = {
  overview: "Overview",
  benefits: "Benefits",
  mechanism: "Mechanism",
  dosing: "Dosage",
  timing: "Timing",
  risks: "Safety",
  interactions: "Interactions",
  faq: "FAQ",
};

export function AnswerCard({ answer }: AnswerCardProps) {
  // Deduplicate sources by URL
  const uniqueSources = answer.sources.reduce(
    (acc, source) => {
      const key = source.sourceUrl ?? source.supplementName;
      if (!acc.has(key)) {
        acc.set(key, source);
      }
      return acc;
    },
    new Map<string, (typeof answer.sources)[0]>(),
  );

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
      {/* Answer Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <span>AI-Generated Answer</span>
      </div>

      {/* Answer Content */}
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {answer.answer}
      </div>

      {/* Sources */}
      {uniqueSources.size > 0 && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span>Sources</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(uniqueSources.values()).map((source, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs"
              >
                <span className="font-medium">{source.supplementName}</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {CHUNK_TYPE_LABELS[source.chunkType] ?? source.chunkType}
                </Badge>
                {source.sourceUrl && (
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`View source for ${source.supplementName}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Debug Info (collapsed by default in prod) */}
      {process.env.NODE_ENV === "development" &&
        answer.query.originalQuery !== answer.query.rewrittenQuery && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Query expansion
            </summary>
            <div className="mt-2 space-y-1 rounded bg-black/20 p-2 font-mono">
              <div>
                <span className="text-muted-foreground">Original:</span>{" "}
                {answer.query.originalQuery}
              </div>
              <div>
                <span className="text-muted-foreground">Expanded:</span>{" "}
                {answer.query.rewrittenQuery}
              </div>
            </div>
          </details>
        )}
    </div>
  );
}
