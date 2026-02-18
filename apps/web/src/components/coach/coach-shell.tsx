"use client";

import { useMemo, useState } from "react";
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
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-50 h-11 rounded-full border border-cyan-400/30 bg-black/80 px-4 text-cyan-100 shadow-lg backdrop-blur md:bottom-6"
      >
        <Sparkles className="mr-1.5 h-4 w-4 text-cyan-300" />
        Coach
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
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
            <CoachChat pageContext={pageContext} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
