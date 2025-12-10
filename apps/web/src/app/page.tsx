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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="font-mono text-6xl font-bold tracking-tight text-primary sm:text-7xl">
            stochi
            <span className="animate-pulse">_</span>
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Balance your chemistry.
          </p>
        </div>

        <div className="max-w-2xl text-center">
          <p className="text-lg text-foreground/80">
            The stoichiometric engine for bio-optimization. Track your
            supplements, detect molecular interactions, and optimize your stack
            with precision.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="font-mono">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-mono">
            <Link href="/auth/sign-up">Create Account</Link>
          </Button>
        </div>

        <div className="mt-8 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            title="Fast Logging"
            description="Log your entire stack in under 3 seconds with Stack Bundles and command-line input."
            icon=">"
          />
          <FeatureCard
            title="Interaction Detection"
            description="Detect stoichiometric imbalances, absorption blocks, and pharmacokinetic conflicts."
            icon="!"
          />
          <FeatureCard
            title="Offline Ready"
            description="Your data stays with you. Works offline, syncs when connected."
            icon="*"
          />
        </div>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p className="font-mono">
            {"// "}No social feeds. No gamification. Just data.
          </p>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-3 font-mono text-2xl text-primary">{icon}</div>
      <h3 className="mb-2 font-mono text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
