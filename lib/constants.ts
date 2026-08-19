export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000";

export const QUERY_KEYS = {
  profile: ["profile"] as const,
  users: (page: number, search: string) => ["users", page, search] as const,
  userDetails: (id?: string) => ["user-details", id] as const,
  alerts: (page: number, search: string) => ["alerts", page, search] as const,
  sosAlerts: (status: string, user = "all", page = 1) =>
    ["sos-alerts", status, user, page] as const,
  userChecklists: (userId?: string, date?: string) =>
    ["user-checklists", userId, date] as const,
  reports: (userId: string) => ["reports", userId] as const,
  sites: (search = "") => ["sites", search] as const,
};
