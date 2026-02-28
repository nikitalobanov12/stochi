"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "~/components/ui/button";

export function ThemeModeCard() {
  const { theme, setTheme } = useTheme();

  const active = theme ?? "system";

  return (
    <div className="glass-card p-4">
      <div className="space-y-3">
        <p className="text-muted-foreground font-mono text-xs">
          Choose how Stochi looks. System follows your device setting.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={active === "system" ? "secondary" : "outline"}
            className="justify-start"
            onClick={() => setTheme("system")}
          >
            <Monitor className="h-3.5 w-3.5" />
            System
          </Button>
          <Button
            type="button"
            variant={active === "light" ? "secondary" : "outline"}
            className="justify-start"
            onClick={() => setTheme("light")}
          >
            <Sun className="h-3.5 w-3.5" />
            Light
          </Button>
          <Button
            type="button"
            variant={active === "dark" ? "secondary" : "outline"}
            className="justify-start"
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-3.5 w-3.5" />
            Dark
          </Button>
        </div>
      </div>
    </div>
  );
}
