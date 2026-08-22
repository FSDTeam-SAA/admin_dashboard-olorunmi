import {
  AlertTriangle,
  Building2,
  Calendar,
  Filter,
  Mail,
  Plus,
  Search,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UserManagementLoading() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            User Management
          </h1>
          <p className="text-sm text-text-tertiary">
            Manage guard accounts, supervisors, and admin users.
          </p>
        </div>

        <Button className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-xs dark:bg-emerald-600 sm:self-auto">
          <Plus className="size-4" />
          Add New User
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LoadingSelect icon={Mail} label="Role" className="min-w-[130px]" />
        <LoadingSelect icon={Filter} label="Status" className="min-w-[130px]" />
        <LoadingSelect icon={Calendar} label="Date Range" className="min-w-[140px]" />
        <LoadingSearch placeholder="Search users..." />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`user-card-route-loading-${index}`}
            className="rounded-xl border border-border bg-card p-4 shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <div className="mt-4 flex gap-2 border-t border-border pt-3">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LocationManagementLoading() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Location Management
          </h1>
          <p className="text-sm text-text-tertiary">
            Manage sites and the patrol locations that belong to them.
          </p>
        </div>

        <Button className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-xs dark:bg-emerald-600 sm:self-auto">
          <Plus className="size-4" />
          Add New Site
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LoadingSearch placeholder="Search sites..." />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`site-route-loading-${index}`}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Building2 className="size-5" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            </div>

            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AlertManagementLoading() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Alert Management Dashboard
        </h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <LoadingSelect icon={Calendar} label="Date Range" className="min-w-[130px]" compact />
          <LoadingSelect icon={AlertTriangle} label="Alert Type" className="min-w-[130px]" compact />
          <LoadingSelect icon={UserX} label="Select User" className="min-w-[140px]" compact />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-7 w-52 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "bg-emerald-600 dark:bg-emerald-800",
          "bg-red-600 dark:bg-red-800",
          "bg-orange-500 dark:bg-orange-700",
          "bg-blue-600 dark:bg-blue-700",
        ].map((className, index) => (
          <div
            key={`alert-kpi-route-loading-${index}`}
            className={`relative overflow-hidden rounded-xl p-4 text-white shadow-xs ${className}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-white/30" />
                <div className="h-7 w-10 rounded bg-white/30" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <TableSkeleton rows={8} />
    </section>
  );
}

export function SettingsLoading() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">Settings</p>
      </div>

      <Tabs value="personal">
        <TabsList className="max-w-[400px]">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>

        <Card className="rounded-xl border-border bg-card">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <Skeleton className="size-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between px-4 pb-0 pt-4 sm:px-6">
            <CardTitle>Personal Information</CardTitle>
            <Skeleton className="h-9 w-28 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-md" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-11 w-full rounded-md" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
            <Skeleton className="h-32 w-full rounded-md" />
          </CardContent>
        </Card>
      </Tabs>
    </section>
  );
}

function LoadingSearch({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative min-w-[240px] flex-1 sm:max-w-[340px]">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
      <Input
        placeholder={placeholder}
        readOnly
        className="h-10 rounded-lg border border-border bg-card pl-9 text-xs text-text-primary placeholder:text-text-quaternary"
      />
    </div>
  );
}

function LoadingSelect({
  icon: Icon,
  label,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  label: string;
  className: string;
  compact?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <Icon
        className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-600 dark:text-slate-200 ${
          compact ? "size-3.5" : "size-4"
        }`}
      />
      <div
        className={`flex w-full items-center rounded-lg border border-border bg-card text-xs font-medium text-text-primary ${
          compact ? "h-9 pl-8 pr-8" : "h-10 pl-9 pr-8"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
