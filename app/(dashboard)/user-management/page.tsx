"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  X,
  XCircle,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  UserFormDialog,
  type UserFormPayload,
} from "./_components/user-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DateRangeFilter } from "@/components/common/date-range-filter";
import { PageSizeSelect } from "@/components/common/page-size-select";
import { PaginationControls } from "@/components/common/pagination-controls";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { UserLocationMap } from "./_components/user-location-map";
import {
  createUser,
  deleteUser,
  getApiMessage,
  getUserChecklists,
  getUserDetails,
  getUsers,
  updateUser,
  updateUserStatus,
} from "@/lib/api";
import { API_BASE_URL, QUERY_KEYS } from "@/lib/constants";
import {
  formatDateLabel,
  formatDateTimeLabel,
  formatTimeLabel,
  getUserInitials,
} from "@/lib/utils";
import type { LocationPoint, ReportItem, UserListItem } from "@/types/api";

const DEFAULT_PAGE_SIZE = 10;
const WEEK_DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
const WEEK_DAY_FALLBACK_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type UserActivity = {
  id: string;
  label: string;
  time: string;
  kind:
    | "booked_in"
    | "booked_off"
    | "check_in_ok"
    | "check_in_not_ok"
    | "missed_check_in"
    | "out_of_location"
    | "back_inside";
};

const activityDisplay: Record<
  UserActivity["kind"],
  {
    icon: LucideIcon;
    className: string;
  }
> = {
  booked_in: {
    icon: Check,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  booked_off: {
    icon: CheckCircle2,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  },
  check_in_ok: {
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  check_in_not_ok: {
    icon: X,
    className: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  },
  missed_check_in: {
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  },
  out_of_location: {
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  },
  back_inside: {
    icon: MapPin,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
};

const getActivityKind = (status?: string, checkOutType?: string | null): UserActivity["kind"] => {
  if (checkOutType === "auto" || status === "user_outside_radius") {
    return "out_of_location";
  }

  switch (status) {
    case "checked_out":
      return "booked_off";
    case "re_checked_in":
      return "check_in_ok";
    case "checked_in_not_ok":
      return "check_in_not_ok";
    case "checked_in_missed":
      return "missed_check_in";
    case "back_inside_radius":
      return "back_inside";
    case "checked_in":
    default:
      return "booked_in";
  }
};

const getActivityLabel = (kind: UserActivity["kind"]) => {
  switch (kind) {
    case "booked_off":
      return "Booked-Off";
    case "check_in_ok":
      return "Check-In: OK";
    case "check_in_not_ok":
      return "Check-In: NOT OK";
    case "missed_check_in":
      return "Missed Check-In";
    case "out_of_location":
      return "Out of location";
    case "back_inside":
      return "Back inside location";
    case "booked_in":
    default:
      return "Booked-In";
  }
};

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

const formatDateInputValue = (dateValue?: string | Date | null) => {
  if (!dateValue) {
    return "";
  }

  if (typeof dateValue === "string" && dateOnlyPattern.test(dateValue)) {
    return dateValue;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentDateInputValue = () => formatDateInputValue(new Date());

const getWeekDayKeyForDate = (dateValue?: string | Date | null) => {
  if (typeof dateValue === "string" && dateOnlyPattern.test(dateValue)) {
    const [year, month, day] = dateValue.split("-").map(Number);
    return WEEK_DAY_KEYS[new Date(year, month - 1, day).getDay()];
  }

  const date = dateValue ? new Date(dateValue) : new Date();
  return WEEK_DAY_KEYS[Number.isNaN(date.getTime()) ? new Date().getDay() : date.getDay()];
};

const getWeekDayLabelForDate = (dateValue?: string | Date | null) => {
  const dayKey = getWeekDayKeyForDate(dateValue);
  return dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
};

const isOffDayLocation = (location?: LocationPoint) =>
  location?.isWeekend === true || location?.isOff === true;

const getPreferredWeeklyLocation = (
  user: UserListItem,
  dateValue?: string | Date | null
) => {
  const selectedDayLocation = user.weeklyLocations?.[getWeekDayKeyForDate(dateValue)];
  if (selectedDayLocation) {
    return selectedDayLocation;
  }

  return WEEK_DAY_FALLBACK_KEYS.map((day) => user.weeklyLocations?.[day]).find(
    (location) =>
      !isOffDayLocation(location) &&
      typeof location?.latitude === "number" &&
      typeof location?.longitude === "number"
  );
};

const getPreferredSite = (user: UserListItem, dateValue?: string | Date | null) => {
  const location = getPreferredWeeklyLocation(user, dateValue);

  return isOffDayLocation(location) ? "Off" : location?.site || user.site || "-";
};

const getPreferredShift = (
  user: UserListItem,
  field: "onShift" | "offShift",
  dateValue?: string | Date | null
) => {
  const location = getPreferredWeeklyLocation(user, dateValue);

  return isOffDayLocation(location) ? "-" : location?.[field] || user[field] || "-";
};

const isUserDisabled = (user: UserListItem) =>
  (user as unknown as { isActive?: boolean }).isActive === false || user.status === "disabled";

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("user");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserListItem | null>(null);
  const [toggleStatusUser, setToggleStatusUser] = useState<UserListItem | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [activityDate, setActivityDate] = useState("");
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: QUERY_KEYS.users(page, pageSize, search, roleFilter),
    queryFn: () => getUsers({ page, limit: pageSize, search, role: roleFilter }),
  });

  const detailsQuery = useQuery({
    queryKey: QUERY_KEYS.userDetails(detailsUserId ?? undefined),
    queryFn: () => getUserDetails(detailsUserId as string),
    enabled: Boolean(detailsOpen && detailsUserId),
  });

  const checklistsQuery = useQuery({
    queryKey: QUERY_KEYS.userChecklists(detailsUserId ?? undefined),
    queryFn: () =>
      getUserChecklists({
        user: detailsUserId as string,
      }),
    enabled: Boolean(detailsOpen && detailsUserId),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (response) => {
      toast.success(response.message || "User added successfully");
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to create user"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserFormPayload }) =>
      updateUser(id, payload),
    onSuccess: (response) => {
      toast.success(response.message || "User updated successfully");
      setFormOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to update user"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (response) => {
      toast.success(response.message || "User deleted successfully");
      setDeleteTargetUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to delete user"));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "disabled" }) =>
      updateUserStatus(id, status),
    onSuccess: (response) => {
      toast.success(response.message || "User status updated");
      setToggleStatusUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to update user status"));
    },
  });

  const rawUsers = usersQuery.data?.users ?? [];

  // Filter client side based on role and status dropdowns if selected
  const filteredUsers = useMemo(() => {
    return rawUsers.filter((user) => {
      if (roleFilter !== "all") {
        const userRole = (user.role || "user").toLowerCase();
        if (userRole !== roleFilter.toLowerCase()) return false;
      }
      if (statusFilter !== "all") {
        const isUserActive = (user as unknown as { isActive?: boolean }).isActive !== false && (user as unknown as { status?: string }).status !== "disabled";
        if (statusFilter === "active" && !isUserActive) return false;
        if (statusFilter === "disabled" && isUserActive) return false;
      }
      if (dateFrom || dateTo) {
        const createdDate = user.createdAt ? user.createdAt.slice(0, 10) : "";

        if (!createdDate) return false;
        if (dateFrom && createdDate < dateFrom) return false;
        if (dateTo && createdDate > dateTo) return false;
      }
      return true;
    });
  }, [rawUsers, roleFilter, statusFilter, dateFrom, dateTo]);

  const pagination = usersQuery.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? 1;
  const currentLimit = pagination?.limit ?? pageSize;
  const totalEntries = pagination?.total ?? filteredUsers.length;
  const startResult = filteredUsers.length ? (currentPage - 1) * currentLimit + 1 : 0;
  const endResult = (currentPage - 1) * currentLimit + filteredUsers.length;

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (user: UserListItem) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleSubmitUser = (payload: UserFormPayload) => {
    if (editingUser?._id) {
      updateMutation.mutate({ id: editingUser._id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  // const handleDateRangeFilterChange = (value: string) => {
  //   setDateRangeFilter(value);
  //   setDateRangeReferenceTime(value === "all" ? 0 : Date.now());
  // };

  const selectedUser = detailsQuery.data?.user;
  const reports = detailsQuery.data?.reports ?? [];

  const activities = useMemo<UserActivity[]>(() => {
    const checklists = checklistsQuery.data ?? detailsQuery.data?.checklists ?? [];
    const visibleChecklists = activityDate
      ? checklists.filter((item) =>
          [
            formatDateInputValue(item.workDate),
            formatDateInputValue(item.checkInAt),
            formatDateInputValue(item.checkOutAt),
          ].includes(activityDate)
        )
      : checklists;

    return [...visibleChecklists]
      .sort((first, second) => {
        const firstTime = new Date(first.checkOutAt ?? first.checkInAt).getTime();
        const secondTime = new Date(second.checkOutAt ?? second.checkInAt).getTime();

        return firstTime - secondTime;
      })
      .map((item) => {
        const kind = getActivityKind(item.status, item.checkOutType);

        return {
          id: item._id,
          label: getActivityLabel(kind),
          time: item.checkOutAt ?? item.checkInAt,
          kind,
        };
      });
  }, [activityDate, checklistsQuery.data, detailsQuery.data?.checklists]);

  return (
    <section className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            User Management
          </h1>
          <p className="text-sm text-text-tertiary">
            Manage guard accounts, supervisors, and admin users.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 sm:self-auto"
        >
          <Plus className="size-4" />
          Add New User
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Role Select Dropdown */}
        <div className="relative min-w-[130px]">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-600 dark:text-slate-200">
            <Mail className="size-4" />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full appearance-none rounded-lg border border-border bg-card pl-9 pr-8 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-secondary-bg focus:border-primary"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 dark:text-slate-300">
            <span className="text-[10px]">▼</span>
          </div>
        </div>

        {/* Status Select Dropdown */}
        <div className="relative min-w-[130px]">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-600 dark:text-slate-200">
            <Filter className="size-4" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full appearance-none rounded-lg border border-border bg-card pl-9 pr-8 text-xs font-medium text-text-primary outline-none transition-colors hover:bg-secondary-bg focus:border-primary"
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 dark:text-slate-300">
            <span className="text-[10px]">▼</span>
          </div>
        </div>

        {/* Date Range Picker */}
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={(value) => {
            setDateFrom(value);
            setPage(1);
          }}
          onDateToChange={(value) => {
            setDateTo(value);
            setPage(1);
          }}
          onClear={() => {
            setDateFrom("");
            setDateTo("");
            setPage(1);
          }}
          open={dateRangeOpen}
          onOpenChange={setDateRangeOpen}
          className="relative min-w-[140px]"
        />

        {/* Search Input */}
        <div className="relative min-w-[240px] flex-1 sm:max-w-[340px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
          <Input
            placeholder="Search users..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-10 rounded-lg border border-border bg-card pl-9 text-xs text-text-primary placeholder:text-text-quaternary"
          />
        </div>
      </div>

      {/* User Cards Grid */}
      {usersQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: Math.min(pageSize, 9) }).map((_, index) => (
            <div
              key={`user-card-skeleton-${index}`}
              className="rounded-xl border border-card-border-strong bg-card p-4 shadow-card"
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
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <UserX className="size-12 text-text-quaternary" />
          <h3 className="mt-3 text-base font-semibold text-text-primary">No users found</h3>
          <p className="mt-1 text-xs text-text-tertiary">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((user) => {
            // Determine active/disabled status
            const isDisabled = isUserDisabled(user);
            const userRole = (user.role || "user").toLowerCase();

            return (
              <div
                key={user._id}
                className="group relative flex flex-col justify-between rounded-xl border border-card-border-strong bg-card shadow-card transition-all hover:shadow-lg"
              >
                {/* Upper Card Area */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <Avatar className="size-14 shrink-0 border-2 border-border/80 shadow-xs">
                      <AvatarImage src={user.avatar?.url ?? ""} alt={user.name ?? "User"} className="object-cover" />
                      <AvatarFallback className="bg-slate-200 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="truncate text-base font-bold text-text-primary" title={user.name}>
                          {user.name || "Unknown"}
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            userRole === "admin" ? router.push("/settings") : handleOpenEdit(user)
                          }
                          className="text-text-tertiary opacity-0 transition-opacity hover:text-text-primary group-hover:opacity-100"
                          title={userRole === "admin" ? "Manage in Settings" : "Edit User"}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>

                      {userRole === "admin" ? (
                        user.email ? (
                          <p className="truncate text-xs font-medium text-text-secondary">
                            {user.email}
                          </p>
                        ) : null
                      ) : (
                        <>
                          <p className="text-xs font-medium text-text-secondary capitalize">
                            Role: {userRole}
                          </p>
                          <p className="text-xs font-medium text-text-secondary">
                            User ID: {user.userId || "-"}
                          </p>
                        </>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-text-tertiary">
                          Created: {user.createdAt ? formatDateLabel(user.createdAt) : "Aug 5, 2026"}
                        </span>

                        {isDisabled ? (
                          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-white bg-red-600">
                            <X className="size-3" />
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-white bg-emerald-600">
                            <Check className="size-3" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="space-y-2 border-t border-border p-2 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      if (userRole === "admin") {
                        router.push("/settings");
                        return;
                      }
                      setDetailsUserId(user._id);
                      setActivityDate(getCurrentDateInputValue());
                      setDetailsOpen(true);
                    }}
                    className="w-full rounded-md bg-action-info-bg py-2 text-center text-xs font-semibold text-action-info-text shadow-xs transition-colors hover:bg-action-info-bg-hover"
                  >
                    View Details
                  </button>

                  {userRole === "admin" ? null : (
                    <div className="flex items-center gap-2">
                      {isDisabled ? (
                        <button
                          type="button"
                          onClick={() => setToggleStatusUser(user)}
                          className="flex-1 rounded-md bg-action-success-bg py-2 text-center text-xs font-semibold text-action-success-text shadow-xs transition-colors hover:bg-action-success-bg-hover"
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setToggleStatusUser(user)}
                          className="flex-1 rounded-md bg-action-neutral-bg py-2 text-center text-xs font-semibold text-action-neutral-text shadow-xs transition-colors hover:bg-action-neutral-bg-hover"
                        >
                          Disable
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeleteTargetUser(user)}
                        className="flex-1 rounded-md bg-action-danger-bg py-2 text-center text-xs font-semibold text-action-danger-text shadow-xs transition-colors hover:bg-action-danger-bg-hover"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer & Pagination */}
      <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-text-tertiary">
            Showing {startResult} to {endResult} of {totalEntries} entries
          </p>
          <PageSizeSelect
            value={pageSize}
            onChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showTextLabels
        />
      </div>

      {/* Create / Edit User Dialog */}
      <UserFormDialog
        key={`${editingUser?._id ?? "new"}-${formOpen ? "open" : "closed"}`}
        open={formOpen}
        onOpenChange={(value) => {
          setFormOpen(value);
          if (!value) {
            setEditingUser(null);
          }
        }}
        initialValues={editingUser}
        loading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmitUser}
      />

      {/* User Details Dialog */}
      <UserDetailsDialog
        open={detailsOpen}
        onOpenChange={(value) => {
          setDetailsOpen(value);
          if (!value) {
            setActivityDate(getCurrentDateInputValue());
          }
        }}
        loading={detailsQuery.isLoading}
        user={selectedUser}
        activities={activities}
        activityDate={activityDate}
        onActivityDateChange={setActivityDate}
        activitiesLoading={checklistsQuery.isFetching}
        activitiesError={
          checklistsQuery.isError
            ? getApiMessage(checklistsQuery.error, "Unable to load activity history")
            : null
        }
        onViewReports={() => setReportsOpen(true)}
      />

      {/* Reports Dialog */}
      <ReportsDialog
        open={reportsOpen}
        onOpenChange={setReportsOpen}
        reports={reports}
        user={selectedUser}
      />

      {/* Confirm Permanent Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTargetUser)}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteTargetUser(null);
          }
        }}
        title="Permanently Delete User?"
        description={`This will permanently delete ${deleteTargetUser?.name || "this user"} and all of their data. This action cannot be undone.`}
        confirmText="Permanently Delete"
        confirmVariant="destructive"
        requireConfirmationText="DELETE"
        onConfirm={() => {
          if (deleteTargetUser) {
            deleteMutation.mutate(deleteTargetUser._id);
          }
        }}
        loading={deleteMutation.isPending}
      />

      {/* Confirm Disable / Enable Dialog */}
      <ConfirmDialog
        open={Boolean(toggleStatusUser)}
        onOpenChange={(value) => {
          if (!value) {
            setToggleStatusUser(null);
          }
        }}
        title={
          toggleStatusUser && isUserDisabled(toggleStatusUser)
            ? "Enable User Account?"
            : "Disable User Account?"
        }
        description={
          toggleStatusUser && isUserDisabled(toggleStatusUser)
            ? `Are you sure you want to re-activate ${toggleStatusUser?.name || "this user"}? They will be able to log in again.`
            : `Are you sure you want to disable ${toggleStatusUser?.name || "this user"}? They will not be able to log in while disabled.`
        }
        confirmText={
          toggleStatusUser && isUserDisabled(toggleStatusUser) ? "Enable Account" : "Disable Account"
        }
        confirmVariant={
          toggleStatusUser && isUserDisabled(toggleStatusUser) ? "default" : "destructive"
        }
        onConfirm={() => {
          if (toggleStatusUser) {
            statusMutation.mutate({
              id: toggleStatusUser._id,
              status: isUserDisabled(toggleStatusUser) ? "active" : "disabled",
            });
          }
        }}
        loading={statusMutation.isPending}
      />
    </section>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon = FileText,
}: {
  label: string;
  value: string;
  icon?: typeof FileText;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-text-tertiary">{label}</Label>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-secondary-bg/60 px-3 text-sm font-medium text-text-primary">
        <Icon className="size-4 shrink-0 text-text-secondary" />
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function PasswordInfoCard({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  const display = value || "-";

  return (
    <div>
      <Label className="mb-1.5 block text-xs text-text-tertiary">Password</Label>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-secondary-bg/60 px-3 text-sm font-medium text-text-primary">
        <Lock className="size-4 shrink-0 text-text-secondary" />
        <span className="flex-1 truncate font-mono tracking-wider">
          {visible ? display : "••••••••"}
        </span>
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          className="shrink-0 text-text-secondary hover:text-text-primary"
          onClick={() => setVisible((previous) => !previous)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function UserDetailsDialog({
  open,
  onOpenChange,
  loading,
  user,
  activities,
  activityDate,
  onActivityDateChange,
  activitiesLoading,
  activitiesError,
  onViewReports,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  user?: UserListItem;
  activities: UserActivity[];
  activityDate: string;
  onActivityDateChange: (date: string) => void;
  activitiesLoading: boolean;
  activitiesError: string | null;
  onViewReports: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[820px] overflow-y-auto rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">User Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <UserDetailsSkeleton />
        ) : user ? (
          <UserDetailsBody
            user={user}
            activities={activities}
            activityDate={activityDate}
            onActivityDateChange={onActivityDateChange}
            activitiesLoading={activitiesLoading}
            activitiesError={activitiesError}
            onViewReports={onViewReports}
          />
        ) : (
          <DialogDescription>User details are not available.</DialogDescription>
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserDetailsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

function UserDetailsBody({
  user,
  activities,
  activityDate,
  onActivityDateChange,
  activitiesLoading,
  activitiesError,
  onViewReports,
}: {
  user: UserListItem;
  activities: UserActivity[];
  activityDate: string;
  onActivityDateChange: (date: string) => void;
  activitiesLoading: boolean;
  activitiesError: string | null;
  onViewReports: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <InfoCard label="User Name" value={user.name || "-"} icon={UserIcon} />
        <InfoCard label="User ID" value={user.userId || "-"} icon={IdCard} />
        <PasswordInfoCard value={user.textPassword || ""} />
        <InfoCard
          label={`Site (${getWeekDayLabelForDate(activityDate)})`}
          value={getPreferredSite(user, activityDate)}
          icon={Building2}
        />
        <InfoCard
          label="On Shift"
          value={getPreferredShift(user, "onShift", activityDate)}
          icon={Clock}
        />
        <InfoCard
          label="Off Shift"
          value={getPreferredShift(user, "offShift", activityDate)}
          icon={Clock}
        />
      </div>

      <ActivityHistoryCard
        user={user}
        date={activityDate}
        onViewReports={onViewReports}
      />
      <ActivitiesList
        activities={activities}
        date={activityDate}
        loading={activitiesLoading}
        error={activitiesError}
        onDateChange={onActivityDateChange}
      />
    </div>
  );
}

function ActivityHistoryCard({
  user,
  date,
  onViewReports,
}: {
  user: UserListItem;
  date: string;
  onViewReports: () => void;
}) {
  const location = getPreferredWeeklyLocation(user, date);
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  const isOffDay = isOffDayLocation(location);
  const hasLocation =
    !isOffDay &&
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return (
    <div className="rounded-xl border border-border bg-secondary-bg/30 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Activity History</p>
        <Button size="sm" className="h-8 rounded-lg bg-blue-600 px-3.5 text-xs text-white hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700" onClick={onViewReports}>
          <Eye className="size-3.5" />
          View Reports
        </Button>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          Check in Location ({getWeekDayLabelForDate(date)})
        </p>
        {hasLocation ? (
          <p className="text-xs text-text-tertiary">
            <MapPin className="mr-1 inline size-3 text-blue-600 dark:text-blue-400" />
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
            {user.defaultRadius ? ` · ${user.defaultRadius}m radius` : ""}
          </p>
        ) : null}
      </div>

      {hasLocation ? (
        <UserLocationMap
          latitude={latitude}
          longitude={longitude}
          radius={user.defaultRadius}
          heightClassName="h-[220px]"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-secondary-bg/40 text-sm text-text-tertiary">
          {isOffDay ? "Off day" : "No location set for this user"}
        </div>
      )}
    </div>
  );
}

function ActivitiesList({
  activities,
  date,
  loading,
  error,
  onDateChange,
}: {
  activities: UserActivity[];
  date: string;
  loading: boolean;
  error: string | null;
  onDateChange: (date: string) => void;
}) {
  const emptyMessage = date
    ? "No activity found for this date"
    : "No recent activity found";

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">Activity Records</p>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-8.5 w-[145px] rounded-lg border border-border bg-card px-2.5 text-xs text-text-primary"
          />
          {date ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 text-xs"
              onClick={() => onDateChange("")}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="rounded-xl border border-border bg-card px-3 py-6 text-center text-xs text-text-tertiary">
          Loading activity history...
        </p>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/60 px-3 py-6 text-center text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      ) : activities.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-3 py-6 text-center text-xs text-text-tertiary">
          {emptyMessage}
        </p>
      ) : (
        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
          {activities.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: UserActivity }) {
  const display = activityDisplay[item.kind];
  const ActivityIcon = display.icon;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_80px_100px] items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs">
      <div className="flex items-center gap-2 font-medium text-text-primary">
        <span
          className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${display.className}`}
        >
          <ActivityIcon className="size-3" />
        </span>
        <span className="truncate">{item.label}</span>
      </div>
      <span className="font-semibold text-text-primary">
        {formatTimeLabel(item.time)}
      </span>
      <span className="text-right text-text-tertiary">
        {formatDateLabel(item.time)}
      </span>
    </div>
  );
}

function ReportsDialog({
  open,
  onOpenChange,
  reports,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: ReportItem[];
  user?: UserListItem;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-2xl border-border bg-card p-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">View Reports</DialogTitle>
        </DialogHeader>

        <ReportsList reports={reports} user={user} />
      </DialogContent>
    </Dialog>
  );
}

function ReportsList({
  reports,
  user,
}: {
  reports: ReportItem[];
  user?: UserListItem;
}) {
  if (reports.length === 0) {
    return <p className="py-6 text-center text-xs text-text-tertiary">No reports found</p>;
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <ReportRow key={report._id} report={report} user={user} />
      ))}
    </div>
  );
}

function ReportRow({
  report,
  user,
}: {
  report: ReportItem;
  user?: UserListItem;
}) {
  const reportTitle =
    String(
      report.reportName ||
        (report.reportDate ? formatDateLabel(report.reportDate) : "Report")
    );
  const reportDate = report.reportDate
    ? formatDateLabel(report.reportDate)
    : formatDateLabel(report.createdAt);
  const fileName = `${sanitizePdfFileName(reportTitle)}.pdf`;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary-bg/50 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <FileText className="size-4 shrink-0 text-text-secondary" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-text-primary">{reportTitle}</p>
          <p className="text-[11px] text-text-tertiary">{reportDate}</p>
        </div>
      </div>

      <button
        type="button"
        className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-secondary-bg hover:text-text-primary"
        title="Download PDF"
        onClick={() => {
          void downloadReportPdf(report, fileName, user);
        }}
      >
        <Download className="size-4" />
      </button>
    </div>
  );
}

const stripTrailingSlash = (value: unknown, fallback = "") => {
  let text = String(value ?? fallback);
  while (text.endsWith("/")) {
    text = text.slice(0, -1);
  }
  return text;
};

const stripLeadingSlashes = (value: unknown) => {
  let text = String(value ?? "");
  while (text.startsWith("/")) {
    text = text.slice(1);
  }
  return text;
};

const sanitizePdfFileName = (value: unknown) => {
  const text = String(value ?? "report").toLowerCase();
  let result = "";
  let previousWasDash = false;

  for (const character of text) {
    const isAlphaNumeric =
      (character >= "a" && character <= "z") ||
      (character >= "0" && character <= "9");

    if (isAlphaNumeric) {
      result += character;
      previousWasDash = false;
    } else if (!previousWasDash) {
      result += "-";
      previousWasDash = true;
    }
  }

  while (result.endsWith("-")) {
    result = result.slice(0, -1);
  }

  return result || "report";
};

const getReportImageUrlCandidates = (image?: {
  fileName?: string;
  path?: string;
  url?: string;
}) => {
  const apiBaseUrl = stripTrailingSlash(API_BASE_URL, window.location.origin);
  const imageBaseUrl = apiBaseUrl;
  const urls = new Set<string>();
  if (image?.fileName) {
    urls.add(
      `${imageBaseUrl}/public/report-images/${encodeURIComponent(image.fileName)}`
    );
    urls.add(`${apiBaseUrl}/api/v1/report/image/${encodeURIComponent(image.fileName)}`);
  }

  const values = [image?.url, image?.path, image?.fileName].filter(Boolean);

  values.forEach((value) => {
    const text = String(value);
    if (/^https?:\/\//i.test(text)) {
      urls.add(text);
      return;
    }

    const cleanValue = stripLeadingSlashes(text);
    const normalizedPaths = [
      cleanValue.startsWith("public/") ? `/${cleanValue}` : "",
      cleanValue.startsWith("report-images/") ? `/public/${cleanValue}` : "",
      `/public/report-images/${cleanValue}`,
    ].filter(Boolean);

    normalizedPaths.forEach((path) => {
      urls.add(`${imageBaseUrl}${path}`);
      urls.add(`${apiBaseUrl}${path}`);
      urls.add(`${window.location.origin}${path}`);
    });
  });

  return Array.from(urls);
};

const formatReportDescription = (value?: string) => {
  let normalized = String(value ?? "").trim().toLowerCase();
  while (normalized.endsWith(".")) {
    normalized = normalized.slice(0, -1);
  }

  if (normalized === "checked in") return "Booked-In.";
  if (normalized === "checked out") return "Booked-Off.";

  return value || "";
};

const loadImageDataUrl = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) {
      return null;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const format = blob.type.includes("png") ? "PNG" : "JPEG";

    return { dataUrl, format };
  } catch {
    return null;
  }
};

const loadFirstAvailableImageDataUrl = async (urls: string[]) => {
  for (const url of urls) {
    const image = await loadImageDataUrl(url);
    if (image) return image;
  }

  return null;
};

async function downloadReportPdf(
  report: ReportItem,
  fileName: string,
  user?: UserListItem
) {
  // jsPDF is only needed when an admin actually exports a report, so it is
  // loaded on demand instead of shipping in the User Management route bundle.
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const logoUrl = `${window.location.origin}/logo-rss.png`;
  const logo = await loadImageDataUrl(logoUrl);
  const entries = report.entries?.length
    ? report.entries
    : [
        {
          _id: "default",
          time: report.reportDate || report.createdAt,
          description: report.reportDescription || "",
          images: [],
        },
      ];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  // Header banner
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, cursorY, contentWidth, 22, "F");

  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, margin + 4, cursorY + 2, 18, 18);
    } catch {
      // Keep going if logo can't be embedded
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("OLORUNMI SECURITY REPORT", margin + 26, cursorY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date())}`,
    margin + 26,
    cursorY + 16
  );

  cursorY += 28;

  // Metadata block
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cursorY, contentWidth, 20, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Guard / User:", margin + 4, cursorY + 7);
  doc.text("User ID:", margin + 4, cursorY + 14);

  doc.setFont("helvetica", "normal");
  doc.text(user?.name || "Unassigned", margin + 30, cursorY + 7);
  doc.text(user?.userId || "-", margin + 30, cursorY + 14);

  doc.setFont("helvetica", "bold");
  doc.text("Report Date:", margin + 100, cursorY + 7);
  doc.setFont("helvetica", "normal");
  doc.text(report.reportDate ? formatDateLabel(report.reportDate) : "-", margin + 125, cursorY + 7);

  cursorY += 26;

  // Entries
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    ensureSpace(30);

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, cursorY, contentWidth, 18, 1.5, 1.5, "FD");

    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Entry #${i + 1}`, margin + 4, cursorY + 6);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(
      entry.time ? formatDateTimeLabel(entry.time) : "-",
      margin + 4,
      cursorY + 12
    );

    cursorY += 22;

    if (entry.description) {
      ensureSpace(16);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(formatReportDescription(entry.description), contentWidth - 8);
      doc.text(lines, margin + 4, cursorY);
      cursorY += lines.length * 4.5 + 4;
    }

    if (entry.images?.length) {
      for (const image of entry.images) {
        const candidates = getReportImageUrlCandidates(image);
        const loaded = await loadFirstAvailableImageDataUrl(candidates);
        if (loaded) {
          ensureSpace(55);
          try {
            doc.addImage(loaded.dataUrl, loaded.format, margin + 4, cursorY, 60, 45);
            cursorY += 50;
          } catch {
            // Ignore corrupted images
          }
        }
      }
    }
  }

  doc.save(fileName);
}
