import Link from "next/link";

export const metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <main className="pt-safe pb-safe mx-auto w-full max-w-3xl px-4 py-16">
      <header className="mb-10">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
          Terms
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white/95">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          By using Stochi, you agree to these terms.
        </p>
      </header>

      <section className="space-y-6 text-sm leading-relaxed text-white/70">
        <div className="space-y-2">
          <h2 className="font-medium text-white/90">Not medical advice</h2>
          <p>
            Stochi provides informational analysis based on indexed research and
            user-entered data. It does not provide medical advice. Always
            consult a qualified healthcare professional.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium text-white/90">Your responsibility</h2>
          <p>
            You are responsible for verifying your inputs and deciding what to
            do with the information provided.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium text-white/90">Availability</h2>
          <p>
            The service may change or be unavailable at times. We do not
            guarantee uninterrupted operation.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-medium text-white/90">Contact</h2>
          <p>
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
