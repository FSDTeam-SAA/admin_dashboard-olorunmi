import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-7 min-w-[86px] items-center justify-center rounded-full px-3 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "bg-[#f0f0f0] text-[#414141]",
        success: "bg-[#1f9d55] text-white",
        danger: "bg-[#ff1111] text-white",
        warning: "bg-[#ffa800] text-white",
        dark: "bg-black text-white",
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
