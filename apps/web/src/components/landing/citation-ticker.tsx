"use client";

import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

/**
 * CitationTicker - Attio-inspired horizontal ticker showing PMID citations
 *
 * Design updates:
 * - Translucent card with softer borders
 * - Gradient accent instead of solid green
 * - Cleaner typography
 * - Smoother animations
 */

// Real PMIDs from the interaction database and additional research
const CITATIONS = [
  {
    pmid: "9701160",
    finding: "Zinc/Copper ratio imbalance detected",
    topic: "Copper deficiency",
  },
  {
    pmid: "25441954",
    finding: "Fat-soluble absorption optimized",
    topic: "Vitamin D bioavailability",
  },
  {
    pmid: "2507689",
    finding: "Calcium/Iron competition flagged",
    topic: "Mineral absorption",
  },
  {
    pmid: "32818573",
    finding: "Serotonergic stacking risk",
    topic: "Ashwagandha interactions",
  },
  {
    pmid: "15956276",
    finding: "Magnesium timing optimized",
    topic: "Mineral chronobiology",
  },
  {
    pmid: "21209192",
    finding: "K2 + D3 synergy confirmed",
    topic: "Vitamin synergies",
  },
  {
    pmid: "17023702",
    finding: "Selenium threshold monitored",
    topic: "Upper limit toxicity",
  },
  {
    pmid: "18469245",
    finding: "Caffeine + L-Theanine stack validated",
    topic: "Nootropic combinations",
  },
];

export function CitationTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % CITATIONS.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const current = CITATIONS[currentIndex];
  if (!current) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Pulsing indicator */}
        <div className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </div>

        {/* Status label */}
        <span className="shrink-0 text-xs font-medium tracking-wide text-white/30">
          Interpreting
        </span>

        {/* Citation content - animated */}
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 transition-opacity duration-300",
            isAnimating ? "opacity-0" : "opacity-100"
          )}
        >
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${current.pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-mono text-xs text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
          >
            PMID:{current.pmid}
          </a>
          <span className="text-white/20" aria-hidden="true">
            →
          </span>
          <span className="truncate text-xs text-white/50">
            {current.finding}
          </span>
        </div>

        {/* Counter */}
        <span className="shrink-0 font-mono text-[10px] text-white/30 tabular-nums">
          {currentIndex + 1}/{CITATIONS.length}
        </span>
      </div>
    </div>
  );
}

/**
 * CitationMarquee - Alternative continuous scrolling version
 *
 * Shows all citations in a continuous horizontal scroll for a more
 * "live feed" feeling.
 */
export function CitationMarquee() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] py-3">
      {/* Gradient masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0A0C10] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0A0C10] to-transparent" />

      {/* Scrolling content */}
      <div className="animate-marquee flex gap-8 whitespace-nowrap">
        {/* Duplicate for seamless loop */}
        {[...CITATIONS, ...CITATIONS].map((citation, i) => (
          <a
            key={`${citation.pmid}-${i}`}
            href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xs"
          >
            <span className="font-mono text-emerald-400 group-hover:text-emerald-300 group-hover:underline">
              PMID:{citation.pmid}
            </span>
            <span className="text-white/50">{citation.finding}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
