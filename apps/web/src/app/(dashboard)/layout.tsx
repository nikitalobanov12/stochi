import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Settings,
  LogOut,
} from "lucide-react";

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
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-mono text-xl font-bold">
              <span className="text-primary">stochi</span>
              <span className="animate-pulse text-primary">_</span>
            </Link>

            <nav className="hidden items-center gap-4 md:flex">
              <NavLink href="/dashboard" icon={LayoutDashboard}>
                Dashboard
              </NavLink>
              <NavLink href="/stacks" icon={Layers}>
                Stacks
              </NavLink>
              <NavLink href="/log" icon={PlusCircle}>
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
                  <Link href="/settings" className="cursor-pointer">
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

      <main className="flex-1">
        <div className="container py-6">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavLink href="/dashboard" icon={LayoutDashboard} label="Home" />
          <MobileNavLink href="/stacks" icon={Layers} label="Stacks" />
          <MobileNavLink href="/log" icon={PlusCircle} label="Log" />
          <MobileNavLink href="/settings" icon={Settings} label="Settings" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  children,
  icon: Icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
