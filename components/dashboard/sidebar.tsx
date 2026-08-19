"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, LogOut, MapPin, Menu, Settings, Users } from "lucide-react";
import { useSession } from "next-auth/react";

import { AppLogo } from "@/components/common/app-logo";
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
    href: "/location-management",
    label: "Location Management",
    icon: MapPin,
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
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-[240px] flex-col border-r border-border bg-sidebar-bg lg:flex">
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
          className="size-10 rounded-lg bg-white dark:bg-secondary-bg"
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
          "fixed top-0 left-0 z-50 flex h-screen w-[240px] flex-col border-r border-border bg-sidebar-bg transition-transform lg:hidden",
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
      <div className="flex items-center justify-center px-6 py-5">
        <AppLogo width={76} height={92} priority />
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
                "flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-all",
                active
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-text-secondary hover:bg-secondary-bg hover:text-text-primary"
              )}
            >
              <Icon className="size-4.5" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-border/50 bg-secondary-bg/50 p-2">
          <Avatar className="size-9 border border-border">
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-text-primary">{displayName}</p>
            <p className="truncate text-[11px] text-text-secondary">{displayEmail}</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-10 w-full justify-center border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
          onClick={onLogoutClick}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </>
  );
}