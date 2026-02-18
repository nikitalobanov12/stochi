import { Sparkles, ShieldCheck, CalendarDays } from "lucide-react";

export function CoachEmptyState() {
  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <h2 className="font-mono text-sm font-medium">Stochi Coach</h2>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        I review your last 7 days of logs, interactions, and stack consistency to
        explain what your pattern means and what to adjust next.
      </p>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-black/20 p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium">Window</span>
          </div>
          <p className="text-muted-foreground">Last 7 days only</p>
        </div>

        <div className="rounded-md border border-white/10 bg-black/20 p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
            <span className="font-medium">Safety</span>
          </div>
          <p className="text-muted-foreground">Guidance, not diagnosis</p>
        </div>
      </div>
    </div>
  );
}
