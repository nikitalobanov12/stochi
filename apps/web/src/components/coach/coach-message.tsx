import { useEffect, useMemo, useState } from "react";
import { Bot, User, Lightbulb } from "lucide-react";

import { cn } from "~/lib/utils";
import { buildStreamingFrames } from "~/lib/ai/coach-streaming";

type CoachMessageProps = {
  role: "user" | "assistant";
  content: string;
  highlights?: string[];
  stream?: boolean;
  onStreamComplete?: () => void;
};

export function CoachMessage({
  role,
  content,
  highlights,
  stream = false,
  onStreamComplete,
}: CoachMessageProps) {
  const isAssistant = role === "assistant";
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = useMemo(() => buildStreamingFrames(content, 3), [content]);

  useEffect(() => {
    if (!stream || !isAssistant || frames.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setFrameIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= frames.length - 1) {
          clearInterval(interval);
          onStreamComplete?.();
          return frames.length - 1;
        }
        return nextIndex;
      });
    }, 38);

    return () => {
      clearInterval(interval);
    };
  }, [frames.length, isAssistant, onStreamComplete, stream]);

  const renderedContent =
    stream && isAssistant ? (frames[frameIndex] ?? content) : content;

  const sections = useMemo(() => {
    if (!isAssistant) {
      return null;
    }

    const meaningMarker = "WHAT THIS MEANS";
    const nextMarker = "WHAT TO DO NEXT";
    const meaningIndex = renderedContent.indexOf(meaningMarker);
    const nextIndex = renderedContent.indexOf(nextMarker);

    if (meaningIndex === -1 || nextIndex === -1) {
      return null;
    }

    const meaning = renderedContent
      .slice(meaningIndex + meaningMarker.length, nextIndex)
      .trim();
    const nextRaw = renderedContent.slice(nextIndex + nextMarker.length).trim();
    const nextItems = nextRaw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[-*]\s*/, ""));

    return {
      meaning,
      nextItems,
    };
  }, [isAssistant, renderedContent]);

  return (
    <div className={cn("flex gap-2", !isAssistant && "justify-end")}>
      {isAssistant && (
        <div className="mt-0.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 p-1.5 shadow-[0_0_16px_rgba(0,240,255,0.15)]">
          <Bot className="h-3.5 w-3.5 text-amber-400" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[90%] rounded-lg border px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[80%]",
          isAssistant
            ? "border-cyan-500/25 bg-[linear-gradient(165deg,rgba(255,255,255,0.05),rgba(8,20,26,0.55))]"
            : "border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_18px_rgba(0,240,255,0.08)]",
        )}
      >
        {sections ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[10px] tracking-[0.12em] text-cyan-300/90 uppercase">
                What This Means
              </p>
              <p>{sections.meaning}</p>
            </div>

            {sections.nextItems.length > 0 && (
              <div className="space-y-1.5 rounded-md border border-cyan-400/20 bg-cyan-500/5 p-2">
                <p className="text-[10px] tracking-[0.12em] text-cyan-300/90 uppercase">
                  What To Do Next
                </p>
                {sections.nextItems.map((item) => (
                  <p key={item} className="text-xs leading-relaxed">
                    - {item}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p>{renderedContent}</p>
        )}

        {isAssistant && highlights && highlights.length > 0 && (
          <div className="mt-3 space-y-1 rounded-md border border-white/10 bg-black/20 p-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />
              Key actions
            </div>
            {highlights.map((highlight) => (
              <p key={highlight} className="text-muted-foreground text-xs">
                - {highlight}
              </p>
            ))}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="mt-0.5 rounded-full border border-white/10 bg-cyan-500/10 p-1.5">
          <User className="h-3.5 w-3.5 text-cyan-300" />
        </div>
      )}
    </div>
  );
}
