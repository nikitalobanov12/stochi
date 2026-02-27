import Link from "next/link";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="pt-safe pb-safe mx-auto w-full max-w-3xl px-4 py-16">
      <header className="mb-10">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Privacy
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white/95">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Stochi is built to minimize data collection. This document explains
          what we store and why.
        </p>
      </header>

      <section className="space-y-6 text-sm leading-relaxed text-white/70">
        <div className="space-y-2">
          <h2 className="font-medium text-white/90">What we store</h2>
          <p>
            When you create an account, we store basic account identifiers (e.g.
            OAuth provider ID) and the supplement data you enter (stacks and
            logs) so the app can work across sessions and devices.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium text-white/90">What we don&apos;t do</h2>
          <p>
            We do not sell your data. We do not run third-party ad trackers.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium text-white/90">Security</h2>
          <p>
            We use encrypted connections (HTTPS) and store data in a managed
            database. No system is perfect; treat this as a personal reference
            tool, not a medical record.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium text-white/90">Contact</h2>
          <p>
            Questions or deletion requests:{" "}
            <span className="font-mono">support@stochi.app</span>
          </p>
        </div>
      </section>

      <div className="mt-12">
        <Link
          href="/"
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
