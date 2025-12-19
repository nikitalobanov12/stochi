"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "~/components/ui/button";
import { HeroInteractionAlert } from "~/components/landing/hero-interaction-alert";
import { CitationTicker } from "~/components/landing/citation-ticker";
import { CapabilityTable } from "~/components/landing/capability-table";
import {
  CompoundTicker,
  CompoundBadgeGrid,
} from "~/components/landing/compound-ticker";

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
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
  return (
    <main className="relative min-h-screen bg-[#0A0C10] font-sans text-[#E6EDF3]">
      {/* Decorative overlays - hidden from screen readers */}
      <div aria-hidden="true">
        {/* Noise texture overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-[1] opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Vignette overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-[2]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* HUD Grid with crosshairs */}
        <div className="pointer-events-none fixed inset-0 z-[1]">
          {/* Main grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #39FF14 1px, transparent 1px),
                linear-gradient(to bottom, #39FF14 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
            }}
          />
          {/* Crosshairs at intersections */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.08]">
            <defs>
              <pattern
                id="crosshairs"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M40 38v4M38 40h4"
                  stroke="#39FF14"
                  strokeWidth="1"
                  fill="none"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#crosshairs)" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-[#39FF14] focus:px-4 focus:py-2 focus:text-[#0A0C10] focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="fixed top-0 right-0 left-0 z-50 border-b border-[#30363D]/50 bg-[#0A0C10]/95 backdrop-blur-md"
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
              <span className="font-mono text-sm font-medium tracking-tight text-[#E6EDF3]">
                stochi<span className="text-[#39FF14]">_</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-mono text-xs text-[#A8B1BB] hover:text-[#E6EDF3]"
              >
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-[#39FF14] font-mono text-xs text-[#0A0C10] hover:bg-[#39FF14]/90"
              >
                <Link href="/auth/sign-up">Run Your Stack Audit</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          id="main-content"
          aria-labelledby="hero-heading"
          className="flex min-h-screen flex-col items-center justify-center px-4 pt-20"
        >
          <div className="mx-auto w-full max-w-5xl">
            {/* The Hook - Loss Aversion Headline */}
            <motion.h1
              id="hero-heading"
              className="text-center text-3xl leading-tight font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="text-[#E6EDF3]">Stop Blinding Your Biology.</span>
              <br />
              <span className="text-[#39FF14]">Master 89,000+ Supplement Interactions.</span>
            </motion.h1>

            {/* Subhead - Authority with specific scientific risks */}
            <motion.p 
              className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-[#A8B1BB] sm:text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
            >
              Generic apps miss nutrient blocking and toxicity. Stochi analyzes
              your stack against PubMed-backed data to optimize ratios like{" "}
              <span className="font-mono text-[#E6EDF3]">Zn:Cu</span> and prevent
              serotonergic risks in real-time.
            </motion.p>

            {/* Primary CTA - High-motivation prompt */}
            <motion.div 
              className="mt-10 flex flex-col items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
            >
              <Button
                asChild
                size="lg"
                className="bg-[#39FF14] px-10 font-mono text-sm font-semibold text-[#0A0C10] shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200 hover:bg-[#32E612] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)]"
              >
                <Link href="/auth/sign-up">Run Your Stack Audit</Link>
              </Button>
            </motion.div>

            <motion.div 
              className="mt-4 text-center font-mono text-[10px] tracking-wider text-[#A8B1BB]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              FREE • NO CREDIT CARD
            </motion.div>

            {/* Hero Visual - High-contrast Interaction Warning */}
            <motion.div 
              className="mt-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 1.5 }}
            >
              <HeroInteractionAlert />
            </motion.div>

            {/* Citation Ticker - Authority signal */}
            <motion.div 
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.7 }}
            >
              <CitationTicker />
            </motion.div>
          </div>
        </section>

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
              className="mb-4 text-center font-mono text-xl font-semibold text-[#E6EDF3] sm:text-2xl md:text-3xl"
            >
              Try the analyzer.
            </h2>
            <p className="mx-auto mb-8 text-center text-sm text-[#A8B1BB] sm:text-base">
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
              className="mb-4 font-mono text-2xl font-semibold text-[#E6EDF3] sm:text-3xl"
              variants={fadeInUp}
            >
              Beyond vitamins.
            </motion.h2>
            <motion.p 
              className="mb-8 max-w-2xl text-base leading-relaxed text-[#A8B1BB]"
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
              <h3 className="mb-4 font-mono text-sm font-semibold text-[#E6EDF3]">
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
                  className="mb-4 font-mono text-2xl font-semibold text-[#E6EDF3] sm:text-3xl"
                >
                  Execute. Don&apos;t log.
                </h2>
                <p className="mb-6 text-base leading-relaxed text-[#A8B1BB]">
                  Batch your intake into Protocols. Log your entire morning
                  stack in 300ms. Frictionless compliance.
                </p>
                <ul className="space-y-3 text-base text-[#A8B1BB]" role="list">
                  <li className="flex items-center gap-2">
                    <span className="text-[#39FF14]" aria-hidden="true">+</span>
                    One-tap logging for entire stacks
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#39FF14]" aria-hidden="true">+</span>
                    Progress tracking with visual indicators
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#39FF14]" aria-hidden="true">+</span>
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
              className="mb-4 font-mono text-2xl font-semibold text-[#E6EDF3] sm:text-3xl"
              variants={fadeInUp}
            >
              Manual tracking failed you.
            </motion.h2>
            <motion.p 
              className="mb-12 max-w-2xl text-base leading-relaxed text-[#A8B1BB]"
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
                className="rounded-xl border border-[#30363D] bg-[#0D1117] p-6"
                variants={staggerItem}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#A8B1BB] uppercase">
                    What You Tracked
                  </span>
                  <span className="font-mono text-[10px] text-[#A8B1BB]/50">
                    INCOMPLETE
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-[#30363D] pb-2">
                    <span className="text-[#E6EDF3]">Zinc Picolinate</span>
                    <span className="text-[#A8B1BB] tabular-nums">50mg</span>
                  </div>
                  <div className="flex justify-between border-b border-[#30363D] pb-2">
                    <span className="text-[#E6EDF3]">Magnesium Glycinate</span>
                    <span className="text-[#A8B1BB] tabular-nums">400mg</span>
                  </div>
                  <div className="flex justify-between border-b border-[#30363D] pb-2">
                    <span className="text-[#E6EDF3]">Vitamin D3</span>
                    <span className="text-[#A8B1BB] tabular-nums">5000IU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#E6EDF3]">Iron</span>
                    <span className="text-[#A8B1BB] tabular-nums">18mg</span>
                  </div>
                </div>
                <div className="mt-4 rounded border border-[#30363D] bg-[#161B22] p-3 text-center font-mono text-xs text-[#A8B1BB]">
                  No interaction data. No ratio analysis.
                </div>
              </motion.div>

              {/* What You Missed */}
              <motion.div
                className="rounded-xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/5 p-6"
                role="list"
                aria-label="What you missed: 3 errors"
                variants={staggerItem}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#FF6B6B] uppercase">
                    What You Missed
                  </span>
                  <span className="font-mono text-[10px] text-[#FF6B6B]">
                    3 ERRORS
                  </span>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-start gap-2" role="listitem">
                    <span className="mt-0.5 text-[#FF6B6B]" aria-hidden="true">×</span>
                    <div>
                      <span className="text-[#E6EDF3]">Zn:Cu ratio 50:1</span>
                      <p className="mt-0.5 text-[#A8B1BB]">
                        No copper to balance zinc intake
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2" role="listitem">
                    <span className="mt-0.5 text-[#F0A500]" aria-hidden="true">!</span>
                    <div>
                      <span className="text-[#E6EDF3]">
                        Mg + Zn competition
                      </span>
                      <p className="mt-0.5 text-[#A8B1BB]">
                        Same transporter, reduced absorption
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2" role="listitem">
                    <span className="mt-0.5 text-[#F0A500]" aria-hidden="true">!</span>
                    <div>
                      <span className="text-[#E6EDF3]">D3 timing unknown</span>
                      <p className="mt-0.5 text-[#A8B1BB]">
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
              className="mb-4 text-2xl font-bold text-[#E6EDF3] sm:text-3xl"
              variants={fadeInUp}
            >
              Your Spreadsheet is Missing These Lethal Errors.
            </motion.h2>
            <motion.p 
              className="mb-12 max-w-2xl text-base text-[#A8B1BB]"
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
              className="mb-12 font-mono text-2xl font-semibold text-[#E6EDF3] sm:text-3xl"
            >
              Field report.
            </h2>

            <div className="overflow-hidden rounded-xl border border-[#30363D] bg-[#0D1117]">
              {/* Case header */}
              <div className="border-b border-[#30363D] bg-[#161B22] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-[#30363D] font-mono text-sm text-[#E6EDF3]">
                      492
                    </div>
                    <div>
                      <div className="font-mono text-sm text-[#E6EDF3]">
                        Subject 492
                      </div>
                      <div className="font-mono text-[10px] tracking-wider text-[#A8B1BB] uppercase">
                        The &quot;Optimized&quot; Stack
                      </div>
                    </div>
                  </div>
                  <div className="rounded bg-[#FF6B6B]/10 px-2 py-1 font-mono text-[10px] tracking-wider text-[#FF6B6B] uppercase">
                    3 Critical Errors
                  </div>
                </div>
              </div>

              {/* Case body */}
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Profile */}
                  <div>
                    <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-[#A8B1BB] uppercase">
                      Profile
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#A8B1BB]">Tracking method</span>
                        <span className="text-[#E6EDF3]">
                          Excel spreadsheet
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A8B1BB]">Duration</span>
                        <span className="text-[#E6EDF3] tabular-nums">
                          4 years
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A8B1BB]">Daily compounds</span>
                        <span className="text-[#E6EDF3] tabular-nums">12+</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A8B1BB]">Self-assessment</span>
                        <span className="text-[#E6EDF3]">
                          &quot;Plateaued, fatigued&quot;
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Findings */}
                  <div>
                    <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-[#FF6B6B] uppercase">
                      Stochi Findings
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="rounded border border-[#FF6B6B]/20 bg-[#FF6B6B]/5 p-2">
                        <span className="text-[#FF6B6B]">CRITICAL:</span>{" "}
                        <span className="text-[#E6EDF3]">
                          50mg Zinc daily, 0mg Copper
                        </span>
                      </div>
                      <div className="rounded border border-[#F0A500]/20 bg-[#F0A500]/5 p-2">
                        <span className="text-[#F0A500]">WARNING:</span>{" "}
                        <span className="text-[#E6EDF3]">
                          D3 taken at 10pm (no meal)
                        </span>
                      </div>
                      <div className="rounded border border-[#F0A500]/20 bg-[#F0A500]/5 p-2">
                        <span className="text-[#F0A500]">WARNING:</span>{" "}
                        <span className="text-[#E6EDF3]">
                          Ca + Mg + Zn simultaneous
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outcome */}
                <div className="mt-6 border-t border-[#30363D] pt-6">
                  <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-[#A8B1BB] uppercase">
                    Outcome
                  </div>
                  <p className="text-base leading-relaxed text-[#A8B1BB]">
                    &quot;I thought the fatigue was just aging. Stochi found the
                    Zinc/Copper imbalance on day one. Added 5mg Copper, split my
                    mineral timing.{" "}
                    <span className="text-[#39FF14]">
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
              className="font-mono text-2xl font-semibold text-[#E6EDF3] sm:text-3xl"
            >
              Stop guessing.
            </h2>
            <p className="mt-3 text-base text-[#A8B1BB]">
              Your stack might be fine. Or it might be working against you. Only
              a diagnostic will tell.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="bg-[#39FF14] px-10 font-mono text-sm font-semibold text-[#0A0C10] shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200 hover:bg-[#32E612] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)]"
              >
                <Link href="/auth/sign-up">Run Your Stack Audit</Link>
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-[#30363D] py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-4">
              <p className="font-mono text-xs text-[#A8B1BB]">stochi_</p>
              <div className="flex items-center gap-4 font-mono text-[10px] text-[#A8B1BB]/50 tabular-nums">
                <span>v2025.01</span>
                <span className="text-[#30363D]">•</span>
                <span>1,423 compounds</span>
                <span className="text-[#30363D]">•</span>
                <span>89,412 interaction pairs</span>
              </div>
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
      className="rounded-xl border border-[#30363D] bg-[#0D1117] p-4"
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
                stroke="#30363D"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#39FF14"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 100.53} 100.53`}
                className={`transition-all duration-300 ${phase === "executing" ? "drop-shadow-[0_0_6px_rgba(57,255,20,0.5)]" : ""}`}
              />
            </svg>
            {/* Center percentage or checkmark */}
            <div className="absolute inset-0 flex items-center justify-center">
              {phase === "complete" ? (
                <span className="text-[#39FF14] text-sm">✓</span>
              ) : (
                <span className="font-mono text-[10px] tabular-nums text-[#E6EDF3]">
                  {progress}%
                </span>
              )}
            </div>
            {/* Pulse effect when executing */}
            {phase === "executing" && (
              <div className="absolute inset-0 animate-ping rounded-full border border-[#39FF14]/30" />
            )}
          </div>
          <div>
            <span className="font-mono text-sm font-medium text-[#E6EDF3]">
              Morning Stack
            </span>
            <p className="font-mono text-[10px] text-[#A8B1BB]">
              {phase === "complete" ? "All logged" : `${loggedCount}/4 logged`}
            </p>
          </div>
        </div>
        <span
          className={`rounded px-2 py-0.5 font-mono text-[10px] ${
            phase === "complete" 
              ? "bg-[#39FF14]/10 text-[#39FF14]" 
              : phase === "executing"
                ? "bg-[#F0A500]/10 text-[#F0A500]"
                : "bg-[#30363D]/50 text-[#A8B1BB]"
          }`}
          aria-live="polite"
        >
          {phase === "complete" ? "COMPLETE" : phase === "executing" ? "EXECUTING" : "READY"}
        </span>
      </div>

      {/* Items */}
      <ul className="mb-4 space-y-2" role="list" aria-label="Supplements in stack">
        {items.map((item, i) => (
          <li
            key={item.name}
            className={`flex items-center justify-between rounded border px-3 py-2 transition-all duration-300 ${
              i < loggedCount
                ? "border-[#39FF14]/30 bg-[#39FF14]/5"
                : "border-[#30363D] bg-[#161B22]"
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Mini progress indicator per item */}
              <div className={`h-1.5 w-1.5 rounded-full transition-all ${
                i < loggedCount ? "bg-[#39FF14]" : "bg-[#30363D]"
              }`} />
              <span
                className={`font-mono text-xs ${i < loggedCount ? "text-[#39FF14]" : "text-[#E6EDF3]"}`}
              >
                {i < loggedCount && <span className="sr-only">Logged: </span>}
                {item.name}
              </span>
            </div>
            <span className="font-mono text-xs text-[#A8B1BB] tabular-nums">
              {item.dose}
            </span>
          </li>
        ))}
      </ul>

      {/* Execute Button - decorative demo, not interactive */}
      <div
        aria-hidden="true"
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-mono text-sm font-medium transition-all ${
          phase === "complete"
            ? "bg-[#39FF14] text-[#0A0C10] shadow-[0_0_20px_rgba(57,255,20,0.3)]"
            : phase === "executing"
              ? "bg-[#39FF14]/20 text-[#39FF14]"
              : "border border-[#30363D] bg-[#161B22] text-[#E6EDF3]"
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
      <p className="mt-3 text-center font-mono text-[10px] text-[#A8B1BB]/60">
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
    if (line.includes("SYNERGY")) return "text-[#39FF14]";
    if (line.includes("CRITICAL")) return "text-[#FF6B6B]";
    if (line.includes("WARNING")) return "text-[#F0A500]";
    if (line.includes("QUEUED")) return "text-[#00D4FF]";
    if (line.startsWith("> →")) return "text-[#A8B1BB]";
    return "text-[#E6EDF3]";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#30363D] bg-[#0D1117]">
      {/* Terminal header - decorative */}
      <div
        className="flex items-center gap-2 border-b border-[#30363D] bg-[#161B22] px-3 py-2 sm:px-4"
        aria-hidden="true"
      >
        <div className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B] sm:h-3 sm:w-3" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#F0A500] sm:h-3 sm:w-3" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#39FF14] sm:h-3 sm:w-3" />
        <span className="ml-2 hidden font-mono text-[10px] text-[#A8B1BB] sm:inline">
          stack_auditor.sh
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-3 sm:p-4">
        {/* Input fields */}
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
          <div className={`flex min-w-0 flex-1 basis-[calc(50%-0.5rem)] items-center gap-1.5 rounded border bg-[#0A0C10] px-2 py-1.5 sm:basis-auto sm:gap-2 sm:px-3 sm:py-2 ${isTyping ? "border-[#39FF14]/50" : "border-[#30363D]"}`}>
            <span className="font-mono text-[10px] text-[#39FF14] sm:text-xs" aria-hidden="true">$</span>
            <label htmlFor="supplement-1" className="sr-only">
              First supplement name
            </label>
            <input
              id="supplement-1"
              type="text"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              placeholder="Supplement 1"
              className="w-full min-w-0 bg-transparent font-mono text-[10px] text-[#E6EDF3] placeholder-[#A8B1BB]/50 outline-none sm:text-xs"
            />
          </div>
          <span className="hidden font-mono text-xs text-[#A8B1BB] sm:block" aria-hidden="true">
            +
          </span>
          <div className={`flex min-w-0 flex-1 basis-[calc(50%-0.5rem)] items-center gap-1.5 rounded border bg-[#0A0C10] px-2 py-1.5 sm:basis-auto sm:gap-2 sm:px-3 sm:py-2 ${isTyping ? "border-[#39FF14]/50" : "border-[#30363D]"}`}>
            <span className="font-mono text-[10px] text-[#39FF14] sm:text-xs" aria-hidden="true">$</span>
            <label htmlFor="supplement-2" className="sr-only">
              Second supplement name
            </label>
            <input
              id="supplement-2"
              type="text"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              placeholder="Supplement 2"
              className="w-full min-w-0 bg-transparent font-mono text-[10px] text-[#E6EDF3] placeholder-[#A8B1BB]/50 outline-none sm:text-xs"
            />
          </div>
          <button
            onClick={analyze}
            className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded bg-[#39FF14] px-3 py-1.5 font-mono text-[10px] font-medium text-[#0A0C10] transition-colors hover:bg-[#32E612] sm:w-auto sm:px-4 sm:py-2 sm:text-xs"
          >
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            ANALYZE
          </button>
        </div>

        {/* Quick examples */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-4 sm:gap-2">
          <span className="font-mono text-[9px] text-[#A8B1BB] sm:text-[10px]">Try:</span>
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
              className="rounded border border-[#30363D] bg-[#161B22] px-1.5 py-0.5 font-mono text-[9px] text-[#A8B1BB] transition-colors hover:border-[#39FF14]/50 hover:text-[#E6EDF3] sm:px-2 sm:py-1 sm:text-[10px]"
            >
              {a} + {b}
            </button>
          ))}
        </div>

        {/* Output - live region for screen readers */}
        <div
          className="min-h-[80px] rounded border border-[#30363D] bg-[#0A0C10] p-2 sm:min-h-[100px] sm:p-3"
          role="region"
          aria-label="Analysis results"
          aria-live="polite"
        >
          {result ? (
            <div className="space-y-1 font-mono text-[10px] sm:text-xs">
              {result.lines.map((line, i) => (
                <p key={i} className={getLineColor(line)}>
                  {line}
                </p>
              ))}
              {result.type === "signup" && (
                <Link
                  href="/auth/sign-up"
                  className="mt-2 inline-flex items-center gap-1 text-[#39FF14] hover:underline"
                >
                  Create free account <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              )}
            </div>
          ) : (
            <p className="font-mono text-[10px] text-[#A8B1BB] sm:text-xs">
              {isTyping ? (
                <span className="text-[#39FF14]">Analyzing stack...</span>
              ) : (
                <>
                  <span className="animate-cursor-blink" aria-hidden="true">_</span> Awaiting input...
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
          border: "border-[#FF6B6B]/30",
          bg: "bg-[#FF6B6B]/5",
          text: "text-[#FF6B6B]",
          iconBg: "bg-[#FF6B6B]/10",
          statusLabel: "CRITICAL",
        }
      : {
          border: "border-[#F0A500]/30",
          bg: "bg-[#F0A500]/5",
          text: "text-[#F0A500]",
          iconBg: "bg-[#F0A500]/10",
          statusLabel: "WARNING",
        };

  const citationId = citation.id.split(":")[1];

  return (
    <article
      className={`relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-6`}
      aria-labelledby={`risk-${citationId}-title`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${type === "danger" ? "via-[#FF6B6B]/50" : "via-[#F0A500]/50"} to-transparent`}
        aria-hidden="true"
      />

      <div className="mb-4 flex items-center justify-between">
        <span
          className={`font-mono text-[10px] tracking-[0.15em] uppercase ${colors.text}`}
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
          className="relative font-mono text-[10px] text-[#A8B1BB]/60 transition-colors hover:text-[#39FF14] focus:text-[#39FF14] focus:outline-none focus:ring-1 focus:ring-[#39FF14]/50 focus:rounded"
        >
          [PMID:{citationId}]
          {showCitation && (
            <div
              id={`citation-${citationId}`}
              role="tooltip"
              className="absolute right-0 bottom-full z-20 mb-2 w-56 rounded border border-[#30363D] bg-[#161B22] p-3 text-left shadow-xl"
            >
              <p className="text-[10px] leading-relaxed text-[#E6EDF3]">
                {citation.title}
              </p>
              <p className="mt-1 text-[10px] text-[#A8B1BB]">
                {citation.source}
              </p>
            </div>
          )}
        </a>
      </div>

      <h3
        id={`risk-${citationId}-title`}
        className="mb-2 font-mono text-sm font-semibold text-[#E6EDF3]"
      >
        {title}
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-[#A8B1BB]">
        {description}
      </p>

      <div className="rounded border border-[#30363D] bg-[#0A0C10] p-3 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] tracking-wider uppercase ${colors.text}`}
          >
            {colors.statusLabel}
          </span>
          <span className="text-[#E6EDF3]">{detection}</span>
        </div>
        <div className="mt-1 text-[#A8B1BB]">
          <span aria-hidden="true">→ </span>
          {recommendation}
        </div>
      </div>
    </article>
  );
}
