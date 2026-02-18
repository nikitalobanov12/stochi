import { Bot, User, Lightbulb } from "lucide-react";

import { cn } from "~/lib/utils";

type CoachMessageProps = {
  role: "user" | "assistant";
  content: string;
  highlights?: string[];
};

export function CoachMessage({ role, content, highlights }: CoachMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={cn("flex gap-2", !isAssistant && "justify-end")}>
      {isAssistant && (
        <div className="mt-0.5 rounded-full border border-white/10 bg-amber-500/10 p-1.5">
          <Bot className="h-3.5 w-3.5 text-amber-400" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[90%] rounded-lg border px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[80%]",
          isAssistant
            ? "border-white/10 bg-white/5"
            : "border-cyan-500/30 bg-cyan-500/10",
        )}
      >
        <p>{content}</p>

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
