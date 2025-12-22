"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "~/components/ui/button";
import { HeroInteractionAlert } from "~/components/landing/hero-interaction-alert";
import { CitationTicker } from "~/components/landing/citation-ticker";
import { CapabilityTable } from "~/components/landing/capability-table";
import {
  CompoundTicker,
  CompoundBadgeGrid,
} from "~/components/landing/compound-ticker";
import { BentoSection } from "~/components/landing/bento-grid";
import { BentoCard } from "~/components/landing/bento-card";
import { LandingTimeline } from "~/components/landing/landing-timeline";
import { LandingBioScore } from "~/components/landing/landing-bio-score";
import { MechanisticFeed } from "~/components/landing/mechanistic-feed";
import { ExpertStacks } from "~/components/landing/expert-stacks";
import { RiskCardCompact } from "~/components/landing/risk-card-compact";

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ============================================================================
// Data
// ============================================================================

// Citation data for medical claims
const CITATIONS = {
  zincCopper: {
    id: "PMID:9701160",
    title: "Copper deficiency induced by zinc therapy",
    source: "J Trace Elem Med Biol, 1998",
  },
  vitaminD: {
    id: "PMID:25441954",
    title: "Effect of fat on vitamin D absorption",
    source: "J Bone Miner Res, 2015",
  },
  calciumIron: {
    id: "PMID:2507689",
    title: "Calcium inhibits iron absorption",
    source: "Am J Clin Nutr, 1989",
  },
  ashwagandha: {
    id: "PMID:32818573",
    title: "Ashwagandha serotonergic activity",
    source: "J Ethnopharmacol, 2020",
  },
};

// Interactive demo - local interaction dictionary (~20 common pairs)
const INTERACTION_DATABASE: Record<
  string,
  { type: "synergy" | "warning" | "critical"; message: string; action: string }
> = {
  "zinc+copper": {
    type: "warning",
    message: "Zinc competes with Copper for absorption",
    action: "Add 2mg Copper per 30mg Zinc",
  },
  "zinc+magnesium": {
    type: "warning",
    message: "Same transporter, reduced absorption",
    action: "Separate by 2+ hours",
  },
  "caffeine+l-theanine": {
    type: "synergy",
    message: "Smooth focus without jitters",
    action: "Classic nootropic stack",
  },
  "calcium+iron": {
    type: "critical",
    message: "Calcium blocks Iron absorption by 40-60%",
    action: "Separate by 4+ hours",
  },
  "vitamin d+k2": {
    type: "synergy",
    message: "K2 directs Calcium to bones, not arteries",
    action: "Take together with fat",
  },
  "vitamin d+magnesium": {
    type: "synergy",
    message: "Magnesium required for D3 activation",
    action: "Optimal pairing",
  },
  "iron+vitamin c": {
    type: "synergy",
    message: "Vitamin C enhances Iron absorption",
    action: "Take together",
  },
  "ashwagandha+5-htp": {
    type: "warning",
    message: "Both increase serotonin levels",
    action: "Monitor for serotonin syndrome",
  },
  "melatonin+magnesium": {
    type: "synergy",
    message: "Enhanced sleep quality",
    action: "Take 30min before bed",
  },
  "bpc-157+tb-500": {
    type: "synergy",
    message: "Complementary healing pathways",
    action: "Research-grade recovery stack",
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function LandingPage() {
  const heroCTARef = useRef<HTMLDivElement>(null);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky CTA when hero CTA is NOT visible
        setShowStickyCTA(!entry?.isIntersecting);
      },
      { threshold: 0, rootMargin: "-50px 0px 0px 0px" },
    );

    if (heroCTARef.current) {
      observer.observe(heroCTARef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative min-h-screen bg-black pt-safe pb-safe font-sans text-white/90">
      {/* Grid overlay for background texture */}
      <div className="lab-grid" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10">
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Sticky CTA - appears when hero CTA scrolls out of view */}
        <AnimatePresence>
          {showStickyCTA && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-4 right-4 z-50"
            >
              <Button
                asChild
                size="sm"
                className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-xs font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110"
              >
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation - scrollable */}
        <nav
          aria-label="Main navigation"
          className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl"
        >
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Stochi"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="text-sm font-medium tracking-tight text-white/90">
                stochi<span className="text-emerald-400">_</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs text-white/50 hover:text-white/90"
              >
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-xs font-medium text-white transition-all hover:brightness-110"
              >
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section - Clinical Precision v2.0: Strict 7/5 (60/40) Grid */}
        <section
          id="main-content"
          aria-labelledby="hero-heading"
          className="flex min-h-screen flex-col items-center justify-center px-4"
        >
          <div className="mx-auto w-full max-w-5xl">
            {/* 12-Column Grid: 7 cols copy, 5 cols visual */}
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
              {/* Left: Copy (7 columns = ~58%) */}
              <div className="lg:col-span-7">
                {/* The Hook - Loss Aversion Headline */}
                <motion.h1
                  id="hero-heading"
                  className="mt-8 text-3xl leading-[1.1] font-semibold tracking-tight sm:text-4xl md:mt-0 md:text-5xl lg:text-5xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <span className="text-white/95">
                    Stop Blinding Your Biology.
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Master 89,000+ Supplement Interactions.
                  </span>
                </motion.h1>

                {/* Subhead - Authority with specific scientific risks */}
                <motion.p
                  className="mt-6 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.2,
                  }}
                >
                  Generic apps miss nutrient blocking and toxicity. Stochi
                  analyzes your stack against PubMed-backed data to optimize
                  ratios like{" "}
                  <span className="font-mono text-white/80">Zn:Cu</span> and
                  prevent serotonergic risks in real-time.
                </motion.p>

                {/* Primary CTA - Attio-style clean button */}
                <div ref={heroCTARef}>
                  <motion.div
                    className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 0.4,
                    }}
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110"
                    >
                      <Link href="/auth/sign-up">Run Your Stack Audit</Link>
                    </Button>
                    <span className="text-xs tracking-wide text-white/30">
                      Free forever • No credit card required
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Right: Hero Visual (5 columns = ~42%) */}
              <div className="lg:col-span-5">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.9,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.8,
                  }}
                >
                  <HeroInteractionAlert />
                </motion.div>
              </div>
            </div>

            {/* Citation Ticker - Authority signal (full width below grid) */}
            <motion.div
              className="mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.2 }}
            >
              <CitationTicker />
            </motion.div>
          </div>
        </section>

        {/* Trust Badges - Authority Anchors */}
        <motion.section
          aria-label="Data sources and research partnerships"
          className="mt-16 border-y border-white/10 bg-[#0A0A0A] py-12 md:mt-24 md:py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.0 }}
        >
          <div className="mx-auto max-w-5xl px-4">
            <p className="mb-8 text-center text-sm font-medium tracking-wide text-white/50 md:mb-12">
              Powered by peer-reviewed research from
            </p>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {/* NIH */}
              <a
                href="https://www.nih.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex h-16 w-16 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-14 w-14">
                    <rect
                      x="10"
                      y="20"
                      width="80"
                      height="60"
                      rx="4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/60 transition-colors group-hover:text-white/80"
                    />
                    <text
                      x="50"
                      y="58"
                      textAnchor="middle"
                      className="text-white/80 transition-colors group-hover:text-white"
                      style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        fontFamily: "system-ui",
                      }}
                    >
                      NIH
                    </text>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/80 transition-colors group-hover:text-white">
                    National Institutes of Health
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    U.S. Department of Health
                  </p>
                </div>
              </a>

              {/* PubMed */}
              <a
                href="https://pubmed.ncbi.nlm.nih.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex h-16 w-16 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-14 w-14">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-400/60 transition-colors group-hover:text-blue-400/80"
                    />
                    <text
                      x="50"
                      y="45"
                      textAnchor="middle"
                      className="text-blue-400/80 transition-colors group-hover:text-blue-400"
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        fontFamily: "system-ui",
                      }}
                    >
                      PubMed
                    </text>
                    <text
                      x="50"
                      y="62"
                      textAnchor="middle"
                      className="text-white/50"
                      style={{ fontSize: "10px", fontFamily: "system-ui" }}
                    >
                      NCBI
                    </text>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/80 transition-colors group-hover:text-white">
                    PubMed Database
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    36M+ biomedical citations
                  </p>
                </div>
              </a>

              {/* EFSA */}
              <a
                href="https://www.efsa.europa.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex h-16 w-16 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-14 w-14">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-500/60 transition-colors group-hover:text-blue-500/80"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="6"
                      fill="currentColor"
                      className="text-yellow-400/70 transition-colors group-hover:text-yellow-400"
                    />
                    {[...Array(12)].map((_, i) => (
                      <circle
                        key={i}
                        cx={50 + 25 * Math.cos((i * 30 * Math.PI) / 180)}
                        cy={50 + 25 * Math.sin((i * 30 * Math.PI) / 180)}
                        r="3"
                        fill="currentColor"
                        className="text-yellow-400/70 transition-colors group-hover:text-yellow-400"
                      />
                    ))}
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/80 transition-colors group-hover:text-white">
                    EFSA
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    European Food Safety Authority
                  </p>
                </div>
              </a>

              {/* Examine.com */}
              <a
                href="https://examine.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex h-16 w-16 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-14 w-14">
                    <rect
                      x="15"
                      y="25"
                      width="70"
                      height="50"
                      rx="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-emerald-400/60 transition-colors group-hover:text-emerald-400/80"
                    />
                    <path
                      d="M30 40 L45 55 L70 30"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      className="text-emerald-400/80 transition-colors group-hover:text-emerald-400"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/80 transition-colors group-hover:text-white">
                    Examine.com
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Evidence-based nutrition
                  </p>
                </div>
              </a>
            </div>
          </div>
        </motion.section>

        {/* Bento Grid - Feature Showcase */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
        >
          <BentoSection
            number="01"
            label="Real-time Analysis"
            title="See Your Stack in Motion"
            description="Pharmacokinetic modeling, interaction detection, and biological state optimization—all running continuously."
          >
            {/* Row 1: Timeline (2/3) + Bio Score (1/3) */}
            <BentoCard span="two-thirds" aspect="timeline" showGlow>
              <div className="p-4 lg:p-6">
                <LandingTimeline />
              </div>
            </BentoCard>
            <BentoCard span="one-third" aspect="score">
              <div className="p-4 lg:p-6">
                <LandingBioScore />
              </div>
            </BentoCard>

            {/* Row 2: Feed (1/3) + Expert Stacks (1/3) + Risk Detection (1/3) */}
            <BentoCard span="one-third" aspect="feed">
              <div className="p-4 lg:p-5">
                <MechanisticFeed />
              </div>
            </BentoCard>
            <BentoCard span="one-third" aspect="stack">
              <div className="p-4 lg:p-5">
                <ExpertStacks limit={3} />
              </div>
            </BentoCard>
            <BentoCard span="one-third" aspect="stack">
              <div className="p-4 lg:p-5">
                <RiskCardCompact limit={3} />
              </div>
            </BentoCard>
          </BentoSection>
        </motion.div>

        {/* Interactive Terminal Section - MOVED TO SECTION 2 (Freemium Hook) */}
        <motion.section
          aria-labelledby="analyzer-heading"
          className="px-4 py-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="mx-auto w-full max-w-2xl">
            <h2
              id="analyzer-heading"
              className="mb-4 text-center text-xl font-semibold text-white/90 sm:text-2xl md:text-3xl"
            >
              Try the analyzer.
            </h2>
            <p className="mx-auto mb-8 text-center text-sm text-white/50 sm:text-base">
              See how Stochi detects interactions instantly. No signup required.
            </p>

            <TerminalAnalyzer interactionDb={INTERACTION_DATABASE} autoDemo />
          </div>
        </motion.section>

        {/* Beyond Vitamins Section */}
        <motion.section
          aria-labelledby="beyond-vitamins-heading"
          className="px-4 py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="mx-auto max-w-4xl">
            <motion.h2
              id="beyond-vitamins-heading"
              className="mb-4 text-2xl font-semibold text-white/90 sm:text-3xl"
              variants={fadeInUp}
            >
              Beyond vitamins.
            </motion.h2>
            <motion.p
              className="mb-8 max-w-2xl text-base leading-relaxed text-white/50"
              variants={fadeInUp}
            >
              First-class support for compounds others ignore. Track research
              chemicals, peptides, and nootropics with specific routes of
              administration and experimental safety protocols.
            </motion.p>

            {/* Compound Ticker */}
            <motion.div variants={fadeIn}>
              <CompoundTicker />
            </motion.div>

            {/* Compound Category Grid */}
            <motion.div className="mt-8" variants={fadeIn}>
              <CompoundBadgeGrid />
            </motion.div>

            {/* Capability Comparison Table */}
            <motion.div className="mt-12" variants={fadeInUp}>
              <h3 className="mb-4 text-sm font-semibold text-white/90">
                Why Stochi vs. alternatives
              </h3>
              <CapabilityTable />
            </motion.div>
          </div>
        </motion.section>

        {/* Protocol Engine Section */}
        <motion.section
          aria-labelledby="protocol-heading"
          className="px-4 py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              {/* Text */}
              <motion.div variants={fadeInUp}>
                <h2
                  id="protocol-heading"
                  className="mb-4 text-2xl font-semibold text-white/90 sm:text-3xl"
                >
                  Execute. Don&apos;t log.
                </h2>
                <p className="mb-6 text-base leading-relaxed text-white/50">
                  Batch your intake into Protocols. Log your entire morning
                  stack in 300ms. Frictionless compliance.
                </p>
                <ul className="space-y-3 text-base text-white/60" role="list">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400" aria-hidden="true">
                      +
                    </span>
                    One-tap logging for entire stacks
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400" aria-hidden="true">
                      +
                    </span>
                    Progress tracking with visual indicators
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400" aria-hidden="true">
                      +
                    </span>
                    Morning, evening, and custom protocols
                  </li>
                </ul>
              </motion.div>

              {/* Animated Protocol Demo */}
              <motion.div variants={fadeInUp}>
                <ProtocolDemo />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Manual Tracking Failed Section */}
        <motion.section
          aria-labelledby="tracking-failed-heading"
          className="px-4 py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="mx-auto max-w-4xl">
            <motion.h2
              id="tracking-failed-heading"
              className="mb-4 text-2xl font-semibold text-white/95 sm:text-3xl"
              variants={fadeInUp}
            >
              Manual tracking failed you.
            </motion.h2>
            <motion.p
              className="mb-12 max-w-2xl text-base leading-relaxed text-white/50"
              variants={fadeInUp}
            >
              You tracked the dosage. You missed the pharmacokinetics. Your
              spreadsheet doesn&apos;t know that Magnesium competes with Zinc
              for the same transporter. We do.
            </motion.p>

            <motion.div
              className="grid gap-6 md:grid-cols-2"
              variants={staggerContainer}
            >
              {/* What You Tracked */}
              <motion.div
                className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6"
                variants={staggerItem}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-widest text-white/40 uppercase">
                    What You Tracked
                  </span>
                  <span className="text-[10px] font-medium text-white/30">
                    INCOMPLETE
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/80">Zinc Picolinate</span>
                    <span className="font-mono text-white/50 tabular-nums">
                      50mg
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/80">Magnesium Glycinate</span>
                    <span className="font-mono text-white/50 tabular-nums">
                      400mg
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-white/80">Vitamin D3</span>
                    <span className="font-mono text-white/50 tabular-nums">
                      5000IU
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Iron</span>
                    <span className="font-mono text-white/50 tabular-nums">
                      18mg
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center text-xs text-white/40">
                  No interaction data. No ratio analysis.
                </div>
              </motion.div>

              {/* What You Missed */}
              <motion.div
                className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6"
                role="list"
                aria-label="What you missed: 3 errors"
                variants={staggerItem}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-widest text-red-400 uppercase">
                    What You Missed
                  </span>
                  <span className="text-[10px] font-medium text-red-400">
                    3 ERRORS
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2" role="listitem">
                    <span className="mt-0.5 text-red-400" aria-hidden="true">
                      ×
                    </span>
                    <div>
                      <span className="text-white/80">
                        Zn:Cu ratio <span className="font-mono">50:1</span>
                      </span>
                      <p className="mt-0.5 text-white/50">
                        No copper to balance zinc intake
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2" role="listitem">
                    <span className="mt-0.5 text-amber-400" aria-hidden="true">
                      !
                    </span>
                    <div>
                      <span className="text-white/80">Mg + Zn competition</span>
                      <p className="mt-0.5 text-white/50">
                        Same transporter, reduced absorption
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2" role="listitem">
                    <span className="mt-0.5 text-amber-400" aria-hidden="true">
                      !
                    </span>
                    <div>
                      <span className="text-white/80">D3 timing unknown</span>
                      <p className="mt-0.5 text-white/50">
                        Fat-soluble, requires meal context
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Pharmacological Vectors Section - Renamed for Loss Aversion */}
        <motion.section
          aria-labelledby="failure-modes-heading"
          className="px-4 py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="mx-auto max-w-4xl">
            <motion.h2
              id="failure-modes-heading"
              className="mb-4 text-2xl font-bold text-white/90 sm:text-3xl"
              variants={fadeInUp}
            >
              Your Spreadsheet is Missing These Lethal Errors.
            </motion.h2>
            <motion.p
              className="mb-12 max-w-2xl text-base text-white/50"
              variants={fadeInUp}
            >
              These pharmacokinetic patterns exist in most stacks. Your
              spreadsheet cannot detect them. Stochi scans for all of them in
              real-time.
            </motion.p>

            <motion.div
              className="grid gap-4 md:grid-cols-2"
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem}>
                <RiskCard
                  type="danger"
                  label="The Absorption Block"
                  title="Zinc depleting Copper stores"
                  description="High-dose Zinc (30mg+) without Copper causes gradual depletion. Symptoms appear after months: fatigue, anemia, neurological issues."
                  detection="Zn:Cu ratio exceeds 15:1"
                  recommendation="Add 2mg Copper per 30mg Zinc"
                  citation={CITATIONS.zincCopper}
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <RiskCard
                  type="danger"
                  label="The Toxicity Threshold"
                  title="Cumulative Upper Limit breach"
                  description="Vitamin A and Selenium from multiple sources can silently reach the Upper Limit (UL). Liver toxicity and selenosis develop without warning."
                  detection="Combined sources exceed UL"
                  recommendation="Audit all Vitamin A / Selenium sources"
                  citation={CITATIONS.vitaminD}
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <RiskCard
                  type="warning"
                  label="The Half-Life Conflict"
                  title="Fat-soluble vitamin without fat"
                  description="Vitamin D, K, E, A require dietary fat for absorption. Taking on empty stomach reduces bioavailability by up to 50%."
                  detection="D3/K2 logged without meal flag"
                  recommendation="Take with fatty meal"
                  citation={CITATIONS.calciumIron}
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <RiskCard
                  type="danger"
                  label="Pharmacodynamic Risk"
                  title="Serotonergic compound stacking"
                  description="Ashwagandha, 5-HTP, St. John's Wort enhance serotonin. Combined with SSRIs, risk of serotonin syndrome increases."
                  detection="Multiple serotonergic agents"
                  recommendation="Physician review required"
                  citation={CITATIONS.ashwagandha}
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Case Study Section */}
        <motion.section
          aria-labelledby="case-study-heading"
          className="px-4 py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="mx-auto max-w-4xl">
            <h2
              id="case-study-heading"
              className="mb-12 text-2xl font-semibold text-white/90 sm:text-3xl"
            >
              Field report.
            </h2>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
              {/* Case header */}
              <div className="border-b border-white/10 bg-white/[0.02] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-sm text-white/90">
                      492
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/90">
                        Subject 492
                      </div>
                      <div className="text-xs text-white/50">
                        The &quot;Optimized&quot; Stack
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                    3 Critical Errors
                  </div>
                </div>
              </div>

              {/* Case body */}
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Profile */}
                  <div>
                    <div className="mb-3 text-xs font-medium tracking-wide text-white/40 uppercase">
                      Profile
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Tracking method</span>
                        <span className="text-white/90">Excel spreadsheet</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Duration</span>
                        <span className="font-mono text-white/90 tabular-nums">
                          4 years
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Daily compounds</span>
                        <span className="font-mono text-white/90 tabular-nums">
                          12+
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Self-assessment</span>
                        <span className="text-white/90">
                          &quot;Plateaued, fatigued&quot;
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Findings */}
                  <div>
                    <div className="mb-3 text-xs font-medium tracking-wide text-red-400 uppercase">
                      Stochi Findings
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2">
                        <span className="font-medium text-red-400">
                          CRITICAL:
                        </span>{" "}
                        <span className="text-white/80">
                          <span className="font-mono">50mg</span> Zinc daily,{" "}
                          <span className="font-mono">0mg</span> Copper
                        </span>
                      </div>
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                        <span className="font-medium text-amber-400">
                          WARNING:
                        </span>{" "}
                        <span className="text-white/80">
                          D3 taken at <span className="font-mono">10pm</span>{" "}
                          (no meal)
                        </span>
                      </div>
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                        <span className="font-medium text-amber-400">
                          WARNING:
                        </span>{" "}
                        <span className="text-white/80">
                          Ca + Mg + Zn simultaneous
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outcome */}
                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="mb-3 text-xs font-medium tracking-wide text-white/40 uppercase">
                    Outcome
                  </div>
                  <p className="text-base leading-relaxed text-white/60">
                    &quot;I thought the fatigue was just aging. Stochi found the
                    Zinc/Copper imbalance on day one. Added{" "}
                    <span className="font-mono">5mg</span> Copper, split my
                    mineral timing.{" "}
                    <span className="font-medium text-emerald-400">
                      Energy returned within 3 weeks.
                    </span>{" "}
                    Four years of spreadsheets missed what Stochi caught
                    instantly.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          aria-labelledby="cta-heading"
          className="px-4 py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="mx-auto max-w-xl text-center">
            <h2
              id="cta-heading"
              className="text-2xl font-semibold text-white/90 sm:text-3xl"
            >
              Stop guessing.
            </h2>
            <p className="mt-3 text-base text-white/50">
              Your stack might be fine. Or it might be working against you. Only
              a diagnostic will tell.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-10 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30"
              >
                <Link href="/auth/sign-up">Run Your Stack Audit</Link>
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#0A0A0A] py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              {/* Logo and tagline */}
              <div className="flex flex-col items-center gap-2 md:items-start">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.svg"
                    alt="Stochi"
                    width={24}
                    height={24}
                    className="opacity-80"
                  />
                  <span className="text-sm font-medium text-white/80">
                    Stochi
                  </span>
                </div>
                <p className="text-xs text-white/40">
                  Pharmacokinetic intelligence for your supplement stack
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-xs text-white/40">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-lg font-semibold text-white/70">
                    1,423
                  </span>
                  <span>Compounds</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-lg font-semibold text-white/70">
                    89,412
                  </span>
                  <span>Interactions</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-lg font-semibold text-white/70">
                    2025
                  </span>
                  <span>Database</span>
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center gap-4 text-xs text-white/40">
                <Link
                  href="/auth/sign-in"
                  className="transition-colors hover:text-white/70"
                >
                  Sign In
                </Link>
                <span className="text-white/20">•</span>
                <Link
                  href="/auth/sign-up"
                  className="transition-colors hover:text-white/70"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/30">
              Not medical advice. Always consult a healthcare professional.
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function ProtocolDemo() {
  const [phase, setPhase] = useState<"idle" | "executing" | "complete">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const cycleAnimation = () => {
      // Start execution
      setPhase("executing");
      setProgress(0);

      // Animate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(progressInterval);
            setPhase("complete");
            return 100;
          }
          return p + 20;
        });
      }, 100);

      // Reset after delay
      setTimeout(() => {
        setPhase("idle");
        setProgress(0);
      }, 4000);
    };

    // Initial delay then cycle
    const initialDelay = setTimeout(cycleAnimation, 1500);
    const interval = setInterval(cycleAnimation, 6000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  const items = [
    { name: "Magnesium Glycinate", dose: "400mg" },
    { name: "Zinc Picolinate", dose: "30mg" },
    { name: "Vitamin D3", dose: "5000IU" },
    { name: "Vitamin K2", dose: "100mcg" },
  ];

  const loggedCount =
    phase === "complete"
      ? 4
      : phase === "executing"
        ? Math.floor(progress / 25)
        : 0;

  return (
    <div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm"
      role="region"
      aria-label="Protocol demo animation"
    >
      {/* Header with SVG Progress Ring */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* SVG Progress Ring */}
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
              {/* Background circle */}
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 100.53} 100.53`}
                className={`transition-all duration-300 ${phase === "executing" ? "drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" : ""}`}
              />
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center percentage or checkmark */}
            <div className="absolute inset-0 flex items-center justify-center">
              {phase === "complete" ? (
                <span className="text-sm text-emerald-400">✓</span>
              ) : (
                <span className="font-mono text-[10px] text-white/80 tabular-nums">
                  {progress}%
                </span>
              )}
            </div>
            {/* Pulse effect when executing */}
            {phase === "executing" && (
              <div className="absolute inset-0 animate-ping rounded-full border border-emerald-400/30" />
            )}
          </div>
          <div>
            <span className="text-sm font-medium text-white/90">
              Morning Stack
            </span>
            <p className="text-xs text-white/50">
              {phase === "complete" ? "All logged" : `${loggedCount}/4 logged`}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            phase === "complete"
              ? "bg-emerald-500/10 text-emerald-400"
              : phase === "executing"
                ? "bg-amber-500/10 text-amber-400"
                : "bg-white/[0.06] text-white/50"
          }`}
          aria-live="polite"
        >
          {phase === "complete"
            ? "COMPLETE"
            : phase === "executing"
              ? "EXECUTING"
              : "READY"}
        </span>
      </div>

      {/* Items */}
      <ul
        className="mb-4 space-y-2"
        role="list"
        aria-label="Supplements in stack"
      >
        {items.map((item, i) => (
          <li
            key={item.name}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-300 ${
              i < loggedCount
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-white/[0.06] bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Mini progress indicator per item */}
              <div
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  i < loggedCount ? "bg-emerald-400" : "bg-white/20"
                }`}
              />
              <span
                className={`text-sm ${i < loggedCount ? "text-emerald-400" : "text-white/80"}`}
              >
                {i < loggedCount && <span className="sr-only">Logged: </span>}
                {item.name}
              </span>
            </div>
            <span className="font-mono text-xs text-white/50 tabular-nums">
              {item.dose}
            </span>
          </li>
        ))}
      </ul>

      {/* Execute Button - decorative demo, not interactive */}
      <div
        aria-hidden="true"
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
          phase === "complete"
            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20"
            : phase === "executing"
              ? "bg-emerald-500/20 text-emerald-400"
              : "border border-white/[0.08] bg-white/[0.03] text-white/80"
        }`}
      >
        {phase === "complete" ? (
          <>
            <span>✓</span> LOGGED IN 300ms
          </>
        ) : phase === "executing" ? (
          <>
            <span className="animate-spin">⟳</span> EXECUTING...
          </>
        ) : (
          <>
            <span>▶</span> EXECUTE PROTOCOL
          </>
        )}
      </div>

      {/* Performance claim */}
      <p className="mt-3 text-center text-xs text-white/40">
        Execute 15+ supplements in 300ms
      </p>
    </div>
  );
}

function TerminalAnalyzer({
  interactionDb,
  autoDemo = false,
}: {
  interactionDb: Record<
    string,
    {
      type: "synergy" | "warning" | "critical";
      message: string;
      action: string;
    }
  >;
  autoDemo?: boolean;
}) {
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [result, setResult] = useState<{
    type: "synergy" | "warning" | "critical" | "none" | "signup";
    lines: string[];
  } | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-demo: simulate typing "Zinc" + "Magnesium" on page load
  useEffect(() => {
    if (!autoDemo) return;

    const demoInput1 = "Zinc";
    const demoInput2 = "Magnesium";
    let i = 0;
    let j = 0;

    // Start typing after 1 second delay
    const startDelay = setTimeout(() => {
      setIsTyping(true);

      // Type first input
      const typeInput1 = setInterval(() => {
        if (i < demoInput1.length) {
          setInput1(demoInput1.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInput1);

          // Brief pause then type second input
          setTimeout(() => {
            const typeInput2 = setInterval(() => {
              if (j < demoInput2.length) {
                setInput2(demoInput2.slice(0, j + 1));
                j++;
              } else {
                clearInterval(typeInput2);
                setIsTyping(false);

                // Trigger analysis after 500ms
                setTimeout(() => {
                  const interaction = interactionDb["zinc+magnesium"];
                  if (interaction) {
                    setResult({
                      type: interaction.type,
                      lines: [
                        "> ANALYSIS COMPLETE",
                        `> ⚠ WARNING: Zinc + Magnesium`,
                        `> ${interaction.message}`,
                        `> → ${interaction.action}`,
                      ],
                    });
                  }
                }, 500);
              }
            }, 80);
          }, 300);
        }
      }, 80);
    }, 1000);

    return () => {
      clearTimeout(startDelay);
    };
  }, [autoDemo, interactionDb]);

  const analyze = () => {
    if (!input1.trim() || !input2.trim()) return;

    const key1 = `${input1.toLowerCase().trim()}+${input2.toLowerCase().trim()}`;
    const key2 = `${input2.toLowerCase().trim()}+${input1.toLowerCase().trim()}`;

    const interaction = interactionDb[key1] || interactionDb[key2];

    if (interaction) {
      const prefix =
        interaction.type === "synergy"
          ? "✓ SYNERGY"
          : interaction.type === "critical"
            ? "✗ CRITICAL"
            : "⚠ WARNING";

      setResult({
        type: interaction.type,
        lines: [
          "> ANALYSIS COMPLETE",
          `> ${prefix}: ${input1} + ${input2}`,
          `> ${interaction.message}`,
          `> → ${interaction.action}`,
        ],
      });
    } else {
      setResult({
        type: "signup",
        lines: [
          "> ANALYSIS QUEUED",
          `> Pair: ${input1} + ${input2}`,
          "> Full report requires account",
          "> → Sign up to view all interactions",
        ],
      });
    }
  };

  const getLineColor = (line: string) => {
    if (line.includes("SYNERGY")) return "text-emerald-400";
    if (line.includes("CRITICAL")) return "text-red-400";
    if (line.includes("WARNING")) return "text-amber-400";
    if (line.includes("QUEUED")) return "text-cyan-400";
    if (line.startsWith("> →")) return "text-white/50";
    return "text-white/80";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      {/* Card header */}
      <div
        className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-white/70">
            Interaction Checker
          </span>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          LIVE
        </span>
      </div>

      {/* Card body */}
      <div className="p-4 sm:p-5">
        {/* Input fields */}
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`flex min-w-0 flex-1 basis-[calc(50%-0.5rem)] items-center gap-2 rounded-xl border bg-white/[0.02] px-3 py-2.5 transition-colors sm:basis-auto ${isTyping ? "border-emerald-500/30" : "border-white/[0.08]"}`}
          >
            <label htmlFor="supplement-1" className="sr-only">
              First supplement name
            </label>
            <input
              id="supplement-1"
              type="text"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              placeholder="First supplement"
              className="w-full min-w-0 bg-transparent text-sm text-white/90 placeholder-white/30 outline-none"
            />
          </div>
          <span
            className="hidden text-sm font-medium text-white/30 sm:block"
            aria-hidden="true"
          >
            +
          </span>
          <div
            className={`flex min-w-0 flex-1 basis-[calc(50%-0.5rem)] items-center gap-2 rounded-xl border bg-white/[0.02] px-3 py-2.5 transition-colors sm:basis-auto ${isTyping ? "border-emerald-500/30" : "border-white/[0.08]"}`}
          >
            <label htmlFor="supplement-2" className="sr-only">
              Second supplement name
            </label>
            <input
              id="supplement-2"
              type="text"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              placeholder="Second supplement"
              className="w-full min-w-0 bg-transparent text-sm text-white/90 placeholder-white/30 outline-none"
            />
          </div>
          <button
            onClick={analyze}
            className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 sm:w-auto"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            Analyze
          </button>
        </div>

        {/* Quick examples */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/40">Try:</span>
          {(
            [
              ["Zinc", "Copper"],
              ["Caffeine", "L-Theanine"],
              ["Vitamin D", "K2"],
            ] as const
          ).map(([a, b]) => (
            <button
              key={`${a}+${b}`}
              onClick={() => {
                setInput1(a);
                setInput2(b);
              }}
              aria-label={`Try ${a} and ${b}`}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-white/50 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04] hover:text-white/70"
            >
              {a} + {b}
            </button>
          ))}
        </div>

        {/* Output - live region for screen readers */}
        <div
          className="min-h-[90px] rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:min-h-[100px] sm:p-4"
          role="region"
          aria-label="Analysis results"
          aria-live="polite"
        >
          {result ? (
            <div className="space-y-1.5 font-mono text-xs">
              {result.lines.map((line, i) => (
                <p key={i} className={getLineColor(line)}>
                  {line}
                </p>
              ))}
              {result.type === "signup" && (
                <Link
                  href="/auth/sign-up"
                  className="mt-3 inline-flex items-center gap-1 text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Create free account{" "}
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/40">
              {isTyping ? (
                <span className="text-emerald-400">Analyzing stack...</span>
              ) : (
                <>
                  <span
                    className="animate-pulse text-emerald-400/60"
                    aria-hidden="true"
                  >
                    ●
                  </span>{" "}
                  Ready — enter two supplements to check for interactions
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskCard({
  type,
  label,
  title,
  description,
  detection,
  recommendation,
  citation,
}: {
  type: "danger" | "warning";
  label: string;
  title: string;
  description: string;
  detection: string;
  recommendation: string;
  citation: { id: string; title: string; source: string };
}) {
  const [showCitation, setShowCitation] = useState(false);
  const colors =
    type === "danger"
      ? {
          border: "border-red-500/20",
          bg: "bg-red-500/5",
          text: "text-red-400",
          iconBg: "bg-red-500/10",
          statusLabel: "CRITICAL",
          gradient: "via-red-500/40",
        }
      : {
          border: "border-amber-500/20",
          bg: "bg-amber-500/5",
          text: "text-amber-400",
          iconBg: "bg-amber-500/10",
          statusLabel: "WARNING",
          gradient: "via-amber-500/40",
        };

  const citationId = citation.id.split(":")[1];

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} p-6 backdrop-blur-sm`}
      aria-labelledby={`risk-${citationId}-title`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${colors.gradient} to-transparent`}
        aria-hidden="true"
      />

      <div className="mb-4 flex items-center justify-between">
        <span
          className={`text-[10px] font-medium tracking-[0.1em] uppercase ${colors.text}`}
        >
          {label}
        </span>
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${citationId}/`}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowCitation(true)}
          onMouseLeave={() => setShowCitation(false)}
          onFocus={() => setShowCitation(true)}
          onBlur={() => setShowCitation(false)}
          aria-describedby={`citation-${citationId}`}
          className="relative font-mono text-[10px] text-white/40 transition-colors hover:text-emerald-400 focus:rounded focus:text-emerald-400 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none"
        >
          [PMID:{citationId}]
          {showCitation && (
            <div
              id={`citation-${citationId}`}
              role="tooltip"
              className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded-xl border border-white/[0.08] bg-[#0A0C10]/95 p-3 text-left shadow-xl backdrop-blur-xl"
            >
              <p className="text-[10px] leading-relaxed text-white/80">
                {citation.title}
              </p>
              <p className="mt-1 text-[10px] text-white/50">
                {citation.source}
              </p>
            </div>
          )}
        </a>
      </div>

      <h3
        id={`risk-${citationId}-title`}
        className="mb-2 text-sm font-semibold text-white/90"
      >
        {title}
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-white/50">
        {description}
      </p>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px]">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-medium tracking-wider uppercase ${colors.text}`}
          >
            {colors.statusLabel}
          </span>
          <span className="text-white/80">{detection}</span>
        </div>
        <div className="mt-1 text-white/50">
          <span aria-hidden="true">→ </span>
          {recommendation}
        </div>
      </div>
    </article>
  );
}
