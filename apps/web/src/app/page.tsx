import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

import { LandingPage } from "./landing-page";
import { PWAAuthRedirect } from "./pwa-auth-redirect";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  // PWAAuthRedirect handles client-side detection of standalone mode
  // and redirects to sign-in instead of showing marketing landing page
  return (
    <>
      <PWAAuthRedirect />
      <LandingPage />
    </>
  );
}
