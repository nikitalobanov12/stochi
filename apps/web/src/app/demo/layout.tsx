import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { DemoProvider } from "~/components/demo/demo-provider";
import { DemoBanner } from "~/components/demo/demo-banner";

// Demo-specific navigation links
function DemoNavLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium transition-[background-color,color,border-color] duration-[var(--motion-fast)] ${
        isActive
          ? "border-border/80 bg-secondary/70 text-foreground"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function DemoMobileNavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg border border-transparent px-3 py-1 transition-[background-color,color,border-color] duration-[var(--motion-fast)] ${
        isActive
          ? "border-border/80 bg-secondary/70 text-foreground"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <div className="relative flex min-h-screen flex-col">
        {/* Micro-grain texture for anti-banding */}
        <div className="hud-noise" />

        {/* Demo Banner */}
        <DemoBanner />

        {/* Desktop header - hidden on mobile */}
        <header className="border-border/80 bg-background/85 sticky top-0 z-50 hidden border-b backdrop-blur-xl md:block">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
            {/* Logo */}
            <Link href="/" className="mr-6 flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Stochi"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="text-foreground text-sm font-medium tracking-tight">
                stochi<span className="text-emerald-400">_</span>
              </span>
            </Link>

            <nav className="flex items-center gap-4">
              <DemoNavLink href="/demo">Dashboard</DemoNavLink>
              <DemoNavLink href="/demo/protocol">Protocol</DemoNavLink>
              <DemoNavLink href="/demo/stacks">Stacks</DemoNavLink>
              <DemoNavLink href="/demo/log">Log</DemoNavLink>
            </nav>

            <div className="flex items-center gap-4">
              <Button
                asChild
                size="sm"
                className="text-primary-foreground rounded-full bg-primary text-xs font-medium"
              >
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
              <Avatar className="border-border h-8 w-8 border opacity-50">
                <AvatarFallback className="bg-secondary font-mono text-xs">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main content - safe area padding for mobile PWA */}
        <main className="pt-safe pb-nav-safe relative z-10 flex-1 overflow-x-hidden md:pt-0 md:pb-0">
          <div className="mx-auto max-w-[1400px] px-4 py-6">{children}</div>
        </main>

        {/* Mobile bottom navigation with safe area for home indicator */}
        <nav className="border-border/80 bg-background/85 pb-safe fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-around py-2">
            <DemoMobileNavLink href="/demo" label="Home" />
            <DemoMobileNavLink href="/demo/protocol" label="Protocol" />
            <DemoMobileNavLink href="/demo/stacks" label="Stacks" />
            <DemoMobileNavLink href="/demo/log" label="Log" />
            <Link
              href="/auth/sign-up"
              className="text-primary flex min-h-[44px] flex-col items-center justify-center gap-1 px-3 py-1"
            >
              <span className="text-[10px]">Sign Up</span>
            </Link>
          </div>
        </nav>
      </div>
    </DemoProvider>
  );
}
