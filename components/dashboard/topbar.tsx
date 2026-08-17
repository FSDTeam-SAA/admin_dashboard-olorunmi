"use client";

import { useQuery } from "@tanstack/react-query";
import { Moon, Sun } from "lucide-react";
import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SosHeaderButton } from "@/components/dashboard/sos-header-button";
import { useTheme } from "@/components/theme-provider";
import { getProfile } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { getUserInitials } from "@/lib/utils";

export function DashboardTopbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
  });

  const displayName = profileQuery.data?.name ?? session?.user?.name ?? "Olorunmi";
  const displayEmail = profileQuery.data?.email ?? session?.user?.email ?? "example@example.com";
  const displayAvatar = profileQuery.data?.avatar?.url ?? session?.user?.avatarUrl ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-border bg-header-bg px-4 sm:px-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-xl bg-secondary-bg text-secondary-text hover:bg-secondary-hover"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <SosHeaderButton />

        <div className="flex items-center gap-2 rounded-xl px-2 py-1">
          <Avatar className="size-10">
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
            <p className="truncate text-xs text-text-secondary">{displayEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
