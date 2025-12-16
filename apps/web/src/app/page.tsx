import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

import { LandingPage } from "./landing-page";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
