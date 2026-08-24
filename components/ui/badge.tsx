import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold leading-none shadow-xs transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary-bg text-secondary-text border border-border",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        active: "bg-emerald-600 text-white font-semibold",
        danger: "bg-red-600 text-white hover:bg-red-700",
        disabled: "bg-red-600 text-white font-semibold",
        warning: "bg-amber-500 text-white hover:bg-amber-600",
        orange: "bg-orange-500 text-white hover:bg-orange-600",
        info: "bg-blue-600 text-white hover:bg-blue-700",
        booked: "bg-blue-600 text-white hover:bg-blue-700",
        neutral: "bg-slate-700 text-white hover:bg-slate-800",
        ok: "bg-green-600 text-white hover:bg-green-700",
        // Amber, not rose — kept visually distinct from the "orange" variant
        // (Out of Location) with a clearly different, more mustard-toned hue.
        critical: "bg-amber-600 text-white hover:bg-amber-700",
        recovered: "bg-teal-600 text-white hover:bg-teal-700",
        dark: "bg-slate-900 text-white dark:bg-slate-800",
        outline: "border border-border bg-transparent text-text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
