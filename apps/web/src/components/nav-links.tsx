"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
};

export function NavLink({ href, children, icon: Icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
      {children}
    </Link>
  );
}

type MobileNavLinkProps = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

export function MobileNavLink({ href, icon: Icon, label }: MobileNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 text-xs transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
      {label}
    </Link>
  );
}
