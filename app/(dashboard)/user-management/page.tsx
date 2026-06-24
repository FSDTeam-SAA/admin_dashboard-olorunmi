"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
  User as UserIcon,
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
  getUserDetails,
  getUsers,
  updateUser,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { formatDateLabel, getUserInitials } from "@/lib/utils";
import type { ReportItem, UserListItem } from "@/types/api";

const PAGE_LIMIT = 8;

type UserActivity = {
  id: string;
  label: string;
  time: string;
  status: "danger" | "success";
};

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
    const checklists = detailsQuery.data?.checklists ?? [];
    return checklists.slice(0, 5).map((item) => ({
      id: item._id,
      label:
        item.checkOutType === "auto"
          ? "Left Assigned Area"
          : item.status === "checked_out"
            ? "End Shift"
            : "Checked-In",
      time: item.checkOutAt ?? item.checkInAt,
      status: item.checkOutType === "auto" ? "danger" : "success",
    }));
  }, [detailsQuery.data?.checklists]);

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
        onOpenChange={setDetailsOpen}
        loading={detailsQuery.isLoading}
        user={selectedUser}
        activities={activities}
        onViewReports={() => setReportsOpen(true)}
      />

      <ReportsDialog
        open={reportsOpen}
        onOpenChange={setReportsOpen}
        reports={reports}
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
  onViewReports,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  user?: UserListItem;
  activities: UserActivity[];
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
  onViewReports,
}: {
  user: UserListItem;
  activities: UserActivity[];
  onViewReports: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <InfoCard label="User Name" value={user.name || "-"} icon={UserIcon} />
        <InfoCard label="User ID" value={user.userId || "-"} icon={IdCard} />
        <PasswordInfoCard value={user.textPassword || ""} />
      </div>

      <ActivityHistoryCard user={user} onViewReports={onViewReports} />
      <ActivitiesList activities={activities} />
    </div>
  );
}

function ActivityHistoryCard({
  user,
  onViewReports,
}: {
  user: UserListItem;
  onViewReports: () => void;
}) {
  const latitude = user.location?.latitude;
  const longitude = user.location?.longitude;
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
        <p className="text-sm text-[#545454]">Check in Location</p>
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

function ActivitiesList({ activities }: { activities: UserActivity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-[#6f6f6f]">No recent activity found</p>;
  }

  return (
    <div className="space-y-2">
      {activities.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ActivityRow({ item }: { item: UserActivity }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#d6c8a0] bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span
          className={`inline-flex size-5 items-center justify-center rounded-full ${
            item.status === "danger"
              ? "bg-[#ffe5e5] text-[#ff2b2b]"
              : "bg-[#e2f5e7] text-[#228f45]"
          }`}
        >
          <MapPin className="size-3" />
        </span>
        {item.label}
      </div>
      <span className="text-xs text-[#626262]">{formatDateLabel(item.time)}</span>
    </div>
  );
}

function ReportsDialog({
  open,
  onOpenChange,
  reports,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: ReportItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-[32px]">View Reports</DialogTitle>
        </DialogHeader>

        <ReportsList reports={reports} />
      </DialogContent>
    </Dialog>
  );
}

function ReportsList({ reports }: { reports: ReportItem[] }) {
  if (reports.length === 0) {
    return <p className="text-sm text-[#666]">No reports found</p>;
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <ReportRow key={report._id} report={report} />
      ))}
    </div>
  );
}

function ReportRow({ report }: { report: ReportItem }) {
  const onDownload = () => {
    const content = `${report.reportName}\n\n${report.reportDescription}`;
    const blob = new Blob([content], { type: "text/plain" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${report.reportName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#d9ccaa] bg-[#f7f7f7] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="size-4 text-[#676767]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{report.reportName}</p>
          <p className="text-xs text-[#6d6d6d]">{formatDateLabel(report.createdAt)}</p>
        </div>
      </div>

      <button
        type="button"
        className="text-[#6f6f6f] hover:text-[#383838]"
        onClick={onDownload}
      >
        <Download className="size-4" />
      </button>
    </div>
  );
}
