"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, WandSparkles } from "lucide-react";

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
  isOpen: boolean;
};

export function CoachChat({ pageContext, isOpen }: CoachChatProps) {
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isProactiveLoading, setIsProactiveLoading] = useState(false);
  const hydratedRoutesRef = useRef<Set<string>>(new Set());

  const canSend = useMemo(() => question.trim().length >= 3, [question]);
  const routeKey = useMemo(
    () => `${pageContext.route}:${pageContext.entityId ?? "none"}`,
    [pageContext.route, pageContext.entityId],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (hydratedRoutesRef.current.has(routeKey)) {
      return;
    }

    hydratedRoutesRef.current.add(routeKey);
    const loadingTimer = setTimeout(() => {
      setIsProactiveLoading(true);
    }, 0);

    const proactivePrompt = `Give me a proactive check-in for the ${pageContext.section} view. Explain one likely bottleneck and one concrete next action I can take in Stochi right now.`;

    void askCoachQuestion(proactivePrompt, pageContext)
      .then((result) => {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-proactive-${Date.now()}`,
            role: "assistant",
            content: result.answer,
            highlights: result.highlights,
          },
        ]);
      })
      .finally(() => {
        setIsProactiveLoading(false);
      });

    return () => {
      clearTimeout(loadingTimer);
    };
  }, [isOpen, pageContext, routeKey]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 3 || isPending || isProactiveLoading) {
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
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-black/20 p-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_2%,rgba(0,240,255,0.18),transparent_44%),radial-gradient(circle_at_82%_100%,rgba(57,255,20,0.1),transparent_35%)]" />

        {messages.length === 0 && !isProactiveLoading && (
          <CoachEmptyState sectionLabel={pageContext.section} />
        )}

        <div className="relative z-10 space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                layout
              >
                <CoachMessage
                  role={message.role}
                  content={message.content}
                  highlights={message.highlights}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {(isPending || isProactiveLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground flex items-center gap-2 text-xs"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isProactiveLoading
                ? "Coach is scanning this page and your recent patterns..."
                : "Coach is analyzing your account data..."}
            </motion.div>
          )}
        </div>
      </div>

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
            className="bg-background/85 placeholder:text-muted-foreground flex-1 rounded-md border border-white/10 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
            disabled={isPending || isProactiveLoading}
          />
          <Button
            type="submit"
            disabled={!canSend || isPending || isProactiveLoading}
            className="border border-cyan-400/30 bg-cyan-500/15 text-cyan-50 hover:bg-cyan-500/25"
          >
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
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <WandSparkles className="h-3 w-3 text-cyan-300" />
            Try asking:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pageContext.suggestedQuestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
                className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs transition-all hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-500/10"
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
