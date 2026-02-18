import { Activity, CalendarDays } from "lucide-react";

import { CoachChat } from "~/components/coach/coach-chat";

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="font-mono text-2xl font-semibold">AI Coach</h1>
        <p className="text-muted-foreground text-sm">
          Account-aware chat that explains your supplement patterns and gives
          practical next steps.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="text-muted-foreground inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
          <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
          Last 7 days
        </div>
        <div className="text-muted-foreground inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
          <Activity className="h-3.5 w-3.5 text-amber-400" />
          Logs + warnings + adherence
        </div>
      </div>

      <CoachChat />
    </div>
  );
}
