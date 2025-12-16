"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";

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

// Live ticker data
const TICKER_ITEMS = [
  { pair: "ZNC + COP", status: "RATIO", color: "text-[#F0A500]" },
  { pair: "VIT_D + FAT", status: "SAFE", color: "text-[#39FF14]" },
  { pair: "CAL + FE", status: "CONFLICT", color: "text-[#FF6B6B]" },
  { pair: "MAG + ZNC", status: "SAFE", color: "text-[#39FF14]" },
  { pair: "ASH + SSRI", status: "WARNING", color: "text-[#F0A500]" },
  { pair: "B12 + FOL", status: "SYNERGY", color: "text-[#39FF14]" },
  { pair: "FE + VIT_C", status: "SYNERGY", color: "text-[#39FF14]" },
  { pair: "CAF + L_THE", status: "SAFE", color: "text-[#39FF14]" },
];

export function LandingPage() {
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [showRiskWarning, setShowRiskWarning] = useState(false);

  const toggleSupplement = (supplement: string) => {
    setSelectedSupplements((prev) => {
      const newSelection = prev.includes(supplement)
        ? prev.filter((s) => s !== supplement)
        : [...prev, supplement];

      if (
        (newSelection.includes("Zinc") && !newSelection.includes("Copper")) ||
        (newSelection.includes("Calcium") && newSelection.includes("Iron"))
      ) {
        setShowRiskWarning(true);
      } else {
        setShowRiskWarning(false);
      }

      return newSelection;
    });
  };

  return (
    <main className="relative min-h-screen bg-[#0A0C10] font-sans text-[#C9D1D9]">
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

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#30363D]/50 bg-[#0A0C10]/95 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Stochi"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="font-mono text-sm font-medium tracking-tight text-[#C9D1D9]">
                stochi<span className="text-[#39FF14]">_</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-mono text-xs text-[#8B949E] hover:text-[#C9D1D9]"
              >
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-[#39FF14] font-mono text-xs text-[#0A0C10] hover:bg-[#39FF14]/90"
              >
                <Link href="/auth/sign-up">Run Diagnostic</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Live Data Ticker */}
        <div className="fixed left-0 right-0 top-14 z-40 overflow-hidden border-b border-[#30363D]/30 bg-[#0A0C10]/90 py-1.5 backdrop-blur-sm">
          <LiveTicker />
        </div>

        {/* Hero Section */}
        <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-24">
          <div className="mx-auto max-w-3xl text-center">
            {/* Section ID */}
            <div className="mb-8 font-mono text-[10px] tracking-[0.3em] text-[#39FF14]/60">
              {"// SEC_01: PRIMARY_DIAGNOSTIC"}
            </div>

            {/* The Hook */}
            <h1 className="font-mono text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-[#C9D1D9]">Quantify your</span>
              <br />
              <span className="text-[#FF6B6B]">biological risk.</span>
            </h1>

            {/* Subhead */}
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#8B949E] sm:text-lg">
              You optimize your sleep, diet, and training. But you are guessing
              with your chemistry. Stochi audits your stack against clinical
              interaction pathways.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-[#39FF14] px-8 font-mono text-sm text-[#0A0C10] transition-all duration-200 hover:bg-[#32E612]"
              >
                <Link href="/auth/sign-up">Run Diagnostic</Link>
              </Button>
              <span className="font-mono text-[10px] tracking-wider text-[#8B949E]">
                FREE • NO CREDIT CARD
              </span>
            </div>

            {/* Scroll hint */}
            <div className="mt-20">
              <div className="mx-auto flex h-8 w-5 items-start justify-center rounded-full border border-[#30363D] p-1">
                <div className="h-2 w-1 animate-bounce rounded-full bg-[#8B949E]" />
              </div>
            </div>
          </div>
        </section>

        {/* Manual Tracking Failed You */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-4xl">
            {/* Section ID */}
            <div className="mb-6 font-mono text-[10px] tracking-[0.3em] text-[#39FF14]/60">
              {"// SEC_02: FAILURE_ANALYSIS"}
            </div>

            <h2 className="mb-4 font-mono text-2xl font-semibold text-[#C9D1D9] sm:text-3xl">
              Manual tracking failed you.
            </h2>
            <p className="mb-12 max-w-2xl text-sm leading-relaxed text-[#8B949E]">
              You tracked the dosage. You missed the pharmacokinetics. Your
              spreadsheet doesn&apos;t know that Magnesium competes with Zinc
              for the same transporter. We do.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* What You Tracked */}
              <div className="rounded-xl border border-[#30363D] bg-[#0D1117] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8B949E]">
                    What You Tracked
                  </span>
                  <span className="font-mono text-[10px] text-[#8B949E]/50">
                    INCOMPLETE
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-[#30363D] pb-2">
                    <span className="text-[#C9D1D9]">Zinc Picolinate</span>
                    <span className="tabular-nums text-[#8B949E]">50mg</span>
                  </div>
                  <div className="flex justify-between border-b border-[#30363D] pb-2">
                    <span className="text-[#C9D1D9]">Magnesium Glycinate</span>
                    <span className="tabular-nums text-[#8B949E]">400mg</span>
                  </div>
                  <div className="flex justify-between border-b border-[#30363D] pb-2">
                    <span className="text-[#C9D1D9]">Vitamin D3</span>
                    <span className="tabular-nums text-[#8B949E]">5000IU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C9D1D9]">Iron</span>
                    <span className="tabular-nums text-[#8B949E]">18mg</span>
                  </div>
                </div>
                <div className="mt-4 rounded border border-[#30363D] bg-[#161B22] p-3 text-center font-mono text-xs text-[#8B949E]">
                  No interaction data. No ratio analysis.
                </div>
              </div>

              {/* What You Missed */}
              <div className="rounded-xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/5 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF6B6B]">
                    What You Missed
                  </span>
                  <span className="font-mono text-[10px] text-[#FF6B6B]">
                    3 ERRORS
                  </span>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#FF6B6B]">×</span>
                    <div>
                      <span className="text-[#C9D1D9]">Zn:Cu ratio 50:1</span>
                      <p className="mt-0.5 text-[#8B949E]">
                        No copper to balance zinc intake
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#F0A500]">!</span>
                    <div>
                      <span className="text-[#C9D1D9]">Mg + Zn competition</span>
                      <p className="mt-0.5 text-[#8B949E]">
                        Same transporter, reduced absorption
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#F0A500]">!</span>
                    <div>
                      <span className="text-[#C9D1D9]">D3 timing unknown</span>
                      <p className="mt-0.5 text-[#8B949E]">
                        Fat-soluble, requires meal context
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pharmacological Vectors */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-4xl">
            {/* Section ID */}
            <div className="mb-6 font-mono text-[10px] tracking-[0.3em] text-[#39FF14]/60">
              {"// SEC_03: PHARMACOLOGICAL_VECTORS"}
            </div>

            <h2 className="mb-4 font-mono text-2xl font-semibold text-[#C9D1D9] sm:text-3xl">
              Common failure modes.
            </h2>
            <p className="mb-12 max-w-2xl text-sm text-[#8B949E]">
              These patterns exist in most stacks. Stochi scans for all of them.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <RiskCard
                type="danger"
                label="Depletion Cascade"
                title="Zinc depleting Copper stores"
                description="High-dose Zinc (30mg+) without Copper causes gradual depletion. Symptoms appear after months: fatigue, anemia, neurological issues."
                detection="Zn:Cu ratio exceeds 15:1"
                recommendation="Add 2mg Copper per 30mg Zinc"
                citation={CITATIONS.zincCopper}
              />

              <RiskCard
                type="warning"
                label="Absorption Null"
                title="Fat-soluble vitamin without fat"
                description="Vitamin D, K, E, A require dietary fat for absorption. Taking on empty stomach reduces bioavailability by up to 50%."
                detection="D3/K2 logged without meal flag"
                recommendation="Take with fatty meal"
                citation={CITATIONS.vitaminD}
              />

              <RiskCard
                type="warning"
                label="Transporter Competition"
                title="Calcium blocking Iron uptake"
                description="Calcium and Iron use the same intestinal transporters. Concurrent dosing reduces Iron absorption by 40-60%."
                detection="Ca + Fe within 2hr window"
                recommendation="Separate by 4+ hours"
                citation={CITATIONS.calciumIron}
              />

              <RiskCard
                type="danger"
                label="Pharmacodynamic Risk"
                title="Serotonergic compound stacking"
                description="Ashwagandha, 5-HTP, St. John's Wort enhance serotonin. Combined with SSRIs, risk of serotonin syndrome increases."
                detection="Multiple serotonergic agents"
                recommendation="Physician review required"
                citation={CITATIONS.ashwagandha}
              />
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-4xl">
            {/* Section ID */}
            <div className="mb-6 font-mono text-[10px] tracking-[0.3em] text-[#39FF14]/60">
              {"// SEC_04: CASE_STUDY"}
            </div>

            <h2 className="mb-12 font-mono text-2xl font-semibold text-[#C9D1D9] sm:text-3xl">
              Field report.
            </h2>

            <div className="rounded-xl border border-[#30363D] bg-[#0D1117] overflow-hidden">
              {/* Case header */}
              <div className="border-b border-[#30363D] bg-[#161B22] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-[#30363D] font-mono text-sm text-[#C9D1D9]">
                      492
                    </div>
                    <div>
                      <div className="font-mono text-sm text-[#C9D1D9]">
                        Subject 492
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#8B949E]">
                        The &quot;Optimized&quot; Stack
                      </div>
                    </div>
                  </div>
                  <div className="rounded bg-[#FF6B6B]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#FF6B6B]">
                    3 Critical Errors
                  </div>
                </div>
              </div>

              {/* Case body */}
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Profile */}
                  <div>
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8B949E]">
                      Profile
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Tracking method</span>
                        <span className="text-[#C9D1D9]">
                          Excel spreadsheet
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Duration</span>
                        <span className="tabular-nums text-[#C9D1D9]">
                          4 years
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Daily compounds</span>
                        <span className="tabular-nums text-[#C9D1D9]">12+</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Self-assessment</span>
                        <span className="text-[#C9D1D9]">
                          &quot;Plateaued, fatigued&quot;
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Findings */}
                  <div>
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF6B6B]">
                      Stochi Findings
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="rounded border border-[#FF6B6B]/20 bg-[#FF6B6B]/5 p-2">
                        <span className="text-[#FF6B6B]">CRITICAL:</span>{" "}
                        <span className="text-[#C9D1D9]">
                          50mg Zinc daily, 0mg Copper
                        </span>
                      </div>
                      <div className="rounded border border-[#F0A500]/20 bg-[#F0A500]/5 p-2">
                        <span className="text-[#F0A500]">WARNING:</span>{" "}
                        <span className="text-[#C9D1D9]">
                          D3 taken at 10pm (no meal)
                        </span>
                      </div>
                      <div className="rounded border border-[#F0A500]/20 bg-[#F0A500]/5 p-2">
                        <span className="text-[#F0A500]">WARNING:</span>{" "}
                        <span className="text-[#C9D1D9]">
                          Ca + Mg + Zn simultaneous
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outcome */}
                <div className="mt-6 border-t border-[#30363D] pt-6">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8B949E]">
                    Outcome
                  </div>
                  <p className="text-sm leading-relaxed text-[#8B949E]">
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
        </section>

        {/* Diagnostic Check */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-2xl">
            {/* Section ID */}
            <div className="mb-6 text-center font-mono text-[10px] tracking-[0.3em] text-[#39FF14]/60">
              {"// SEC_05: QUICK_SCAN"}
            </div>

            <h2 className="mb-4 text-center font-mono text-2xl font-semibold text-[#C9D1D9] sm:text-3xl">
              Quick risk check.
            </h2>
            <p className="mx-auto mb-8 text-center text-sm text-[#8B949E]">
              Select your supplements. We&apos;ll flag obvious conflicts.
            </p>

            <div className="rounded-xl border border-[#30363D] bg-[#0D1117] p-6">
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {[
                  "Zinc",
                  "Magnesium",
                  "Vitamin D",
                  "Iron",
                  "Calcium",
                  "Copper",
                  "B12",
                  "Omega-3",
                ].map((supplement) => (
                  <button
                    key={supplement}
                    onClick={() => toggleSupplement(supplement)}
                    className={`rounded border px-3 py-2 font-mono text-xs transition-all ${
                      selectedSupplements.includes(supplement)
                        ? "border-[#39FF14]/50 bg-[#39FF14]/10 text-[#39FF14]"
                        : "border-[#30363D] bg-[#161B22] text-[#8B949E] hover:border-[#8B949E]/50"
                    }`}
                  >
                    {supplement}
                  </button>
                ))}
              </div>

              {showRiskWarning && (
                <div className="animate-fade-in rounded border border-[#FF6B6B]/30 bg-[#FF6B6B]/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-sm text-[#FF6B6B]">×</span>
                    <div>
                      <p className="font-mono text-sm text-[#FF6B6B]">
                        Risk Detected
                      </p>
                      <p className="mt-1 text-xs text-[#8B949E]">
                        {selectedSupplements.includes("Zinc") &&
                        !selectedSupplements.includes("Copper")
                          ? "Zinc without Copper causes gradual depletion."
                          : "Calcium blocks Iron absorption. Separate by 4+ hours."}
                      </p>
                      <Button
                        asChild
                        size="sm"
                        className="mt-3 bg-[#39FF14] font-mono text-xs text-[#0A0C10] hover:bg-[#39FF14]/90"
                      >
                        <Link href="/auth/sign-up">Run Full Diagnostic</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {selectedSupplements.length > 0 && !showRiskWarning && (
                <div className="animate-fade-in rounded border border-[#39FF14]/30 bg-[#39FF14]/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-[#39FF14]">✓</span>
                    <div>
                      <p className="font-mono text-sm text-[#39FF14]">
                        No obvious conflicts
                      </p>
                      <p className="mt-1 text-xs text-[#8B949E]">
                        Full diagnostic checks ratios, timing, and 1,400+
                        interaction pairs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedSupplements.length === 0 && (
                <div className="text-center font-mono text-xs text-[#8B949E]">
                  Select supplements to check
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-xl text-center">
            {/* Section ID */}
            <div className="mb-6 font-mono text-[10px] tracking-[0.3em] text-[#39FF14]/60">
              {"// SEC_06: INITIATE"}
            </div>

            <h2 className="font-mono text-2xl font-semibold text-[#C9D1D9] sm:text-3xl">
              Stop guessing.
            </h2>
            <p className="mt-3 text-sm text-[#8B949E]">
              Your stack might be fine. Or it might be working against you. Only
              a diagnostic will tell.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="bg-[#39FF14] px-10 font-mono text-sm text-[#0A0C10] transition-all duration-200 hover:bg-[#32E612]"
              >
                <Link href="/auth/sign-up">Run Diagnostic</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#30363D] py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-4">
              <p className="font-mono text-xs text-[#8B949E]">stochi_</p>
              <div className="flex items-center gap-4 font-mono text-[10px] tabular-nums text-[#8B949E]/50">
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

function LiveTicker() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center overflow-hidden">
      <div
        className="flex items-center gap-8 whitespace-nowrap font-mono text-[10px]"
        style={{
          transform: `translateX(-${offset % 800}px)`,
        }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map(
          (item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-[#8B949E]/50">[</span>
              <span className="text-[#8B949E]">{item.pair}</span>
              <span className="text-[#8B949E]/50">]</span>
              <span className={item.color}>{item.status}</span>
            </div>
          )
        )}
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

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-6`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${type === "danger" ? "via-[#FF6B6B]/50" : "via-[#F0A500]/50"} to-transparent`}
      />

      <div className="mb-4 flex items-center justify-between">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.15em] ${colors.text}`}
        >
          {label}
        </span>
        <button
          onMouseEnter={() => setShowCitation(true)}
          onMouseLeave={() => setShowCitation(false)}
          className="relative font-mono text-[10px] text-[#8B949E]/40 transition-colors hover:text-[#8B949E]"
        >
          [{citation.id.split(":")[1]}]
          {showCitation && (
            <div className="absolute bottom-full right-0 z-20 mb-2 w-56 rounded border border-[#30363D] bg-[#161B22] p-3 text-left shadow-xl">
              <p className="text-[10px] leading-relaxed text-[#C9D1D9]">
                {citation.title}
              </p>
              <p className="mt-1 text-[10px] text-[#8B949E]">
                {citation.source}
              </p>
            </div>
          )}
        </button>
      </div>

      <h3 className="mb-2 font-mono text-sm font-semibold text-[#C9D1D9]">
        {title}
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-[#8B949E]">
        {description}
      </p>

      <div className="rounded border border-[#30363D] bg-[#0A0C10] p-3 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-wider ${colors.text}`}
          >
            {colors.statusLabel}
          </span>
          <span className="text-[#C9D1D9]">{detection}</span>
        </div>
        <div className="mt-1 text-[#8B949E]">→ {recommendation}</div>
      </div>
    </div>
  );
}
