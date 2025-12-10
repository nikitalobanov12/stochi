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
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-3xl font-bold text-primary">stochi_</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Balance your chemistry.
          </p>
        </div>
        <AuthView path={path[0] ?? "sign-in"} />
      </div>
    </main>
  );
}
