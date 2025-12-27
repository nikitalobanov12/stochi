"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Settings,
  Loader2,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

// Map icon names to components - icons must be defined in the client component
const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  stacks: Layers,
  log: PlusCircle,
  settings: Settings,
  protocol: Calendar,
};

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  iconName: keyof typeof iconMap;
};

export function NavLink({ href, children, iconName }: NavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  const Icon = iconMap[iconName];

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    // Don't navigate if already on this page
    if (isActive) return;

    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        "hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground",
        isPending && "pointer-events-none",
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
      )}
      {children}
    </a>
  );
}

type MobileNavLinkProps = {
  href: string;
  iconName: keyof typeof iconMap;
  label: string;
};

export function MobileNavLink({ href, iconName, label }: MobileNavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  const Icon = iconMap[iconName];

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    // Don't navigate if already on this page
    if (isActive) return;

    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        "hover:text-foreground flex min-h-[44px] flex-col items-center justify-center gap-1 px-3 text-xs transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground",
        isPending && "pointer-events-none",
      )}
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        Icon && <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
      )}
      {label}
    </a>
  );
}
