"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
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
  IdCard,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
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
import { PaginationControls } from "@/components/common/pagination-controls";
import { PageHeader } from "@/components/dashboard/page-header";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserLocationMap } from "./_components/user-location-map";
import {
  createUser,
  deleteUser,
  getApiMessage,
  getUserChecklists,
  getUserDetails,
  getUsers,
  updateUser,
} from "@/lib/api";
import { API_BASE_URL, QUERY_KEYS } from "@/lib/constants";
import { formatDateLabel, getUserInitials } from "@/lib/utils";
import type { ReportItem, UserListItem } from "@/types/api";

const PAGE_LIMIT = 8;
const WEEK_DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
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
    className: "bg-[#e2f5e7] text-[#228f45]",
  },
  booked_off: {
    icon: CheckCircle2,
    className: "bg-[#e9f0ff] text-[#2b6bff]",
  },
  check_in_ok: {
    icon: CheckCircle2,
    className: "bg-[#e2f5e7] text-[#228f45]",
  },
  check_in_not_ok: {
    icon: X,
    className: "bg-[#ffe5e5] text-[#ff2b2b]",
  },
  missed_check_in: {
    icon: AlertTriangle,
    className: "bg-[#fff2d8] text-[#e89900]",
  },
  out_of_location: {
    icon: XCircle,
    className: "bg-[#ffe5e5] text-[#ff2b2b]",
  },
  back_inside: {
    icon: MapPin,
    className: "bg-[#e2f5e7] text-[#228f45]",
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

const formatTimeLabel = (dateValue: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));

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

const getPreferredWeeklyLocation = (
  user: UserListItem,
  dateValue?: string | Date | null
) => {
  const selectedDayLocation = user.weeklyLocations?.[getWeekDayKeyForDate(dateValue)];
  if (selectedDayLocation) {
    return selectedDayLocation;
  }

  return WEEK_DAY_KEYS.map((day) => user.weeklyLocations?.[day]).find(
    (location) =>
      typeof location?.latitude === "number" &&
      typeof location?.longitude === "number"
  );
};

const getPreferredSite = (user: UserListItem, dateValue?: string | Date | null) =>
  getPreferredWeeklyLocation(user, dateValue)?.site || user.site || "-";

export default function UserManagementPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [activityDate, setActivityDate] = useState("");
  const [reportsOpen, setReportsOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: QUERY_KEYS.users(page, search),
    queryFn: () => getUsers({ page, limit: PAGE_LIMIT, search }),
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
      setDeleteUserId(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error(getApiMessage(error, "Unable to delete user"));
    },
  });

  const users = usersQuery.data?.users ?? [];
  const pagination = usersQuery.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? 1;
  const currentLimit = pagination?.limit ?? PAGE_LIMIT;
  const startResult = users.length ? (currentPage - 1) * currentLimit + 1 : 0;
  const endResult = (currentPage - 1) * currentLimit + users.length;

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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-[280px]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9a9a9a]" />
            <Input
              placeholder="Search ....."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-12 rounded-[14px] border border-[#b9b9b9] bg-transparent pl-9"
            />
          </div>
        </div>

        <Button className="h-12 rounded-lg px-6" onClick={handleOpenCreate}>
          <Plus className="size-5" />
          Add New user
        </Button>
      </div>

      <PageHeader title="User Management" subtitle="User Management" />

      {usersQuery.isLoading ? (
        <TableSkeleton rows={PAGE_LIMIT} />
      ) : (
        <>
          <Table className="">
            <TableHeader>
              <TableRow className="border-none ">
                <TableHead>Profile Image</TableHead>
                <TableHead>User Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[#6f6f6f]">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Avatar className="size-12">
                        <AvatarImage src={user.avatar?.url ?? ""} alt={user.name ?? "User"} />
                        <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name ?? "Unknown"}</TableCell>
                    <TableCell>{user.userId ?? "-"}</TableCell>
                    <TableCell>
                      {user.createdAt ? formatDateLabel(user.createdAt) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="dark">
                          {revealedPasswords[user._id]
                            ? user.textPassword || "—"
                            : "••••••••"}
                        </Badge>
                        <button
                          type="button"
                          aria-label={
                            revealedPasswords[user._id]
                              ? "Hide password"
                              : "Show password"
                          }
                          className="text-[#6f6f6f] hover:text-[#1f1f1f]"
                          onClick={() => togglePasswordVisibility(user._id)}
                        >
                          {revealedPasswords[user._id] ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-end justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-full bg-[#d6e8db] text-[#228f45] hover:bg-[#cde1d4]"
                          onClick={() => {
                            setDetailsUserId(user._id);
                            setActivityDate(getCurrentDateInputValue());
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="size-4" />
                          View Details
                        </Button>

                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-9 rounded-full bg-[#d9e6ff] text-[#2f6fd9]"
                          onClick={() => handleOpenEdit(user)}
                        >
                          <Pencil className="size-4" />
                        </Button>

                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-9 rounded-full bg-[#ffd5dc] text-[#ff2b2b]"
                          onClick={() => setDeleteUserId(user._id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#686868]">
              Showing {startResult} to {endResult} of {pagination?.total ?? users.length} results
            </p>
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

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

      <ReportsDialog
        open={reportsOpen}
        onOpenChange={setReportsOpen}
        reports={reports}
        user={selectedUser}
      />

      <ConfirmDialog
        open={Boolean(deleteUserId)}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteUserId(null);
          }
        }}
        title="Are you sure?"
        description="You want to delete from this Dashboard."
        confirmText="Delete"
        confirmVariant="default"
        onConfirm={() => {
          if (deleteUserId) {
            deleteMutation.mutate(deleteUserId);
          }
        }}
        loading={deleteMutation.isPending}
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
      <Label className="mb-1.5 block text-xs text-[#5f5f5f]">{label}</Label>
      <div className="flex h-11 items-center gap-2 rounded-xl bg-[#e7e7e7] px-3 text-sm font-medium text-[#2f2f2f]">
        <Icon className="size-4 shrink-0 text-[#6f6f6f]" />
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
      <Label className="mb-1.5 block text-xs text-[#5f5f5f]">Password</Label>
      <div className="flex h-11 items-center gap-2 rounded-xl bg-[#e7e7e7] px-3 text-sm font-medium text-[#2f2f2f]">
        <Lock className="size-4 shrink-0 text-[#6f6f6f]" />
        <span className="flex-1 truncate font-mono tracking-wider">
          {visible ? display : "••••••••"}
        </span>
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          className="shrink-0 text-[#6f6f6f] hover:text-[#1f1f1f]"
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
      <DialogContent className="max-h-[92vh] max-w-[820px] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
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
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
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
      <div className="grid gap-3 md:grid-cols-3">
        <InfoCard label="User Name" value={user.name || "-"} icon={UserIcon} />
        <InfoCard label="User ID" value={user.userId || "-"} icon={IdCard} />
        <PasswordInfoCard value={user.textPassword || ""} />
        <InfoCard
          label={`Site (${getWeekDayLabelForDate(activityDate)})`}
          value={getPreferredSite(user, activityDate)}
          icon={Building2}
        />
        <InfoCard label="On Shift" value={user.onShift || "-"} icon={Clock} />
        <InfoCard label="Off Shift" value={user.offShift || "-"} icon={Clock} />
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
  const hasLocation =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return (
    <div className="rounded-xl border border-[#dfdfdf] bg-[#f7f7f7] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Activity History</p>
        <Button size="sm" className="h-8 rounded-full px-4" onClick={onViewReports}>
          <Eye className="size-4" />
          View Reports
        </Button>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-[#545454]">
          Check in Location ({getWeekDayLabelForDate(date)})
        </p>
        {hasLocation ? (
          <p className="text-xs text-[#6f6f6f]">
            <MapPin className="mr-1 inline size-3" />
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
        <div className="flex h-32.5 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#dedede,#f5f5f5)] text-sm text-[#6f6f6f]">
          No location set for this user
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#2f2f2f]">Activity Records</p>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-9 w-[155px] rounded-lg border border-[#c8c8c8] bg-white px-2 text-sm"
          />
          {date ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => onDateChange("")}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="rounded-lg border border-[#d6c8a0] bg-white px-3 py-6 text-center text-sm text-[#6f6f6f]">
          Loading activity history...
        </p>
      ) : error ? (
        <p className="rounded-lg border border-[#f1bdc5] bg-[#fdecef] px-3 py-6 text-center text-sm text-[#ff2b2b]">
          {error}
        </p>
      ) : activities.length === 0 ? (
        <p className="rounded-lg border border-[#d6c8a0] bg-white px-3 py-6 text-center text-sm text-[#6f6f6f]">
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
    <div className="grid grid-cols-[minmax(0,1fr)_76px_104px] items-center gap-2 rounded-lg border border-[#d6c8a0] bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span
          className={`inline-flex size-5 items-center justify-center rounded-full ${display.className}`}
        >
          <ActivityIcon className="size-3" />
        </span>
        {item.label}
      </div>
      <span className="text-sm font-medium text-[#2f2f2f]">
        {formatTimeLabel(item.time)}
      </span>
      <span className="text-right text-xs text-[#626262]">
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
      <DialogContent className="max-w-[360px] rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-[32px]">View Reports</DialogTitle>
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
    return <p className="text-sm text-[#666]">No reports found</p>;
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
    <div className="flex items-center justify-between rounded-lg border border-[#d9ccaa] bg-[#f7f7f7] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="size-4 text-[#676767]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{reportTitle}</p>
          <p className="text-xs text-[#6d6d6d]">{reportDate}</p>
        </div>
      </div>

      <button
        type="button"
        className="text-[#6f6f6f] hover:text-[#383838]"
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
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const logoUrl = `${window.location.origin}/logo-rss.png`;
  const logo = await loadImageDataUrl(logoUrl);
  const entries = report.entries?.length
    ? report.entries
    : [{ time: "-", description: report.reportDescription || "No entries found" }];
  const reportDate = report.reportDate || new Date(report.createdAt).toISOString().slice(0, 10);
  const userName = report.user?.name || report.security || user?.name || "-";
  const site = report.site || user?.site || "-";
  const onShift = report.onShift || user?.onShift || "-";
  const offShift = report.offShift || user?.offShift || "-";
  const security = report.security || user?.name || user?.userId || userName;

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2;
  const cell = (
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    options: { bold?: boolean; center?: boolean; fill?: boolean } = {}
  ) => {
    if (options.fill) {
      doc.setFillColor(246, 246, 246);
      doc.rect(x, y, width, height, "F");
    }
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.rect(x, y, width, height);
    doc.setFont("times", options.bold ? "bold" : "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(text || "-", width - 3);
    const textX = options.center ? x + width / 2 : x + 1.5;
    const textY = y + height / 2 + 1.2 - (lines.length - 1) * 1.8;
    doc.text(lines, textX, textY, { align: options.center ? "center" : "left" });
  };
  const drawReportHeader = () => {
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("REGAL SECURITY SERVICES LTD.", pageWidth / 2, 14, { align: "center" });

    doc.setFillColor(255, 243, 205);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.rect(marginX, 18, contentWidth, 28, "FD");
    if (logo) {
      doc.addImage(logo.dataUrl, logo.format, 20, 21, 20, 20);
    }
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(
      [
        "Head Office:  1841-300, 85 Shawville Blvd, SW,\nCalgary, AB T2Y 3W5",
        "Phone:  T 403.457.4734 | F 403.457.4738",
        "Email:  info@regalsecurityservices.ca",
        "Web:  www.regalsecurity.ca",
      ],
      48,
      26
    );

    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.text("DAILY LOG REPORT", marginX, 56);

    const summaryY = 60;
    const widths = [30, 26, 40, 30, 30, 34];
    const labels = ["DATE", "DAY", "SITE", "ON SHIFT", "OFF SHIFT", "SECURITY"];
    const values = [
      reportDate,
      report.day || "-",
      site,
      onShift,
      offShift,
      security,
    ];
    let cursorX = marginX;
    labels.forEach((label, index) => {
      cell(cursorX, summaryY, widths[index], 7, label, {
        bold: true,
        center: true,
        fill: true,
      });
      cell(cursorX, summaryY + 7, widths[index], 8, values[index], { center: true });
      cursorX += widths[index];
    });

    doc.setLineWidth(0.35);
    doc.rect(marginX, 79, contentWidth, 8);
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.text("USER NAME:", marginX + 2, 84.5);
    doc.setFont("times", "normal");
    doc.text(userName, marginX + 23, 84.5);

    cell(marginX, 91, 22, 9, "TIME", { bold: true, center: true, fill: true });
    cell(marginX + 22, 91, 128, 9, "DESCRIPTION", {
      bold: true,
      center: true,
      fill: true,
    });
    cell(marginX + 150, 91, 40, 9, "IMAGE", { bold: true, center: true, fill: true });
  };

  drawReportHeader();

  let y = 100;
  for (const entry of entries) {
    const firstImage = entry.images?.[0];
    const imageUrlCandidates = getReportImageUrlCandidates(firstImage);
    const descriptionLines = doc.splitTextToSize(
      formatReportDescription(entry.description) || "-",
      124
    );
    const rowHeight = Math.max(
      imageUrlCandidates.length ? 62 : 10,
      descriptionLines.length * 4.2 + 5
    );
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      drawReportHeader();
      y = 100;
    }

    cell(marginX, y, 22, rowHeight, entry.time || "-", { center: true });
    doc.rect(marginX + 22, y, 128, rowHeight);
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(descriptionLines, marginX + 24, y + 6);
    doc.rect(marginX + 150, y, 40, rowHeight);

    if (imageUrlCandidates.length) {
      const image = await loadFirstAvailableImageDataUrl(imageUrlCandidates);
      if (image) {
        doc.addImage(image.dataUrl, image.format, marginX + 153, y + 3, 34, rowHeight - 6);
      } else {
        doc.setFont("times", "normal");
        doc.setFontSize(7);
        doc.text(
          doc.splitTextToSize("Image file not found", 34),
          marginX + 153,
          y + 7
        );
      }
    }

    y += rowHeight;
  }

  doc.save(fileName);
}
