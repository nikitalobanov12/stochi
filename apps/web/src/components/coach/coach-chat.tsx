"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "~/components/ui/button";
import { askCoachQuestion } from "~/server/actions/coach-chat";
import { CoachEmptyState } from "~/components/coach/coach-empty-state";
import { CoachMessage } from "~/components/coach/coach-message";
import { type CoachPageContext } from "~/lib/ai/coach-page-context";

type CoachChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  highlights?: string[];
};

type CoachChatProps = {
  pageContext: CoachPageContext;
};

export function CoachChat({ pageContext }: CoachChatProps) {
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isPending, startTransition] = useTransition();

  const canSend = useMemo(() => question.trim().length >= 3, [question]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3 || isPending) {
      return;
    }

    const userMessage: CoachChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");

    startTransition(async () => {
      const result = await askCoachQuestion(trimmedQuestion, pageContext);

      const assistantMessage: CoachChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        highlights: result.highlights,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    });
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <CoachEmptyState sectionLabel={pageContext.section} />
      ) : (
        <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
          {messages.map((message) => (
            <CoachMessage
              key={message.id}
              role={message.role}
              content={message.content}
              highlights={message.highlights}
            />
          ))}

          {isPending && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Coach is analyzing your account data...
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <label
          htmlFor="coach-question"
          className="text-muted-foreground text-xs"
        >
          Ask about {pageContext.section.toLowerCase()}
        </label>
        <div className="flex items-center gap-2">
          <input
            id="coach-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What does my week suggest I should change first?"
            className="bg-background placeholder:text-muted-foreground flex-1 rounded-md border px-3 py-2 text-sm outline-none"
            disabled={isPending}
          />
          <Button type="submit" disabled={!canSend || isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {messages.length === 0 && pageContext.suggestedQuestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {pageContext.suggestedQuestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
                className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-muted-foreground text-[11px]">
        Coach uses your Stochi account data and provides guidance, not medical
        diagnosis.
      </p>
    </div>
  );
}
