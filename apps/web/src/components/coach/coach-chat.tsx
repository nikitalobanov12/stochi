"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { askCoachQuestion } from "~/server/actions/coach-chat";
import { CoachEmptyState } from "~/components/coach/coach-empty-state";
import { CoachMessage } from "~/components/coach/coach-message";
import {
  buildLogCommandHref,
  buildStackIntentHref,
} from "~/lib/ai/coach-deeplinks";
import { type CoachPageContext } from "~/lib/ai/coach-page-context";

type CoachChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  highlights?: string[];
  metricSnapshot?: {
    adherence: number;
    critical: number;
    medium: number;
    ratioWarnings: number;
    activeDays: number;
  };
  focusSupplement?: string | null;
  suggestedCommand?: string | null;
};

type CoachChatProps = {
  pageContext: CoachPageContext;
  isOpen: boolean;
  onNavigateFromQuickAction?: () => void;
};

export function CoachChat({
  pageContext,
  isOpen,
  onNavigateFromQuickAction,
}: CoachChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [isProactiveLoading, setIsProactiveLoading] = useState(false);
  const hydratedRoutesRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

    const proactivePrompt = `Give me a proactive check-in for the ${pageContext.section} view using ${pageContext.voiceStyle} style. Explain one likely bottleneck and one concrete next action I can take in Stochi right now.`;

    void askCoachQuestion(proactivePrompt, pageContext)
      .then((result) => {
        const assistantProactiveId = `assistant-proactive-${Date.now()}`;
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: assistantProactiveId,
            role: "assistant",
            content: result.answer,
            highlights: result.highlights,
            metricSnapshot: result.metrics,
            focusSupplement: result.focusSupplement,
            suggestedCommand: result.suggestedCommand,
          },
        ]);
        setStreamingMessageId(assistantProactiveId);
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
        metricSnapshot: result.metrics,
        focusSupplement: result.focusSupplement,
        suggestedCommand: result.suggestedCommand,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setStreamingMessageId(assistantMessage.id);
    });
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isOpen, messages, isPending, isProactiveLoading]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-wide text-cyan-200 uppercase">
          {pageContext.section}
        </span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] tracking-wide uppercase">
          {pageContext.voiceStyle}
        </span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] tracking-wide uppercase">
          7-day model
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-black/20 p-3">
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
                  metricSnapshot={message.metricSnapshot}
                  quickActions={
                    message.role === "assistant"
                      ? buildQuickActions(
                          pageContext,
                          message.focusSupplement,
                          message.suggestedCommand,
                          message.metricSnapshot,
                        )
                      : undefined
                  }
                  onQuickAction={(href) => {
                    router.push(href);
                    onNavigateFromQuickAction?.();
                  }}
                  stream={message.id === streamingMessageId}
                  onStreamComplete={() => {
                    setStreamingMessageId((currentId) =>
                      currentId === message.id ? null : currentId,
                    );
                  }}
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
              <div className="flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <motion.div
                  className="h-3 w-8 overflow-hidden"
                  initial={false}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full w-full bg-[linear-gradient(90deg,transparent_0%,rgba(0,240,255,0.45)_50%,transparent_100%)]"
                    animate={{ x: ["-120%", "140%"] }}
                    transition={{
                      duration: 1.1,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  />
                </motion.div>
              </div>
              {isProactiveLoading
                ? "Coach is scanning this page and your recent patterns..."
                : "Coach is analyzing your account data..."}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
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

function buildQuickActions(
  pageContext: CoachPageContext,
  focusSupplement?: string | null,
  suggestedCommand?: string | null,
  metricSnapshot?: {
    adherence: number;
    critical: number;
    medium: number;
    ratioWarnings: number;
    activeDays: number;
  },
): Array<{ label: string; href: string }> {
  const commandSeed = suggestedCommand ?? focusSupplement ?? "magnesium";

  if (pageContext.route === "log") {
    const commandLink = buildLogCommandHref(commandSeed);

    return [
      { label: "Prefill Quick Log", href: commandLink },
      { label: "Review Stacks", href: "/dashboard/stacks" },
    ];
  }

  if (pageContext.route === "stack-detail") {
    const stackPrimaryIntent =
      metricSnapshot && metricSnapshot.critical > 0
        ? "interactions"
        : "compounds";

    return [
      {
        label:
          stackPrimaryIntent === "interactions"
            ? "Jump To Warnings"
            : "Jump To Compounds",
        href: pageContext.entityId
          ? buildStackIntentHref(pageContext.entityId, stackPrimaryIntent)
          : "/dashboard/stacks",
      },
      {
        label: "Prep Stack Log",
        href: buildLogCommandHref(commandSeed),
      },
    ];
  }

  if (pageContext.route === "learn") {
    return [
      { label: "Open Dashboard", href: "/dashboard" },
      {
        label: "Prep Learn Follow-up",
        href: buildLogCommandHref(commandSeed),
      },
    ];
  }

  if (pageContext.route === "protocol") {
    return [
      { label: "Open Protocol", href: "/dashboard/protocol" },
      {
        label: "Prep Protocol Log",
        href: buildLogCommandHref(commandSeed),
      },
    ];
  }

  return [
    { label: "Open Dashboard", href: "/dashboard" },
    { label: "Open Stacks", href: "/dashboard/stacks" },
    {
      label: "Prep Quick Log",
      href: buildLogCommandHref(commandSeed),
    },
  ];
}
