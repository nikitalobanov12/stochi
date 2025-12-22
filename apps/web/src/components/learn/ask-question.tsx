"use client";

/**
 * Ask Question Component
 *
 * Input form for asking questions about a supplement.
 */

import { useState, useCallback, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type AskQuestionProps = {
  supplementName: string;
  onSubmit: (question: string) => Promise<void>;
  isLoading: boolean;
};

// Example questions to help users get started
const EXAMPLE_QUESTIONS = [
  "What are the main benefits?",
  "What's the best time to take it?",
  "Are there any side effects?",
  "How does it interact with other supplements?",
];

export function AskQuestion({
  supplementName,
  onSubmit,
  isLoading,
}: AskQuestionProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!question.trim() || isLoading) return;

      await onSubmit(question.trim());
      setQuestion("");
    },
    [question, isLoading, onSubmit],
  );

  const handleExampleClick = useCallback(
    async (exampleQuestion: string) => {
      if (isLoading) return;
      setQuestion(exampleQuestion);
      await onSubmit(exampleQuestion);
    },
    [isLoading, onSubmit],
  );

  return (
    <div className="space-y-4">
      {/* Example Questions */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.map((example) => (
          <button
            key={example}
            onClick={() => handleExampleClick(example)}
            disabled={isLoading}
            className="border-muted-foreground/20 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Question Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder={`Ask about ${supplementName}...`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!question.trim() || isLoading}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
