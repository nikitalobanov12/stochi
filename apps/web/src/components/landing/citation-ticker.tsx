"use client";

import { useEffect, useState } from "react";

/**
 * CitationTicker - Horizontal scrolling ticker showing real-time PMID citations
 *
 * Displays PMIDs being "interpreted" to establish scientific authority.
 * Links are clickable and go directly to PubMed.
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
    <div className="overflow-hidden rounded-lg border border-[#30363D] bg-[#0D1117]">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Pulsing indicator */}
        <div className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#39FF14] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#39FF14]" />
        </div>

        {/* Status label */}
        <span className="shrink-0 font-mono text-[10px] tracking-widest text-[#A8B1BB] uppercase">
          Interpreting
        </span>

        {/* Citation content - animated */}
        <div
          className={`flex min-w-0 flex-1 items-center gap-2 transition-opacity duration-300 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
        >
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${current.pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-mono text-xs text-[#39FF14] transition-colors hover:underline"
          >
            PMID:{current.pmid}
          </a>
          <span className="text-[#30363D]" aria-hidden="true">
            →
          </span>
          <span className="truncate font-mono text-xs text-[#E6EDF3]">
            {current.finding}
          </span>
        </div>

        {/* Counter */}
        <span className="shrink-0 font-mono text-[10px] text-[#A8B1BB]/50 tabular-nums">
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
    <div className="relative overflow-hidden rounded-lg border border-[#30363D] bg-[#0D1117] py-3">
      {/* Gradient masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0D1117] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0D1117] to-transparent" />

      {/* Scrolling content */}
      <div className="animate-marquee flex gap-8 whitespace-nowrap">
        {/* Duplicate for seamless loop */}
        {[...CITATIONS, ...CITATIONS].map((citation, i) => (
          <a
            key={`${citation.pmid}-${i}`}
            href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 font-mono text-xs"
          >
            <span className="text-[#39FF14] group-hover:underline">
              PMID:{citation.pmid}
            </span>
            <span className="text-[#A8B1BB]">{citation.finding}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
