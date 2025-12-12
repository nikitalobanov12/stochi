import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";

import { getSession } from "~/server/better-auth/server";
import { auth } from "~/server/better-auth";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { NavLink, MobileNavLink } from "~/components/nav-links";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  const user = session.user;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-mono text-xl font-bold">
              <span className="text-primary">stochi</span>
              <span className="animate-pulse text-primary">_</span>
            </Link>

            <nav className="hidden items-center gap-4 md:flex">
              <NavLink href="/dashboard" iconName="dashboard">
                Dashboard
              </NavLink>
              <NavLink href="/dashboard/stacks" iconName="stacks">
                Stacks
              </NavLink>
              <NavLink href="/dashboard/log" iconName="log">
                Log
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image ?? undefined} alt={user.name} />
                    <AvatarFallback className="font-mono text-xs">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form>
                  <DropdownMenuItem asChild>
                    <button
                      type="submit"
                      className="w-full cursor-pointer"
                      formAction={async () => {
                        "use server";
                        await auth.api.signOut({
                          headers: await headers(),
                        });
                        redirect("/");
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background pb-safe md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavLink href="/dashboard" iconName="dashboard" label="Home" />
          <MobileNavLink href="/dashboard/stacks" iconName="stacks" label="Stacks" />
          <MobileNavLink href="/dashboard/log" iconName="log" label="Log" />
          <MobileNavLink href="/dashboard/settings" iconName="settings" label="Settings" />
        </div>
      </nav>
    </div>
  );
}
