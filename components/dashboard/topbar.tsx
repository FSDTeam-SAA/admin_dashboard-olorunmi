"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfile } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { getUserInitials } from "@/lib/utils";

export function DashboardTopbar() {
  const { data: session } = useSession();
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
  });

  const displayName = profileQuery.data?.name ?? session?.user?.name ?? "Olorunmi";
  const displayEmail = profileQuery.data?.email ?? session?.user?.email ?? "example@example.com";
  const displayAvatar = profileQuery.data?.avatar?.url ?? session?.user?.avatarUrl ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-end border-b border-[#dfdfdf] bg-[#efefef] px-4 sm:px-6">
      <div className="flex items-center gap-2 rounded-xl px-2 py-1">
        <Avatar className="size-10">
          <AvatarImage src={displayAvatar} alt={displayName} />
          <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1f1f1f]">{displayName}</p>
          <p className="truncate text-xs text-[#545454]">{displayEmail}</p>
        </div>
      </div>
    </header>
  );
}
