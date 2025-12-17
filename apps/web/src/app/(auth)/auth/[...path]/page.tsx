import Image from "next/image";
import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path: [path] }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
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

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/logo.svg"
            alt="stochi"
            width={140}
            height={40}
            className="mx-auto h-10 w-auto"
            priority
          />
          <p className="mt-3 font-mono text-sm text-muted-foreground">
            Balance your chemistry.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <AuthView path={path[0] ?? "sign-in"} />
        </div>
      </div>
    </main>
  );
}
