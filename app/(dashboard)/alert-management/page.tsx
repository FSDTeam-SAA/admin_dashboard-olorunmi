"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Eye,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PaginationControls } from "@/components/common/pagination-controls";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteAlert,
  getAlerts,
  getApiMessage,
  getUserChecklists,
  getUsers,
  sendAlert,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { formatDateTimeLabel, getUserInitials } from "@/lib/utils";
import type { ChecklistItem } from "@/types/api";

const PAGE_LIMIT = 8;
const REALTIME_REFETCH_INTERVAL = 5000;

type AlertBadgeConfig = {
  label: string;
  variant: "danger" | "orange" | "booked" | "neutral" | "success" | "warning";
  icon: typeof AlertTriangle;
};

const getAlertBadgeConfig = (status: ChecklistItem["status"] | string): AlertBadgeConfig => {
  switch (status) {
    case "checked_in_missed":
    case "missed_check_in":
      return {
        label: "Missed Check-In",
        variant: "danger",
        icon: AlertTriangle,
      };
    case "user_outside_radius":
    case "out_of_location":
      return {
        label: "Out of Location",
        variant: "orange",
        icon: MapPin,
      };
    case "checked_out":
    case "booked_off":
      return {
        label: "Booked-Off",
        variant: "booked",
        icon: Calendar,
      };
    case "testing_alert":
    case "testing":
      return {
        label: "Testing Alert",
        variant: "neutral",
        icon: UserIcon,
      };
    case "checked_in":
      return {
        label: "Booked-In",
        variant: "success",
        icon: CheckCircle2,
      };
    case "re_checked_in":
      return {
        label: "Check-In: OK",
        variant: "success",
        icon: CheckCircle2,
      };
    case "checked_in_not_ok":
      return {
        label: "Check-In: NOT OK",
        variant: "danger",
        icon: AlertTriangle,
      };
    default:
      return {
        label: status ? status.replace(/_/g, " ") : "Alert",
        variant: "neutral",
        icon: AlertTriangle,
      };
  }
};

const ALERT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "re_checked_in", label: "Check-In: OK" },
  { value: "checked_in_not_ok", label: "Check-In: NOT OK" },
  { value: "checked_in_missed", label: "Missed Check-In" },
  { value: "checked_in", label: "Booked-In" },
  { value: "checked_out", label: "Booked-Off" },
  { value: "user_outside_radius", label: "Out of Location" },
  { value: "back_inside_radius", label: "Back Inside Radius" },
  { value: "testing_alert", label: "Testing Alert" },
];

// Most recent activity moment on an alert, used to pick a user's latest alert.
const getAlertTimestamp = (alert: ChecklistItem) => {
  const value = alert.checkOutAt || alert.checkInAt || alert.workDate;

  return value ? new Date(value).getTime() : 0;
};

const getDeviceDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function AlertManagementPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const dateRangeRef = useRef<HTMLDivElement>(null);
  const [alertTypeFilter, setAlertTypeFilter] = useState("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [statusTab, setStatusTab] = useState<"all" | "unresolved" | "resolved">("all");

  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, boolean>>({});
  const [resolvedAlerts, setResolvedAlerts] = useState<Record<string, boolean>>({});

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewAlert, setViewAlert] = useState<ChecklistItem | null>(null);
  const [viewDate, setViewDate] = useState(getDeviceDate);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cardAlertType, setCardAlertType] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!dateRangeOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target as Node)) {
        setDateRangeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dateRangeOpen]);

  const alertsQuery = useQuery({
    queryKey: QUERY_KEYS.alerts(page, search),
    queryFn: () => getAlerts({ page, limit: PAGE_LIMIT, search, latestPerUser: true }),
    refetchInterval: REALTIME_REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  const usersQuery = useQuery({
    queryKey: ["users-filter-list"],
    queryFn: () => getUsers({ page: 1, limit: 100 }),
  });

  const viewUserId = viewAlert?.user?._id;

  const checklistsQuery = useQuery({
    queryKey: QUERY_KEYS.userChecklists(viewUserId, viewDate),
    queryFn: () =>
      getUserChecklists({
        user: viewUserId as string,
        date: viewDate || undefined,
      }),
    enabled: viewModalOpen && Boolean(viewUserId),
    refetchInterval: viewModalOpen ? REALTIME_REFETCH_INTERVAL : false,
    refetchIntervalInBackground: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: (response) => {
      toast.success(response.message || "Alert resolved successfully");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to delete alert"));
    },
  });

  const alertsData = alertsQuery.data?.alerts;

  // The API already collapses this list to the latest alert per user
  // (`latestPerUser`); this is a client-side safeguard so a user can never be
  // rendered twice. Full per-user history stays available via the View dialog.
  const rawAlerts = useMemo(() => {
    const latestByUser = new Map<string, ChecklistItem>();

    (alertsData ?? []).forEach((alert) => {
      const userKey = alert.user?._id ?? alert._id;
      const existing = latestByUser.get(userKey);

      if (!existing || getAlertTimestamp(alert) > getAlertTimestamp(existing)) {
        latestByUser.set(userKey, alert);
      }
    });

    return [...latestByUser.values()].sort(
      (first, second) => getAlertTimestamp(second) - getAlertTimestamp(first)
    );
  }, [alertsData]);

  // Filter alerts based on filters
  const filteredAlerts = useMemo(() => {
    return rawAlerts.filter((alert) => {
      if (alertTypeFilter !== "all" && alert.status !== alertTypeFilter) {
        return false;
      }

      if (selectedUserFilter !== "all" && alert.user?._id !== selectedUserFilter) {
        return false;
      }

      if (dateFrom || dateTo) {
        const alertDateValue = alert.checkOutAt || alert.checkInAt;
        const alertDate = alertDateValue ? alertDateValue.slice(0, 10) : "";

        if (!alertDate) return false;
        if (dateFrom && alertDate < dateFrom) return false;
        if (dateTo && alertDate > dateTo) return false;
      }

      const isResolved = resolvedAlerts[alert._id];
      if (statusTab === "resolved" && !isResolved) return false;
      if (statusTab === "unresolved" && isResolved) return false;

      return true;
    });
  }, [rawAlerts, alertTypeFilter, selectedUserFilter, dateFrom, dateTo, statusTab, resolvedAlerts]);

  const hasActiveFilters = Boolean(dateFrom || dateTo || alertTypeFilter !== "all" || selectedUserFilter !== "all" || statusTab !== "all");

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setDateRangeOpen(false);
    setAlertTypeFilter("all");
    setSelectedUserFilter("all");
    setStatusTab("all");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  // Calculate KPI Counts
  const kpiStats = useMemo(() => {
    let bookedIn = 0;
    let missedCheckIn = 0;
    let outOfLocation = 0;
    let bookedOff = 0;

    rawAlerts.forEach((alert) => {
      if (alert.status === "checked_in") bookedIn++;
      else if (alert.status === "checked_in_missed") missedCheckIn++;
      else if (alert.status === "user_outside_radius") outOfLocation++;
      else if (alert.status === "checked_out") bookedOff++;
    });

    return { bookedIn, missedCheckIn, outOfLocation, bookedOff };
  }, [rawAlerts]);

  // Alerts backing the card dialog. Reuses the same deduped `rawAlerts` list
  // (latest alert per user) that the main table filters from.
  const cardAlerts = useMemo(() => {
    if (!cardAlertType) return [];

    return rawAlerts.filter((alert) => alert.status === cardAlertType);
  }, [rawAlerts, cardAlertType]);

  const cardAlertLabel = cardAlertType ? getAlertBadgeConfig(cardAlertType).label : "";

  const pagination = alertsQuery.data?.pagination;
  const currentPage = pagination?.page ?? 1;
  const currentLimit = pagination?.limit ?? PAGE_LIMIT;
  const totalEntries = pagination?.total ?? rawAlerts.length;
  const startResult = filteredAlerts.length ? (currentPage - 1) * currentLimit + 1 : 0;
  const endResult = (currentPage - 1) * currentLimit + filteredAlerts.length;

  const checklistHistory = [...(checklistsQuery.data ?? [])].sort((first, second) => {
    const firstTime = new Date(first.checkInAt || first.checkOutAt || 0).getTime();
    const secondTime = new Date(second.checkInAt || second.checkOutAt || 0).getTime();

    return firstTime - secondTime;
  });

  const handleAcknowledge = (id: string) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }));
    toast.success("Alert acknowledged");
  };

  const handleResolve = (id: string) => {
    setResolvedAlerts((prev) => ({ ...prev, [id]: true }));
    toast.success("Alert marked as resolved");
  };

  // Shared row renderer for the main table and the summary-card dialog, so
  // Acknowledge/Resolve/View stay backed by the same handlers everywhere.
  const renderAlertRow = (alert: ChecklistItem) => {
    const badgeConfig = getAlertBadgeConfig(alert.status);
    const AlertIcon = badgeConfig.icon;
    const isAcknowledged = acknowledgedAlerts[alert._id];
    const isResolved = resolvedAlerts[alert._id];

    return (
      <TableRow key={alert._id} className="transition-colors hover:bg-secondary-bg/50">
        {/* User Name with Avatar */}
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="size-9 shrink-0 border border-border">
              <AvatarImage
                src={(alert.user as unknown as { avatar?: { url?: string } })?.avatar?.url ?? ""}
                alt={alert.user?.name ?? "User"}
              />
              <AvatarFallback className="text-xs font-bold">
                {getUserInitials(alert.user?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-semibold text-text-primary">
              {alert.user?.name || "John Smith"}
            </span>
          </div>
        </TableCell>

        {/* User ID */}
        <TableCell className="text-xs font-medium text-text-secondary">
          {alert.user?.userId || "USR-1034"}
        </TableCell>

        {/* Date & Time */}
        <TableCell className="text-xs text-text-secondary">
          {alert.checkOutAt
            ? formatDateTimeLabel(alert.checkOutAt)
            : alert.checkInAt
              ? formatDateTimeLabel(alert.checkInAt)
              : "2023-12-15 10:21 AM"}
        </TableCell>

        {/* Alert Pill Badge */}
        <TableCell>
          <Badge variant={badgeConfig.variant} className="h-7 px-3 text-xs font-semibold">
            <AlertIcon className="size-3.5" />
            {badgeConfig.label}
          </Badge>
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            {/* Acknowledge Button */}
            <Button
              type="button"
              variant="tealOutline"
              size="sm"
              className="h-8 rounded-md px-3 text-xs font-medium"
              disabled={isAcknowledged}
              onClick={() => handleAcknowledge(alert._id)}
            >
              {isAcknowledged ? "Acknowledged" : "Acknowledge"}
            </Button>

            {/* Resolve Button */}
            <Button
              type="button"
              variant="slateOutline"
              size="sm"
              className="h-8 rounded-md px-3 text-xs font-medium"
              disabled={isResolved}
              onClick={() => handleResolve(alert._id)}
            >
              {isResolved ? "Resolved" : "Resolve"}
            </Button>

            {/* View Button */}
            <Button
              type="button"
              variant="slateOutline"
              size="sm"
              className="h-8 rounded-md px-3 text-xs font-medium"
              onClick={() => {
                setViewAlert(alert);
                setViewDate(getDeviceDate());
                setViewModalOpen(true);
              }}
            >
              View
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <section className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Alert Management Dashboard
        </h1>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Picker */}
          <div className="relative min-w-[130px]" ref={dateRangeRef}>
            <button
              type="button"
              onClick={() => setDateRangeOpen((prev) => !prev)}
              className="flex h-9 w-full items-center gap-1.5 rounded-lg border border-border bg-card pl-2.5 pr-2.5 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-secondary-bg focus:border-primary"
            >
              <Calendar className="size-3.5 shrink-0 text-slate-600 dark:text-slate-200" />
              <span className="flex-1 truncate text-left">
                {dateFrom || dateTo
                  ? `${dateFrom || "…"} – ${dateTo || "…"}`
                  : "Date Range"}
              </span>
              <ChevronDown className="size-3.5 shrink-0 text-slate-500 dark:text-slate-300" />
            </button>

            {dateRangeOpen ? (
              <div className="absolute top-full left-0 z-20 mt-1.5 w-[260px] rounded-lg border border-border bg-card p-3 shadow-lg">
                <div className="space-y-2.5">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-text-tertiary">From</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-8.5 w-full rounded-lg border border-border bg-card px-2.5 text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-text-tertiary">To</label>
                    <Input
                      type="date"
                      value={dateTo}
                      min={dateFrom || undefined}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-8.5 w-full rounded-lg border border-border bg-card px-2.5 text-xs text-text-primary"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 text-xs"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 flex-1 bg-teal-600 text-xs text-white hover:bg-teal-700"
                    onClick={() => setDateRangeOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Alert Type Dropdown */}
          <div className="relative min-w-[130px]">
            <AlertTriangle className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-600 dark:text-slate-200" />
            <select
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-border bg-card pl-8 pr-8 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-secondary-bg focus:border-primary"
            >
              <option value="all">Alert Type</option>
              {ALERT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          </div>

          {/* Select User Dropdown */}
          <div className="relative min-w-[140px]">
            <UserIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-600 dark:text-slate-200" />
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-border bg-card pl-8 pr-8 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-secondary-bg focus:border-primary"
            >
              <option value="all">Select User</option>
              {usersQuery.data?.users?.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name || u.userId}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          </div>
        </div>

        {/* Status Segmented Tabs & Search Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-medium text-text-secondary">
            <span className="font-semibold text-text-primary">Status :</span>
            <button
              type="button"
              onClick={() => setStatusTab("all")}
              className={`rounded px-2 py-1 transition-colors ${
                statusTab === "all"
                  ? "font-bold text-blue-600 dark:text-blue-400"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              All
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => setStatusTab("unresolved")}
              className={`rounded px-2 py-1 transition-colors ${
                statusTab === "unresolved"
                  ? "font-bold text-blue-600 dark:text-blue-400"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              Unresolved
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => setStatusTab("resolved")}
              className={`rounded px-2 py-1 transition-colors ${
                statusTab === "resolved"
                  ? "font-bold text-blue-600 dark:text-blue-400"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              Resolved
            </button>
          </div>

          <Button
            type="button"
            className="h-9 rounded-lg bg-teal-600 px-5 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 active:bg-teal-800"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["alerts"] })}
          >
            Search
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold"
            disabled={!hasActiveFilters}
            onClick={handleClearFilters}
          >
            <RotateCcw className="size-3.5" />
            Clear Filter
          </Button>
        </div>
      </div>

      {/* 4 Top KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Booked-In (Green) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setCardAlertType("checked_in")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setCardAlertType("checked_in");
          }}
          className="relative cursor-pointer overflow-hidden rounded-xl bg-emerald-600 p-4 text-left text-white shadow-xs transition-transform hover:-translate-y-0.5 dark:bg-emerald-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/90">Booked-In</p>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight">{kpiStats.bookedIn}</span>
                <span className="text-xs font-medium text-white/80">&rsaquo;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Missed Check-In (Red) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setCardAlertType("checked_in_missed")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setCardAlertType("checked_in_missed");
          }}
          className="relative cursor-pointer overflow-hidden rounded-xl bg-red-600 p-4 text-left text-white shadow-xs transition-transform hover:-translate-y-0.5 dark:bg-red-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs">
              <span className="text-base font-black">!</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/90">Missed Check-In</p>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight">{kpiStats.missedCheckIn}</span>
                <span className="text-xs font-medium text-white/80">&rsaquo;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Out of Location (Orange) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setCardAlertType("user_outside_radius")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setCardAlertType("user_outside_radius");
          }}
          className="relative cursor-pointer overflow-hidden rounded-xl bg-orange-500 p-4 text-left text-white shadow-xs transition-transform hover:-translate-y-0.5 dark:bg-orange-700"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/90">Out of Location</p>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight">{kpiStats.outOfLocation}</span>
                <span className="text-xs font-medium text-white/80">&rsaquo;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Booked-Off (Blue) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setCardAlertType("checked_out")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setCardAlertType("checked_out");
          }}
          className="relative cursor-pointer overflow-hidden rounded-xl bg-blue-600 p-4 text-left text-white shadow-xs transition-transform hover:-translate-y-0.5 dark:bg-blue-700"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs">
              <Calendar className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/90">Booked-Off</p>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight">{kpiStats.bookedOff}</span>
                <span className="text-xs font-medium text-white/80">&rsaquo;</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Table */}
      {alertsQuery.isLoading ? (
        <TableSkeleton rows={PAGE_LIMIT} />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-transparent">
                  <TableHead className="w-[220px]">User Name</TableHead>
                  <TableHead className="w-[140px]">User ID</TableHead>
                  <TableHead className="w-[200px]">Date &amp; Time</TableHead>
                  <TableHead className="w-[180px]">Alert</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-text-tertiary">
                      No alerts found for current criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map(renderAlertRow)
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer & Pagination */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-tertiary">
              Showing {startResult} to {endResult} of {totalEntries} entries
            </p>
            <PaginationControls
              page={page}
              totalPages={pagination?.totalPages ?? 1}
              onPageChange={setPage}
              showTextLabels
            />
          </div>
        </div>
      )}

      {/* Alert Details Dialog */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-[760px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-primary">Alert Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary-bg/50 px-3.5 py-2.5">
                <p className="text-xs text-text-tertiary">User Name</p>
                <p className="font-semibold text-text-primary">{viewAlert?.user?.name ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary-bg/50 px-3.5 py-2.5">
                <p className="text-xs text-text-tertiary">User ID</p>
                <p className="font-semibold text-text-primary">{viewAlert?.user?.userId ?? "-"}</p>
              </div>
            </div>

            <div>
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">Alert History</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={viewDate}
                    onChange={(event) => setViewDate(event.target.value)}
                    className="h-8.5 w-[145px] rounded-lg border border-border bg-card px-2.5 text-xs text-text-primary"
                  />
                  {viewDate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8.5 text-xs"
                      onClick={() => setViewDate("")}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>

              {checklistsQuery.isLoading ? (
                <p className="rounded-xl border border-border bg-secondary-bg/30 px-3 py-6 text-center text-xs text-text-tertiary">
                  Loading checklist history...
                </p>
              ) : checklistsQuery.isError ? (
                <p className="rounded-xl border border-red-200 bg-red-50/50 px-3 py-6 text-center text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                  {getApiMessage(checklistsQuery.error, "Unable to load checklist history")}
                </p>
              ) : checklistHistory.length === 0 ? (
                <p className="rounded-xl border border-border bg-secondary-bg/30 px-3 py-6 text-center text-xs text-text-tertiary">
                  No checklist records found
                </p>
              ) : (
                <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
                  {checklistHistory.map((item) => (
                    <div key={item._id} className="rounded-xl border border-border bg-secondary-bg/30 p-3.5">
                      <div className="mb-2.5 flex items-center justify-between">
                        <Badge variant={getAlertBadgeConfig(item.status).variant}>
                          {getAlertBadgeConfig(item.status).label}
                        </Badge>
                        <span className="text-xs text-text-tertiary">{item.workDate}</span>
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                          <p className="text-[11px] text-text-tertiary">Check In</p>
                          <p className="text-xs font-medium text-text-primary">
                            {item.checkInAt ? formatDateTimeLabel(item.checkInAt) : "-"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                          <p className="text-[11px] text-text-tertiary">Check Out</p>
                          <p className="text-xs font-medium text-text-primary">
                            {item.checkOutAt ? formatDateTimeLabel(item.checkOutAt) : "-"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                          <p className="text-[11px] text-text-tertiary">Check In Location</p>
                          <p className="text-xs font-medium text-text-primary">
                            {item.checkInLocation
                              ? `${item.checkInLocation.latitude}, ${item.checkInLocation.longitude}`
                              : "-"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
                          <p className="text-[11px] text-text-tertiary">Check Out Location</p>
                          <p className="text-xs font-medium text-text-primary">
                            {item.checkOutLocation?.latitude != null &&
                            item.checkOutLocation?.longitude != null
                              ? `${item.checkOutLocation.latitude}, ${item.checkOutLocation.longitude}`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-row justify-center sm:justify-center">
            <Button
              variant="outline"
              className="min-w-[120px]"
              onClick={() => setViewModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Alert Type Dialog */}
      <Dialog open={Boolean(cardAlertType)} onOpenChange={(value) => !value && setCardAlertType(null)}>
        <DialogContent className="max-w-[900px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-primary">{cardAlertLabel} Alerts</DialogTitle>
          </DialogHeader>

          <div className="max-h-[520px] overflow-y-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-transparent">
                  <TableHead className="w-[220px]">User Name</TableHead>
                  <TableHead className="w-[140px]">User ID</TableHead>
                  <TableHead className="w-[200px]">Date &amp; Time</TableHead>
                  <TableHead className="w-[180px]">Alert</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-text-tertiary">
                      No {cardAlertLabel} alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  cardAlerts.map(renderAlertRow)
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="flex-row justify-center sm:justify-center">
            <Button
              variant="outline"
              className="min-w-[120px]"
              onClick={() => setCardAlertType(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteId(null);
          }
        }}
        title="Delete Alert?"
        description="Are you sure you want to permanently delete this alert?"
        confirmText="Delete"
        confirmVariant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
          }
        }}
        loading={deleteMutation.isPending}
      />
    </section>
  );
}
