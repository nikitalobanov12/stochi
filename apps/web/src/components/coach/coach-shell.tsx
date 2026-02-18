"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Minimize2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "~/components/ui/button";
import { CoachChat } from "~/components/coach/coach-chat";
import { buildCoachPageContext } from "~/lib/ai/coach-page-context";

export function CoachShell() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const pageContext = useMemo(
    () => buildCoachPageContext(pathname),
    [pathname],
  );

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
          onClick={() => setIsOpen((open) => !open)}
          className="relative h-12 rounded-full border border-cyan-400/35 bg-black/80 px-4 text-cyan-100 shadow-[0_0_30px_rgba(0,240,255,0.12)] backdrop-blur"
        >
          <motion.span
            className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#39FF14]"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <Sparkles className="mr-1.5 h-4 w-4 text-cyan-300" />
          Coach
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
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
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Live coaching for {pageContext.section.toLowerCase()} using
                    current-page context and your last 7 days.
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
              <CoachChat pageContext={pageContext} isOpen={isOpen} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
