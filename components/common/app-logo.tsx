"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function AppLogo({
  width = 84,
  height = 98,
  className,
  priority = true,
}: AppLogoProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-white/95 p-1 shadow-sm transition-transform duration-200 hover:scale-105 dark:bg-white/10 dark:backdrop-blur-xs dark:border dark:border-white/15", className)}>
      <Image
        src="/login_logo_Dark.jpeg"
        alt="RSS Regal Security Services"
        width={width}
        height={height}
        priority={priority}
        className="h-auto max-h-[86px] w-auto rounded-lg object-contain"
      />
    </div>
  );
}
