"use client";

import { apiClient } from "@/lib/axios-client";
import type {
  AlertsListResponse,
  ApiResponse,
  ChecklistItem,
  ReportItem,
  ReportsListResponse,
  LocationItem,
  SosAlertItem,
  SosAlertsListResponse,
  UserDetailsResponse,
  UserListItem,
  WeeklyLocations,
  UsersListResponse,
} from "@/types/api";

export const getApiMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const forgotPassword = async (email: string) => {
  const response = await apiClient.post<ApiResponse<null>>("/auth/forgot-password", {
    email,
  });

  return response.data;
};

export const verifyOtp = async (payload: { email: string; otp: string }) => {
  const response = await apiClient.post<ApiResponse<Record<string, never>>>(
    "/auth/verify-otp",
    payload
  );

  return response.data;
};

export const resetPassword = async (payload: {
  email: string;
  otp: string;
  password: string;
}) => {
  const response = await apiClient.post<ApiResponse<Record<string, never>>>(
    "/auth/reset-password",
    payload
  );

  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post<ApiResponse<null>>("/auth/logout");
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get<ApiResponse<UserListItem>>("/user/profile");
  return response.data.data;
};

export const updateProfile = async (payload: {
  name?: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: File | null;
}) => {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.phone !== undefined) formData.append("phone", payload.phone);
  if (payload.address !== undefined) formData.append("address", payload.address);
  if (payload.bio !== undefined) formData.append("bio", payload.bio);
  if (payload.avatar) formData.append("avatar", payload.avatar);

  const response = await apiClient.patch<ApiResponse<UserListItem>>(
    "/user/update-profile",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const response = await apiClient.post<ApiResponse<UserListItem>>(
    "/user/change-password",
    payload
  );
  return response.data;
};

export const getUsers = async (params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}) => {
  const response = await apiClient.get<ApiResponse<UsersListResponse>>("/user/admin/list", {
    params,
  });

  return response.data.data;
};

export const createUser = async (payload: {
  name: string;
  userId: string;
  password: string;
  site?: string;
  onShift?: string;
  offShift?: string;
  weeklyLocations: WeeklyLocations;
  defaultRadius?: number;
  profilePhoto?: File | null;
}) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("userId", payload.userId);
  formData.append("password", payload.password);
  formData.append("site", payload.site ?? "");
  formData.append("onShift", payload.onShift ?? "");
  formData.append("offShift", payload.offShift ?? "");
  formData.append("weeklyLocations", JSON.stringify(payload.weeklyLocations));

  if (payload.defaultRadius !== undefined) {
    formData.append("defaultRadius", String(payload.defaultRadius));
  }

  if (payload.profilePhoto) {
    formData.append("profilePhoto", payload.profilePhoto);
  }

  const response = await apiClient.post<ApiResponse<UserListItem>>("/user/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getUserDetails = async (id: string) => {
  const response = await apiClient.get<ApiResponse<UserDetailsResponse>>(
    `/user/admin/list/${id}`
  );

  return response.data.data;
};

export const updateUser = async (
  id: string,
  payload: {
    name?: string;
    userId?: string;
    password?: string;
    site?: string;
    onShift?: string;
    offShift?: string;
    weeklyLocations?: WeeklyLocations;
    defaultRadius?: number;
    profilePhoto?: File | null;
  }
) => {
  const formData = new FormData();

  if (payload.name) formData.append("name", payload.name);
  if (payload.userId) formData.append("userId", payload.userId);
  if (payload.password) formData.append("password", payload.password);
  if (payload.site !== undefined) formData.append("site", payload.site);
  if (payload.onShift !== undefined) formData.append("onShift", payload.onShift);
  if (payload.offShift !== undefined)
    formData.append("offShift", payload.offShift);
  if (payload.weeklyLocations) {
    formData.append("weeklyLocations", JSON.stringify(payload.weeklyLocations));
  }
  if (payload.defaultRadius !== undefined)
    formData.append("defaultRadius", String(payload.defaultRadius));
  if (payload.profilePhoto) formData.append("profilePhoto", payload.profilePhoto);

  const response = await apiClient.patch<ApiResponse<UserListItem>>(
    `/user/admin/list/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const updateUserStatus = async (id: string, status: "active" | "disabled") => {
  const response = await apiClient.patch<ApiResponse<UserListItem>>(
    `/user/admin/list/${id}`,
    { status }
  );

  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete<ApiResponse<null>>(`/user/admin/list/${id}`);
  return response.data;
};

export const getAlerts = async (params: {
  page: number;
  limit: number;
  search?: string;
  latestPerUser?: boolean;
  dateFrom?: string;
  dateTo?: string;
  alertType?: string;
  user?: string;
  // A single alert status here fetches the raw (undeduped) event list for
  // that type — used by the summary-card dialogs so their row count matches
  // the card's own total.
  type?: string;
  // With `type`, collapse to one row per user (their latest event of that
  // type) plus `eventCount` — the card dialog's default deduplicated view.
  groupByUser?: boolean;
  // With `type`, scope the raw (undeduped) event list to one user — the card
  // dialog's per-user expand.
  expandUser?: string;
}) => {
  const response = await apiClient.get<ApiResponse<AlertsListResponse>>(
    "/checklist/admin/alerts",
    { params }
  );

  return response.data.data;
};

export const getUserChecklists = async (params: { user: string; date?: string }) => {
  const response = await apiClient.get<ApiResponse<ChecklistItem[]>>("/checklist/me", {
    params,
  });

  return response.data.data;
};

export const sendAlert = async (id: string) => {
  const response = await apiClient.post<ApiResponse<ChecklistItem>>(
    `/checklist/admin/alerts/${id}/send`
  );

  return response.data;
};

export const deleteAlert = async (id: string) => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/checklist/admin/alerts/${id}`
  );

  return response.data;
};

export const getSosAlerts = async (params: {
  status?: "pending" | "acknowledged" | "all";
  user?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get<ApiResponse<SosAlertsListResponse>>("/sos", {
    params: {
      status: params.status ?? "pending",
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...(params.user && params.user !== "all" ? { user: params.user } : {}),
    },
  });

  return response.data.data;
};

export const acknowledgeSosAlert = async (id: string) => {
  const response = await apiClient.post<ApiResponse<SosAlertItem>>(
    `/sos/${id}/acknowledge`
  );

  return response.data;
};

export const getReports = async (params: {
  user?: string;
  page: number;
  limit: number;
}) => {
  const response = await apiClient.get<ApiResponse<ReportsListResponse>>("/report", {
    params,
  });

  return response.data.data;
};

export const getMyReports = async () => {
  const response = await apiClient.get<ApiResponse<ReportItem[]>>("/report/me");
  return response.data.data;
};

export const getLocations = async (params?: { search?: string }) => {
  const response = await apiClient.get<ApiResponse<LocationItem[]>>("/location", {
    params,
  });

  return response.data.data;
};

export const createLocation = async (payload: {
  name: string;
  latitude: number;
  longitude: number;
}) => {
  const response = await apiClient.post<ApiResponse<LocationItem>>("/location", payload);

  return response.data;
};

export const updateLocation = async ({
  id,
  ...payload
}: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}) => {
  const response = await apiClient.patch<ApiResponse<LocationItem>>(
    `/location/${id}`,
    payload
  );

  return response.data;
};

export const deleteLocation = async (id: string) => {
  const response = await apiClient.delete<ApiResponse<LocationItem>>(`/location/${id}`);

  return response.data;
};
