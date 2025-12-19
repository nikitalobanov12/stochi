"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  Brain,
  Atom,
  Pill,
  Sparkles,
  Droplets,
} from "lucide-react";

// Specific compounds that signal "We built this for you" to hardcore biohackers
const COMPOUNDS = [
  { code: "BPC-157", type: "PEPTIDE", route: "INJ", icon: FlaskConical },
  { code: "SEMAX", type: "NOOTROPIC", route: "NASAL", icon: Brain },
  { code: "MAGNESIUM", type: "MINERAL", route: "ORAL", icon: Atom },
  { code: "BROMANTANE", type: "RSH_CHEM", route: "ORAL", icon: Sparkles },
  { code: "VITAMIN_D3", type: "VITAMIN", route: "ORAL", icon: Pill },
  { code: "LION_MANE", type: "NOOTROPIC", route: "ORAL", icon: Brain },
  { code: "TB-500", type: "PEPTIDE", route: "INJ", icon: FlaskConical },
  { code: "MODAFINIL", type: "NOOTROPIC", route: "ORAL", icon: Brain },
  { code: "GHK-Cu", type: "PEPTIDE", route: "TOPICAL", icon: Droplets },
  { code: "NAC", type: "AMINO", route: "ORAL", icon: Atom },
] as const;

// Type colors for badges
const TYPE_COLORS: Record<string, string> = {
  PEPTIDE: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  NOOTROPIC: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  MINERAL: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  VITAMIN: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  RSH_CHEM: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  AMINO: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

// Route colors
const ROUTE_COLORS: Record<string, string> = {
  INJ: "text-violet-400",
  NASAL: "text-cyan-400",
  ORAL: "text-[#8B949E]",
  TOPICAL: "text-emerald-400",
};

/**
 * CompoundTicker - Horizontal scrolling ticker of supported compounds
 *
 * The "Dog Whistle" strategy: Using specific compound names (BPC-157, Semax)
 * signals to the target audience that this app was built for them.
 */
export function CompoundTicker() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      setOffset((prev) => prev + 0.5);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Triple the items for seamless loop
  const items = [...COMPOUNDS, ...COMPOUNDS, ...COMPOUNDS];

  return (
    <div
      className="relative overflow-hidden py-6"
      role="marquee"
      aria-label="Supported compound types: peptides, nootropics, minerals, vitamins, research chemicals, and amino acids"
    >
      {/* Gradient masks for fade effect */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0A0C10] to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0A0C10] to-transparent"
        aria-hidden="true"
      />

      <div
        className="flex items-center gap-4"
        style={{
          transform: `translateX(-${offset % (COMPOUNDS.length * 160)}px)`,
        }}
        aria-hidden="true"
      >
        {items.map((compound, index) => {
          const Icon = compound.icon;
          return (
            <div
              key={`${compound.code}-${index}`}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 ${TYPE_COLORS[compound.type]}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="font-mono text-xs font-medium">
                {compound.code}
              </span>
              <span
                className={`font-mono text-[10px] ${ROUTE_COLORS[compound.route]}`}
              >
                {compound.route}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * CompoundBadgeGrid - Static grid of compound type badges
 *
 * Alternative to ticker for a more stable display
 */
export function CompoundBadgeGrid() {
  const categories = [
    {
      name: "Peptides",
      icon: FlaskConical,
      examples: "BPC-157, TB-500, GHK-Cu",
      color: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    },
    {
      name: "Nootropics",
      icon: Brain,
      examples: "Semax, Modafinil, Lion's Mane",
      color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    },
    {
      name: "Minerals",
      icon: Atom,
      examples: "Magnesium, Zinc, Copper",
      color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    },
    {
      name: "Vitamins",
      icon: Pill,
      examples: "D3, K2, B-Complex",
      color: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    },
    {
      name: "Research",
      icon: Sparkles,
      examples: "Bromantane, Selank, NSI-189",
      color: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    },
    {
      name: "Amino Acids",
      icon: Atom,
      examples: "NAC, L-Theanine, Taurine",
      color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    },
  ];

  return (
    <ul
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      role="list"
      aria-label="Compound categories"
    >
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <li
            key={cat.name}
            className={`rounded-lg border p-3 ${cat.color} transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono text-xs font-medium">{cat.name}</span>
            </div>
            <p className="mt-1.5 text-[10px] opacity-70">{cat.examples}</p>
          </li>
        );
      })}
    </ul>
  );
}
