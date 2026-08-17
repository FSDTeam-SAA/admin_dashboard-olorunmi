"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SosAlertWatcher } from "@/components/dashboard/sos-alert-watcher";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { getApiMessage, logoutUser } from "@/lib/api";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      toast.success("Logged out successfully");
      await signOut({ callbackUrl: "/login" });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to log out"));
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardSidebar
        onLogoutClick={() => setLogoutOpen(true)}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((previous) => !previous)}
      />

      <div className="min-h-screen lg:pl-[240px]">
        <DashboardTopbar />
        <div className="px-4 pb-6 pt-6 sm:px-6 lg:px-8">{children}</div>
      </div>

      <SosAlertWatcher />

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Are you sure?"
        description="You want to Log out from this Dashboard."
        confirmText="Log out"
        onConfirm={() => logoutMutation.mutate()}
        loading={logoutMutation.isPending}
      />
    </div>
  );
}