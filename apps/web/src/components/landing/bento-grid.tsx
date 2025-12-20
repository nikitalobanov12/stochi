"use client";

import { cn } from "~/lib/utils";

/**
 * BentoGrid - Responsive grid layout for landing page feature sections
 * 
 * Breakpoints:
 * - Desktop (≥1024px): 12-column grid
 * - Tablet (768-1023px): 2-column grid
 * - Mobile (<768px): Single column stack
 */

type BentoGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-5 md:gap-6 lg:gap-8 xl:gap-10",
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-12",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * BentoSection - Container for a Bento Grid section with Attio-style header
 */
type BentoSectionProps = {
  number: string;
  label: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function BentoSection({
  number,
  label,
  title,
  description,
  children,
  className,
}: BentoSectionProps) {
  return (
    <section className={cn("px-4 py-16 lg:px-8 lg:py-24", className)}>
      <div className="mx-auto max-w-[1400px]">
        {/* Attio-style section header */}
        <div className="mb-8 lg:mb-12">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-xs font-medium text-emerald-400/80">[{number}]</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">
              {label}
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white/95 sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-3 max-w-2xl text-base text-white/50 lg:text-lg">
              {description}
            </p>
          )}
        </div>

        {/* Grid content */}
        <BentoGrid>{children}</BentoGrid>
      </div>
    </section>
  );
}
