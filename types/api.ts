export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AuthUser = {
  _id: string;
  name: string;
  email?: string;
  role: "admin" | "user";
  userId?: string;
  avatar?: {
    public_id?: string;
    url?: string;
  };
  phone?: string;
  address?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  site?: string;
  onShift?: string;
  offShift?: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: "admin" | "user";
  _id: string;
  user: AuthUser;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserListItem = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  address?: string;
  userId?: string;
  role?: string;
  textPassword?: string;
  avatar?: {
    public_id?: string;
    url?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  site?: string;
  onShift?: string;
  offShift?: string;
  defaultRadius?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ChecklistItem = {
  _id: string;
  user?: {
    _id: string;
    name?: string;
    userId?: string;
  };
  option: string;
  workDate: string;
  checkInAt: string;
  checkOutAt?: string;
  checkOutType?: "manual" | "auto";
  status:
    | "checked_in"
    | "checked_out"
    | "checked_in_missed"
    | "user_outside_radius"
    | "re_checked_in";
  alertStatus?: "pending" | "sent";
  alertSentAt?: string | null;
  checkInLocation: {
    latitude: number;
    longitude: number;
  };
  checkOutLocation?: {
    latitude?: number;
    longitude?: number;
  };
};

export type ReportItem = {
  _id: string;
  reportName: string;
  reportDescription: string;
  createdAt: string;
  user?: {
    _id: string;
    name?: string;
    userId?: string;
    email?: string;
  };
};

export type UsersListResponse = {
  users: UserListItem[];
  pagination: PaginationMeta;
};

export type UserDetailsResponse = {
  user: UserListItem;
  checklists: ChecklistItem[];
  reports: ReportItem[];
};

export type AlertsListResponse = {
  alerts: ChecklistItem[];
  pagination: PaginationMeta;
};

export type ReportsListResponse = {
  reports: ReportItem[];
  pagination: PaginationMeta;
};
