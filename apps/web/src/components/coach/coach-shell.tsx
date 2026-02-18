"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
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
          onClick={() => setIsOpen(true)}
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

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full border-l border-cyan-500/20 bg-[#0d1117]/95 sm:max-w-md"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2 font-mono">
              <MessageCircle className="h-4 w-4 text-cyan-300" />
              Stochi Coach
            </SheetTitle>
            <SheetDescription>
              Context-aware guidance for {pageContext.section.toLowerCase()}{" "}
              using your current page and last 7 days.
            </SheetDescription>
          </SheetHeader>

          <div className="pb-safe px-4">
            <CoachChat pageContext={pageContext} isOpen={isOpen} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
