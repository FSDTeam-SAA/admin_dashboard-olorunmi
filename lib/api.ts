"use client";

import { apiClient } from "@/lib/axios-client";
import type {
  AlertsListResponse,
  ApiResponse,
  ChecklistItem,
  ReportItem,
  ReportsListResponse,
  UserDetailsResponse,
  UserListItem,
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
  latitude: number;
  longitude: number;
  defaultRadius?: number;
  profilePhoto?: File | null;
}) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("userId", payload.userId);
  formData.append("password", payload.password);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));

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
    latitude?: number;
    longitude?: number;
    defaultRadius?: number;
    profilePhoto?: File | null;
  }
) => {
  const formData = new FormData();

  if (payload.name) formData.append("name", payload.name);
  if (payload.userId) formData.append("userId", payload.userId);
  if (payload.password) formData.append("password", payload.password);
  if (payload.latitude !== undefined)
    formData.append("latitude", String(payload.latitude));
  if (payload.longitude !== undefined)
    formData.append("longitude", String(payload.longitude));
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

export const deleteUser = async (id: string) => {
  const response = await apiClient.delete<ApiResponse<null>>(`/user/admin/list/${id}`);
  return response.data;
};

export const getAlerts = async (params: {
  page: number;
  limit: number;
  search?: string;
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
