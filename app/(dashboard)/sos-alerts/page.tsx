"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  TriangleAlert,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { PaginationControls } from "@/components/common/pagination-controls";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  acknowledgeSosAlert,
  getApiMessage,
  getSosAlerts,
  getUsers,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import {
  SOS_REFETCH_INTERVAL,
  getSosAcknowledgedByLabel,
  getSosAcknowledgedLabel,
  getSosLocationLabel,
  getSosTriggeredLabel,
} from "@/lib/sos";
import { getUserInitials } from "@/lib/utils";
import type { SosAlertItem } from "@/types/api";

const PAGE_LIMIT = 10;

type StatusFilter = "all" | "pending" | "acknowledged";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "acknowledged", label: "Acknowledged" },
];

export default function SosAlertsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [userFilter, setUserFilter] = useState("all");

  const sosQuery = useQuery({
    queryKey: QUERY_KEYS.sosAlerts(statusFilter, userFilter, page),
    queryFn: () =>
      getSosAlerts({
        status: statusFilter,
        user: userFilter,
        page,
        limit: PAGE_LIMIT,
      }),
    refetchInterval: SOS_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Shares its cache with the alert management page's user dropdown.
  const usersQuery = useQuery({
    queryKey: ["users-filter-list"],
    queryFn: () => getUsers({ page: 1, limit: 100 }),
    // This only populates the filter dropdown. It is shared with the other
    // dashboard tabs via the query key, so a longer stale window stops a heavy
    // 100-user payload being refetched on every tab switch.
    staleTime: 5 * 60 * 1000,
  });

  // Same endpoint helper the SOS popup uses, so both paths stay in step.
  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeSosAlert,
    onSuccess: (response) => {
      toast.success(response.message || "SOS alert acknowledged");
      queryClient.invalidateQueries({ queryKey: ["sos-alerts"] });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to acknowledge this SOS alert"));
    },
  });

  const alerts = sosQuery.data?.alerts ?? [];
  const pagination = sosQuery.data?.pagination;
  const currentPage = pagination?.page ?? page;
  const currentLimit = pagination?.limit ?? PAGE_LIMIT;
  const totalEntries = pagination?.total ?? alerts.length;
  const startResult = alerts.length ? (currentPage - 1) * currentLimit + 1 : 0;
  const endResult = (currentPage - 1) * currentLimit + alerts.length;

  const handleStatusChange = (nextStatus: StatusFilter) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleUserChange = (nextUser: string) => {
    setUserFilter(nextUser);
    setPage(1);
  };

  const renderAction = (alert: SosAlertItem) => {
    if (alert.status === "acknowledged") {
      return (
        <div className="text-right">
          <p className="text-xs font-semibold text-text-primary">
            by {getSosAcknowledgedByLabel(alert)}
          </p>
          <p className="text-[11px] text-text-tertiary">
            {getSosAcknowledgedLabel(alert)}
          </p>
        </div>
      );
    }

    const isAcknowledging =
      acknowledgeMutation.isPending &&
      acknowledgeMutation.variables === alert._id;

    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="h-8 rounded-md px-3 text-xs font-semibold"
        disabled={isAcknowledging}
        onClick={() => acknowledgeMutation.mutate(alert._id)}
      >
        {isAcknowledging ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Acknowledge (I&apos;m Aware)
      </Button>
    );
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          SOS Alerts
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Every emergency alert raised by a guard, and who acknowledged it.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Select User Dropdown */}
          <div className="relative min-w-[160px]">
            <UserIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-600 dark:text-slate-200" />
            <select
              value={userFilter}
              onChange={(event) => handleUserChange(event.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-border bg-card pr-8 pl-8 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-secondary-bg focus:border-primary"
              aria-label="Filter by guard"
            >
              <option value="all">All Guards</option>
              {usersQuery.data?.users?.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name || user.userId}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1 text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">Status :</span>
          {STATUS_TABS.map((tab, index) => (
            <span key={tab.value} className="flex items-center gap-1">
              {index > 0 ? <span className="text-border">|</span> : null}
              <button
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={`rounded px-2 py-1 transition-colors ${
                  statusFilter === tab.value
                    ? "font-bold text-blue-600 dark:text-blue-400"
                    : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            </span>
          ))}
        </div>
      </div>

      {sosQuery.isLoading ? (
        <TableSkeleton rows={PAGE_LIMIT} />
      ) : sosQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-10 text-center text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {getApiMessage(sosQuery.error, "Unable to load SOS alerts")}
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-transparent">
                <TableHead className="w-[220px]">Guard</TableHead>
                <TableHead className="w-[120px]">User ID</TableHead>
                <TableHead className="w-[260px]">Triggered</TableHead>
                <TableHead className="w-[170px]">Location</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-text-tertiary"
                  >
                    No SOS alerts found for current criteria
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => {
                  const location = getSosLocationLabel(alert);
                  const isPending = alert.status === "pending";

                  return (
                    <TableRow
                      key={alert._id}
                      className="transition-colors hover:bg-secondary-bg/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 shrink-0 border border-border">
                            <AvatarImage
                              src={alert.user?.avatar?.url ?? ""}
                              alt={alert.user?.name ?? "Guard"}
                            />
                            <AvatarFallback className="text-xs font-bold">
                              {getUserInitials(alert.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm font-semibold text-text-primary">
                            {alert.user?.name || "Unknown guard"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-medium text-text-secondary">
                        {alert.user?.userId || "-"}
                      </TableCell>

                      <TableCell className="text-xs text-text-secondary">
                        {getSosTriggeredLabel(alert)}
                      </TableCell>

                      <TableCell className="text-xs">
                        {location ? (
                          <a
                            href={location.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                          >
                            <MapPin className="size-3.5 shrink-0" />
                            {location.text}
                          </a>
                        ) : (
                          <span className="text-text-tertiary">
                            Location unavailable
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={isPending ? "danger" : "success"}
                          className="h-7 px-3 text-xs font-semibold"
                        >
                          {isPending ? (
                            <TriangleAlert className="size-3.5" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          {isPending ? "Pending" : "Acknowledged"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end">{renderAction(alert)}</div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-tertiary">
              Showing {startResult} to {endResult} of {totalEntries} entries
            </p>
            <PaginationControls
              page={currentPage}
              totalPages={pagination?.totalPages ?? 1}
              onPageChange={setPage}
              showTextLabels
            />
          </div>
        </div>
      )}
    </section>
  );
}
