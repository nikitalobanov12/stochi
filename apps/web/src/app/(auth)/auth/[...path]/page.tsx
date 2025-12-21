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
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black p-4">
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
          <p className="text-muted-foreground mt-3 font-mono text-sm">
            Balance your chemistry.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
          <AuthView path={path[0] ?? "sign-in"} />
        </div>
      </div>
    </main>
  );
}
