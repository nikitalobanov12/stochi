"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

// Map icon names to components - icons must be defined in the client component
const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  stacks: Layers,
  log: PlusCircle,
  settings: Settings,
};

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  iconName: keyof typeof iconMap;
};

export function NavLink({ href, children, iconName }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  const Icon = iconMap[iconName];

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {Icon && <Icon className={cn("h-4 w-4", isActive && "text-primary")} />}
      {children}
    </Link>
  );
}

type MobileNavLinkProps = {
  href: string;
  iconName: keyof typeof iconMap;
  label: string;
};

export function MobileNavLink({ href, iconName, label }: MobileNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  const Icon = iconMap[iconName];

  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[44px] flex-col items-center justify-center gap-1 px-3 text-xs transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {Icon && <Icon className={cn("h-5 w-5", isActive && "text-primary")} />}
      {label}
    </Link>
  );
}
