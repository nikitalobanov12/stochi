"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Minimize2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "~/components/ui/button";
import { CoachChat } from "~/components/coach/coach-chat";
import { buildCoachPageContext } from "~/lib/ai/coach-page-context";

export function CoachShell() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingBriefings, setPendingBriefings] = useState(0);
  const lastPathnameRef = useRef(pathname);
  const pageContext = useMemo(
    () => buildCoachPageContext(pathname),
    [pathname],
  );
  const voiceLabel = pageContext.voiceStyle.replace("-", " ");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        setPendingBriefings(0);
        lastPathnameRef.current = pathname;
        return;
      }

      if (lastPathnameRef.current !== pathname) {
        lastPathnameRef.current = pathname;
        setPendingBriefings((count) => Math.min(9, count + 1));
      }
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, pathname]);

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const targetTag = target?.tagName;
      const isTypingTarget =
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => {
      window.removeEventListener("keydown", handleGlobalShortcut);
    };
  }, []);

  return (
    <>
      <motion.div
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-50 md:bottom-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full bg-cyan-400/20 blur-xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />

        <Button
          type="button"
          onClick={() => {
            setPendingBriefings(0);
            setIsOpen((open) => !open);
          }}
          title="Coach (Ctrl+Shift+C)"
          className="relative h-12 rounded-full border border-cyan-400/35 bg-black/80 px-4 text-cyan-100 shadow-[0_0_30px_rgba(0,240,255,0.12)] backdrop-blur"
        >
          <motion.span
            className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#39FF14]"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <Sparkles className="mr-1.5 h-4 w-4 text-cyan-300" />
          Coach
          {pendingBriefings > 0 && !isOpen && (
            <span className="ml-2 rounded-full border border-cyan-300/30 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
              +{pendingBriefings}
            </span>
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close coach overlay"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            />

            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+9rem)] z-50 w-[calc(100vw-2rem)] max-w-[430px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0d1117]/95 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur md:bottom-22"
            >
              <div className="relative border-b border-cyan-500/20 px-4 pt-3 pb-3">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(0,240,255,0.12),transparent_45%)]" />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 font-mono text-sm">
                      <MessageCircle className="h-4 w-4 text-cyan-300" />
                      Stochi Coach
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-wide text-cyan-200 uppercase">
                        {voiceLabel}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] tracking-wide uppercase">
                        contextual mode
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Live coaching for {pageContext.section.toLowerCase()}{" "}
                      using current-page context and your last 7 days.
                    </p>
                    <p className="text-muted-foreground/70 font-mono text-[10px] tracking-wide uppercase">
                      Shortcut: Ctrl+Shift+C
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground rounded-md border border-white/10 bg-white/5 p-1.5 transition-colors"
                    aria-label="Minimize coach"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="pb-safe h-[min(68vh,620px)] px-4 pt-3">
                <CoachChat
                  pageContext={pageContext}
                  isOpen={isOpen}
                  onNavigateFromQuickAction={() => setIsOpen(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
