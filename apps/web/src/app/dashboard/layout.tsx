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
    <div className="relative flex min-h-screen flex-col">
      {/* Micro-grain texture for anti-banding */}
      <div className="hud-noise" />

      {/* Desktop header - hidden on mobile */}
      <header className="sticky top-0 z-50 hidden border-b border-white/10 bg-black/80 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
          <nav className="flex items-center gap-4">
            <NavLink href="/dashboard" iconName="dashboard">
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/stacks" iconName="stacks">
              Protocols
            </NavLink>
            <NavLink href="/dashboard/log" iconName="log">
              Log
            </NavLink>
          </nav>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="border-border h-8 w-8 border">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-secondary font-mono text-xs">
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
                    <p className="text-sm leading-none font-medium">
                      {user.name}
                    </p>
                    <p className="text-muted-foreground text-xs leading-none">
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

      {/* Main content - safe area padding for mobile PWA */}
      <main className="relative z-10 flex-1 pt-safe pb-nav-safe md:pt-0 md:pb-0">
        <div className="mx-auto max-w-[1400px] px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom navigation with safe area for home indicator */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-white/10 bg-black/80 pb-safe backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavLink href="/dashboard" iconName="dashboard" label="Home" />
          <MobileNavLink
            href="/dashboard/stacks"
            iconName="stacks"
            label="Protocols"
          />
          <MobileNavLink href="/dashboard/log" iconName="log" label="Log" />
          <MobileNavLink
            href="/dashboard/settings"
            iconName="settings"
            label="Settings"
          />
        </div>
      </nav>
    </div>
  );
}
