"use client";

import { useState, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "stochi-demo-dismissed-hints";

function getDismissedHints(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function dismissHint(hintId: string) {
  const dismissed = getDismissedHints();
  if (!dismissed.includes(hintId)) {
    dismissed.push(hintId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
  }
}

type DemoHintProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export function DemoHint({ id, children, className = "" }: DemoHintProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay so hints appear after page loads
    const timer = setTimeout(() => {
      const dismissed = getDismissedHints();
      if (!dismissed.includes(id)) {
        setIsVisible(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  if (!isVisible) return null;

  function handleDismiss() {
    setIsVisible(false);
    dismissHint(id);
  }

  return (
    <div
      className={`relative flex items-start gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 font-mono text-[11px] text-cyan-300/80 ${className}`}
    >
      <span className="mt-px shrink-0 text-cyan-400">{">"}</span>
      <div className="flex-1">{children}</div>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 text-cyan-500/40 transition-colors hover:text-cyan-300"
        aria-label="Dismiss hint"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
