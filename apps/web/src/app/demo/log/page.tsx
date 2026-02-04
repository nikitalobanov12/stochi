"use client";

import { useDemoContext } from "~/components/demo/demo-provider";
import { DemoLogList } from "../demo-log-list";
import { DemoCommandBar } from "../demo-command-bar";

export default function DemoLogPage() {
  const demo = useDemoContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Activity Log</h1>
        <p className="text-muted-foreground text-sm">
          Today&apos;s supplement intake
        </p>
      </div>

      {/* Command Bar */}
      <DemoCommandBar supplements={demo.supplements} />

      {/* Log List - show all */}
      <DemoLogList maxVisible={50} />

      {/* Interactions Summary */}
      {demo.interactions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
            Active Interactions
          </h2>
          <div className="glass-card divide-y divide-white/5">
            {demo.interactions.map((interaction) => (
              <div key={interaction.id} className="p-4">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 text-xs ${
                      interaction.type === "synergy"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {interaction.type === "synergy" ? "+" : "!"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">
                        {interaction.source.name}
                      </span>
                      <span className="text-muted-foreground"> + </span>
                      <span className="font-medium">
                        {interaction.target.name}
                      </span>
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {interaction.mechanism}
                    </p>
                    {interaction.suggestion && (
                      <p className="mt-1 text-xs text-emerald-400/80">
                        {interaction.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ratio Warnings */}
      {demo.ratioWarnings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
            Ratio Warnings
          </h2>
          <div className="glass-card divide-y divide-white/5">
            {demo.ratioWarnings.map((warning, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs text-amber-400">!</span>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{warning.source.name}</span>
                      <span className="text-muted-foreground"> : </span>
                      <span className="font-medium">{warning.target.name}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-xs">
                        ({warning.currentRatio}:1)
                      </span>
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {warning.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
