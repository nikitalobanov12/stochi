import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "~/components/ui/button";
import { getSession } from "~/server/better-auth/server";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="container relative mx-auto px-4 py-20 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <Image
                src="/logo.svg"
                alt="Stochi Logo"
                width={80}
                height={80}
                className="h-20 w-20 sm:h-24 sm:w-24"
                priority
              />
            </div>

            {/* Title with terminal cursor */}
            <h1 className="font-mono text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
              stochi
              <span className="animate-pulse text-primary">_</span>
            </h1>

            {/* Tagline */}
            <p className="mt-4 font-mono text-xl text-primary sm:text-2xl">
              Balance your chemistry.
            </p>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              The stoichiometric engine for bio-optimization. Track your
              supplements, detect molecular interactions, and optimize your
              stack with precision.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="font-mono text-base">
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-mono text-base"
              >
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Demo Section */}
      <section className="border-y border-border bg-card/50 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <TerminalDemo />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center font-mono text-sm uppercase tracking-widest text-muted-foreground">
            {"// "}Core Features
          </h2>
          <p className="mb-12 text-center font-mono text-2xl font-semibold text-foreground sm:text-3xl">
            Precision instrumentation for your stack
          </p>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<CommandIcon />}
              title="Fast Logging"
              description="Log your entire stack in under 3 seconds. Type naturally: 'mag 200mg, zinc 15mg' and we handle the rest."
              example="/log mag 200mg zinc 15mg"
            />
            <FeatureCard
              icon={<AlertIcon />}
              title="Interaction Detection"
              description="Detect stoichiometric imbalances, absorption blocks, and pharmacokinetic conflicts before they happen."
              example="Zn:Cu ratio 15:1 detected"
            />
            <FeatureCard
              icon={<OfflineIcon />}
              title="Offline Ready"
              description="Your data stays with you. Works offline, syncs when connected. No cloud dependency required."
              example="PWA + Local Storage"
            />
          </div>
        </div>
      </section>

      {/* Interaction Types Section */}
      <section className="border-y border-border bg-card/50 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center font-mono text-sm uppercase tracking-widest text-muted-foreground">
            {"// "}The Engine
          </h2>
          <p className="mb-12 text-center font-mono text-2xl font-semibold text-foreground sm:text-3xl">
            Three types of molecular analysis
          </p>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            <InteractionType
              severity="warning"
              title="Stoichiometric"
              description="Ratio imbalances like Zinc:Copper > 15:1 that create competitive deficiencies."
              example="Zn 50mg + Cu 1mg"
            />
            <InteractionType
              severity="critical"
              title="Absorption Block"
              description="Complete absorption failures from timing or compound conflicts."
              example="Vitamin D + Black Coffee"
            />
            <InteractionType
              severity="info"
              title="Pharmacokinetic"
              description="Enzyme inhibition affecting drug metabolism and potency."
              example="Piperine + CYP3A4"
            />
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-8 font-mono text-2xl font-semibold text-foreground sm:text-3xl">
              Biology is not magic. It&apos;s math.
            </h2>
            <p className="text-lg text-muted-foreground">
              While other apps track what you take, Stochi calculates the
              molecular ratios of your stack to prevent competitive absorption.
              It ensures your inputs actually result in the correct biological
              outputs, rather than expensive chemical imbalances.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border pt-12">
              <div>
                <div className="font-mono text-3xl font-bold text-primary">
                  &lt;3s
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  to log your stack
                </div>
              </div>
              <div>
                <div className="font-mono text-3xl font-bold text-primary">
                  100%
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  offline capable
                </div>
              </div>
              <div>
                <div className="font-mono text-3xl font-bold text-primary">
                  0
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  social features
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-card/50 py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-mono text-2xl font-semibold text-foreground sm:text-3xl">
            Ready to optimize your stack?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            No social feeds. No gamification. Just data.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="font-mono text-base">
              <Link href="/auth/sign-up">Start for Free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            {"// "}stochi_ — The Pharmacological Compiler
          </p>
        </div>
      </footer>
    </main>
  );
}

function TerminalDemo() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0D1117] shadow-2xl">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-[#161B22] px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-[#FF5F56]" />
        <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
        <div className="h-3 w-3 rounded-full bg-[#27CA40]" />
        <span className="ml-2 font-mono text-xs text-[#8B949E]">
          stochi — stack analyzer
        </span>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-sm leading-relaxed sm:p-6 sm:text-base">
        <div className="text-[#8B949E]">
          <span className="text-[#39FF14]">$</span> stochi analyze --stack
          morning
        </div>
        <div className="mt-4 text-[#C9D1D9]">
          <span className="text-[#8B949E]">Running diagnostics...</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-[#39FF14]">✓</span>
            <span className="text-[#C9D1D9]">
              Magnesium Bisglycinate 200mg
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#39FF14]">✓</span>
            <span className="text-[#C9D1D9]">Zinc Picolinate 15mg</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FFDD57]">!</span>
            <span className="text-[#C9D1D9]">
              Copper 1mg{" "}
              <span className="text-[#FFDD57]">
                — Zn:Cu ratio 15:1 (optimal: 10:1)
              </span>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FF3860]">✗</span>
            <span className="text-[#C9D1D9]">
              Vitamin D3 5000IU{" "}
              <span className="text-[#FF3860]">
                — Take with fat for absorption
              </span>
            </span>
          </div>
        </div>
        <div className="mt-4 border-t border-[#30363D] pt-4">
          <span className="text-[#8B949E]">Synthesis complete:</span>
          <span className="ml-2 text-[#39FF14]">2 optimal</span>
          <span className="mx-1 text-[#8B949E]">|</span>
          <span className="text-[#FFDD57]">1 warning</span>
          <span className="mx-1 text-[#8B949E]">|</span>
          <span className="text-[#FF3860]">1 critical</span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  example,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  example: string;
}) {
  return (
    <div className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      <code className="inline-block rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
        {example}
      </code>
    </div>
  );
}

function InteractionType({
  severity,
  title,
  description,
  example,
}: {
  severity: "warning" | "critical" | "info";
  title: string;
  description: string;
  example: string;
}) {
  const colorMap = {
    warning: "text-[#FFDD57] border-[#FFDD57]/30 bg-[#FFDD57]/5",
    critical: "text-[#FF3860] border-[#FF3860]/30 bg-[#FF3860]/5",
    info: "text-[#00F0FF] border-[#00F0FF]/30 bg-[#00F0FF]/5",
  };

  const iconMap = {
    warning: "!",
    critical: "✗",
    info: "i",
  };

  return (
    <div className={`rounded-lg border p-6 ${colorMap[severity]}`}>
      <div className="mb-3 font-mono text-2xl">{iconMap[severity]}</div>
      <h3 className="mb-2 font-mono text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm opacity-80">{description}</p>
      <div className="font-mono text-xs opacity-60">{example}</div>
    </div>
  );
}

function CommandIcon() {
  return (
    <svg
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}
