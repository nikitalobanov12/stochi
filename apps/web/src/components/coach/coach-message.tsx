import { useEffect, useMemo, useState } from "react";
import { Bot, User, Lightbulb } from "lucide-react";

import { cn } from "~/lib/utils";
import { getTypingStepDelayMs } from "~/lib/ai/coach-typing";

type CoachMessageProps = {
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
  quickActions?: Array<{ label: string; href: string }>;
  onQuickAction?: (href: string) => void;
  stream?: boolean;
  onStreamComplete?: () => void;
};

export function CoachMessage({
  role,
  content,
  highlights,
  metricSnapshot,
  quickActions,
  onQuickAction,
  stream = false,
  onStreamComplete,
}: CoachMessageProps) {
  const isAssistant = role === "assistant";
  const [typedCharacterCount, setTypedCharacterCount] = useState(0);

  useEffect(() => {
    if (!stream || !isAssistant) {
      return;
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    timeoutHandle = setTimeout(() => {
      setTypedCharacterCount(0);
    }, 0);

    const step = (currentIndex: number) => {
      if (currentIndex >= content.length) {
        onStreamComplete?.();
        return;
      }

      const nextIndex = currentIndex + 1;
      setTypedCharacterCount(nextIndex);
      const currentCharacter = content[nextIndex - 1] ?? "";
      const delayMs = getTypingStepDelayMs(currentCharacter);
      timeoutHandle = setTimeout(() => step(nextIndex), delayMs);
    };

    timeoutHandle = setTimeout(() => step(0), 30);

    return () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [content, isAssistant, onStreamComplete, stream]);

  const renderedContent =
    stream && isAssistant ? content.slice(0, typedCharacterCount) : content;

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
            {metricSnapshot && (
              <div className="flex flex-wrap gap-1.5">
                <MetricChip
                  label={`adherence ${metricSnapshot.adherence}%`}
                  value={metricSnapshot.adherence}
                  tone="cyan"
                />
                <MetricChip
                  label={`active days ${metricSnapshot.activeDays}`}
                  value={Math.round((metricSnapshot.activeDays / 7) * 100)}
                  tone="slate"
                />
                <MetricChip
                  label={`critical ${metricSnapshot.critical}`}
                  value={Math.min(metricSnapshot.critical * 25, 100)}
                  tone="amber"
                />
                <MetricChip
                  label={`medium ${metricSnapshot.medium}`}
                  value={Math.min(metricSnapshot.medium * 20, 100)}
                  tone="yellow"
                />
                {metricSnapshot.ratioWarnings > 0 && (
                  <MetricChip
                    label={`ratio ${metricSnapshot.ratioWarnings}`}
                    value={Math.min(metricSnapshot.ratioWarnings * 20, 100)}
                    tone="fuchsia"
                  />
                )}
              </div>
            )}

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

        {isAssistant && quickActions && quickActions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action.href}
                type="button"
                onClick={() => onQuickAction?.(action.href)}
                className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] transition-colors hover:bg-cyan-500/20"
              >
                {action.label}
              </button>
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

function MetricChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "slate" | "amber" | "yellow" | "fuchsia";
}) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const toneClasses: Record<typeof tone, string> = {
    cyan: "border-cyan-400/25 bg-cyan-500/10",
    slate: "border-white/15 bg-white/5",
    amber: "border-amber-400/25 bg-amber-500/10",
    yellow: "border-yellow-400/25 bg-yellow-500/10",
    fuchsia: "border-fuchsia-400/25 bg-fuchsia-500/10",
  };

  return (
    <span
      className={cn(
        "relative overflow-hidden rounded-full border px-2 py-0.5 text-[10px] uppercase",
        toneClasses[tone],
      )}
    >
      <span
        className="absolute inset-y-0 left-0 bg-white/10"
        style={{ width: `${clampedValue}%` }}
      />
      <span className="relative z-10">{label}</span>
    </span>
  );
}
