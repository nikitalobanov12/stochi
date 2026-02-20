import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-medium tracking-[0.01em] transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--motion-fast)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--elevation-1)] hover:bg-primary/92 hover:shadow-[var(--elevation-2)]",
        destructive:
          "bg-destructive text-white shadow-[var(--elevation-1)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-border bg-card text-foreground hover:bg-secondary hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/82",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Mobile-first: min-h-[44px] ensures touch target compliance
        default: "h-9 min-h-[44px] px-4 py-2 has-[>svg]:px-3 sm:min-h-0",
        sm: "h-8 min-h-[44px] rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 sm:min-h-0",
        lg: "h-10 min-h-[44px] rounded-md px-6 has-[>svg]:px-4 sm:min-h-0",
        icon: "size-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
        "icon-sm": "size-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
        "icon-lg": "size-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
