import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-xs",
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs",
        teal: "bg-teal-600 text-white hover:bg-teal-700 shadow-xs",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs",
        outline:
          "border border-border bg-card text-text-primary hover:bg-secondary-bg hover:text-foreground",
        secondary:
          "bg-secondary-bg text-secondary-text hover:bg-secondary-hover",
        ghost: "text-secondary-text hover:bg-ghost-hover hover:text-foreground",
        tealOutline: "border border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-500/20",
        slateOutline: "border border-border text-text-secondary hover:bg-secondary-bg hover:text-text-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8.5 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "size-10 rounded-lg",
        iconSm: "size-8.5 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
