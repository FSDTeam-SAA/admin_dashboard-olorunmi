"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, LogOut, Menu, Settings, Users } from "lucide-react";
import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { cn, getUserInitials } from "@/lib/utils";

type SidebarProps = {
  onLogoutClick: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
};

const navItems = [
  {
    href: "/user-management",
    label: "User Management",
    icon: Users,
  },
  {
    href: "/alert-management",
    label: "Alert Management",
    icon: AlertTriangle,
  },
  {
    href: "/settings",
    label: "Setting",
    icon: Settings,
  },
];

export function DashboardSidebar({
  onLogoutClick,
  mobileOpen,
  onMobileToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
  });

  const profile = profileQuery.data;

  return (
    <>
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-[240px] flex-col border-r border-[#dfdfdf] bg-[#f1f1f1] lg:flex">
        <SidebarContent
          pathname={pathname}
          session={session}
          profile={profile}
          onLogoutClick={onLogoutClick}
        />
      </aside>

      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="secondary"
          size="icon"
          className="size-10 rounded-lg bg-white"
          onClick={onMobileToggle}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onMobileToggle();
            }
          }}
        />
      ) : null}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-[240px] flex-col border-r border-[#dfdfdf] bg-[#f1f1f1] transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          pathname={pathname}
          session={session}
          profile={profile}
          onLogoutClick={() => {
            onLogoutClick();
            onMobileToggle();
          }}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  session,
  profile,
  onLogoutClick,
}: {
  pathname: string;
  session: ReturnType<typeof useSession>["data"];
  profile?: Awaited<ReturnType<typeof getProfile>>;
  onLogoutClick: () => void;
}) {
  const displayName = profile?.name ?? session?.user?.name ?? "Olorunmi";
  const displayEmail = profile?.email ?? session?.user?.email ?? "example@example.com";
  const displayAvatar = profile?.avatar?.url ?? session?.user?.avatarUrl ?? "";

  return (
    <>
      <div className="flex items-center justify-center px-8 py-5">
        <Image src="/logo-rss.png" alt="RSS Logo" width={74} height={90} priority />
      </div>

      <nav className="mt-5 flex flex-col gap-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-12 items-center gap-2 rounded-lg px-3 text-sm text-[#202020] transition-colors",
                active
                  ? "bg-[#a79663] text-white"
                  : "hover:bg-[#e6e6e6]"
              )}
            >
              <Icon className="size-4" />
              <span className="text-base font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-4">
        <div className="mb-3 flex items-center gap-2 rounded-xl px-2 py-1">
          <Avatar className="size-10">
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1f1f1f]">{displayName}</p>
            <p className="truncate text-xs text-[#545454]">{displayEmail}</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-11 w-full justify-center border-[#ff9d9d] text-[#ff2b2b] hover:bg-[#fff4f4]"
          onClick={onLogoutClick}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </>
  );
}
