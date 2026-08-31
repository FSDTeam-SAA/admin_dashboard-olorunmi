export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000";

export const QUERY_KEYS = {
  profile: ["profile"] as const,
  users: (page: number, limit: number, search: string, role = "all") =>
    ["users", page, limit, search, role] as const,
  userDetails: (id?: string) => ["user-details", id] as const,
  alerts: (
    page: number,
    limit: number,
    search: string,
    dateFrom = "",
    dateTo = "",
    alertType = "all",
    user = "all"
  ) => ["alerts", page, limit, search, dateFrom, dateTo, alertType, user] as const,
  cardAlerts: (type: string | null, page: number, limit: number, dateFrom = "", dateTo = "") =>
    ["card-alerts", type, page, limit, dateFrom, dateTo] as const,
  cardAlertsUserExpand: (
    type: string | null,
    userId: string | null,
    page: number,
    limit: number,
    dateFrom = "",
    dateTo = ""
  ) => ["card-alerts-user-expand", type, userId, page, limit, dateFrom, dateTo] as const,
  sosAlerts: (status: string, user = "all", page = 1) =>
    ["sos-alerts", status, user, page] as const,
  userChecklists: (userId?: string, date?: string) =>
    ["user-checklists", userId, date] as const,
  reports: (userId: string) => ["reports", userId] as const,
  locations: (search = "") => ["locations", search] as const,
};
